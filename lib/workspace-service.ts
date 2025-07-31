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
import { 
  Workspace, 
  Organization, 
  WorkspaceMember,
  WorkspaceRole,
  Activity,
  COLLECTIONS 
} from "./types";

export class WorkspaceService {
  // Organization Management
  static async createInitialOrganization(
    userId: string, 
    orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'owners' | 'members'>
  ): Promise<{ success: boolean; organizationId?: string; error?: string }> {
    try {
      // Check if user already has organizations to prevent duplicates for initial creation only
      const existingOrgs = await this.getUserOrganizations(userId);
      if (existingOrgs.length > 0) {
        console.log('User already has organizations, skipping initial creation');
        return { success: true, organizationId: existingOrgs[0].id };
      }

      // Use the regular createOrganization for initial setup
      return this.createOrganization(userId, orgData);
    } catch (error: any) {
      console.error('Error creating initial organization:', error);
      return { success: false, error: error.message };
    }
  }

  static async createOrganization(
    userId: string, 
    orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'owners' | 'members'>
  ): Promise<{ success: boolean; organizationId?: string; error?: string }> {
    try {
      const orgRef = doc(collection(db, COLLECTIONS.ORGANIZATIONS));
      const organizationId = orgRef.id;

      // Filter out undefined values from orgData
      const cleanOrgData = Object.fromEntries(
        Object.entries(orgData).filter(([_, value]) => value !== undefined)
      );

      const organization: Organization = {
        id: organizationId,
        ...(cleanOrgData as Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'owners' | 'members'>),
        createdBy: userId,
        owners: [userId],
        members: [userId],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await runTransaction(db, async (transaction) => {
        // Create organization
        transaction.set(orgRef, organization);

        // Create default workspace
        const workspaceRef = doc(collection(db, COLLECTIONS.WORKSPACES));
        const defaultWorkspace: Workspace = {
          id: workspaceRef.id,
          organizationId,
          name: "General",
          emoji: "#",
          description: "Default workspace for getting started",
          isDefault: true,
          createdBy: userId,
          settings: {
            isPrivate: false,
            allowGuestAccess: false,
            defaultProjectRole: 'member',
            integrations: {
              emailNotifications: true,
            }
          },
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
        };
        transaction.set(workspaceRef, defaultWorkspace);

        // Add user as workspace owner
        const memberDocId = `${workspaceRef.id}_${userId}`;
        const memberRef = doc(db, COLLECTIONS.WORKSPACE_MEMBERS, memberDocId);
        const workspaceMember: WorkspaceMember = {
          id: memberDocId,
          workspaceId: workspaceRef.id,
          userId,
          organizationId,
          role: 'owner',
          status: 'active',
          invitedBy: userId,
          invitedAt: serverTimestamp() as Timestamp,
          joinedAt: serverTimestamp() as Timestamp,
          lastActiveAt: serverTimestamp() as Timestamp,
          permissions: {
            canCreateProjects: true,
            canInviteMembers: true,
            canManageWorkspace: true,
            canDeleteWorkspace: true,
            canManageIntegrations: true,
            canViewAllProjects: true,
            canManageRoles: true,
          },
          invitationSource: 'direct', // Owner creates organization directly
        };
        transaction.set(memberRef, workspaceMember);

        // Log activity
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        const activity: Activity = {
          id: activityRef.id,
          organizationId,
          workspaceId: workspaceRef.id,
          userId,
          type: 'workspace_created',
          action: 'created_organization_and_workspace',
          details: {
            organizationName: orgData.name,
            workspaceName: defaultWorkspace.name,
          },
          metadata: {},
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(activityRef, activity);
      });

      return { success: true, organizationId };
    } catch (error: any) {
      console.error('Error creating organization:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ORGANIZATIONS),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Organization);
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }
  }

  static async removeOrganizationMember(
    organizationId: string,
    userIdToRemove: string,
    removedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Starting removal of user ${userIdToRemove} from organization ${organizationId} by ${removedBy}`);
      
      // Check if the remover is the organization admin
      const orgDoc = await getDoc(doc(db, COLLECTIONS.ORGANIZATIONS, organizationId));
      if (!orgDoc.exists()) {
        return { success: false, error: 'Organization not found' };
      }

      const orgData = orgDoc.data();
      console.log(`Organization: ${orgData.name} (${organizationId})`);
      
      if (orgData.createdBy !== removedBy) {
        return { success: false, error: 'Only organization admin can remove members' };
      }

      // Prevent removing the admin themselves
      if (userIdToRemove === orgData.createdBy) {
        return { success: false, error: 'Cannot remove organization admin' };
      }

      // Get all workspaces in the organization
      const workspacesQuery = query(
        collection(db, COLLECTIONS.WORKSPACES),
        where('organizationId', '==', organizationId)
      );
      const workspacesSnapshot = await getDocs(workspacesQuery);
      const allWorkspaces = workspacesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get all workspace member records for this user
      const memberRecordsPromises = allWorkspaces.map(workspace => 
        getDoc(doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspace.id}_${userIdToRemove}`))
      );
      const memberRecords = await Promise.all(memberRecordsPromises);

      // Get user's profile to find their email for invitation cleanup
      const userProfile = await getDoc(doc(db, COLLECTIONS.PROFILES, userIdToRemove));
      const userEmail = userProfile.exists() ? userProfile.data()?.email : null;

      // Get activities, notifications, and invitations for this user in THIS SPECIFIC organization only
      const [activitiesSnapshot, notificationsSnapshot, invitationsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, COLLECTIONS.ACTIVITIES),
          where('organizationId', '==', organizationId),
          where('userId', '==', userIdToRemove)
        )),
        getDocs(query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('organizationId', '==', organizationId),
          where('userId', '==', userIdToRemove)
        )),
        userEmail ? getDocs(query(
          collection(db, COLLECTIONS.INVITATIONS),
          where('organizationId', '==', organizationId),
          where('email', '==', userEmail.toLowerCase())
        )) : Promise.resolve({ docs: [] })
      ]);

      await runTransaction(db, async (transaction) => {
        // Remove user from organization members list
        const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, organizationId);
        const currentMembers = orgData.members || [];
        transaction.update(orgRef, {
          members: currentMembers.filter((id: string) => id !== userIdToRemove),
          updatedAt: serverTimestamp(),
        });

        // Remove workspace member records ONLY for workspaces in THIS organization
        allWorkspaces.forEach((workspace, index) => {
          if (memberRecords[index].exists()) {
            const memberRef = doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspace.id}_${userIdToRemove}`);
            transaction.delete(memberRef);
            console.log(`Removed user ${userIdToRemove} from workspace ${workspace.id} in organization ${organizationId}`);
          }
        });

        // Delete activities ONLY for THIS organization
        activitiesSnapshot.docs.forEach(doc => {
          transaction.delete(doc.ref);
        });

        // Delete notifications ONLY for THIS organization
        notificationsSnapshot.docs.forEach(doc => {
          transaction.delete(doc.ref);
        });

        // Cancel invitations ONLY for THIS organization
        if (invitationsSnapshot.docs) {
          invitationsSnapshot.docs.forEach(doc => {
            transaction.update(doc.ref, {
              status: 'cancelled',
              cancelledAt: serverTimestamp(),
              cancelledBy: removedBy,
            });
          });
        }

        // Log the removal activity
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        transaction.set(activityRef, {
          id: activityRef.id,
          organizationId,
          workspaceId: null, // Organization-level activity
          userId: removedBy,
          type: 'member_removed',
          action: 'removed_organization_member',
          details: {
            removedUserId: userIdToRemove,
            workspacesAffected: allWorkspaces.length,
            removedFromSpecificOrganization: organizationId,
            organizationName: orgData.name,
            preservedOtherOrganizations: true,
          },
          metadata: {},
          createdAt: serverTimestamp(),
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error removing organization member:', error);
      return { success: false, error: error.message };
    }
  }

  // Workspace Management
  static async createWorkspace(
    userId: string,
    organizationId: string,
    workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'organizationId'>
  ): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
    try {
      const workspaceRef = doc(collection(db, COLLECTIONS.WORKSPACES));
      const workspaceId = workspaceRef.id;

      // Get organization data to access all members (outside transaction)
      const orgDoc = await getDoc(doc(db, COLLECTIONS.ORGANIZATIONS, organizationId));
      if (!orgDoc.exists()) {
        return { success: false, error: 'Organization not found' };
      }
      
      const orgData = orgDoc.data();
      const organizationMembers = orgData.members || [];

      // Filter out undefined values from workspaceData
      const cleanWorkspaceData = Object.fromEntries(
        Object.entries(workspaceData).filter(([_, value]) => value !== undefined)
      );

       // @ts-ignore
      const workspace: Workspace = {
        id: workspaceId,
        organizationId,
        ...cleanWorkspaceData,
        createdBy: userId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await runTransaction(db, async (transaction) => {
        // Create workspace
        transaction.set(workspaceRef, workspace);

        // Add ALL organization members to the new workspace
        organizationMembers.forEach((memberId: string) => {
          const memberDocId = `${workspaceId}_${memberId}`;
          const memberRef = doc(db, COLLECTIONS.WORKSPACE_MEMBERS, memberDocId);
          
          // Creator gets 'owner' role, others get 'member' role
          const role = memberId === userId ? 'owner' : 'member';
          
          const workspaceMember: WorkspaceMember = {
            id: memberDocId,
            workspaceId,
            userId: memberId,
            organizationId,
            role,
            status: 'active',
            invitedBy: userId,
            invitedAt: serverTimestamp() as Timestamp,
            joinedAt: serverTimestamp() as Timestamp,
            lastActiveAt: serverTimestamp() as Timestamp,
            permissions: role === 'owner' ? {
              canCreateProjects: true,
              canInviteMembers: true,
              canManageWorkspace: true,
              canDeleteWorkspace: true,
              canManageIntegrations: true,
              canViewAllProjects: true,
              canManageRoles: true,
            } : {
              canCreateProjects: true,
              canInviteMembers: true,
              canManageWorkspace: false,
              canDeleteWorkspace: false,
              canManageIntegrations: false,
              canViewAllProjects: true,
              canManageRoles: false,
            },
            invitationSource: 'direct', // Auto-added to new workspace
          };
          transaction.set(memberRef, workspaceMember);
        });

        // Log activity
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        const activity: Activity = {
          id: activityRef.id,
          organizationId,
          workspaceId,
          userId,
          type: 'workspace_created',
          action: 'created_workspace',
          details: {
            workspaceName: workspaceData.name,
            workspaceEmoji: workspaceData.emoji,
            autoAddedMembers: organizationMembers.length,
            allOrganizationMembersAdded: true,
          },
          metadata: {},
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(activityRef, activity);
      });

      return { success: true, workspaceId };
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      return { success: false, error: error.message };
    }
  }

  static async getWorkspacesForOrganization(organizationId: string): Promise<Workspace[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.WORKSPACES),
        where('organizationId', '==', organizationId),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Workspace);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }
  }

  static async getUserWorkspaces(userId: string, organizationId: string): Promise<Workspace[]> {
    try {
      // First get workspace IDs where user is a member
      const memberQuery = query(
        collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
        where('userId', '==', userId),
        where('organizationId', '==', organizationId),
        where('status', '==', 'active')
      );
      const memberSnapshot = await getDocs(memberQuery);
      const workspaceIds = memberSnapshot.docs.map(doc => doc.data().workspaceId);

      if (workspaceIds.length === 0) return [];

      // Get workspace details
      const workspaces: Workspace[] = [];
      for (const workspaceId of workspaceIds) {
        const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
        if (workspaceDoc.exists()) {
          workspaces.push(workspaceDoc.data() as Workspace);
        }
      }

      return workspaces.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.createdAt > b.createdAt ? 1 : -1;
      });
    } catch (error) {
      console.error('Error fetching user workspaces:', error);
      return [];
    }
  }

  static async updateWorkspace(
    workspaceId: string,
    userId: string,
    updates: Partial<Workspace>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check permissions
      const hasPermission = await this.checkWorkspacePermission(workspaceId, userId, 'canManageWorkspace');
      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const workspaceRef = doc(db, COLLECTIONS.WORKSPACES, workspaceId);
      await updateDoc(workspaceRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      const workspaceDoc = await getDoc(workspaceRef);
      const workspace = workspaceDoc.data() as Workspace;

      const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
      const activity: Activity = {
        id: activityRef.id,
        organizationId: workspace.organizationId,
        workspaceId,
        userId,
        type: 'workspace_updated',
        action: 'updated_workspace',
        details: {
          updates: Object.keys(updates),
          workspaceName: workspace.name,
        },
        metadata: {},
        createdAt: serverTimestamp() as Timestamp,
      };
      await setDoc(activityRef, activity);

      return { success: true };
    } catch (error: any) {
      console.error('Error updating workspace:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check permissions
      const hasPermission = await this.checkWorkspacePermission(workspaceId, userId, 'canDeleteWorkspace');
      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Check if it's not the default workspace
      const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
      const workspace = workspaceDoc.data() as Workspace;
      
      if (workspace.isDefault) {
        return { success: false, error: 'Cannot delete default workspace' };
      }

      await runTransaction(db, async (transaction) => {
        // Delete workspace
        transaction.delete(doc(db, COLLECTIONS.WORKSPACES, workspaceId));

        // Delete all workspace members
        const membersQuery = query(
          collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
          where('workspaceId', '==', workspaceId)
        );
        const membersSnapshot = await getDocs(membersQuery);
        membersSnapshot.docs.forEach(memberDoc => {
          transaction.delete(memberDoc.ref);
        });

        // Log activity
        const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
        const activity: Activity = {
          id: activityRef.id,
          organizationId: workspace.organizationId,
          userId,
          type: 'workspace_deleted',
          action: 'deleted_workspace',
          details: {
            workspaceName: workspace.name,
            workspaceId,
          },
          metadata: {},
          createdAt: serverTimestamp() as Timestamp,
        };
        transaction.set(activityRef, activity);
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting workspace:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscriptions
  static subscribeToUserWorkspaces(
    userId: string,
    organizationId: string,
    callback: (workspaces: Workspace[]) => void
  ): () => void {
    // Subscribe to workspace members for this user
    const memberQuery = query(
      collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
      where('userId', '==', userId),
      where('organizationId', '==', organizationId),
      where('status', '==', 'active')
    );

    return onSnapshot(memberQuery, async (memberSnapshot) => {
      const workspaceIds = memberSnapshot.docs.map(doc => doc.data().workspaceId);
      
      if (workspaceIds.length === 0) {
        callback([]);
        return;
      }

      // Get workspace details for each workspace ID
      const workspaces: Workspace[] = [];
      for (const workspaceId of workspaceIds) {
        const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
        if (workspaceDoc.exists()) {
          workspaces.push(workspaceDoc.data() as Workspace);
        }
      }

      workspaces.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.createdAt > b.createdAt ? 1 : -1;
      });

      callback(workspaces);
    });
  }

  static subscribeToWorkspace(
    workspaceId: string,
    callback: (workspace: Workspace | null) => void
  ): () => void {
    const workspaceRef = doc(db, COLLECTIONS.WORKSPACES, workspaceId);
    return onSnapshot(workspaceRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as Workspace);
      } else {
        callback(null);
      }
    });
  }

  // Permission helpers
  static async checkWorkspacePermission(
    workspaceId: string,
    userId: string,
    permission: keyof WorkspaceMember['permissions']
  ): Promise<boolean> {
    try {
      const memberDoc = await getDoc(
        doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspaceId}_${userId}`)
      );
      
      if (!memberDoc.exists()) return false;
      
      const member = memberDoc.data() as WorkspaceMember;
      return member.status === 'active' && member.permissions[permission];
    } catch (error) {
      console.error('Error checking workspace permission:', error);
      return false;
    }
  }

  static async getUserWorkspaceRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    try {
      const memberDoc = await getDoc(
        doc(db, COLLECTIONS.WORKSPACE_MEMBERS, `${workspaceId}_${userId}`)
      );
      
      if (!memberDoc.exists()) return null;
      
      const member = memberDoc.data() as WorkspaceMember;
      return member.status === 'active' ? member.role : null;
    } catch (error) {
      console.error('Error getting user workspace role:', error);
      return null;
    }
  }

  // Activity helpers
  static async getWorkspaceActivities(
    workspaceId: string,
    limitCount: number = 50
  ): Promise<Activity[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITIES),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Activity);
    } catch (error) {
      console.error('Error fetching workspace activities:', error);
      return [];
    }
  }

  static subscribeToWorkspaceActivities(
    workspaceId: string,
    callback: (activities: Activity[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITIES),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (querySnapshot) => {
      const activities = querySnapshot.docs.map(doc => doc.data() as Activity);
      callback(activities);
    });
  }
}