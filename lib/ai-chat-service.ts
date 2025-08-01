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
import { AIConversation, AIMessage, COLLECTIONS } from "./types";

export class AIChatService {
  // Create a new AI conversation
  static async createConversation(
    userId: string,
    organizationId: string,
    workspaceId?: string,
    projectId?: string,
    title: string = "New Chat"
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      const conversationRef = doc(collection(db, COLLECTIONS.AI_CONVERSATIONS));
      const conversationId = conversationRef.id;

      // Build context object, only including fields that have values
      const context: any = {};
      
      if (workspaceId) {
        const workspaceData = await this.getWorkspaceContext(workspaceId);
        if (workspaceData) {
          context.workspaceData = workspaceData;
        }
      }
      
      if (projectId) {
        const projectData = await this.getProjectContext(projectId);
        if (projectData) {
          context.projectData = projectData;
        }
      }

      // Build conversation object, only including fields that have values
      const conversation: any = {
        id: conversationId,
        userId,
        organizationId,
        title,
        model: "claude-3-5-sonnet-20241022",
        messages: [],
        context,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Only add workspaceId if it's not null/undefined
      if (workspaceId) {
        conversation.workspaceId = workspaceId;
      }

      // Only add projectId if it's not null/undefined
      if (projectId) {
        conversation.projectId = projectId;
      }

      await setDoc(conversationRef, conversation);

      return { success: true, conversationId };
    } catch (error: any) {
      console.error('Error creating AI conversation:', error);
      return { success: false, error: error.message };
    }
  }

  // Add a message to an existing conversation
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: {
      tokens?: number;
      model?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Adding message to conversation:', { conversationId, role, contentLength: content.length, metadata });
      
      const conversationRef = doc(db, COLLECTIONS.AI_CONVERSATIONS, conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        console.error('Conversation not found:', conversationId);
        return { success: false, error: 'Conversation not found' };
      }

      const conversation = conversationDoc.data() as AIConversation;
      console.log('Current conversation:', { id: conversation.id, messageCount: conversation.messages?.length || 0 });
      
      const messageId = Date.now().toString(); // Simple ID generation

      const messageMetadata: any = {
        timestamp: Timestamp.fromDate(new Date()),
      };
      
      // Only add metadata fields that have actual values
      if (metadata?.tokens) {
        messageMetadata.tokens = metadata.tokens;
      }
      if (metadata?.model) {
        messageMetadata.model = metadata.model;
      }

      const newMessage: AIMessage = {
        id: messageId,
        role,
        content,
        metadata: messageMetadata,
      };

      console.log('New message to add:', newMessage);

      const updatedMessages = [...(conversation.messages || []), newMessage];
      console.log('Updated messages array length:', updatedMessages.length);

      const updateData: any = {
        messages: updatedMessages,
        updatedAt: serverTimestamp(),
      };

      // Update title based on first user message if it's still "New Chat"
      if (conversation.title === "New Chat" && role === 'user' && (conversation.messages?.length || 0) === 0) {
        updateData.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      }

      console.log('Update data for Firebase:', { 
        messagesCount: updateData.messages.length,
        hasTitle: !!updateData.title 
      });

      await updateDoc(conversationRef, updateData);
      console.log('Message successfully added to Firebase');

      return { success: true };
    } catch (error: any) {
      console.error('Error adding message to conversation:', error);
      return { success: false, error: error.message };
    }
  }

  // Get a specific conversation
  static async getConversation(conversationId: string): Promise<AIConversation | null> {
    try {
      const conversationDoc = await getDoc(doc(db, COLLECTIONS.AI_CONVERSATIONS, conversationId));
      
      if (!conversationDoc.exists()) {
        return null;
      }

      return conversationDoc.data() as AIConversation;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  // Get all conversations for a user
  static async getUserConversations(
    userId: string,
    organizationId: string,
    limitCount: number = 50
  ): Promise<AIConversation[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AI_CONVERSATIONS),
        where('userId', '==', userId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as AIConversation);
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      return [];
    }
  }

  // Get conversations for a workspace
  static async getWorkspaceConversations(
    workspaceId: string,
    organizationId: string,
    limitCount: number = 50
  ): Promise<AIConversation[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.AI_CONVERSATIONS),
        where('workspaceId', '==', workspaceId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as AIConversation);
    } catch (error) {
      console.error('Error fetching workspace conversations:', error);
      return [];
    }
  }

  // Subscribe to real-time conversation updates
  static subscribeToConversation(
    conversationId: string,
    callback: (conversation: AIConversation | null) => void
  ): () => void {
    const conversationRef = doc(db, COLLECTIONS.AI_CONVERSATIONS, conversationId);

    return onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as AIConversation);
      } else {
        callback(null);
      }
    });
  }

  // Subscribe to user's conversations list
  static subscribeToUserConversations(
    userId: string,
    organizationId: string,
    callback: (conversations: AIConversation[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db, COLLECTIONS.AI_CONVERSATIONS),
      where('userId', '==', userId),
      where('organizationId', '==', organizationId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (querySnapshot) => {
      const conversations = querySnapshot.docs.map(doc => doc.data() as AIConversation);
      callback(conversations);
    });
  }

  // Update conversation title
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const conversationRef = doc(db, COLLECTIONS.AI_CONVERSATIONS, conversationId);
      
      await updateDoc(conversationRef, {
        title,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating conversation title:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a conversation
  static async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const conversationRef = doc(db, COLLECTIONS.AI_CONVERSATIONS, conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        return { success: false, error: 'Conversation not found' };
      }

      const conversation = conversationDoc.data() as AIConversation;
      
      // Check if user owns the conversation
      if (conversation.userId !== userId) {
        return { success: false, error: 'You can only delete your own conversations' };
      }

      await deleteDoc(conversationRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to get workspace context
  private static async getWorkspaceContext(workspaceId: string): Promise<any> {
    try {
      const workspaceDoc = await getDoc(doc(db, COLLECTIONS.WORKSPACES, workspaceId));
      return workspaceDoc.exists() ? {
        id: workspaceDoc.id,
        name: workspaceDoc.data().name,
        description: workspaceDoc.data().description,
      } : undefined;
    } catch (error) {
      console.error('Error getting workspace context:', error);
      return undefined;
    }
  }

  // Helper method to get project context
  private static async getProjectContext(projectId: string): Promise<any> {
    try {
      const projectDoc = await getDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
      return projectDoc.exists() ? {
        id: projectDoc.id,
        name: projectDoc.data().name,
        description: projectDoc.data().description,
        status: projectDoc.data().status,
      } : undefined;
    } catch (error) {
      console.error('Error getting project context:', error);
      return undefined;
    }
  }

  // Search conversations
  static async searchConversations(
    userId: string,
    organizationId: string,
    searchTerm: string,
    limitCount: number = 20
  ): Promise<AIConversation[]> {
    try {
      // Get user's conversations and filter locally
      const conversations = await this.getUserConversations(userId, organizationId, limitCount * 2);
      
      // Search in titles and message content
      const filteredConversations = conversations.filter(conversation => {
        const titleMatch = conversation.title.toLowerCase().includes(searchTerm.toLowerCase());
        const messageMatch = conversation.messages.some(message => 
          message.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return titleMatch || messageMatch;
      });
      
      return filteredConversations.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }
}