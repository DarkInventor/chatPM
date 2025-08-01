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
import { Task, Activity, COLLECTIONS } from "./types";

export class TaskService {
  // Create a new task
  static async createTask(
    organizationId: string,
    workspaceId: string,
    projectId: string,
    userId: string,
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'workspaceId' | 'projectId' | 'createdBy'>
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const taskRef = doc(collection(db, COLLECTIONS.TASKS));
      const taskId = taskRef.id;

      const task: Task = {
        id: taskId,
        organizationId,
        workspaceId,
        projectId,
        createdBy: userId,
        ...taskData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(taskRef, task);

      // Log activity
      await this.logTaskActivity(taskId, userId, 'created_task', `Created task "${taskData.title}"`);

      return { success: true, taskId };
    } catch (error: any) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all tasks for a project
  static async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Task);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      return [];
    }
  }

  // Get all tasks for a workspace
  static async getWorkspaceTasks(workspaceId: string, organizationId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('workspaceId', '==', workspaceId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Task);
    } catch (error) {
      console.error('Error fetching workspace tasks:', error);
      return [];
    }
  }

  // Get all tasks for an organization
  static async getOrganizationTasks(organizationId: string, limitCount: number = 100): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Task);
    } catch (error) {
      console.error('Error fetching organization tasks:', error);
      return [];
    }
  }

  // Get tasks assigned to a user
  static async getUserTasks(userId: string, organizationId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('organizationId', '==', organizationId),
        where('assignedTo', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Task);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      // Fallback: try getting by createdBy if assignedTo array query fails
      try {
        const fallbackQ = query(
          collection(db, COLLECTIONS.TASKS),
          where('organizationId', '==', organizationId),
          where('createdBy', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        
        const fallbackSnapshot = await getDocs(fallbackQ);
        return fallbackSnapshot.docs.map(doc => doc.data() as Task);
      } catch (fallbackError) {
        console.error('Error in fallback task query:', fallbackError);
        return [];
      }
    }
  }

  // Get upcoming deadlines
  static async getUpcomingDeadlines(
    organizationId: string,
    daysAhead: number = 7
  ): Promise<Task[]> {
    try {
      const tasks = await this.getOrganizationTasks(organizationId);
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      return tasks.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueDate = task.dueDate.toDate();
        return dueDate >= now && dueDate <= futureDate;
      }).sort((a, b) => {
        const dateA = a.dueDate!.toDate();
        const dateB = b.dueDate!.toDate();
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      return [];
    }
  }

  // Get overdue tasks
  static async getOverdueTasks(organizationId: string): Promise<Task[]> {
    try {
      const tasks = await this.getOrganizationTasks(organizationId);
      const now = new Date();
      
      return tasks.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        return task.dueDate.toDate() < now;
      }).sort((a, b) => {
        const dateA = a.dueDate!.toDate();
        const dateB = b.dueDate!.toDate();
        return dateA.getTime() - dateB.getTime(); // Oldest overdue first
      });
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      return [];
    }
  }

  // Get a specific task
  static async getTask(taskId: string): Promise<Task | null> {
    try {
      const taskDoc = await getDoc(doc(db, COLLECTIONS.TASKS, taskId));
      return taskDoc.exists() ? taskDoc.data() as Task : null;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  // Update task
  static async updateTask(
    taskId: string,
    userId: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'workspaceId' | 'projectId'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // If marking as completed, set completedAt timestamp
      if (updates.status === 'completed' && updates.status !== undefined) {
        updateData.completedAt = serverTimestamp();
      }
      
      await updateDoc(taskRef, updateData);

      // Log activity for significant updates
      if (updates.status) {
        const action = updates.status === 'completed' ? 'completed_task' : 'updated_status';
        const description = updates.status === 'completed' 
          ? 'Completed task' 
          : `Changed status to ${updates.status}`;
        await this.logTaskActivity(taskId, userId, action, description);
      }
      if (updates.assignedTo) {
        await this.logTaskActivity(taskId, userId, 'assigned_task', 'Updated task assignment');
      }
      if (updates.priority) {
        await this.logTaskActivity(taskId, userId, 'updated_priority', `Changed priority to ${updates.priority}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete task
  static async deleteTask(taskId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      const task = await getDoc(taskRef);
      
      if (!task.exists()) {
        return { success: false, error: 'Task not found' };
      }

      const taskData = task.data() as Task;
      
      // Check permissions (basic check - enhance as needed)
      if (taskData.createdBy !== userId && !taskData.assignedTo?.includes(userId)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      await deleteDoc(taskRef);
      
      // Log activity
      await this.logTaskActivity(taskId, userId, 'deleted_task', `Deleted task "${taskData.title}"`);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  }

  // Assign task to user
  static async assignTask(
    taskId: string,
    userId: string,
    assigneeId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      const task = await getDoc(taskRef);
      
      if (!task.exists()) {
        return { success: false, error: 'Task not found' };
      }

      const taskData = task.data() as Task;
      const currentAssignees = taskData.assignedTo || [];
      
      if (currentAssignees.includes(assigneeId)) {
        return { success: false, error: 'User is already assigned to this task' };
      }

      await updateDoc(taskRef, {
        assignedTo: [...currentAssignees, assigneeId],
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await this.logTaskActivity(taskId, userId, 'assigned_task', `Assigned task to user`);

      return { success: true };
    } catch (error: any) {
      console.error('Error assigning task:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscribe to task updates
  static subscribeToTask(
    taskId: string,
    callback: (task: Task | null) => void
  ): () => void {
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);

    return onSnapshot(taskRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as Task);
      } else {
        callback(null);
      }
    });
  }

  // Subscribe to project tasks
  static subscribeToProjectTasks(
    projectId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => doc.data() as Task);
      callback(tasks);
    });
  }

  // Subscribe to user tasks
  static subscribeToUserTasks(
    userId: string,
    organizationId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('organizationId', '==', organizationId),
      where('assignedTo', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => doc.data() as Task);
      callback(tasks);
    });
  }

  // Get task statistics
  static async getTaskStats(organizationId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
  }> {
    try {
      const tasks = await this.getOrganizationTasks(organizationId);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        overdue: tasks.filter(t => 
          t.dueDate && t.dueDate.toDate() < now && t.status !== 'completed'
        ).length,
        dueToday: tasks.filter(t => {
          if (!t.dueDate || t.status === 'completed') return false;
          const dueDate = t.dueDate.toDate();
          return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).length,
        dueThisWeek: tasks.filter(t => {
          if (!t.dueDate || t.status === 'completed') return false;
          const dueDate = t.dueDate.toDate();
          return dueDate >= now && dueDate <= weekFromNow;
        }).length,
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting task stats:', error);
      return { total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 };
    }
  }

  // Get user productivity metrics
  static async getUserProductivity(
    userId: string,
    organizationId: string,
    days: number = 30
  ): Promise<{
    completedTasks: number;
    averageCompletionTime: number;
    onTimeCompletions: number;
    productivityScore: number;
  }> {
    try {
      const tasks = await this.getUserTasks(userId, organizationId);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const recentCompletedTasks = tasks.filter(t => 
        t.status === 'completed' && 
        t.completedAt && 
        t.completedAt.toDate() > cutoffDate
      );
      
      const completionTimes = recentCompletedTasks
        .filter(t => t.createdAt && t.completedAt)
        .map(t => {
          const created = t.createdAt!.toDate();
          const completed = t.completedAt!.toDate();
          return (completed.getTime() - created.getTime()) / (24 * 60 * 60 * 1000); // days
        });
      
      const averageCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;
      
      const onTimeCompletions = recentCompletedTasks.filter(t => {
        if (!t.dueDate || !t.completedAt) return true; // Assume on time if no due date
        return t.completedAt.toDate() <= t.dueDate.toDate();
      }).length;
      
      // Simple productivity score (0-100)
      const completionRate = recentCompletedTasks.length;
      const onTimeRate = recentCompletedTasks.length > 0 
        ? (onTimeCompletions / recentCompletedTasks.length) * 100 
        : 100;
      const speedScore = averageCompletionTime > 0 
        ? Math.max(0, 100 - (averageCompletionTime * 10)) 
        : 100;
      
      const productivityScore = Math.round((completionRate * 2 + onTimeRate + speedScore) / 4);
      
      return {
        completedTasks: recentCompletedTasks.length,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        onTimeCompletions,
        productivityScore: Math.min(100, productivityScore)
      };
    } catch (error) {
      console.error('Error calculating user productivity:', error);
      return { completedTasks: 0, averageCompletionTime: 0, onTimeCompletions: 0, productivityScore: 0 };
    }
  }

  // Private method to log task activities
  private static async logTaskActivity(
    taskId: string,
    userId: string,
    action: string,
    description: string
  ): Promise<void> {
    try {
      const activityRef = doc(collection(db, COLLECTIONS.ACTIVITIES));
      
      const activity: Activity = {
        id: activityRef.id,
        userId,
        taskId,
        action,
        // @ts-ignore
        description,
        metadata: {},
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(activityRef, activity);
    } catch (error) {
      console.error('Error logging task activity:', error);
      // Don't throw - activity logging shouldn't break main functionality
    }
  }
}