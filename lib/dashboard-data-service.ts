import { ProjectService } from './project-service';
import { TaskService } from './task-service';
import { WorkspaceService } from './workspace-service';
import { ChatService } from './chat-service';
import { Project, Task, Activity, ChatMessage, WorkspaceMember } from './types';

export interface DashboardData {
  projects: Project[];
  tasks: Task[];
  recentActivity: Activity[];
  upcomingDeadlines: Task[];
  overdueTasks: Task[];
  userTasks: Task[];
  projectStats: ProjectStats;
  taskStats: TaskStats;
  teamActivity: TeamActivity[];
  healthScores: { [projectId: string]: number };
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onTrack: number;
  atRisk: number;
  averageProgress: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
}

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  action: string;
  description: string;
  projectName?: string;
  taskTitle?: string;
  timestamp: Date;
  type: 'task' | 'project' | 'comment' | 'file' | 'member';
}

export class DashboardDataService {
  static async getComprehensiveDashboardData(
    userId: string,
    organizationId: string,
    workspaceId?: string
  ): Promise<DashboardData> {
    try {
      console.log('Loading comprehensive dashboard data for:', { userId, organizationId, workspaceId });

      // Parallel data fetching for performance
      const [
        projects,
        allTasks,
        projectStats,
        taskStats
      ] = await Promise.all([
        workspaceId 
          ? ProjectService.getWorkspaceProjects(workspaceId, organizationId)
          : ProjectService.getOrganizationProjects(organizationId),
        workspaceId
          ? TaskService.getWorkspaceTasks(workspaceId, organizationId)
          : TaskService.getOrganizationTasks(organizationId),
        workspaceId
          ? this.calculateWorkspaceProjectStats(workspaceId, organizationId)
          : ProjectService.getProjectStats(organizationId),
        TaskService.getTaskStats(organizationId)
      ]);

      // Get user-specific tasks
      const userTasks = await TaskService.getUserTasks(userId, organizationId);

      // Get upcoming deadlines and overdue tasks
      const upcomingDeadlines = await TaskService.getUpcomingDeadlines(organizationId, 7);
      const overdueTasks = await TaskService.getOverdueTasks(organizationId);

      // Calculate project health scores
      const healthScores: { [projectId: string]: number } = {};
      projects.forEach(project => {
        const projectTasks = allTasks.filter(t => t.projectId === project.id);
        healthScores[project.id] = ProjectService.calculateProjectHealth(project, projectTasks);
      });

      // Get recent activity (simulated for now - you can enhance this)
      const recentActivity = await this.getRecentActivity(organizationId, workspaceId);

      // Get team activity
      const teamActivity = await this.getTeamActivity(organizationId, workspaceId);

      return {
        projects,
        tasks: allTasks,
        recentActivity,
        upcomingDeadlines,
        overdueTasks,
        userTasks,
        projectStats: {
          ...projectStats,
          averageProgress: projects.length > 0 
            ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
            : 0
        },
        taskStats: {
          ...taskStats,
          completionRate: taskStats.total > 0 
            ? Math.round((taskStats.completed / taskStats.total) * 100)
            : 0
        },
        teamActivity,
        healthScores
      };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      return this.getEmptyDashboardData();
    }
  }

  private static async calculateWorkspaceProjectStats(
    workspaceId: string,
    organizationId: string
  ): Promise<ProjectStats> {
    try {
      const projects = await ProjectService.getWorkspaceProjects(workspaceId, organizationId);
      
      return {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        // @ts-ignore
        onTrack: projects.filter(p => p.health === 'on_track').length,
        atRisk: projects.filter(p => p.health === 'at_risk' || p.health === 'critical').length,
        averageProgress: projects.length > 0 
          ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
          : 0
      };
    } catch (error) {
      console.error('Error calculating workspace project stats:', error);
      return { total: 0, active: 0, completed: 0, onTrack: 0, atRisk: 0, averageProgress: 0 };
    }
  }

  private static async getRecentActivity(
    organizationId: string,
    workspaceId?: string
  ): Promise<Activity[]> {
    try {
      // This is a placeholder - implement based on your activity tracking
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  private static async getTeamActivity(
    organizationId: string,
    workspaceId?: string
  ): Promise<TeamActivity[]> {
    try {
      // Get recent tasks and projects for activity simulation
      const [tasks, projects] = await Promise.all([
        workspaceId
          ? TaskService.getWorkspaceTasks(workspaceId, organizationId)
          : TaskService.getOrganizationTasks(organizationId, 20),
        workspaceId
          ? ProjectService.getWorkspaceProjects(workspaceId, organizationId)
          : ProjectService.getOrganizationProjects(organizationId, 10)
      ]);

      const activities: TeamActivity[] = [];
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Generate activities from recent task completions
      const recentCompletedTasks = tasks
        .filter(t => t.status === 'completed' && t.completedAt && t.completedAt.toDate() > weekAgo)
        .sort((a, b) => (b.completedAt?.toDate().getTime() || 0) - (a.completedAt?.toDate().getTime() || 0))
        .slice(0, 10);

      recentCompletedTasks.forEach(task => {
        const project = projects.find(p => p.id === task.projectId);
        const assignee = task.assignedTo?.[0]; // Take first assignee for simplicity
        
        if (assignee && task.completedAt) {
          activities.push({
            id: `task-${task.id}`,
            userId: assignee,
            userName: 'Team Member', // You'd get this from user profile
            userInitials: 'TM',
            action: 'completed',
            description: `completed task "${task.title}"`,
            projectName: project?.name,
            taskTitle: task.title,
            timestamp: task.completedAt.toDate(),
            type: 'task'
          });
        }
      });

      // Generate activities from recent project updates
      const recentProjects = projects
        .filter(p => p.updatedAt && p.updatedAt.toDate() > weekAgo)
        .sort((a, b) => (b.updatedAt?.toDate().getTime() || 0) - (a.updatedAt?.toDate().getTime() || 0))
        .slice(0, 5);

      recentProjects.forEach(project => {
        activities.push({
          id: `project-${project.id}`,
          userId: project.createdBy,
          userName: 'Project Owner',
          userInitials: 'PO',
          action: 'updated',
          description: `updated project "${project.name}"`,
          projectName: project.name,
          timestamp: project.updatedAt!.toDate(),
          type: 'project'
        });
      });

      // Sort all activities by timestamp (most recent first)
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 15);

    } catch (error) {
      console.error('Error generating team activity:', error);
      return [];
    }
  }

  static async getUserProductivityInsights(
    userId: string,
    organizationId: string
  ): Promise<{
    completedThisWeek: number;
    overdueCount: number;
    upcomingCount: number;
    productivityScore: number;
    topProjects: { name: string; tasksCompleted: number }[];
    suggestions: string[];
  }> {
    try {
      const [userTasks, productivity] = await Promise.all([
        TaskService.getUserTasks(userId, organizationId),
        TaskService.getUserProductivity(userId, organizationId, 7)
      ]);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const completedThisWeek = userTasks.filter(t => 
        t.status === 'completed' && 
        t.completedAt && 
        t.completedAt.toDate() > weekAgo
      ).length;

      const overdueCount = userTasks.filter(t => 
        t.dueDate && 
        t.dueDate.toDate() < now && 
        t.status !== 'completed'
      ).length;

      const upcomingCount = userTasks.filter(t => 
        t.dueDate && 
        t.dueDate.toDate() > now && 
        t.dueDate.toDate() < nextWeek &&
        t.status !== 'completed'
      ).length;

      // Get top projects by task completion
      const projects = await ProjectService.getOrganizationProjects(organizationId);
      const topProjects = projects
        .map(project => {
          const projectTasks = userTasks.filter(t => 
            t.projectId === project.id && 
            t.status === 'completed' && 
            t.completedAt && 
            t.completedAt.toDate() > weekAgo
          );
          return {
            name: project.name,
            tasksCompleted: projectTasks.length
          };
        })
        .filter(p => p.tasksCompleted > 0)
        .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
        .slice(0, 3);

      // Generate suggestions
      const suggestions = [];
      if (overdueCount > 0) {
        suggestions.push(`You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}. Consider prioritizing them.`);
      }
      if (upcomingCount > 3) {
        suggestions.push(`You have ${upcomingCount} tasks due this week. Break them into smaller chunks for better focus.`);
      }
      if (completedThisWeek < 5) {
        suggestions.push('Try setting smaller, more achievable daily goals to boost productivity.');
      }
      if (productivity.averageCompletionTime > 5) {
        suggestions.push('Consider breaking down larger tasks to improve completion time.');
      }

      return {
        completedThisWeek,
        overdueCount,
        upcomingCount,
        productivityScore: productivity.productivityScore,
        topProjects,
        suggestions
      };
    } catch (error) {
      console.error('Error getting user productivity insights:', error);
      return {
        completedThisWeek: 0,
        overdueCount: 0,
        upcomingCount: 0,
        productivityScore: 0,
        topProjects: [],
        suggestions: ['Start by creating your first project and tasks to track your productivity.']
      };
    }
  }

  private static getEmptyDashboardData(): DashboardData {
    return {
      projects: [],
      tasks: [],
      recentActivity: [],
      upcomingDeadlines: [],
      overdueTasks: [],
      userTasks: [],
      projectStats: { total: 0, active: 0, completed: 0, onTrack: 0, atRisk: 0, averageProgress: 0 },
      taskStats: { total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0, dueToday: 0, dueThisWeek: 0, completionRate: 0 },
      teamActivity: [],
      healthScores: {}
    };
  }

  // Format time ago helper
  static formatTimeAgo(date: Date): string {
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

  // Format due date helper
  static formatDueDate(dueDate: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (dueDate < today) {
      const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      return `${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`;
    } else if (dueDate < tomorrow) {
      return 'Today';
    } else if (dueDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return 'Tomorrow';
    } else {
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return `${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
    }
  }

  // Get priority color
  static getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }

  // Get status color
  static getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'todo':
        return 'text-gray-500';
      case 'blocked':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }
}