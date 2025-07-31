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
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  ChatMessage, 
  ChatTypingIndicator,
  ChatReaction,
  WorkspaceMember,
  UserProfile,
  COLLECTIONS 
} from "./types";
import { NotificationService } from "./notification-service";

export class ChatService {
  // Send a message
  static async sendMessage(
    workspaceId: string,
    organizationId: string,
    userId: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'system' = 'text',
    metadata?: any,
    replyTo?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const messageRef = doc(collection(db, COLLECTIONS.CHAT_MESSAGES));
      const messageId = messageRef.id;

      const message: ChatMessage = {
        id: messageId,
        workspaceId,
        organizationId,
        userId,
        content,
        type,
        reactions: [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Only add optional fields if they exist and are not null/undefined
      if (replyTo) {
        message.replyTo = replyTo;
      }
      
      if (metadata && metadata !== null) {
        message.metadata = metadata;
      }

      await setDoc(messageRef, message);

      // Create notifications for other workspace members (async, don't block message sending)
      try {
        // Get workspace members
        const membersQuery = query(
          collection(db, COLLECTIONS.WORKSPACE_MEMBERS),
          where('workspaceId', '==', workspaceId),
          where('status', '==', 'active')
        );
        const membersSnapshot = await getDocs(membersQuery);
        const memberUserIds = membersSnapshot.docs.map(doc => doc.data().userId);

        // Get workspace info
        const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
        const workspaceName = workspaceDoc.exists() ? workspaceDoc.data().name : 'Unknown Workspace';

        // Get sender info
        const senderDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, userId));
        const senderName = senderDoc.exists() ? senderDoc.data().displayName : 'Unknown User';
        const senderAvatar = senderDoc.exists() ? senderDoc.data().photoURL : undefined;

        // Create notifications (don't await - let it happen in background)
        NotificationService.createNotification(
          workspaceId,
          workspaceName,
          organizationId,
          messageId,
          userId,
          senderName,
          content,
          type,
          memberUserIds,
          senderAvatar
        );
      } catch (error) {
        console.error('Error creating notifications:', error);
        // Don't fail the message send if notifications fail
      }

      return { success: true, messageId };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Get messages for a workspace
  static async getMessages(
    workspaceId: string,
    limitCount: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CHAT_MESSAGES),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => doc.data() as ChatMessage);
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Subscribe to real-time messages
  static subscribeToMessages(
    workspaceId: string,
    callback: (messages: ChatMessage[]) => void,
    limitCount: number = 100
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.CHAT_MESSAGES),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => doc.data() as ChatMessage);
      callback(messages.reverse()); // Return in chronological order
    });
  }

  // Update message (for editing)
  static async updateMessage(
    messageId: string,
    content: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const messageRef = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        return { success: false, error: 'Message not found' };
      }

      const messageData = messageDoc.data() as ChatMessage;
      
      // Check if user owns the message
      if (messageData.userId !== userId) {
        return { success: false, error: 'You can only edit your own messages' };
      }

      await updateDoc(messageRef, {
        content,
        editedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating message:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete message
  static async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const messageRef = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        return { success: false, error: 'Message not found' };
      }

      const messageData = messageDoc.data() as ChatMessage;
      
      // Check if user owns the message
      if (messageData.userId !== userId) {
        return { success: false, error: 'You can only delete your own messages' };
      }

      await deleteDoc(messageRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }

  // Add reaction to message
  static async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const messageRef = doc(db, COLLECTIONS.CHAT_MESSAGES, messageId);
      
      await runTransaction(db, async (transaction) => {
        const messageDoc = await transaction.get(messageRef);
        
        if (!messageDoc.exists()) {
          throw new Error('Message not found');
        }

        const messageData = messageDoc.data() as ChatMessage;
        const reactions = messageData.reactions || [];
        
        // Find existing reaction with same emoji
        const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);
        
        if (existingReactionIndex >= 0) {
          // Check if user already reacted with this emoji
          const existingReaction = reactions[existingReactionIndex];
          if (existingReaction.users.includes(userId)) {
            // Remove user's reaction
            existingReaction.users = existingReaction.users.filter(id => id !== userId);
            existingReaction.count = existingReaction.users.length;
            
            // Remove reaction if no users left
            if (existingReaction.count === 0) {
              reactions.splice(existingReactionIndex, 1);
            }
          } else {
            // Add user's reaction
            existingReaction.users.push(userId);
            existingReaction.count = existingReaction.users.length;
          }
        } else {
          // Create new reaction
          reactions.push({
            emoji,
            users: [userId],
            count: 1
          });
        }

        transaction.update(messageRef, {
          reactions,
          updatedAt: serverTimestamp(),
        });
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Typing indicators
  static async startTyping(
    workspaceId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const typingRef = doc(db, COLLECTIONS.CHAT_TYPING, `${workspaceId}_${userId}`);
      await setDoc(typingRef, {
        id: `${workspaceId}_${userId}`,
        workspaceId,
        userId,
        userName,
        startedAt: serverTimestamp(),
      });
      
      // Auto-remove typing indicator after 3 seconds
      setTimeout(async () => {
        try {
          await deleteDoc(typingRef);
        } catch (error) {
          // Ignore errors when cleaning up typing indicator
        }
      }, 3000);
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  }

  static async stopTyping(workspaceId: string, userId: string): Promise<void> {
    try {
      const typingRef = doc(db, COLLECTIONS.CHAT_TYPING, `${workspaceId}_${userId}`);
      await deleteDoc(typingRef);
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  }

  // Subscribe to typing indicators
  static subscribeToTyping(
    workspaceId: string,
    callback: (typingUsers: ChatTypingIndicator[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.CHAT_TYPING),
      where('workspaceId', '==', workspaceId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const typingUsers = querySnapshot.docs.map(doc => doc.data() as ChatTypingIndicator);
      callback(typingUsers);
    });
  }

  // Search messages
  static async searchMessages(
    workspaceId: string,
    searchTerm: string,
    limitCount: number = 20
  ): Promise<ChatMessage[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that searches for exact matches in content
      const q = query(
        collection(db, COLLECTIONS.CHAT_MESSAGES),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc'),
        limit(limitCount * 5) // Get more messages to filter locally
      );
      
      const querySnapshot = await getDocs(q);
      const allMessages = querySnapshot.docs.map(doc => doc.data() as ChatMessage);
      
      // Filter messages that contain the search term (case-insensitive)
      const filteredMessages = allMessages.filter(message =>
        message.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredMessages.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }
}