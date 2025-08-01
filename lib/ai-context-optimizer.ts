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
import { AIContextCache } from "./ai-context-cache";
import { 
  Workspace, 
  Project, 
  Task, 
  ChatMessage, 
  WorkspaceMember, 
  Activity,
  UserProfile,
  COLLECTIONS 
} from "./types";

export interface OptimizedWorkspaceContext {
  workspace: {
    id: string;
    name: string;
    emoji: string;
    description?: string;
  };
  projectsSummary: string;
  tasksSummary: string;
  recentMessages: ChatMessage[];
  teamSummary: string;
  keyMetrics: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    teamSize: number;
  };
  urgentItems: string[];
  contextSize: number; // Track token usage
}

export interface CrossWorkspaceContext {
  userWorkspaces: OptimizedWorkspaceContext[];
  globalSummary: string;
  totalContextSize: number;
  priorityAlerts: string[];
}

export class AIContextOptimizer {
  private static readonly MAX_MESSAGES_PER_WORKSPACE = 10;
  private static readonly MAX_PROJECTS_SUMMARY_LENGTH = 200;
  private static readonly MAX_TASKS_SUMMARY_LENGTH = 150;
  private static readonly MAX_TOTAL_CONTEXT_SIZE = 3000; // Rough token limit

  /**
   * Get optimized context for a single workspace
   * Limits data to essential information only
   * Uses caching to reduce Firebase reads and improve performance
   */
  static async getOptimizedWorkspaceContext(
    workspaceId: string,
    organizationId: string
  ): Promise<OptimizedWorkspaceContext | null> {
    try {
      // Check cache first
      const cacheKey = AIContextCache.getWorkspaceContextKey(workspaceId, organizationId);
      const cachedContext = AIContextCache.get<OptimizedWorkspaceContext>(cacheKey);
      
      if (cachedContext) {
        console.log('Using cached workspace context');
        return cachedContext;
      }

      // Get workspace details
      const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
      if (!workspaceDoc.exists()) return null;
      
      const workspaceData = workspaceDoc.data() as Workspace;
      const workspace = {
        id: workspaceData.id,
        name: workspaceData.name,
        emoji: workspaceData.emoji,
        description: workspaceData.description
      };

      // Parallel fetch with limits
      const [projects, tasks, messages, members] = await Promise.all([
        this.getWorkspaceProjectsLimited(workspaceId),
        this.getWorkspaceTasksLimited(workspaceId),
        this.getWorkspaceMessagesLimited(workspaceId),
        this.getWorkspaceMembersLimited(workspaceId)
      ]);

      // Generate optimized summaries
      const projectsSummary = this.summarizeProjects(projects);
      const tasksSummary = this.summarizeTasks(tasks);
      const teamSummary = this.summarizeTeam(members);
      const urgentItems = this.identifyUrgentItems(projects, tasks);
      
      const keyMetrics = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        overdueTasks: tasks.filter(t => 
          t.dueDate && t.dueDate.toDate() < new Date() && t.status !== 'completed'
        ).length,
        teamSize: members.length
      };

      // Estimate context size (rough token estimation)
      const contextSize = this.estimateContextSize({
        workspace,
        projectsSummary,
        tasksSummary,
        recentMessages: messages,
        teamSummary,
        keyMetrics,
        urgentItems
      });

      const context: OptimizedWorkspaceContext = {
        workspace,
        projectsSummary,
        tasksSummary,
        recentMessages: messages,
        teamSummary,
        keyMetrics,
        urgentItems,
        contextSize
      };

      // Cache the result with smart TTL based on activity
      const recentActivityCount = messages.filter(m => 
        m.createdAt.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;
      
      AIContextCache.cacheWorkspaceContext(
        workspaceId, 
        organizationId, 
        context, 
        recentActivityCount
      );

      console.log(`Generated workspace context: ${contextSize} tokens (estimated)`);
      return context;
    } catch (error) {
      console.error('Error getting optimized workspace context:', error);
      return null;
    }
  }

  /**
   * Get context across multiple workspaces for a user
   * Intelligently prioritizes and limits data
   */
  static async getCrossWorkspaceContext(
    userId: string,
    organizationId: string,
    maxWorkspaces: number = 5
  ): Promise<CrossWorkspaceContext> {
    try {
      // Get user's workspaces (limited)
      const userWorkspaces = await this.getUserWorkspacesLimited(userId, organizationId, maxWorkspaces);
      
      // Get optimized context for each workspace
      const workspaceContexts = await Promise.all(
        userWorkspaces.map(workspace => 
          this.getOptimizedWorkspaceContext(workspace.id, organizationId)
        )
      );

      const validContexts = workspaceContexts.filter(ctx => ctx !== null) as OptimizedWorkspaceContext[];
      
      // Generate global summary
      const globalSummary = this.generateGlobalSummary(validContexts);
      const priorityAlerts = this.generatePriorityAlerts(validContexts);
      
      const totalContextSize = validContexts.reduce((sum, ctx) => sum + ctx.contextSize, 0);

      return {
        userWorkspaces: validContexts,
        globalSummary,
        totalContextSize,
        priorityAlerts
      };
    } catch (error) {
      console.error('Error getting cross-workspace context:', error);
      return {
        userWorkspaces: [],
        globalSummary: 'Unable to load workspace data',
        totalContextSize: 0,
        priorityAlerts: []
      };
    }
  }

  /**
   * Generate context-aware system prompt for Claude
   * Optimized for token efficiency
   */
  static generateOptimizedSystemPrompt(
    context: OptimizedWorkspaceContext,
    userMessage: string,
    recentChatMessages: ChatMessage[] = []
  ): string {
    let prompt = `You are Claude, an AI assistant for ${context.workspace.name} ${context.workspace.emoji}.

WORKSPACE OVERVIEW:
${context.workspace.description || 'No description'}
Team: ${context.keyMetrics.teamSize} members
Projects: ${context.keyMetrics.activeProjects}/${context.keyMetrics.totalProjects} active
Tasks: ${context.keyMetrics.completedTasks}/${context.keyMetrics.totalTasks} completed`;

    if (context.keyMetrics.overdueTasks > 0) {
      prompt += `
⚠️ ${context.keyMetrics.overdueTasks} OVERDUE TASKS`;
    }

    prompt += `

PROJECTS: ${context.projectsSummary}

TASKS: ${context.tasksSummary}

TEAM: ${context.teamSummary}`;

    if (context.urgentItems.length > 0) {
      prompt += `

🚨 URGENT: ${context.urgentItems.join(', ')}`;
    }

    // Add recent chat context (limited)
    if (recentChatMessages.length > 0) {
      const chatContext = recentChatMessages
        .slice(-5) // Only last 5 messages to save tokens
        .map(msg => `${msg.userId === 'claude-ai' ? 'You' : 'User'}: ${msg.content}`)
        .join('\n');
      
      prompt += `

RECENT CHAT:
${chatContext}`;
    }

    prompt += `

INSTRUCTIONS:
- Be concise and actionable
- Reference specific projects/tasks when relevant
- Highlight urgent items and blockers
- Provide practical project management advice
- Keep responses under 200 words unless detailed analysis is requested

USER: ${userMessage}`;

    return prompt;
  }

  /**
   * Get smart context for cross-workspace queries
   * Aggregates most relevant information from all workspaces
   */
  static async getSmartCrossWorkspacePrompt(
    userId: string,
    organizationId: string,
    userMessage: string
  ): Promise<string> {
    const crossContext = await this.getCrossWorkspaceContext(userId, organizationId);
    
    if (crossContext.userWorkspaces.length === 0) {
      return `You are Claude, an AI project management assistant.

The user doesn't have access to workspace data yet. Help them get started with project management best practices.

USER: ${userMessage}`;
    }

    let prompt = `You are Claude, an AI assistant with access to ${crossContext.userWorkspaces.length} workspaces.

OVERVIEW:
${crossContext.globalSummary}`;

    if (crossContext.priorityAlerts.length > 0) {
      prompt += `

🚨 PRIORITY ALERTS:
${crossContext.priorityAlerts.join('\n')}`;
    }

    // Add workspace summaries (compressed)
    prompt += `

WORKSPACES:`;
    crossContext.userWorkspaces.forEach(ws => {
      prompt += `
• ${ws.workspace.name} ${ws.workspace.emoji}: ${ws.keyMetrics.activeProjects}/${ws.keyMetrics.totalProjects} projects, ${ws.keyMetrics.overdueTasks} overdue`;
    });

    prompt += `

Be helpful, concise, and focus on actionable insights across all workspaces.

USER: ${userMessage}`;

    return prompt;
  }

  // Private helper methods for data fetching with limits
  private static async getWorkspaceProjectsLimited(workspaceId: string): Promise<Project[]> {
    try {
      // First try with composite query (requires index)
      const q = query(
        collection(db, COLLECTIONS.PROJECTS),
        where('workspaceId', '==', workspaceId),
        orderBy('updatedAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Project);
    } catch (error) {
      console.warn('Composite index not available for projects, using simple query:', error);
      // Fallback to simple query without orderBy
      const q = query(
        collection(db, COLLECTIONS.PROJECTS),
        where('workspaceId', '==', workspaceId),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => doc.data() as Project);
      // Sort in memory
      return projects.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    }
  }

  private static async getWorkspaceTasksLimited(workspaceId: string): Promise<Task[]> {
    try {
      // First try with composite query (requires index)
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('workspaceId', '==', workspaceId),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Task);
    } catch (error) {
      console.warn('Composite index not available for tasks, using simple query:', error);
      // Fallback to simple query without orderBy
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('workspaceId', '==', workspaceId),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      // Sort in memory
      return tasks.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    }
  }

  private static async getWorkspaceMessagesLimited(workspaceId: string): Promise<ChatMessage[]> {
    try {
      // First try with composite query (requires index)
      const q = query(
        collection(db, COLLECTIONS.CHAT_MESSAGES),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        limit(this.MAX_MESSAGES_PER_WORKSPACE)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ChatMessage).reverse(); // Chronological order
    } catch (error) {
      console.warn('Composite index not available for chat messages, using simple query:', error);
      // Fallback to simple query without orderBy
      const q = query(
        collection(db, COLLECTIONS.CHAT_MESSAGES),
        where('workspaceId', '==', workspaceId),
        limit(this.MAX_MESSAGES_PER_WORKSPACE)
      );
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => doc.data() as ChatMessage);
      // Sort in memory and return chronological order
      return messages.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    }
  }

  private static async getWorkspaceMembersLimited(workspaceId: string): Promise<(WorkspaceMember & { profile: UserProfile })[]> {
    try {
      // First try with composite query (requires index)
      const q = query(
        collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
        where('workspaceId', '==', workspaceId),
        where('status', '==', 'active'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const members = snapshot.docs.map(doc => doc.data() as WorkspaceMember);
      
      // Get profiles (batch)
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
    } catch (error) {
      console.warn('Composite index not available for workspace members, using simple query:', error);
      // Fallback to simple query with just workspaceId
      const q = query(
        collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
        where('workspaceId', '==', workspaceId),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const allMembers = snapshot.docs.map(doc => doc.data() as WorkspaceMember);
      
      // Filter active members in memory
      const members = allMembers.filter(member => member.status === 'active');
      
      // Get profiles (batch)
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
  }

  private static async getUserWorkspacesLimited(
    userId: string, 
    organizationId: string, 
    limitCount: number
  ): Promise<Workspace[]> {
    try {
      // First try with composite query (requires index)
      const membershipsQuery = query(
        collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
        where('userId', '==', userId),
        where('organizationId', '==', organizationId),
        where('status', '==', 'active'),
        orderBy('lastActiveAt', 'desc'),
        limit(limitCount)
      );
      
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const workspaceIds = membershipsSnapshot.docs.map(doc => doc.data().workspaceId);
      
      // Get workspace details
      const workspaces = await Promise.all(
        workspaceIds.map(async (workspaceId) => {
          const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
          return workspaceDoc.exists() ? workspaceDoc.data() as Workspace : null;
        })
      );
      
      return workspaces.filter(ws => ws !== null) as Workspace[];
    } catch (error) {
      console.warn('Composite index not available for user workspaces, using simple query:', error);
      // Fallback to simple query
      const membershipsQuery = query(
        collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
        where('userId', '==', userId),
        where('organizationId', '==', organizationId),
        limit(limitCount)
      );
      
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const allMemberships = membershipsSnapshot.docs.map(doc => doc.data() as WorkspaceMember);
      
      // Filter active memberships in memory
      const activeMemberships = allMemberships.filter(m => m.status === 'active');
      
      // Sort by lastActiveAt in memory (if available)
      const sortedMemberships = activeMemberships.sort((a, b) => {
        if (!a.lastActiveAt || !b.lastActiveAt) return 0;
        return b.lastActiveAt.toMillis() - a.lastActiveAt.toMillis();
      });
      
      const workspaceIds = sortedMemberships.slice(0, limitCount).map(m => m.workspaceId);
      
      // Get workspace details
      const workspaces = await Promise.all(
        workspaceIds.map(async (workspaceId) => {
          const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
          return workspaceDoc.exists() ? workspaceDoc.data() as Workspace : null;
        })
      );
      
      return workspaces.filter(ws => ws !== null) as Workspace[];
    }
  }

  // Summarization methods
  private static summarizeProjects(projects: Project[]): string {
    if (projects.length === 0) return "No projects";
    
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const atRisk = projects.filter(p => p.health === 'at_risk' || p.health === 'critical').length;
    
    let summary = `${active} active, ${completed} completed`;
    if (atRisk > 0) summary += `, ${atRisk} at risk`;
    
    // Add top projects
    const topProjects = projects.slice(0, 3).map(p => 
      `${p.name} (${p.progress || 0}%)`
    ).join(', ');
    
    return `${summary}. Recent: ${topProjects}`;
  }

  private static summarizeTasks(tasks: Task[]): string {
    if (tasks.length === 0) return "No tasks";
    
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => 
      t.dueDate && t.dueDate.toDate() < new Date() && t.status !== 'completed'
    ).length;
    const highPriority = tasks.filter(t => 
      t.priority === 'high' || t.priority === 'critical'
    ).length;
    
    let summary = `${completed}/${tasks.length} done, ${inProgress} active`;
    if (overdue > 0) summary += `, ${overdue} overdue`;
    if (highPriority > 0) summary += `, ${highPriority} high-priority`;
    
    return summary;
  }

  private static summarizeTeam(members: (WorkspaceMember & { profile: UserProfile })[]): string {
    if (members.length === 0) return "No team members";
    
    const roles = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const rolesSummary = Object.entries(roles)
      .map(([role, count]) => `${count} ${role}${count > 1 ? 's' : ''}`)
      .join(', ');
    
    return `${members.length} members: ${rolesSummary}`;
  }

  private static identifyUrgentItems(projects: Project[], tasks: Task[]): string[] {
    const urgent: string[] = [];
    const now = new Date();
    
    // Overdue tasks
    const overdueTasks = tasks.filter(t => 
      t.dueDate && t.dueDate.toDate() < now && t.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      urgent.push(`${overdueTasks.length} overdue tasks`);
    }
    
    // Critical projects
    const criticalProjects = projects.filter(p => p.health === 'critical');
    if (criticalProjects.length > 0) {
      urgent.push(`${criticalProjects.length} critical projects`);
    }
    
    // Due today
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dueToday = tasks.filter(t => 
      t.dueDate && 
      t.dueDate.toDate() <= today && 
      t.dueDate.toDate() >= now &&
      t.status !== 'completed'
    );
    if (dueToday.length > 0) {
      urgent.push(`${dueToday.length} due today`);
    }
    
    return urgent;
  }

  private static generateGlobalSummary(contexts: OptimizedWorkspaceContext[]): string {
    const totalProjects = contexts.reduce((sum, ctx) => sum + ctx.keyMetrics.totalProjects, 0);
    const totalTasks = contexts.reduce((sum, ctx) => sum + ctx.keyMetrics.totalTasks, 0);
    const totalOverdue = contexts.reduce((sum, ctx) => sum + ctx.keyMetrics.overdueTasks, 0);
    const totalTeamSize = contexts.reduce((sum, ctx) => sum + ctx.keyMetrics.teamSize, 0);
    
    return `${contexts.length} workspaces, ${totalProjects} projects, ${totalTasks} tasks, ${totalTeamSize} team members${totalOverdue > 0 ? `, ${totalOverdue} overdue` : ''}`;
  }

  private static generatePriorityAlerts(contexts: OptimizedWorkspaceContext[]): string[] {
    const alerts: string[] = [];
    
    contexts.forEach(ctx => {
      if (ctx.keyMetrics.overdueTasks > 0) {
        alerts.push(`${ctx.workspace.name}: ${ctx.keyMetrics.overdueTasks} overdue tasks`);
      }
      ctx.urgentItems.forEach(item => {
        alerts.push(`${ctx.workspace.name}: ${item}`);
      });
    });
    
    return alerts.slice(0, 5); // Limit alerts
  }

  private static estimateContextSize(context: any): number {
    // Rough token estimation (4 chars ≈ 1 token)
    const text = JSON.stringify(context);
    return Math.ceil(text.length / 4);
  }
}