"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { WorkspaceService } from '@/lib/workspace-service';
import { MemberService } from '@/lib/member-service';
import { 
  Workspace, 
  Organization, 
  WorkspaceMember, 
  UserProfile, 
  UserPresence,
  Activity
} from '@/lib/types';

interface WorkspaceContextType {
  // Organizations
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  
  // Workspaces
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  
  // Members
  workspaceMembers: (WorkspaceMember & { profile: UserProfile })[];
  memberPresence: Record<string, UserPresence>;
  
  // Activities
  recentActivities: Activity[];
  
  // Loading states
  isLoadingOrganizations: boolean;
  isLoadingWorkspaces: boolean;
  isLoadingMembers: boolean;
  isLoadingActivities: boolean;
  
  // Actions
  createOrganization: (orgData: { name: string; logo?: string; plan: 'free' | 'startup' | 'enterprise' }) => Promise<{ success: boolean; error?: string }>;
  createWorkspace: (workspaceData: { name: string; emoji: string; description?: string; isDefault?: boolean }) => Promise<{ success: boolean; error?: string }>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<{ success: boolean; error?: string }>;
  deleteWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Member actions
  inviteMember: (email: string, role: 'owner' | 'admin' | 'member' | 'guest') => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (userId: string, newRole: 'owner' | 'admin' | 'member' | 'guest') => Promise<{ success: boolean; error?: string }>;
  removeMember: (userId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Utility
  refreshData: () => Promise<void>;
  getUserRole: (workspaceId?: string) => 'owner' | 'admin' | 'member' | 'guest' | null;
  hasPermission: (permission: string, workspaceId?: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  
  // State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<(WorkspaceMember & { profile: UserProfile })[]>([]);
  const [memberPresence, setMemberPresence] = useState<Record<string, UserPresence>>({});
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  
  // Loading states
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  // Track organization creation attempts to prevent duplicates
  const [hasAttemptedOrgCreation, setHasAttemptedOrgCreation] = useState(false);
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  
  // Unsubscribe functions
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState<(() => void)[]>([]);

  // Load organizations when user changes
  useEffect(() => {
    if (user?.uid) {
      loadOrganizations();
    } else {
      // Clear data when user logs out
      setOrganizations([]);
      setCurrentOrganization(null);
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setWorkspaceMembers([]);
      setMemberPresence({});
      setRecentActivities([]);
      // Reset organization creation flags
      setHasAttemptedOrgCreation(false);
      setIsCreatingOrganization(false);
    }
  }, [user?.uid]);

  // Disabled automatic organization creation - users will be guided through onboarding instead
  // useEffect(() => {
  //   const createDefaultOrganization = async () => {
  //     if (user?.uid && userProfile && 
  //         organizations.length === 0 && 
  //         !isLoadingOrganizations && 
  //         !hasAttemptedOrgCreation && 
  //         !isCreatingOrganization) {
        
  //       setHasAttemptedOrgCreation(true);
  //       setIsCreatingOrganization(true);
        
  //       console.log("Creating default organization for new user");
        
  //       try {
  //         const result = await createOrganization({
  //           name: `${userProfile.displayName || 'My'} Organization`,
  //           plan: 'free'
  //         });
          
  //         if (!result.success) {
  //           console.error("Failed to create default organization:", result.error);
  //           // Reset attempt flag on failure so user can try again
  //           setHasAttemptedOrgCreation(false);
  //         }
  //       } catch (error) {
  //         console.error("Error creating default organization:", error);
  //         setHasAttemptedOrgCreation(false);
  //       } finally {
  //         setIsCreatingOrganization(false);
  //       }
  //     }
  //   };

  //   createDefaultOrganization();
  // }, [user?.uid, userProfile, organizations.length, isLoadingOrganizations, hasAttemptedOrgCreation, isCreatingOrganization]);

  // Load workspaces when current organization changes
  useEffect(() => {
    if (user?.uid && currentOrganization?.id) {
      console.log(`🔄 Organization changed to: ${currentOrganization.name} - Loading workspaces...`);
      loadWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setWorkspaceMembers([]);
      setMemberPresence({});
      setRecentActivities([]);
    }
  }, [user?.uid, currentOrganization?.id]);

  // Load members and activities when current workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      console.log(`🔄 Workspace changed to: ${currentWorkspace.name} - Loading members and activities...`);
      loadWorkspaceMembers();
      loadWorkspaceActivities();
    } else {
      setWorkspaceMembers([]);
      setMemberPresence({});
      setRecentActivities([]);
    }
  }, [currentWorkspace?.id]);

  // Update user presence when workspace changes
  useEffect(() => {
    if (user?.uid && currentWorkspace?.id) {
      MemberService.updateUserPresence(
        user.uid,
        'online',
        currentWorkspace.id
      );
    }
  }, [user?.uid, currentWorkspace?.id]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [unsubscribeFunctions]);

  // Load functions
  const loadOrganizations = async () => {
    if (!user?.uid) return;
    
    setIsLoadingOrganizations(true);
    try {
      const orgs = await WorkspaceService.getUserOrganizations(user.uid);
      console.log(`User ${user.uid} has access to ${orgs.length} organizations:`, orgs.map(org => ({ id: org.id, name: org.name, createdBy: org.createdBy })));
      setOrganizations(orgs);
      
      // Set current organization if not set (default to first one)
      if (!currentOrganization && orgs.length > 0) {
        setCurrentOrganization(orgs[0]);
        console.log(`Set current organization to:`, orgs[0].name);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setIsLoadingOrganizations(false);
    }
  };

  const loadWorkspaces = useCallback(async () => {
    if (!user?.uid || !currentOrganization?.id) return;
    
    setIsLoadingWorkspaces(true);
    try {
      // Clean up existing subscriptions and reset array
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      setUnsubscribeFunctions([]);
      
      // Subscribe to real-time workspace updates
      const unsubscribe = WorkspaceService.subscribeToUserWorkspaces(
        user.uid,
        currentOrganization.id,
        (workspaceList) => {
          console.log('Received workspace update:', workspaceList.length, 'workspaces');
          setWorkspaces(workspaceList);
          
          // Set current workspace if not set (default to default workspace or first one)
          if (!currentWorkspace && workspaceList.length > 0) {
            const defaultWorkspace = workspaceList.find(w => w.isDefault) || workspaceList[0];
            setCurrentWorkspace(defaultWorkspace);
          }
          
          setIsLoadingWorkspaces(false);
        }
      );
      
      setUnsubscribeFunctions([unsubscribe]);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setIsLoadingWorkspaces(false);
    }
  }, [user?.uid, currentOrganization?.id, currentWorkspace]);

  const loadWorkspaceMembers = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    setIsLoadingMembers(true);
    try {
      console.log(`🔄 Loading members for workspace: ${currentWorkspace.name}`);
      
      // Clean up existing member subscriptions first
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      setUnsubscribeFunctions([]);
      
      // Subscribe to real-time member updates
      const unsubscribe = MemberService.subscribeToWorkspaceMembers(
        currentWorkspace.id,
        (members, presence) => {
          console.log(`📥 Received ${members.length} members for workspace: ${currentWorkspace.name}`);
          setWorkspaceMembers(members);
          setMemberPresence(presence);
          setIsLoadingMembers(false);
        }
      );
      
      setUnsubscribeFunctions(prev => [...prev, unsubscribe]);
    } catch (error) {
      console.error('Error loading workspace members:', error);
      setIsLoadingMembers(false);
    }
  }, [currentWorkspace?.id]);

  const loadWorkspaceActivities = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    
    setIsLoadingActivities(true);
    try {
      // Subscribe to real-time activity updates
      const unsubscribe = WorkspaceService.subscribeToWorkspaceActivities(
        currentWorkspace.id,
        (activities) => {
          setRecentActivities(activities);
          setIsLoadingActivities(false);
        }
      );
      
      setUnsubscribeFunctions(prev => [...prev, unsubscribe]);
    } catch (error) {
      console.error('Error loading workspace activities:', error);
      setIsLoadingActivities(false);
    }
  }, [currentWorkspace?.id]);

  // Action functions
  const createOrganization = async (orgData: { name: string; logo?: string; plan: 'free' | 'startup' | 'enterprise' }) => {
    if (!user?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await WorkspaceService.createOrganization(user.uid, {
      ...orgData,
      settings: {
        allowMemberInvites: true,
        requireApprovalForNewMembers: false,
        defaultWorkspaceRole: 'member',
        aiModelAccess: ['gpt-4', 'claude-3-sonnet'],
      }
    });

    if (result.success && result.organizationId) {
      // Refresh organizations list
      await loadOrganizations();
      // Set the newly created organization as current
      const orgs = await WorkspaceService.getUserOrganizations(user.uid);
      const newOrg = orgs.find(org => org.id === result.organizationId);
      if (newOrg) {
        console.log('Setting newly created organization as current:', newOrg.name);
        setCurrentOrganization(newOrg);
      }
    }

    return result;
  };

  const createWorkspace = async (workspaceData: { name: string; emoji: string; description?: string; isDefault?: boolean }) => {
    if (!user?.uid || !currentOrganization?.id) {
      return { success: false, error: 'User not authenticated or no organization selected' };
    }

    const result = await WorkspaceService.createWorkspace(
      user.uid,
      currentOrganization.id,
      {
        ...workspaceData,
        isDefault: workspaceData.isDefault || false,
        settings: {
          isPrivate: false,
          allowGuestAccess: false,
          defaultProjectRole: 'member',
          integrations: {
            emailNotifications: true,
          }
        }
      }
    );

    // Workspaces will be updated automatically via subscription
    // But also manually trigger a refresh to ensure immediate updates
    if (result.success) {
      // Immediate refresh attempt
      loadWorkspaces();
      // Fallback refresh in case the subscription missed it
      setTimeout(() => {
        console.log('Triggering fallback workspace refresh after creation');
        loadWorkspaces();
      }, 1000);
    }
    
    return result;
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>) => {
    if (!user?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await WorkspaceService.updateWorkspace(workspaceId, user.uid, updates);
    // Workspace will be updated automatically via subscription
    return result;
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!user?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await WorkspaceService.deleteWorkspace(workspaceId, user.uid);
    
    if (result.success && currentWorkspace?.id === workspaceId) {
      // Switch to another workspace if current one was deleted
      const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
      if (remainingWorkspaces.length > 0) {
        setCurrentWorkspace(remainingWorkspaces[0]);
      } else {
        setCurrentWorkspace(null);
      }
    }

    return result;
  };

  const inviteMember = async (email: string, role: 'owner' | 'admin' | 'member' | 'guest') => {
    if (!user?.uid || !currentWorkspace?.id || !currentOrganization?.id) {
      return { success: false, error: 'Missing required data' };
    }

    const result = await MemberService.inviteMemberByEmail(
      currentWorkspace.id,
      currentOrganization.id,
      email,
      role,
      user.uid
    );

    return result;
  };

  const updateMemberRole = async (userId: string, newRole: 'owner' | 'admin' | 'member' | 'guest') => {
    if (!user?.uid || !currentWorkspace?.id) {
      return { success: false, error: 'Missing required data' };
    }

    const result = await MemberService.updateMemberRole(
      currentWorkspace.id,
      userId,
      newRole,
      user.uid
    );

    return result;
  };

  const removeMember = async (userId: string) => {
    if (!user?.uid || !currentWorkspace?.id) {
      return { success: false, error: 'Missing required data' };
    }

    const result = await MemberService.removeMember(
      currentWorkspace.id,
      userId,
      user.uid
    );

    return result;
  };

  const refreshData = async () => {
    console.log('🔄 Refreshing all workspace data...');
    await loadOrganizations();
    if (currentOrganization?.id) {
      await loadWorkspaces();
      if (currentWorkspace?.id) {
        // Force reload members and activities for current workspace
        loadWorkspaceMembers();
        loadWorkspaceActivities();
      }
    }
    console.log('✅ Data refresh completed');
  };

  const getUserRole = (workspaceId?: string): 'owner' | 'admin' | 'member' | 'guest' | null => {
    const targetWorkspaceId = workspaceId || currentWorkspace?.id;
    if (!user?.uid || !targetWorkspaceId) return null;

    const member = workspaceMembers.find(m => m.userId === user.uid && m.workspaceId === targetWorkspaceId);
    return member?.role || null;
  };

  const hasPermission = (permission: string, workspaceId?: string): boolean => {
    const targetWorkspaceId = workspaceId || currentWorkspace?.id;
    if (!user?.uid || !targetWorkspaceId) {
      return false;
    }

    const member = workspaceMembers.find(m => m.userId === user.uid && m.workspaceId === targetWorkspaceId);
    
    if (!member || member.status !== 'active') {
      return false;
    }

    return (member.permissions as any)[permission] === true;
  };

  const value: WorkspaceContextType = {
    // Organizations
    organizations,
    currentOrganization,
    setCurrentOrganization,
    
    // Workspaces
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    
    // Members
    workspaceMembers,
    memberPresence,
    
    // Activities
    recentActivities,
    
    // Loading states
    isLoadingOrganizations,
    isLoadingWorkspaces,
    isLoadingMembers,
    isLoadingActivities,
    
    // Actions
    createOrganization,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    
    // Member actions
    inviteMember,
    updateMemberRole,
    removeMember,
    
    // Utility
    refreshData,
    getUserRole,
    hasPermission,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}