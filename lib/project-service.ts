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
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Project, Task, Activity, COLLECTIONS } from "./types";

export class ProjectService {
  // Create a new project
  static async createProject(
    organizationId: string,
    workspaceId: string,
    userId: string,
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'workspaceId' | 'createdBy'>
  ): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      const projectRef = doc(collection(db, COLLECTIONS.PROJECTS));
      const projectId = projectRef.id;

      const project: Project = {
        id: projectId,
        organizationId,
        workspaceId,
        createdBy: userId,
        ...projectData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(projectRef, project);

      // Log activity
      await this.logProjectActivity(projectId, userId, 'created_project', `Created project "${projectData.name}"`);

      return { success: true, projectId };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all projects for a workspace
  static async getWorkspaceProjects(workspaceId: string, organizationId: string): Promise<Project[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROJECTS),
        where('workspaceId', '==', workspaceId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Project);
    } catch (error) {
      console.error('Error fetching workspace projects:', error);
      return [];
    }
  }

  // Get all projects for an organization (across all workspaces)
  static async getOrganizationProjects(organizationId: string, limitCount: number = 50): Promise<Project[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROJECTS),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Project);
    } catch (error) {
      console.error('Error fetching organization projects:', error);
      return [];
    }
  }

  // Get projects by user (where user is assigned or owner)
  static async getUserProjects(userId: string, organizationId: string): Promise<Project[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROJECTS),
        where('organizationId', '==', organizationId),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Project);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      // Fallback: try getting by createdBy if members array query fails
      try {
        const fallbackQ = query(
          collection(db, COLLECTIONS.PROJECTS),
          where('organizationId', '==', organizationId),
          where('createdBy', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        
        const fallbackSnapshot = await getDocs(fallbackQ);
        return fallbackSnapshot.docs.map(doc => doc.data() as Project);
      } catch (fallbackError) {
        console.error('Error in fallback project query:', fallbackError);
        return [];
      }
    }
  }

  // Get a specific project
  static async getProject(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await getDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
      return projectDoc.exists() ? projectDoc.data() as Project : null;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }

  // Update project
  static async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'workspaceId'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
      
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Log activity for significant updates
      if (updates.status) {
        await this.logProjectActivity(projectId, userId, 'updated_status', `Changed status to ${updates.status}`);
      }
      if (updates.progress !== undefined) {
        await this.logProjectActivity(projectId, userId, 'updated_progress', `Progress updated to ${updates.progress}%`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete project
  static async deleteProject(projectId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
      const project = await getDoc(projectRef);
      
      if (!project.exists()) {
        return { success: false, error: 'Project not found' };
      }

      const projectData = project.data() as Project;
      
      // Check permissions (basic check - enhance as needed)
      if (projectData.createdBy !== userId) {
        return { success: false, error: 'Insufficient permissions' };
      }

      await deleteDoc(projectRef);
      
      // Log activity
      await this.logProjectActivity(projectId, userId, 'deleted_project', `Deleted project "${projectData.name}"`);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Add member to project
  static async addProjectMember(
    projectId: string,
    userId: string,
    memberToAdd: string,
    role: string = 'member'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
      const project = await getDoc(projectRef);
      
      if (!project.exists()) {
        return { success: false, error: 'Project not found' };
      }

      const projectData = project.data() as Project;
      const currentMembers = projectData.members || [];
      
      if (currentMembers.includes(memberToAdd)) {
        return { success: false, error: 'User is already a member' };
      }

      await updateDoc(projectRef, {
        members: [...currentMembers, memberToAdd],
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await this.logProjectActivity(projectId, userId, 'added_member', `Added member to project`);

      return { success: true };
    } catch (error: any) {
      console.error('Error adding project member:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscribe to project updates
  static subscribeToProject(
    projectId: string,
    callback: (project: Project | null) => void
  ): () => void {
    const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);

    return onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as Project);
      } else {
        callback(null);
      }
    });
  }

  // Subscribe to workspace projects
  static subscribeToWorkspaceProjects(
    workspaceId: string,
    organizationId: string,
    callback: (projects: Project[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('workspaceId', '==', workspaceId),
      where('organizationId', '==', organizationId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(doc => doc.data() as Project);
      callback(projects);
    });
  }

  // Calculate project health score
  static calculateProjectHealth(project: Project, tasks: Task[]): number {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    
    if (projectTasks.length === 0) return 50; // Neutral if no tasks
    
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const overdueTasks = projectTasks.filter(t => 
      t.dueDate && t.dueDate.toDate() < new Date() && t.status !== 'completed'
    ).length;
    
    const completionRate = completedTasks / projectTasks.length;
    const overdueRate = overdueTasks / projectTasks.length;
    
    // Base score from completion rate
    let score = completionRate * 60 + 40; // 40-100 range
    
    // Penalty for overdue tasks
    score -= overdueRate * 30;
    
    // Bonus for on-track progress
    if (project.progress && project.progress > completionRate * 100) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Get project statistics
  static async getProjectStats(organizationId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    onTrack: number;
    atRisk: number;
  }> {
    try {
      const projects = await this.getOrganizationProjects(organizationId);
      
      const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        // @ts-ignore
        onTrack: projects.filter(p => p.health === 'on_track').length,
        atRisk: projects.filter(p => p.health === 'at_risk' || p.health === 'critical').length,
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting project stats:', error);
      return { total: 0, active: 0, completed: 0, onTrack: 0, atRisk: 0 };
    }
  }

  // Private method to log project activities
  private static async logProjectActivity(
    projectId: string,
    userId: string,
    action: string,
    description: string
  ): Promise<void> {
    try {
      const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
      
      const activity: Activity = {
        id: activityRef.id,
        userId,
        projectId,
        action,
        // @ts-ignore
        description,
        metadata: {},
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(activityRef, activity);
    } catch (error) {
      console.error('Error logging project activity:', error);
      // Don't throw - activity logging shouldn't break main functionality
    }
  }
}