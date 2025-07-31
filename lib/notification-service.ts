import {
  collection,
  doc,
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
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  ChatNotification,
  WorkspaceUnreadCount,
  COLLECTIONS 
} from "./types";

export class NotificationService {
  // Create notification when new message is sent
  static async createNotification(
    workspaceId: string,
    workspaceName: string,
    organizationId: string,
    messageId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'system',
    recipientUserIds: string[],
    senderAvatar?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Don't create notifications for the sender
      const recipients = recipientUserIds.filter(id => id !== senderId);
      
      if (recipients.length === 0) {
        return { success: true };
      }

      const batch = await runTransaction(db, async (transaction) => {
        // Create notification for each recipient
        for (const userId of recipients) {
          const notificationRef = doc(collection(db, COLLECTIONS.CHAT_NOTIFICATIONS));
          const notification: ChatNotification = {
            id: notificationRef.id,
            workspaceId,
            workspaceName,
            organizationId,
            messageId,
            senderId,
            senderName,
            senderAvatar,
            content: content.length > 100 ? content.substring(0, 100) + '...' : content,
            messageType,
            isRead: false,
            userId,
            createdAt: serverTimestamp() as Timestamp,
          };
          
          transaction.set(notificationRef, notification);

          // Update unread count
          const unreadCountRef = doc(db, COLLECTIONS.WORKSPACE_UNREAD_COUNTS, `${workspaceId}_${userId}`);
          const unreadCount: WorkspaceUnreadCount = {
            workspaceId,
            userId,
            unreadCount: 1, // Will be incremented by transaction
            lastMessageAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
          };

          // Use transaction.set with merge: true to increment or create
          transaction.set(unreadCountRef, unreadCount, { merge: true });
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notifications for a user
  static async getUserNotifications(
    userId: string,
    limitCount: number = 20
  ): Promise<ChatNotification[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHAT_NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as ChatNotification);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Subscribe to user notifications
  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: ChatNotification[]) => void,
    limitCount: number = 20
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.CHAT_NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => doc.data() as ChatNotification);
      callback(notifications);
    });
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const notificationRef = doc(db, COLLECTIONS.CHAT_NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read for a user
  static async markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHAT_NOTIFICATIONS),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const querySnapshot = await getDocs(q);
      
      const batch = await runTransaction(db, async (transaction) => {
        querySnapshot.docs.forEach(doc => {
          transaction.update(doc.ref, { isRead: true });
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread counts for workspaces
  static async getWorkspaceUnreadCounts(userId: string): Promise<Record<string, number>> {
    try {
      const q = query(
        collection(db, COLLECTIONS.WORKSPACE_UNREAD_COUNTS),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const unreadCounts: Record<string, number> = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as WorkspaceUnreadCount;
        unreadCounts[data.workspaceId] = data.unreadCount;
      });
      
      return unreadCounts;
    } catch (error) {
      console.error('Error fetching workspace unread counts:', error);
      return {};
    }
  }

  // Subscribe to workspace unread counts
  static subscribeToWorkspaceUnreadCounts(
    userId: string,
    callback: (unreadCounts: Record<string, number>) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.WORKSPACE_UNREAD_COUNTS),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const unreadCounts: Record<string, number> = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as WorkspaceUnreadCount;
        unreadCounts[data.workspaceId] = data.unreadCount;
      });
      callback(unreadCounts);
    });
  }

  // Mark workspace as read (reset unread count)
  static async markWorkspaceAsRead(
    workspaceId: string,
    userId: string,
    lastReadMessageId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const unreadCountRef = doc(db, COLLECTIONS.WORKSPACE_UNREAD_COUNTS, `${workspaceId}_${userId}`);
      await updateDoc(unreadCountRef, {
        unreadCount: 0,
        lastReadMessageId: lastReadMessageId || null,
        updatedAt: serverTimestamp(),
      });

      // Also mark related notifications as read
      const notificationsQuery = query(
        collection(db, COLLECTIONS.CHAT_NOTIFICATIONS),
        where('userId', '==', userId),
        where('workspaceId', '==', workspaceId),
        where('isRead', '==', false)
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      const batch = await runTransaction(db, async (transaction) => {
        notificationsSnapshot.docs.forEach(doc => {
          transaction.update(doc.ref, { isRead: true });
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error marking workspace as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up old notifications (optional, for maintenance)
  static async cleanupOldNotifications(daysOld: number = 30): Promise<{ success: boolean; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const q = query(
        collection(db, COLLECTIONS.CHAT_NOTIFICATIONS),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      );
      
      const querySnapshot = await getDocs(q);
      
      const batch = await runTransaction(db, async (transaction) => {
        querySnapshot.docs.forEach(doc => {
          transaction.delete(doc.ref);
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error cleaning up old notifications:', error);
      return { success: false, error: error.message };
    }
  }
}