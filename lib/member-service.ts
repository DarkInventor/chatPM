import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  writeBatch,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { firestoreService } from "./firestore";
import { EmailService, EmailInvitationData } from "./email-service";
import { 
  WorkspaceMember,
  WorkspaceRole,
  MemberStatus,
  Invitation,
  Activity,
  Notification,
  UserProfile,
  UserPresence,
  Workspace,
  Organization,
  COLLECTIONS 
} from "./types";

export class MemberService {
  // Invitation Management
  static async inviteMemberByEmail(
    workspaceId: string,
    organizationId: string,
    email: string,
    role: WorkspaceRole,
    invitedBy: string
  ): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    try {
      // Check if inviter has permission
      const hasPermission = await this.checkInvitePermission(workspaceId, invitedBy);
      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions to invite members' };
      }

      // Check if user already exists and is already a member
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        const existingMember = await this.getWorkspaceMember(workspaceId, existingUser.uid);
        if (existingMember && existingMember.status === 'active') {
          return { success: false, error: 'User is already a member of this workspace' };
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await this.getPendingInvitation(workspaceId, email);
      if (existingInvitation) {
        return { success: false, error: 'An invitation is already pending for this email' };
      }

      const invitationRef = doc(collection(db, COLLECTIONS.INVITATIONS));
      const invitationId = invitationRef.id;

      // Generate secure token for invitation link
      const token = this.generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Get cached data for better UX
      const [inviterProfile, workspaceDoc, orgDoc] = await Promise.all([
        firestoreService.getUserProfile(invitedBy),
        workspaceId ? getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId)) : null,
        getDoc(doc(db, COLLECTIONS.ORGANIZATIONS, organizationId))
      ]);

      const invitation: Invitation = {
        id: invitationId,
        organizationId,
        workspaceId,
        email: email.toLowerCase(),
        role,
        invitedBy,
        status: 'pending',
        token,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp() as Timestamp,
        // Cache data for better UX
        inviterName: inviterProfile?.displayName || inviterProfile?.email.split('@')[0] || 'Someone',
        organizationName: orgDoc?.exists() ? orgDoc.data()?.name : 'Organization',
        workspaceName: workspaceDoc?.exists() ? workspaceDoc.data()?.name : undefined,
      };

      await runTransaction(db, async (transaction) => {
        // Create invitation
        transaction.set(invitationRef, invitation);

        // If user exists, create notification
        if (existingUser) {
          const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
          const notification: Notification = {
            id: notificationRef.id,
            userId: existingUser.uid,
            organizationId,
            workspaceId,
            type: 'workspace_invite',
            title: 'Workspace Invitation',
            message: `You've been invited to join a workspace`,
            actionUrl: `/invite/${token}`,
            isRead: false,
            priority: 'medium',
            createdAt: serverTimestamp() as Timestamp,
          };
          transaction.set(notificationRef, notification);
        }

        // Log activity
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        const activity: Activity = {
          id: activityRef.id,
          organizationId,
          workspaceId,
          userId: invitedBy,
          type: 'member_invited',
          action: 'invited_member',
          details: {
            email,
            role,
            invitationId,
          },
          metadata: {},
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(activityRef, activity);
      });

      // Send email invitation
      await this.sendInvitationEmail(workspaceId, organizationId, email, invitation, invitedBy);

      return { success: true, invitationId };
    } catch (error: any) {
      console.error('Error inviting member:', error);
      return { success: false, error: error.message };
    }
  }

  static async acceptInvitation(
    token: string,
    userId: string
  ): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
    try {
      // Find invitation by token
      const invitationQuery = query(
        collection(db, COLLECTIONS.INVITATIONS),
        where('token', '==', token),
        where('status', '==', 'pending')
      );
      const invitationSnapshot = await getDocs(invitationQuery);

      if (invitationSnapshot.empty) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      const invitationDoc = invitationSnapshot.docs[0];
      const invitation = invitationDoc.data() as Invitation;

      // Check if invitation has expired
      if (invitation.expiresAt.toDate() < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Get user profile
      const userProfile = await firestoreService.getUserProfile(userId);
      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      // Check if user email matches invitation
      if (userProfile.email.toLowerCase() !== invitation.email) {
        return { success: false, error: 'Email does not match invitation' };
      }

      const workspaceId = invitation.workspaceId!;
      const organizationId = invitation.organizationId;

      // Get all workspaces in the organization and check existing memberships (outside transaction)
      const workspacesQuery = query(
        collection(db, COLLECTIONS.WORKSPACES),
        where('organizationId', '==', organizationId)
      );
      const workspacesSnapshot = await getDocs(workspacesQuery);
      const allWorkspaces = workspacesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check existing memberships for this user in any workspace of this organization
      const existingMembershipsPromises = allWorkspaces.map(workspace => 
        getDoc(doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspace.id}_${userId}`))
      );
      const existingMemberships = await Promise.all(existingMembershipsPromises);

      await runTransaction(db, async (transaction) => {
        // IMPORTANT: All reads must be done before any writes in Firestore transactions
        
        // Read organization data first
        const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, organizationId);
        const orgDoc = await transaction.get(orgRef);

        // Now perform all writes
        // Update invitation status
        transaction.update(invitationDoc.ref, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: userId,
        });

        // Create workspace member records for ALL workspaces in the organization
        allWorkspaces.forEach((workspace, index) => {
          const memberDocId = `${workspace.id}_${userId}`;
          const memberRef = doc(db, COLLECTIONS.WORKSPACE_MEMBERS, memberDocId);
          
          // Only create if member doesn't already exist
          if (!existingMemberships[index].exists()) {
            const workspaceMember: WorkspaceMember = {
              id: memberDocId,
              workspaceId: workspace.id,
              userId,
              organizationId,
              role: invitation.role,
              status: 'active',
              invitedBy: invitation.invitedBy,
              invitedAt: invitation.createdAt,
              joinedAt: serverTimestamp() as Timestamp,
              lastActiveAt: serverTimestamp() as Timestamp,
              permissions: this.getDefaultPermissions(invitation.role),
              invitationSource: 'email', // Track that this was an email invitation
              invitationToken: token, // Store the token used to join
            };
            transaction.set(memberRef, workspaceMember);
          }
        });

        // Update organization members list
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const members = orgData.members || [];
          if (!members.includes(userId)) {
            transaction.update(orgRef, {
              members: [...members, userId],
              updatedAt: serverTimestamp(),
            });
            
            console.log(`Added user ${userId} to organization ${organizationId} members list. User now has access to this organization only through invitation.`);
          }
        }

        // Log activity for organization join
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        const activity: Activity = {
          id: activityRef.id,
          organizationId,
          // @ts-ignore
          workspaceId: null, // Organization-level activity
          userId,
          type: 'member_joined',
          action: 'accepted_invitation',
          details: {
            email: invitation.email,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
            workspacesCount: allWorkspaces.length,
            joinedAllWorkspaces: true,
          },
          metadata: {},
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(activityRef, activity);

        // Create welcome notification
        const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
        const notification: Notification = {
          id: notificationRef.id,
          userId,
          organizationId,
           // @ts-ignore
          workspaceId: null, // Organization-level notification
          type: 'member_joined',
          title: 'Welcome to the organization!',
          message: `You've successfully joined the organization with access to ${allWorkspaces.length} workspaces`,
          isRead: false,
          priority: 'low',
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(notificationRef, notification);
      });

      return { success: true, workspaceId };
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: error.message };
    }
  }

  // Member Management
  static async getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { profile: UserProfile })[]> {
    try {
      const membersQuery = query(
        collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
        where('workspaceId', '==', workspaceId),
        where('status', '==', 'active'),
        orderBy('joinedAt', 'asc')
      );
      const membersSnapshot = await getDocs(membersQuery);
      
      const membersWithProfile: (WorkspaceMember & { profile: UserProfile })[] = [];

      for (const memberDoc of membersSnapshot.docs) {
        const member = memberDoc.data() as WorkspaceMember;
        const profile = await firestoreService.getUserProfile(member.userId);
        
        if (profile) {
          membersWithProfile.push({
            ...member,
            profile,
          });
        }
      }

      return membersWithProfile;
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      return [];
    }
  }

  static async updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: WorkspaceRole,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if updater has permission
      const hasPermission = await this.checkManageRolePermission(workspaceId, updatedBy);
      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions to manage roles' };
      }

      // Prevent user from changing their own role if they're the only owner
      if (userId === updatedBy && newRole !== 'owner') {
        const owners = await this.getWorkspaceOwners(workspaceId);
        if (owners.length === 1 && owners[0].userId === userId) {
          return { success: false, error: 'Cannot change role - you are the only owner' };
        }
      }

      const memberRef = doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspaceId}_${userId}`);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        return { success: false, error: 'Member not found' };
      }

      const member = memberDoc.data() as WorkspaceMember;
      const oldRole = member.role;

      await runTransaction(db, async (transaction) => {
        // Update member role and permissions
        transaction.update(memberRef, {
          role: newRole,
          permissions: this.getDefaultPermissions(newRole),
          updatedAt: serverTimestamp(),
        });

        // Log activity
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        const activity: Activity = {
          id: activityRef.id,
          organizationId: member.organizationId,
          workspaceId,
          userId: updatedBy,
          type: 'member_role_updated',
          action: 'updated_member_role',
          details: {
            targetUserId: userId,
            oldRole,
            newRole,
          },
          metadata: {},
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(activityRef, activity);

        // Create notification for the user whose role was changed
        if (userId !== updatedBy) {
          const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
          const notification: Notification = {
            id: notificationRef.id,
            userId,
            organizationId: member.organizationId,
            workspaceId,
            type: 'member_joined', // Using generic type for role changes
            title: 'Role Updated',
            message: `Your role has been updated to ${newRole}`,
            isRead: false,
            priority: 'medium',
            createdAt: serverTimestamp() as Timestamp,
          };
          transaction.set(notificationRef, notification);
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating member role:', error);
      return { success: false, error: error.message };
    }
  }

  static async removeMember(
    workspaceId: string,
    userId: string,
    removedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if remover has permission
      const hasPermission = await this.checkManageRolePermission(workspaceId, removedBy);
      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions to remove members' };
      }

      // Prevent removing the only owner
      if (userId !== removedBy) {
        const member = await this.getWorkspaceMember(workspaceId, userId);
        if (member?.role === 'owner') {
          const owners = await this.getWorkspaceOwners(workspaceId);
          if (owners.length === 1) {
            return { success: false, error: 'Cannot remove the only owner' };
          }
        }
      }

      const memberRef = doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspaceId}_${userId}`);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        return { success: false, error: 'Member not found' };
      }

      const member = memberDoc.data() as WorkspaceMember;

      await runTransaction(db, async (transaction) => {
        // Update member status to removed instead of deleting
        transaction.update(memberRef, {
          status: 'removed',
          updatedAt: serverTimestamp(),
        });

        // Log activity
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        const activity: Activity = {
          id: activityRef.id,
          organizationId: member.organizationId,
          workspaceId,
          userId: removedBy,
          type: 'member_removed',
          action: 'removed_member',
          details: {
            targetUserId: userId,
            previousRole: member.role,
          },
          metadata: {},
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(activityRef, activity);

        // Create notification for the removed user
        if (userId !== removedBy) {
          const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
          const notification: Notification = {
            id: notificationRef.id,
            userId,
            organizationId: member.organizationId,
            workspaceId,
            type: 'member_joined', // Using generic type
            title: 'Removed from Workspace',
            message: `You have been removed from the workspace`,
            isRead: false,
            priority: 'high',
            createdAt: serverTimestamp() as Timestamp,
          };
          transaction.set(notificationRef, notification);
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error removing member:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscriptions
  static subscribeToWorkspaceMembers(
    workspaceId: string,
    callback: (members: (WorkspaceMember & { profile: UserProfile })[], presence: Record<string, UserPresence>) => void
  ): () => void {
    const membersQuery = query(
      collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
      where('workspaceId', '==', workspaceId),
      where('status', '==', 'active'),
      orderBy('joinedAt', 'asc')
    );

    return onSnapshot(membersQuery, async (membersSnapshot) => {
      const membersWithProfile: (WorkspaceMember & { profile: UserProfile })[] = [];
      const userIds: string[] = [];

      for (const memberDoc of membersSnapshot.docs) {
        const member = memberDoc.data() as WorkspaceMember;
        const profile = await firestoreService.getUserProfile(member.userId);
        
        if (profile) {
          membersWithProfile.push({
            ...member,
            profile,
          });
          userIds.push(member.userId);
        }
      }

      // Get presence information for all members
      const presence: Record<string, UserPresence> = {};
      if (userIds.length > 0) {
        for (const userId of userIds) {
          const presenceDoc = await getDoc(doc(db, COLLECTIONS.USER_PRESENCE, userId));
          if (presenceDoc.exists()) {
            presence[userId] = presenceDoc.data() as UserPresence;
          }
        }
      }

      callback(membersWithProfile, presence);
    });
  }

  // Public method to get invitation by token (needed for invitation page)
  static async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const invitationQuery = query(
        collection(db, COLLECTIONS.INVITATIONS),
        where('token', '==', token),
        limit(1)
      );
      const invitationSnapshot = await getDocs(invitationQuery);
      return invitationSnapshot.empty ? null : invitationSnapshot.docs[0].data() as Invitation;
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      return null;
    }
  }

  static async getPendingInvitationsForUser(email: string): Promise<Invitation[]> {
    try {
      const invitationQuery = query(
        collection(db, COLLECTIONS.INVITATIONS),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'pending'),
        where('expiresAt', '>', new Date()),
        orderBy('expiresAt', 'desc'),
        orderBy('createdAt', 'desc')
      );
      const invitationSnapshot = await getDocs(invitationQuery);
      return invitationSnapshot.docs.map(doc => doc.data() as Invitation);
    } catch (error) {
      console.error('Error getting pending invitations for user:', error);
      return [];
    }
  }

  // Helper methods
  private static async checkInvitePermission(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const memberDocId = `${workspaceId}_${userId}`;
      const memberDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACE_MEMBERS, memberDocId));
      
      if (!memberDoc.exists()) {
        return false;
      }
      
      const member = memberDoc.data() as WorkspaceMember;
      return member.status === 'active' && member.permissions?.canInviteMembers;
    } catch (error) {
      console.error('Error checking invite permission:', error);
      return false;
    }
  }

  private static async checkManageRolePermission(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const memberDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspaceId}_${userId}`));
      if (!memberDoc.exists()) return false;
      
      const member = memberDoc.data() as WorkspaceMember;
      return member.status === 'active' && member.permissions.canManageRoles;
    } catch (error) {
      console.error('Error checking manage role permission:', error);
      return false;
    }
  }

  private static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const profilesQuery = query(
        collection(db, COLLECTIONS.PROFILES),
        where('email', '==', email.toLowerCase()),
        limit(1)
      );
      const profilesSnapshot = await getDocs(profilesQuery);
      return profilesSnapshot.empty ? null : profilesSnapshot.docs[0].data() as UserProfile;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  private static async getPendingInvitation(workspaceId: string, email: string): Promise<Invitation | null> {
    try {
      const invitationQuery = query(
        collection(db, COLLECTIONS.INVITATIONS),
        where('workspaceId', '==', workspaceId),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'pending')
      );
      const invitationSnapshot = await getDocs(invitationQuery);
      return invitationSnapshot.empty ? null : invitationSnapshot.docs[0].data() as Invitation;
    } catch (error) {
      console.error('Error getting pending invitation:', error);
      return null;
    }
  }

  private static async getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    try {
      const memberDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspaceId}_${userId}`));
      return memberDoc.exists() ? memberDoc.data() as WorkspaceMember : null;
    } catch (error) {
      console.error('Error getting workspace member:', error);
      return null;
    }
  }

  private static async getWorkspaceOwners(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const ownersQuery = query(
        collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
        where('workspaceId', '==', workspaceId),
        where('role', '==', 'owner'),
        where('status', '==', 'active')
      );
      const ownersSnapshot = await getDocs(ownersQuery);
      return ownersSnapshot.docs.map(doc => doc.data() as WorkspaceMember);
    } catch (error) {
      console.error('Error getting workspace owners:', error);
      return [];
    }
  }

  private static getDefaultPermissions(role: WorkspaceRole): WorkspaceMember['permissions'] {
    switch (role) {
      case 'owner':
        return {
          canCreateProjects: true,
          canInviteMembers: true,
          canManageWorkspace: true,
          canDeleteWorkspace: true,
          canManageIntegrations: true,
          canViewAllProjects: true,
          canManageRoles: true,
        };
      case 'admin':
        return {
          canCreateProjects: true,
          canInviteMembers: true,
          canManageWorkspace: true,
          canDeleteWorkspace: false,
          canManageIntegrations: true,
          canViewAllProjects: true,
          canManageRoles: true,
        };
      case 'member':
        return {
          canCreateProjects: true,
          canInviteMembers: true, // Members can invite other members
          canManageWorkspace: false,
          canDeleteWorkspace: false,
          canManageIntegrations: false,
          canViewAllProjects: true,
          canManageRoles: false,
        };
      case 'guest':
        return {
          canCreateProjects: false,
          canInviteMembers: false,
          canManageWorkspace: false,
          canDeleteWorkspace: false,
          canManageIntegrations: false,
          canViewAllProjects: false,
          canManageRoles: false,
        };
      default:
        return {
          canCreateProjects: false,
          canInviteMembers: false,
          canManageWorkspace: false,
          canDeleteWorkspace: false,
          canManageIntegrations: false,
          canViewAllProjects: false,
          canManageRoles: false,
        };
    }
  }

  private static generateInvitationToken(): string {
    return Math.random().toString(36).substring(2) + 
           Math.random().toString(36).substring(2) + 
           Date.now().toString(36);
  }

  // Presence Management
  static async updateUserPresence(
    userId: string,
    status: 'online' | 'away' | 'offline',
    currentWorkspace?: string,
    currentProject?: string
  ): Promise<void> {
    try {
      const presenceRef = doc(db, COLLECTIONS.USER_PRESENCE, userId);
      
      // Build presence object without undefined values
      const presence: any = {
        userId,
        status,
        lastSeen: serverTimestamp() as Timestamp,
      };
      
      // Only include currentWorkspace if it's defined
      if (currentWorkspace !== undefined) {
        presence.currentWorkspace = currentWorkspace;
      }
      
      // Only include currentProject if it's defined
      if (currentProject !== undefined) {
        presence.currentProject = currentProject;
      }
      
      await setDoc(presenceRef, presence, { merge: true });
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  static subscribeToUserPresence(
    userIds: string[],
    callback: (presence: Record<string, UserPresence>) => void
  ): () => void {
    if (userIds.length === 0) {
      callback({});
      return () => {};
    }

    const unsubscribes: (() => void)[] = [];
    const presenceData: Record<string, UserPresence> = {};

    userIds.forEach(userId => {
      const presenceRef = doc(db, COLLECTIONS.USER_PRESENCE, userId);
      const unsubscribe = onSnapshot(presenceRef, (doc) => {
        if (doc.exists()) {
          presenceData[userId] = doc.data() as UserPresence;
        } else {
          delete presenceData[userId];
        }
        callback({ ...presenceData });
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  // Email sending helper
  private static async sendInvitationEmail(
    workspaceId: string,
    organizationId: string,
    inviteeEmail: string,
    invitation: Invitation,
    invitedBy: string
  ): Promise<void> {
    try {
      // Get inviter profile
      const inviterProfile = await firestoreService.getUserProfile(invitedBy);
      if (!inviterProfile) {
        console.error('Inviter profile not found');
        return;
      }

      // Get workspace details
      const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
      if (!workspaceDoc.exists()) {
        console.error('Workspace not found');
        return;
      }
      const workspace = workspaceDoc.data() as Workspace;

      // Get organization details
      const orgDoc = await getDoc(doc(db, COLLECTIONS.ORGANIZATIONS, organizationId));
      if (!orgDoc.exists()) {
        console.error('Organization not found');
        return;
      }
      const organization = orgDoc.data() as Organization;

      // Prepare email data
      const emailData: EmailInvitationData = {
        inviterName: inviterProfile.displayName || inviterProfile.email.split('@')[0],
        inviterEmail: inviterProfile.email,
        workspaceName: workspace.name,
        inviteeEmail,
        invitationToken: invitation.token,
        organizationName: organization.name,
      };

      // Send the email
      const result = await EmailService.sendInvitationEmail(emailData);
      if (!result.success) {
        console.error('Failed to send invitation email:', result.error);
      } else {
        console.log('Invitation email sent successfully to:', inviteeEmail);
      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
    }
  }
}