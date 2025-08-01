import { AIContextService, WorkspaceContext } from './ai-context-service';
import { Project, Task, Activity, ChatMessage } from './types';

export interface DashboardInsights {
  greeting: string;
  priorityItems: PriorityItem[];
  projectUpdates: ProjectUpdate[];
  teamActivity: TeamActivityInsight[];
  suggestions: AISuggestion[];
  metrics: DashboardMetrics;
  upcomingDeadlines: UpcomingDeadline[];
  riskAlerts: RiskAlert[];
}

export interface PriorityItem {
  id: string;
  type: 'task' | 'project' | 'meeting' | 'review';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  dueDate?: Date;
  projectName?: string;
  actionRequired: string;
}

export interface ProjectUpdate {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  healthScore: number;
  lastUpdate: string;
  keyChanges: string[];
  nextMilestone?: string;
}

export interface TeamActivityInsight {
  type: 'productivity' | 'collaboration' | 'blocker' | 'achievement';
  title: string;
  description: string;
  members: string[];
  impact: 'positive' | 'neutral' | 'negative';
  suggestion?: string;
}

export interface AISuggestion {
  id: string;
  category: 'productivity' | 'planning' | 'team' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'quick' | 'moderate' | 'significant';
  actionItems: string[];
  relatedItems: string[];
}

export interface DashboardMetrics {
  completionRate: number;
  teamVelocity: number;
  projectHealth: number;
  riskScore: number;
  trendsLastWeek: {
    tasksCompleted: number;
    projectsAdvanced: number;
    teamActivity: number;
  };
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  type: 'task' | 'project' | 'milestone';
  dueDate: Date;
  daysUntilDue: number;
  assignee?: string;
  projectName: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskAlert {
  id: string;
  type: 'overdue' | 'blocked' | 'resource' | 'scope' | 'timeline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedItems: string[];
  recommendations: string[];
  timeframe: string;
}

export class AIDashboardService {
  static async generateDashboardInsights(
    userId: string,
    organizationId: string,
    workspaceId?: string,
    userName: string = 'User'
  ): Promise<DashboardInsights> {
    try {
      // Get workspace context (if specific workspace, otherwise get organization-wide data)
      const context = workspaceId 
        ? await AIContextService.getWorkspaceContext(workspaceId, organizationId)
        : await this.getOrganizationContext(organizationId, userId);

      if (!context) {
        return this.generateFallbackInsights(userName);
      }

      const insights = await this.analyzeContextForInsights(context, userId, userName);
      return insights;
    } catch (error) {
      console.error('Error generating dashboard insights:', error);
      return this.generateFallbackInsights(userName);
    }
  }

  private static async getOrganizationContext(
    organizationId: string,
    userId: string
  ): Promise<WorkspaceContext | null> {
    // For now, we'll use the first available workspace
    // In a full implementation, this would aggregate data across all user's workspaces
    // TODO: Implement organization-wide context aggregation
    return null;
  }

  private static async analyzeContextForInsights(
    context: WorkspaceContext,
    userId: string,
    userName: string
  ): Promise<DashboardInsights> {
    const currentTime = new Date();
    const greeting = this.generateTimeBasedGreeting(userName, currentTime);
    
    // Analyze different aspects of the workspace
    const priorityItems = this.identifyPriorityItems(context, userId);
    const projectUpdates = this.generateProjectUpdates(context);
    const teamActivity = this.analyzeTeamActivity(context, userId);
    const suggestions = await this.generateAISuggestions(context, userId);
    const metrics = this.calculateDashboardMetrics(context);
    const upcomingDeadlines = this.identifyUpcomingDeadlines(context);
    const riskAlerts = this.identifyRiskAlerts(context);

    return {
      greeting,
      priorityItems,
      projectUpdates,
      teamActivity,
      suggestions,
      metrics,
      upcomingDeadlines,
      riskAlerts
    };
  }

  private static generateTimeBasedGreeting(userName: string, currentTime: Date): string {
    const hour = currentTime.getHours();
    let timeGreeting = '';
    let emoji = '';
    
    if (hour < 12) {
      timeGreeting = 'Good morning';
      emoji = '';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
      emoji = '';
    } else {
      timeGreeting = 'Good evening';
      emoji = '';
    }

    const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    return `${timeGreeting}, ${userName} ${emoji}`;
  }

  private static identifyPriorityItems(context: WorkspaceContext, userId: string): PriorityItem[] {
    const items: PriorityItem[] = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // High priority tasks assigned to user
    const userTasks = context.tasks.filter(task => 
      task.assignedTo?.includes(userId) && 
      task.status !== 'completed' &&
      (task.priority === 'high' || task.priority === 'critical')
    );

    userTasks.forEach(task => {
      const project = context.projects.find(p => p.id === task.projectId);
      const dueDate = task.dueDate?.toDate();
      const isOverdue = dueDate && dueDate < now;
      const isDueSoon = dueDate && dueDate < tomorrow;

      items.push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description || 'No description provided',
        urgency: isOverdue ? 'high' : isDueSoon ? 'medium' : 'low',
        dueDate,
        projectName: project?.name,
        actionRequired: isOverdue ? 'Overdue - Complete immediately' : 'Review and update progress'
      });
    });

    // Projects needing attention
    const riskProjects = context.projects.filter(project => 
      project.health === 'at_risk' || project.health === 'critical'
    );

    riskProjects.forEach(project => {
      items.push({
        id: project.id,
        type: 'project',
        title: `${project.name} needs attention`,
        description: `Project health: ${project.health}`,
        urgency: project.health === 'critical' ? 'high' : 'medium',
        dueDate: project.dueDate?.toDate(),
        actionRequired: 'Review project status and address blockers'
      });
    });

    // Sort by urgency and due date
    return items.sort((a, b) => {
      const urgencyWeight = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    }).slice(0, 5);
  }

  private static generateProjectUpdates(context: WorkspaceContext): ProjectUpdate[] {
    return context.projects.map(project => {
      const projectTasks = context.tasks.filter(t => t.projectId === project.id);
      const completedTasks = projectTasks.filter(t => t.status === 'completed');
      const recentActivities = context.activities
        .filter(a => a.projectId === project.id)
        .slice(0, 3);

      const keyChanges = recentActivities.map(activity => 
        `${activity.action} (${this.formatTimeAgo(activity.createdAt.toDate())})`
      );

      const healthScore = context.metrics.projectHealthScores[project.id] || 50;
      
      return {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        progress: project.progress || 0,
        healthScore,
        lastUpdate: recentActivities.length > 0 
          ? this.formatTimeAgo(recentActivities[0].createdAt.toDate())
          : 'No recent activity',
        keyChanges,
        nextMilestone: this.identifyNextMilestone(project, projectTasks)
      };
    }).slice(0, 3);
  }

  private static analyzeTeamActivity(context: WorkspaceContext, userId: string): TeamActivityInsight[] {
    const insights: TeamActivityInsight[] = [];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Productivity insights
    const recentCompletions = context.tasks.filter(task => 
      task.completedAt && task.completedAt.toDate() > weekAgo
    );

    if (recentCompletions.length > 0) {
      const completionsByMember = recentCompletions.reduce((acc, task) => {
        task.assignedTo?.forEach(memberId => {
          acc[memberId] = (acc[memberId] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const topPerformers = Object.entries(completionsByMember)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([memberId]) => {
          const member = context.members.find(m => m.userId === memberId);
          return member?.profile.displayName || 'Unknown';
        });

      insights.push({
        type: 'productivity',
        title: 'High Productivity This Week',
        description: `${recentCompletions.length} tasks completed`,
        members: topPerformers,
        impact: 'positive',
        suggestion: 'Celebrate team achievements and identify successful patterns'
      });
    }

    // Collaboration insights
    const recentMessages = context.chatMessages.filter(msg => 
      msg.createdAt.toDate() > weekAgo
    );

    if (recentMessages.length > 20) {
      insights.push({
        type: 'collaboration',
        title: 'Active Team Communication',
        description: `${recentMessages.length} messages this week`,
        members: [],
        impact: 'positive'
      });
    }

    return insights;
  }

  private static async generateAISuggestions(
    context: WorkspaceContext,
    userId: string
  ): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Task management suggestions
    const unassignedTasks = context.tasks.filter(t => 
      !t.assignedTo || t.assignedTo.length === 0
    );

    if (unassignedTasks.length > 0) {
      suggestions.push({
        id: 'assign-tasks',
        category: 'productivity',
        title: 'Assign Unassigned Tasks',
        description: `${unassignedTasks.length} tasks need owners`,
        impact: 'medium',
        effort: 'quick',
        actionItems: [
          'Review unassigned tasks',
          'Match tasks with team member skills',
          'Set realistic deadlines'
        ],
        relatedItems: unassignedTasks.map(t => t.id)
      });
    }

    // Project health suggestions
    const unhealthyProjects = context.projects.filter(p => 
      p.health === 'at_risk' || p.health === 'critical'
    );

    if (unhealthyProjects.length > 0) {
      suggestions.push({
        id: 'improve-project-health',
        category: 'risk',
        title: 'Address Project Health Issues',
        description: `${unhealthyProjects.length} projects need attention`,
        impact: 'high',
        effort: 'moderate',
        actionItems: [
          'Schedule project health reviews',
          'Identify and resolve blockers',
          'Realign resources if needed'
        ],
        relatedItems: unhealthyProjects.map(p => p.id)
      });
    }

    // Team efficiency suggestions
    if (context.metrics.averageTaskCompletionTime > 7) {
      suggestions.push({
        id: 'improve-task-velocity',
        category: 'productivity',
        title: 'Improve Task Completion Speed',
        description: `Average completion time: ${context.metrics.averageTaskCompletionTime} days`,
        impact: 'medium',
        effort: 'moderate',
        actionItems: [
          'Break down large tasks into smaller ones',
          'Remove bottlenecks in workflow',
          'Improve task estimation process'
        ],
        relatedItems: []
      });
    }

    return suggestions.slice(0, 4);
  }

  private static calculateDashboardMetrics(context: WorkspaceContext): DashboardMetrics {
    const completionRate = context.metrics.totalTasks > 0 
      ? (context.metrics.completedTasks / context.metrics.totalTasks) * 100 
      : 0;

    const projectHealthScores = Object.values(context.metrics.projectHealthScores);
    const projectHealth = projectHealthScores.length > 0
      ? projectHealthScores.reduce((a, b) => a + b, 0) / projectHealthScores.length
      : 50;

    const riskScore = Math.max(0, 100 - (context.metrics.overdueTasks * 10));
    const teamVelocity = context.metrics.messagesThisWeek + (context.metrics.completedTasks * 5);

    return {
      completionRate: Math.round(completionRate),
      teamVelocity,
      projectHealth: Math.round(projectHealth),
      riskScore,
      trendsLastWeek: {
        tasksCompleted: context.metrics.completedTasks,
        projectsAdvanced: context.projects.filter(p => p.status === 'active').length,
        teamActivity: context.metrics.messagesThisWeek
      }
    };
  }

  private static identifyUpcomingDeadlines(context: WorkspaceContext): UpcomingDeadline[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const deadlines: UpcomingDeadline[] = [];

    // Task deadlines
    context.tasks.forEach(task => {
      if (task.dueDate && task.status !== 'completed') {
        const dueDate = task.dueDate.toDate();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysUntilDue <= 7 && daysUntilDue >= -3) { // Include recently overdue
          const project = context.projects.find(p => p.id === task.projectId);
          const assignee = task.assignedTo?.[0];
          const assigneeName = assignee 
            ? context.members.find(m => m.userId === assignee)?.profile.displayName
            : undefined;

          deadlines.push({
            id: task.id,
            title: task.title,
            type: 'task',
            dueDate,
            daysUntilDue,
            assignee: assigneeName,
            projectName: project?.name || 'Unknown Project',
            riskLevel: daysUntilDue < 0 ? 'high' : daysUntilDue <= 2 ? 'medium' : 'low'
          });
        }
      }
    });

    // Project deadlines
    context.projects.forEach(project => {
      if (project.dueDate && project.status !== 'completed') {
        const dueDate = project.dueDate.toDate();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysUntilDue <= 14 && daysUntilDue >= -7) { // Wider range for projects
          deadlines.push({
            id: project.id,
            title: project.name,
            type: 'project',
            dueDate,
            daysUntilDue,
            projectName: project.name,
            riskLevel: daysUntilDue < 0 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low'
          });
        }
      }
    });

    return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 5);
  }

  private static identifyRiskAlerts(context: WorkspaceContext): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    // Overdue items
    const overdueTasks = context.tasks.filter(task => 
      task.dueDate && 
      task.dueDate.toDate() < new Date() && 
      task.status !== 'completed'
    );

    if (overdueTasks.length > 0) {
      alerts.push({
        id: 'overdue-tasks',
        type: 'overdue',
        severity: overdueTasks.length > 5 ? 'critical' : 'high',
        title: `${overdueTasks.length} Overdue Tasks`,
        description: 'Tasks that have passed their due dates',
        affectedItems: overdueTasks.map(t => t.title),
        recommendations: [
          'Prioritize overdue tasks immediately',
          'Reassess task deadlines and resources',
          'Communicate delays to stakeholders'
        ],
        timeframe: 'Immediate action required'
      });
    }

    // Blocked tasks
    const blockedTasks = context.tasks.filter(task => 
      task.dependencies.length > 0 && task.status !== 'completed'
    );

    if (blockedTasks.length > 3) {
      alerts.push({
        id: 'blocked-tasks',
        type: 'blocked',
        severity: 'medium',
        title: `${blockedTasks.length} Blocked Tasks`,
        description: 'Tasks waiting on dependencies',
        affectedItems: blockedTasks.map(t => t.title),
        recommendations: [
          'Review and resolve dependencies',
          'Consider parallel work streams',
          'Update task priorities'
        ],
        timeframe: 'Within 3 days'
      });
    }

    return alerts;
  }

  private static generateFallbackInsights(userName: string): DashboardInsights {
    return {
      greeting: `${userName}`,
      priorityItems: [],
      projectUpdates: [],
      teamActivity: [],
      suggestions: [{
        id: 'get-started',
        category: 'planning',
        title: 'Get Started with Your First Project',
        description: 'Create your first project and start organizing your work',
        impact: 'high',
        effort: 'quick',
        actionItems: [
          'Click "New Project" to get started',
          'Add team members to collaborate',
          'Create your first tasks'
        ],
        relatedItems: []
      }],
      metrics: {
        completionRate: 0,
        teamVelocity: 0,
        projectHealth: 100,
        riskScore: 100,
        trendsLastWeek: {
          tasksCompleted: 0,
          projectsAdvanced: 0,
          teamActivity: 0
        }
      },
      upcomingDeadlines: [],
      riskAlerts: []
    };
  }

  private static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMinutes = Math.floor(diffMs / (60 * 1000));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  private static identifyNextMilestone(project: Project, tasks: Task[]): string | undefined {
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    const priorityTasks = incompleteTasks.filter(t => 
      t.priority === 'high' || t.priority === 'critical'
    );

    if (priorityTasks.length > 0) {
      return `Complete ${priorityTasks.length} high-priority tasks`;
    }

    if (project.progress < 25) {
      return 'Complete project planning phase';
    } else if (project.progress < 50) {
      return 'Reach 50% completion milestone';
    } else if (project.progress < 75) {
      return 'Begin final phase';
    } else {
      return 'Final review and completion';
    }
  }
}