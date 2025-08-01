import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  Workspace, 
  Project, 
  Task, 
  ChatMessage, 
  WorkspaceMember, 
  Activity,
  AIConversation,
  UserProfile,
  COLLECTIONS 
} from "./types";
import { ProjectService } from "./project-service";
import { TaskService } from "./task-service";

export interface WorkspaceContext {
  workspace: Workspace;
  projects: Project[];
  tasks: Task[];
  chatMessages: ChatMessage[];
  members: (WorkspaceMember & { profile: UserProfile })[];
  activities: Activity[];
  aiConversations: AIConversation[];
  metrics: WorkspaceMetrics;
}

export interface WorkspaceMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMembers: number;
  activeMembers: number;
  messagesThisWeek: number;
  averageTaskCompletionTime: number;
  projectHealthScores: { [projectId: string]: number };
  memberProductivity: { [userId: string]: number };
}

export interface ProjectInsights {
  project: Project;
  tasks: Task[];
  recentActivity: Activity[];
  healthScore: number;
  riskFactors: string[];
  suggestions: string[];
  blockers: Task[];
  upcomingDeadlines: Task[];
}

export class AIContextService {
  // Get comprehensive workspace context for AI
  static async getWorkspaceContext(
    workspaceId: string,
    organizationId: string,
    includeFullHistory: boolean = false
  ): Promise<WorkspaceContext | null> {
    try {
      // Get workspace details
      const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
      if (!workspaceDoc.exists()) {
        return null;
      }
      const workspace = workspaceDoc.data() as Workspace;

      // Parallel data fetching for performance
      const [
        projects,
        tasks,
        chatMessages,
        members,
        activities,
        aiConversations
      ] = await Promise.all([
        ProjectService.getWorkspaceProjects(workspaceId, organizationId),
        TaskService.getWorkspaceTasks(workspaceId, organizationId),
        this.getWorkspaceChatMessages(workspaceId, includeFullHistory ? 1000 : 100),
        this.getWorkspaceMembers(workspaceId),
        this.getWorkspaceActivities(workspaceId, 50),
        this.getWorkspaceAIConversations(workspaceId, organizationId, 20)
      ]);

      // Calculate metrics
      const metrics = this.calculateWorkspaceMetrics(
        projects,
        tasks,
        members,
        chatMessages,
        activities
      );

      return {
        workspace,
        projects,
        tasks,
        chatMessages,
        members,
        activities,
        aiConversations,
        metrics
      };
    } catch (error) {
      console.error('Error getting workspace context:', error);
      return null;
    }
  }

  // Get specific project insights with AI analysis
  static async getProjectInsights(projectId: string): Promise<ProjectInsights | null> {
    try {
      const projectDoc = await getDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
      if (!projectDoc.exists()) {
        return null;
      }
      const project = projectDoc.data() as Project;

      const [tasks, activities] = await Promise.all([
        this.getProjectTasks(projectId),
        this.getProjectActivities(projectId, 20)
      ]);

      const healthScore = this.calculateProjectHealth(project, tasks);
      const riskFactors = this.identifyRiskFactors(project, tasks);
      const suggestions = this.generateProjectSuggestions(project, tasks, activities);
      const blockers = tasks.filter(task => task.dependencies.length > 0 && task.status !== 'completed');
      const upcomingDeadlines = tasks.filter(task => 
        task.dueDate && 
        task.status !== 'completed' && 
        task.dueDate.toDate() <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).sort((a, b) => a.dueDate!.toMillis() - b.dueDate!.toMillis());

      return {
        project,
        tasks,
        recentActivity: activities,
        healthScore,
        riskFactors,
        suggestions,
        blockers,
        upcomingDeadlines
      };
    } catch (error) {
      console.error('Error getting project insights:', error);
      return null;
    }
  }

  // Generate AI-ready context summary
  static async generateContextSummary(
    workspaceId: string,
    organizationId: string,
    userId: string
  ): Promise<string> {
    const context = await this.getWorkspaceContext(workspaceId, organizationId, false);
    if (!context) {
      return "Unable to load workspace context.";
    }

    const userProfile = context.members.find(m => m.userId === userId)?.profile;
    const userName = userProfile?.displayName || "User";
    
    let summary = `# Workspace Context for ${context.workspace.name}\n\n`;
    summary += `Hello ${userName}! Here's the current state of your workspace:\n\n`;
    
    // Workspace Overview
    summary += `## Workspace Overview\n`;
    summary += `- **Name:** ${context.workspace.name} ${context.workspace.emoji}\n`;
    summary += `- **Description:** ${context.workspace.description || 'No description'}\n`;
    summary += `- **Members:** ${context.metrics.totalMembers} total, ${context.metrics.activeMembers} active\n\n`;
    
    // Projects Summary
    summary += `## Projects (${context.metrics.totalProjects} total)\n`;
    summary += `- **Active:** ${context.metrics.activeProjects}\n`;
    summary += `- **Completed:** ${context.metrics.completedProjects}\n\n`;
    
    if (context.projects.length > 0) {
      summary += `### Current Projects:\n`;
      context.projects.forEach(project => {
        const progress = project.progress || 0;
        const status = project.status;
        summary += `- **${project.name}** (${status}, ${progress}% complete)\n`;
        summary += `  - ${project.description}\n`;
        summary += `  - Priority: ${project.priority}, Health: ${project.health}\n`;
        if (project.dueDate) {
          const dueDate = project.dueDate.toDate().toLocaleDateString();
          summary += `  - Due: ${dueDate}\n`;
        }
      });
      summary += `\n`;
    }
    
    // Tasks Summary
    summary += `## Tasks (${context.metrics.totalTasks} total)\n`;
    summary += `- **Completed:** ${context.metrics.completedTasks}\n`;
    summary += `- **Overdue:** ${context.metrics.overdueTasks}\n`;
    summary += `- **In Progress:** ${context.tasks.filter(t => t.status === 'in_progress').length}\n\n`;
    
    // Recent Activity
    if (context.activities.length > 0) {
      summary += `## Recent Activity (Last 10)\n`;
      context.activities.slice(0, 10).forEach(activity => {
        const memberProfile = context.members.find(m => m.userId === activity.userId)?.profile;
        const memberName = memberProfile?.displayName || 'Unknown User';
        summary += `- ${memberName}: ${activity.action}\n`;
      });
      summary += `\n`;
    }
    
    // Team Communication
    summary += `## Team Communication\n`;
    summary += `- **Messages this week:** ${context.metrics.messagesThisWeek}\n`;
    summary += `- **Recent conversations:** ${context.chatMessages.slice(0, 5).length} latest messages\n\n`;
    
    // Key Insights
    summary += `## Key Insights\n`;
    const overallHealth = this.calculateOverallWorkspaceHealth(context);
    summary += `- **Workspace Health:** ${overallHealth}/100\n`;
    
    if (context.metrics.overdueTasks > 0) {
      summary += `- ⚠️ **${context.metrics.overdueTasks} overdue tasks** need attention\n`;
    }
    
    const atRiskProjects = context.projects.filter(p => p.health === 'at_risk' || p.health === 'critical');
    if (atRiskProjects.length > 0) {
      summary += `- ⚠️ **${atRiskProjects.length} projects at risk:** ${atRiskProjects.map(p => p.name).join(', ')}\n`;
    }
    
    return summary;
  }

  // Private helper methods
  private static async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    const q = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('workspaceId', '==', workspaceId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Project);
  }

  private static async getWorkspaceTasks(workspaceId: string): Promise<Task[]> {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('workspaceId', '==', workspaceId),
      orderBy('updatedAt', 'desc'),
      limit(500) // Reasonable limit for performance
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Task);
  }

  private static async getWorkspaceChatMessages(workspaceId: string, limitCount: number): Promise<ChatMessage[]> {
    const q = query(
      collection(db, COLLECTIONS.CHAT_MESSAGES),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ChatMessage);
  }

  private static async getWorkspaceMembers(workspaceId: string): Promise<(WorkspaceMember & { profile: UserProfile })[]> {
    const q = query(
      collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
      where('workspaceId', '==', workspaceId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const members = snapshot.docs.map(doc => doc.data() as WorkspaceMember);
    
    // Get profiles for all members
    const profiles = await Promise.all(
      members.map(async (member) => {
        const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, member.userId));
        return profileDoc.exists() ? profileDoc.data() as UserProfile : null;
      })
    );
    
    return members.map((member, index) => ({
      ...member,
      profile: profiles[index] || {
        uid: member.userId,
        email: 'unknown@example.com',
        displayName: 'Unknown User',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    }));
  }

  private static async getWorkspaceActivities(workspaceId: string, limitCount: number): Promise<Activity[]> {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITIES),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Activity);
  }

  private static async getWorkspaceAIConversations(
    workspaceId: string, 
    organizationId: string, 
    limitCount: number
  ): Promise<AIConversation[]> {
    const q = query(
      collection(db, COLLECTIONS.AI_CONVERSATIONS),
      where('workspaceId', '==', workspaceId),
      where('organizationId', '==', organizationId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AIConversation);
  }

  private static async getProjectTasks(projectId: string): Promise<Task[]> {
    const q = query(
      collection(db, COLLECTIONS.TASKS),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Task);
  }

  private static async getProjectActivities(projectId: string, limitCount: number): Promise<Activity[]> {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITIES),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Activity);
  }

  // Metrics calculation methods
  private static calculateWorkspaceMetrics(
    projects: Project[],
    tasks: Task[],
    members: (WorkspaceMember & { profile: UserProfile })[],
    chatMessages: ChatMessage[],
    activities: Activity[]
  ): WorkspaceMetrics {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      t.dueDate.toDate() < now && 
      t.status !== 'completed'
    );

    const messagesThisWeek = chatMessages.filter(m => 
      m.createdAt.toDate() > weekAgo
    ).length;

    const activeMembers = members.filter(m => {
      const lastActivity = activities.find(a => a.userId === m.userId);
      return lastActivity && lastActivity.createdAt.toDate() > weekAgo;
    }).length;

    // Calculate average task completion time
    const completedTasksWithTime = completedTasks.filter(t => t.completedAt && t.createdAt);
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) => {
          const completionTime = task.completedAt!.toMillis() - task.createdAt.toMillis();
          return sum + (completionTime / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / completedTasksWithTime.length
      : 0;

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      totalMembers: members.length,
      activeMembers,
      messagesThisWeek,
      averageTaskCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      projectHealthScores: this.calculateProjectHealthScores(projects, tasks),
      memberProductivity: this.calculateMemberProductivity(members, tasks, activities)
    };
  }

  private static calculateProjectHealth(project: Project, tasks: Task[]): number {
    let score = 50; // Base score
    
    // Progress factor
    score += (project.progress || 0) * 0.3;
    
    // Task completion rate
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    if (projectTasks.length > 0) {
      const completedTasks = projectTasks.filter(t => t.status === 'completed');
      score += (completedTasks.length / projectTasks.length) * 30;
    }
    
    // Due date factor
    if (project.dueDate) {
      const daysUntilDue = (project.dueDate.toMillis() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue < 0) score -= 20; // Overdue
      else if (daysUntilDue < 7) score -= 10; // Due soon
    }
    
    // Overdue tasks penalty
    const overdueTasks = projectTasks.filter(t => 
      t.dueDate && 
      t.dueDate.toDate() < new Date() && 
      t.status !== 'completed'
    );
    score -= overdueTasks.length * 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static calculateProjectHealthScores(projects: Project[], tasks: Task[]): { [projectId: string]: number } {
    const scores: { [projectId: string]: number } = {};
    projects.forEach(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      scores[project.id] = this.calculateProjectHealth(project, projectTasks);
    });
    return scores;
  }

  private static calculateMemberProductivity(
    members: (WorkspaceMember & { profile: UserProfile })[],
    tasks: Task[],
    activities: Activity[]
  ): { [userId: string]: number } {
    const productivity: { [userId: string]: number } = {};
    
    members.forEach(member => {
      const memberTasks = tasks.filter(t => t.assignedTo?.includes(member.userId));
      const completedTasks = memberTasks.filter(t => t.status === 'completed');
      const memberActivities = activities.filter(a => a.userId === member.userId);
      
      let score = 0;
      
      // Task completion rate
      if (memberTasks.length > 0) {
        score += (completedTasks.length / memberTasks.length) * 50;
      }
      
      // Activity level
      score += Math.min(memberActivities.length * 2, 30);
      
      // On-time completion bonus
      const onTimeCompletions = completedTasks.filter(t => 
        !t.dueDate || t.completedAt!.toDate() <= t.dueDate.toDate()
      );
      if (completedTasks.length > 0) {
        score += (onTimeCompletions.length / completedTasks.length) * 20;
      }
      
      productivity[member.userId] = Math.round(score);
    });
    
    return productivity;
  }

  private static identifyRiskFactors(project: Project, tasks: Task[]): string[] {
    const risks: string[] = [];
    
    if (project.dueDate && project.dueDate.toDate() < new Date()) {
      risks.push("Project is overdue");
    }
    
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      t.dueDate.toDate() < new Date() && 
      t.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      risks.push(`${overdueTasks.length} tasks are overdue`);
    }
    
    const blockedTasks = tasks.filter(t => t.dependencies.length > 0 && t.status !== 'completed');
    if (blockedTasks.length > 0) {
      risks.push(`${blockedTasks.length} tasks have dependencies`);
    }
    
    if (project.progress < 25 && project.status === 'active') {
      risks.push("Low progress for active project");
    }
    
    return risks;
  }

  private static generateProjectSuggestions(project: Project, tasks: Task[], activities: Activity[]): string[] {
    const suggestions: string[] = [];
    
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    const highPriorityTasks = incompleteTasks.filter(t => t.priority === 'high' || t.priority === 'critical');
    
    if (highPriorityTasks.length > 0) {
      suggestions.push(`Focus on ${highPriorityTasks.length} high-priority tasks`);
    }
    
    const unassignedTasks = incompleteTasks.filter(t => !t.assignedTo || t.assignedTo.length === 0);
    if (unassignedTasks.length > 0) {
      suggestions.push(`Assign ${unassignedTasks.length} unassigned tasks to team members`);
    }
    
    if (project.progress < 50 && project.status === 'active') {
      suggestions.push("Consider breaking down large tasks or adding more resources");
    }
    
    const recentActivityCount = activities.filter(a => 
      a.createdAt.toDate() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (recentActivityCount < 3) {
      suggestions.push("Project appears inactive - consider a team check-in");
    }
    
    return suggestions;
  }

  private static calculateOverallWorkspaceHealth(context: WorkspaceContext): number {
    let score = 50;
    
    // Project health factor
    const projectHealthScores = Object.values(context.metrics.projectHealthScores);
    if (projectHealthScores.length > 0) {
      const avgProjectHealth = projectHealthScores.reduce((a, b) => a + b, 0) / projectHealthScores.length;
      score += (avgProjectHealth - 50) * 0.5;
    }
    
    // Task completion rate
    if (context.metrics.totalTasks > 0) {
      const completionRate = context.metrics.completedTasks / context.metrics.totalTasks;
      score += completionRate * 30;
    }
    
    // Team activity
    if (context.metrics.totalMembers > 0) {
      const activityRate = context.metrics.activeMembers / context.metrics.totalMembers;
      score += activityRate * 20;
    }
    
    // Overdue penalty
    score -= context.metrics.overdueTasks * 2;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}