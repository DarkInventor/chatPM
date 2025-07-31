import { Timestamp } from "firebase/firestore";

// User and Profile Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  logo?: string;
  plan: 'free' | 'startup' | 'enterprise';
  createdBy: string;
  owners: string[]; // User IDs with full admin access
  members: string[]; // All members including owners
  settings: OrganizationSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrganizationSettings {
  allowMemberInvites: boolean;
  requireApprovalForNewMembers: boolean;
  defaultWorkspaceRole: WorkspaceRole;
  aiModelAccess: string[]; // AI models available to this org
}

// Workspace Types
export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  emoji: string;
  description?: string;
  color?: string;
  isDefault: boolean; // Each org should have one default workspace
  createdBy: string;
  settings: WorkspaceSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkspaceSettings {
  isPrivate: boolean;
  allowGuestAccess: boolean;
  defaultProjectRole: ProjectRole;
  integrations: {
    slackWebhook?: string;
    discordWebhook?: string;
    emailNotifications: boolean;
  };
}

// Member and Role Types
export interface WorkspaceMember {
  id: string; // Composite: `${workspaceId}_${userId}`
  workspaceId: string;
  userId: string;
  organizationId: string;
  role: WorkspaceRole;
  status: MemberStatus;
  invitedBy: string;
  invitedAt: Timestamp;
  joinedAt?: Timestamp;
  lastActiveAt?: Timestamp;
  permissions: WorkspacePermissions;
  invitationSource: 'direct' | 'email' | 'link'; // Track how user joined
  invitationToken?: string; // Store the invitation token used to join
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';
export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'removed';

export interface WorkspacePermissions {
  canCreateProjects: boolean;
  canInviteMembers: boolean;
  canManageWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canManageIntegrations: boolean;
  canViewAllProjects: boolean;
  canManageRoles: boolean;
}

// Project Types
export interface Project {
  id: string;
  workspaceId: string;
  organizationId: string;
  name: string;
  description: string;
  color: string;
  emoji?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number; // 0-100
  health: ProjectHealth; // Auto-calculated based on tasks and deadlines
  members: string[]; // User IDs
  createdBy: string;
  tags: string[];
  startDate?: Timestamp;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  settings: ProjectSettings;
  metrics: ProjectMetrics;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectHealth = 'healthy' | 'at_risk' | 'critical' | 'unknown';

export interface ProjectSettings {
  isPrivate: boolean;
  autoArchive: boolean;
  requireTaskApproval: boolean;
  allowGuestContributors: boolean;
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeMembers: number;
  avgCompletionTime: number; // in days
  lastActivityAt?: Timestamp;
}

// Task Types
export interface Task {
  id: string;
  projectId: string;
  workspaceId: string;
  organizationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string[];
  createdBy: string;
  labels: string[];
  dependencies: string[]; // Task IDs that must be completed first
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Timestamp;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskComment {
  id: string;
  userId: string;
  content: string;
  mentions: string[]; // User IDs mentioned in comment
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

// Activity and Notification Types
export interface Activity {
  id: string;
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  type: ActivityType;
  action: string;
  details: Record<string, any>;
  metadata: {
    ip?: string;
    userAgent?: string;
    location?: string;
  };
  createdAt: Timestamp;
}

export type ActivityType = 
  | 'workspace_created' | 'workspace_updated' | 'workspace_deleted'
  | 'member_invited' | 'member_joined' | 'member_removed' | 'member_role_updated'
  | 'project_created' | 'project_updated' | 'project_completed' | 'project_archived'
  | 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned'
  | 'comment_added' | 'file_uploaded' | 'integration_connected';

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Timestamp;
  readAt?: Timestamp;
}

export type NotificationType = 
  | 'task_assigned' | 'task_due' | 'task_completed'
  | 'project_deadline' | 'project_completed'
  | 'member_invited' | 'member_joined'
  | 'comment_mention' | 'workspace_invite';

// Invitation Types
export interface Invitation {
  id: string;
  organizationId: string;
  workspaceId?: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string; // Secure token for invitation link
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  acceptedBy?: string; // User ID who accepted the invitation
  createdAt: Timestamp;
  // Additional fields for better team management
  inviterName?: string; // Cache inviter name for email
  organizationName?: string; // Cache org name for email
  workspaceName?: string; // Cache workspace name for email
}

// Real-time Presence Types
export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Timestamp;
  currentWorkspace?: string;
  currentProject?: string;
  isTyping?: boolean;
  typingIn?: string; // Resource ID where user is typing
}

// Integration Types
export interface Integration {
  id: string;
  organizationId: string;
  workspaceId?: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type IntegrationType = 
  | 'slack' | 'discord' | 'github' | 'gitlab' | 'jira' 
  | 'trello' | 'asana' | 'calendar' | 'email' | 'webhook';

// AI and Analytics Types
export interface AIConversation {
  id: string;
  userId: string;
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  title: string;
  model: string; // AI model used
  messages: AIMessage[];
  context: {
    workspaceData?: any;
    projectData?: any;
    taskData?: any;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    tokens?: number;
    model?: string;
    timestamp: Timestamp;
  };
}

// Analytics Types
export interface WorkspaceAnalytics {
  workspaceId: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string; // YYYY-MM-DD format
  metrics: {
    activeUsers: number;
    tasksCreated: number;
    tasksCompleted: number;
    projectsCreated: number;
    projectsCompleted: number;
    aiQueriesCount: number;
    avgTaskCompletionTime: number;
    memberProductivity: Record<string, number>;
  };
  createdAt: Timestamp;
}

// File and Storage Types
export interface FileUpload {
  id: string;
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  isPublic: boolean;
  tags: string[];
  createdAt: Timestamp;
}

// Chat Types
export interface ChatMessage {
  id: string;
  workspaceId: string;
  organizationId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  mentions?: string[]; // User IDs mentioned in message
  replyTo?: string; // Message ID being replied to
  editedAt?: Timestamp;
  reactions?: ChatReaction[];
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
    imageUrl?: string;
    systemAction?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatReaction {
  emoji: string;
  users: string[]; // User IDs who reacted
  count: number;
}

export interface ChatTypingIndicator {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  startedAt: Timestamp;
}

export interface ChatNotification {
  id: string;
  workspaceId: string;
  workspaceName: string;
  organizationId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  userId: string; // Who should receive this notification
  createdAt: Timestamp;
}

export interface WorkspaceUnreadCount {
  workspaceId: string;
  userId: string;
  unreadCount: number;
  lastReadMessageId?: string;
  lastMessageAt: Timestamp;
  updatedAt: Timestamp;
}

// Database Collection Names (for consistency)
export const COLLECTIONS = {
  PROFILES: 'profiles',
  ORGANIZATIONS: 'organizations',
  WORKSPACES: 'workspaces',
  WORKSPACE_MEMBERS: 'workspace_members',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  ACTIVITIES: 'activities',
  NOTIFICATIONS: 'notifications',
  INVITATIONS: 'invitations',
  USER_PRESENCE: 'user_presence',
  INTEGRATIONS: 'integrations',
  AI_CONVERSATIONS: 'ai_conversations',
  WORKSPACE_ANALYTICS: 'workspace_analytics',
  FILE_UPLOADS: 'file_uploads',
  CHAT_MESSAGES: 'chat_messages',
  CHAT_TYPING: 'chat_typing',
  CHAT_NOTIFICATIONS: 'chat_notifications',
  WORKSPACE_UNREAD_COUNTS: 'workspace_unread_counts'
} as const;