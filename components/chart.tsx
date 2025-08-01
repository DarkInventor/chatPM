"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { AIChatService } from "@/lib/ai-chat-service"
import { AIContextOptimizer } from "@/lib/ai-context-optimizer"
import { AIConversation, AIMessage } from "@/lib/types"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function Chat() {
  const { state: sidebarState } = useSidebar()
  const { user } = useAuth()
  const { currentOrganization, currentWorkspace } = useWorkspace()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Initialize conversation when user and organization are available
  useEffect(() => {
    const initializeConversation = async () => {
      if (user && currentOrganization && !currentConversation) {
        // First, try to find existing "Ask AI" conversation for this user/organization
        // We'll look for conversations without a workspaceId (global conversations)
        const existingConversations = await AIChatService.getUserConversations(
          user.uid,
          currentOrganization.id,
          50 // Get more to filter through
        );

        // Find the "Ask AI" conversation (one without workspaceId)
        const askAIConversation = existingConversations.find(conv => 
          !conv.workspaceId && (conv.title === "Ask AI Chat" || conv.title === "New Chat")
        );

        let conversationToUse: string | null = null;

        if (askAIConversation) {
          // Use the existing Ask AI conversation
          conversationToUse = askAIConversation.id;
          console.log('Using existing Ask AI conversation:', conversationToUse);
        } else {
          // Create a new Ask AI conversation (without workspaceId for global access)
          const result = await AIChatService.createConversation(
            user.uid,
            currentOrganization.id,
            undefined, // No workspaceId - this makes it global
            undefined, // projectId
            "Ask AI Chat"
          )
          
          if (result.success && result.conversationId) {
            conversationToUse = result.conversationId;
            console.log('Created new Ask AI conversation:', conversationToUse);
          }
        }

        if (conversationToUse) {
          setConversationId(conversationToUse);
        }
      }
    }

    initializeConversation()
  }, [user, currentOrganization, currentWorkspace, currentConversation])

  // Subscribe to conversation updates if we have a conversationId
  useEffect(() => {
    if (!conversationId) return

    const unsubscribe = AIChatService.subscribeToConversation(
      conversationId,
      (conversation) => {
        if (conversation) {
          setCurrentConversation(conversation)
          // Convert AI messages to our Message format
          const convertedMessages: Message[] = conversation.messages.map((msg: AIMessage) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as "user" | "assistant",
            timestamp: msg.metadata.timestamp?.toDate() || new Date()
          }))
          
          setMessages(convertedMessages)
        }
      }
    )

    return unsubscribe
  }, [conversationId])

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user || !currentOrganization || !conversationId) return

    setIsLoading(true)

    try {
      // Add user message to Firebase
      console.log('Sending user message to Firebase:', { conversationId, content: content.trim() });
      const userMessageResult = await AIChatService.addMessage(conversationId, 'user', content.trim());
      console.log('User message result:', userMessageResult);
      
      if (!userMessageResult.success) {
        throw new Error(`Failed to save user message: ${userMessageResult.error}`);
      }

      // Prepare context - "Ask AI" always uses comprehensive cross-workspace context
      console.log('Preparing context for Ask AI - using cross-workspace context');
      const systemPrompt = await AIContextOptimizer.getSmartCrossWorkspacePrompt(
        user.uid,
        currentOrganization.id,
        content.trim()
      );

      // Call Claude API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: content.trim() }
          ]
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Claude API error (${response.status}): ${errorData.error || 'Failed to get AI response'}`)
      }

      const data = await response.json()
      
      // Add assistant response to Firebase
      console.log('Sending assistant response to Firebase:', { conversationId, responseLength: data.content?.length });
      const assistantMessageResult = await AIChatService.addMessage(
        conversationId, 
        'assistant', 
        data.content,
        {
          model: 'claude-3-5-sonnet-20241022',
          tokens: data.usage?.total_tokens
        }
      );
      console.log('Assistant message result:', assistantMessageResult);
      
      if (!assistantMessageResult.success) {
        console.error('Failed to save assistant message:', assistantMessageResult.error);
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message to Firebase
      if (conversationId) {
        await AIChatService.addMessage(
          conversationId,
          'assistant',
          "Sorry, I encountered an error. Please try again."
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Messages Area */}
      <div className="px-6 py-4 space-y-4 mb-40">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-transparent text-blue-600 text-lg">PM</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">Start a conversation</h3>
                <p className="text-sm text-muted-foreground">Ask me anything or start with a greeting</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                {message.role === 'user' ? (
                  <AvatarFallback className="bg-gray-100 text-gray-600">U</AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-blue-100 text-blue-700">PM</AvatarFallback>
                )}
              </Avatar>
              <div className={`min-w-3xl ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Chat Input */}
      <div className={`fixed bottom-6 z-50 transition-all duration-300 ${
        sidebarState === "collapsed" 
          ? "left-[calc(14%+1.5rem)]" 
          : "left-1/2 transform -translate-x-1/2"
      } min-w-md px-4 lg:min-w-3xl md:min-w-3xl md:px-0 lg:px-0 mx-auto`}>
        <AIChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}