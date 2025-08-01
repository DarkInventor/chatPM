"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, MoreVertical, Reply, Edit, Trash, ThumbsUp, ThumbsUpIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { ChatService } from '@/lib/chat-service'
import { NotificationService } from '@/lib/notification-service'
import { AIContextOptimizer } from '@/lib/ai-context-optimizer'
import { ChatMessage, ChatTypingIndicator } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSidebar } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Smile } from 'react-feather'
import { Thumb } from '@radix-ui/react-switch'

interface WorkspaceChatProps {
  className?: string
}

export function WorkspaceChat({}: WorkspaceChatProps) {
  const { user } = useAuth()
  const { currentWorkspace, currentOrganization, workspaceMembers } = useWorkspace()
  const { state: sidebarState } = useSidebar()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [typingUsers, setTypingUsers] = useState<ChatTypingIndicator[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null)
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to messages and mark workspace as read when user is in chat
  useEffect(() => {
    if (!currentWorkspace?.id || !user?.uid) return

    // Mark workspace as read when user enters chat
    NotificationService.markWorkspaceAsRead(currentWorkspace.id, user.uid)

    const unsubscribe = ChatService.subscribeToMessages(
      currentWorkspace.id,
      (newMessages) => {
        setMessages(newMessages)
        // Mark workspace as read when new messages come in while user is actively viewing
        if (newMessages.length > 0) {
          NotificationService.markWorkspaceAsRead(currentWorkspace.id, user.uid)
        }
      }
    )

    return unsubscribe
  }, [currentWorkspace?.id, user?.uid])

  // Subscribe to typing indicators
  useEffect(() => {
    if (!currentWorkspace?.id) return

    const unsubscribe = ChatService.subscribeToTyping(
      currentWorkspace.id,
      (typing) => {
        // Filter out current user's typing indicator
        const otherUsersTyping = typing.filter(t => t.userId !== user?.uid)
        setTypingUsers(otherUsersTyping)
      }
    )

    return unsubscribe
  }, [currentWorkspace?.id, user?.uid])

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    if (!isTyping && currentWorkspace?.id && user?.uid) {
      setIsTyping(true)
      ChatService.startTyping(
        currentWorkspace.id,
        user.uid,
        user.displayName || user.email || 'Anonymous'
      )
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (currentWorkspace?.id && user?.uid) {
        ChatService.stopTyping(currentWorkspace.id, user.uid)
        setIsTyping(false)
      }
    }, 1000)
  }

  // Send message with @claude detection
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentWorkspace?.id || !currentOrganization?.id || !user?.uid) return

    const content = newMessage.trim()
    const isMentioningClaude = content.toLowerCase().includes('@claude')
    
    setNewMessage('')
    
    // Stop typing indicator
    if (isTyping) {
      ChatService.stopTyping(currentWorkspace.id, user.uid)
      setIsTyping(false)
    }

    // Send the user message first
    const result = await ChatService.sendMessage(
      currentWorkspace.id,
      currentOrganization.id,
      user.uid,
      content,
      'text',
      null,
      replyToMessage?.id
    )

    if (!result.success) {
      console.error('Failed to send message:', result.error)
      setReplyToMessage(null)
      return
    }

    // If user mentioned @claude, process AI response
    if (isMentioningClaude) {
      await handleClaudeResponse(content, result.messageId)
    }

    // Clear reply
    setReplyToMessage(null)
  }

  // Handle Claude AI response with optimized context
  const handleClaudeResponse = async (userMessage: string, userMessageId?: string) => {
    if (!currentWorkspace?.id || !currentOrganization?.id || !user?.uid) return

    setIsProcessingAI(true)

    try {
      // Get optimized workspace context (cost-efficient)
      const optimizedContext = await AIContextOptimizer.getOptimizedWorkspaceContext(
        currentWorkspace.id,
        currentOrganization.id
      )

      if (!optimizedContext) {
        throw new Error('Unable to load workspace context')
      }

      // Prepare optimized system prompt
      const systemPrompt = AIContextOptimizer.generateOptimizedSystemPrompt(
        optimizedContext,
        userMessage,
        messages.slice(-5) // Only last 5 messages for context
      )

      console.log(`Context size: ${optimizedContext.contextSize} tokens (estimated)`)

      // Call Claude API with optimized prompt
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        }),
      })

      console.log('Claude API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Claude API error:', errorData)
        throw new Error(`Claude API error (${response.status}): ${errorData.error || 'Failed to get AI response'}`)
      }

      const data = await response.json()
      console.log('Claude API response received:', { hasContent: !!data.content })
      
      // Send Claude's response as a system message
      const aiResult = await ChatService.sendMessage(
        currentWorkspace.id,
        currentOrganization.id,
        'claude-ai', // Special user ID for Claude
        data.content,
        'system',
        {
          aiResponse: true,
          replyToMessage: userMessageId,
          model: 'claude-3-5-sonnet-20241022',
          contextSize: optimizedContext.contextSize,
          costOptimized: true
        }
      )

      if (!aiResult.success) {
        console.error('Failed to send AI response:', aiResult.error)
      }

    } catch (error) {
      console.error('Error processing Claude response:', error)
      
      // Send error message
      await ChatService.sendMessage(
        currentWorkspace.id,
        currentOrganization.id,
        'claude-ai',
        "I'm sorry, I encountered an error processing your request. Please try again.",
        'system',
        { aiResponse: true, error: true }
      )
    } finally {
      setIsProcessingAI(false)
    }
  }

  // Handle file attachment
  const handleFileAttachment = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentWorkspace?.id || !currentOrganization?.id || !user?.uid) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    // For now, we'll send the file name as a message
    // In a production app, you'd upload to storage first
    const fileType = file.type.startsWith('image/') ? 'image' : 'file'
    const content = `📎 ${file.name}`
    
    const result = await ChatService.sendMessage(
      currentWorkspace.id,
      currentOrganization.id,
      user.uid,
      content,
      fileType,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      },
      replyToMessage?.id
    )

    if (!result.success) {
      console.error('Failed to send file:', result.error)
    }

    // Clear reply and file input
    setReplyToMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Edit message
  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim() || !user?.uid) return

    const result = await ChatService.updateMessage(messageId, editingContent.trim(), user.uid)
    
    if (result.success) {
      setEditingMessageId(null)
      setEditingContent('')
    } else {
      console.error('Failed to edit message:', result.error)
    }
  }

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!user?.uid) return

    const result = await ChatService.deleteMessage(messageId, user.uid)
    
    if (!result.success) {
      console.error('Failed to delete message:', result.error)
    }
  }

  // Add reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user?.uid) return

    const result = await ChatService.addReaction(messageId, user.uid, emoji)
    
    if (!result.success) {
      console.error('Failed to add reaction:', result.error)
    }
  }

  // Get user profile for message
  const getUserProfile = (userId: string): { name: string; avatar?: string; isAI?: boolean } => {
    if (userId === 'claude-ai') {
      return {
        name: 'Claude',
        avatar: undefined,
        isAI: true
      }
    }
    
    const member = workspaceMembers.find(m => m.userId === userId)
    return {
      name: member?.profile.displayName || 'Unknown User',
      avatar: member?.profile.photoURL,
      isAI: false
    }
  }

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  // Render message content with @claude highlighting
  const renderMessageContent = (content: string) => {
    // Check if message contains @claude mention
    if (!content.toLowerCase().includes('@claude')) {
      return <span className="text-sm leading-relaxed">{content}</span>
    }

    // Split content by @claude mentions and highlight them
    const parts = content.split(/(@claude)/gi)
    
    return (
      <span className="text-sm leading-relaxed">
        {parts.map((part, index) => {
          if (part.toLowerCase() === '@claude') {
            return (
              <span
                key={index}
                className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold italic"
                style={{ fontWeight: 'bold', fontStyle: 'italic' }}
              >
                @claude
              </span>
            )
          }
          return part
        })}
      </span>
    )
  }

  // Group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {}
    
    messages.forEach(message => {
      const dateKey = formatDate(message.createdAt)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-transparent text-blue-600 text-lg">#</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-1">Select a workspace</h3>
              <p className="text-sm text-muted-foreground">Choose a workspace to start chatting with your team</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="max-w-7xl px-0 lg:px-22">
      {/* Messages Area */}
      <div className="px-6 py-4 space-y-4 mb-40">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-transparent text-blue-600 text-lg">
                    {currentWorkspace.emoji}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Welcome to {currentWorkspace.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start the conversation with your team members
                </p>
              </div>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-6">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs font-medium">{dateKey}</span>
                </div>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const userProfile = getUserProfile(message.userId)
                const isOwn = message.userId === user?.uid
                const showAvatar = index === 0 || dateMessages[index - 1].userId !== message.userId
                
                return (
                  <div key={message.id} className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={userProfile.avatar} />
                      <AvatarFallback className={
                        userProfile.isAI 
                          ? "bg-background" 
                          : isOwn 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-gray-100 text-gray-600"
                      }>
                        {userProfile.isAI ? (
                          <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMwAAADACAMAAAB/Pny7AAAAaVBMVEX////Zd1fYdFPYclDXbkrXcE3++/rWa0b89vT35N/67+zdiW/78/HswLTWaUPaelvux7346eXbf2L02tPVZT3cg2ffjnby1Mznrp7jn4v139nlppTptabim4bwzcTglX/UXzPTWivRUBSsXkRmAAASX0lEQVR4nNVd54KjMA5eXOi9Bwhk7v0f8iANLCzTZ+6+f7sTwHJRt/Tv31bkXIMgcbT+eY+Qz3Optfnr58JLZ7T01JSrnw9HWjTC9AtHuoxKRotGHXvl83rNJs8Z9aWDXUJGZcSQwFv5fJKR6YNpe+loFxATGTEav5vrnveY8ByJ1y7pFXDkxJC4WPV41Insg2jJxQNWoZNuM01j5aqlKQArJMFfrkwzZ8yvUWVrptitGXgsvnzEChSGnBjNWMMCLAJ2KXUuH7EKUtY8DCtfITgTHz51u37ECiDsbB2XbeFU8LUs/Ro02D6j3fJZDuHKsHVM8CpED4QYLV1kAfpsJoy/ZGY9sJXpBeeSpmVCZqYZvzJkHDc4oC/8JSXY7WZi5leGjKMyMBbAlliT6wCRy7tfGbICDTzF49IsnAA7APNgNMufq7w3iivsBRvO7zi2BbPGhjt0BTtvHS14QguqkwgQUKBLY6gnz4ac8LEkaPVGo+QFjXXueTR84dY7dRoLysyfhS+ZNzbZmP4lEraSm2g9d6LK55J008//uYE4a49LfAYeojtrJFQ91oL9uaBmmjE4YzRYaQJugn1HqKG56jEPEMOUDMN0ZhItXe842YAWMtnPygQq/tSA0fmqdXTvkpN5jXOqRiQnv+PP6FCbSRXMdmbHvSYru2KjRYgpoLI4dbg5U5zXuiWVfoBfstEahKFR/Gs6YIIkRsWS2UCbdPmZA9CRU0NzdFvrYICsxgamY7T0VtMFtEisxs9GQEWbDk40LgRD+R4biLnINEUkJ+0wHcUE5KPWXMIwWjS+wUW/BTNN6zPhGMOFD2BmZpWitOxxTbmmaer60lEr5SoazZBTA7QZzNtuc5SWVTYD/CrJ8ntdNqGlNFBMhAekyNIUIjGslsoMV8MsjOHVm3eZxSihnDHDT51EtTyhfGlIJv8k0GZ8T/ZuN0fN8v7Nm30GVjBODQ88hRHhdvIPp3KWA3wzqczN5OIuhmE4W32GkTOV04TUipUt5OKAaNLtCRQULlFm9BLTx594bHSzzYIOtMMVFBPhAb70nIpvpo5klkINP/z9Kcu3aWb2bXb8aIwLqgSJpBmyr4q/5bf58hWo8/c5kGCjzizT7SnBtyoS4pC6NsRVNJrZ+bdyBSPrn9jqywUxx/dE8wBjapEkkj7Al/CNH/EXM8tHrvV/gbAVBSL55FAfOziefJdLYhWuoAAQAudZb7BwyROGXCypoEMP6ufb8jM9PCA/NWR2vCNhrHPtGtNcX+CoyqfADYvzGZIDO6CQ6wHzcyYqALPzX+HapbY2zAhRoq80cvn75vzv+fUYihFRAYDnP8pUEoZoSrcPBg9RuHqwWKqARHLJSWH2RSkcbyYeZ71DQyXPl+2zllWsntJSttXknvTZxhA8ANCNoz78fKdn1pbx5u8QjE6mg8h1dg5SA4QXU0d4UajUYkiw1yQLlcyeZZLNK+dDJBaXRpT/9+kaqyW/9tjv/1eLLhrMty90u3wIF5ZGF4/M9EQhwu1LyxG7X8lXenXgPjs4ldSCFhNjIpGYidgyMXHwgn875F0ylGvTbzW47KbcCjGmS5MI5z+e7FY0Gv8Ezw6GZWqFGd6DshBMliUn35hQ3QrETM5/qPwY1Q77Y4oM88K9xpICkw0xbNhtXBrBBUrz71ZNYtWBIfSE9Dq7DpSH0ndEVoXEnyau8Xr6g9G/biOm94eWdalfC9BbRLn/DId7Aq+SGzZsDArkgpj5ssQSDZA+fzdnNvtg1WjE/zlpfj3VexHDalyaqcwcczoRB8+HFue0eIwbGsrFYfl0P3vSU8Y/kT59Khe/WZAV6lR+0XxmPmriqDdB0Ixsc5ZL8sJnaUyBmLdnTVeLNLrdf6lCVON+32FQZGIyhVJ9m7yXxhaIeYc+lU6yfpOdHIvRW6q0M2gwWr/yU8NfbM+akkpefAENWr+Qnh/ys9RbjYwRYLlL8L00iUBMM/uvObZ6/FZBL5UCVPO/rhupO+BtJIo+rGG1bEe5MEuJOHvRZkqNgxvvhKNIegRekbtQoG+QHrVajikzCo4guhGlzuG/LVBpUg156qWeIGb69Zaz8u8MbLnFshWeo3SesPuTA5uyFSTaICGnjpJ+rfRQrZKRS288VDVRbQuWPbUb6e0aPhhi0ywIek88JS1rs/F3wwwdlXpDtdoe8l0kY3zmb9+mzwaZWo1lK9KKDyKqVVuN8MFHmUiW76mVCJyOqPkj3eXx2wizDZRxrV7jcmWu58FGxq53SPA6ZL9Azg3N0R5mlDbS+zX85upqnwX4+a/Q0qN4KPgAkcsjEifmemLoJZlLcuidkklLYTQVciVKRswlWbIYQrWDQAamVL7Fn16kxmBYchAcAdE2DkZ3D7JxM8zVzqj92HLZ0YyqovXqe3jQuLZKesnirNQvdbsqwqbsMu4bjBu5d+yc6YXaztkHYiyOyrQKr6nvecx7Mt7bg3KnPCZnrdI/fXH8eTxdoCMcyMg0xjjwhFAe74qtfaEXsdJRtB0kxna/m4RllzsB4ZCMD9hRAyi6+afyAXlylxXesjgICKVKkXD8llSo9HdsxDw8rieNw9lAxfKkLV75WIbdncakCZ+4MHS98jrjkbK153LplsQ6LNhZ68FfORi66UZF6fgPf5PehGVdbISVKz0EazG4cUzbSrxbnKbG5jeys5wGTaaOta0D7byyI+m2BfnSsj21BkNyO0MhoKMY3IzN+VsKuB68ufOrIP7qKh5roCedMpxzISHc9+P75+Kj6TVem1juQZ+7620/tYdB/Qe/e0n0Ca1YQ4AuCII4zjInv5U9ZUUV7SBNjwI/+E1CjIefN5ZrjkP1nhoJ+YD2WgMfwLiWOffyuWir92P982uEpI+sscCMNwp3y5B3bvh+mj4ePw8/cLph2cKkXzb0poDigsU5eE44J04jsxXUvnjhNe+U+oG2XhgEed2EhWXb7kDa932VKivqIBmU0iDO8hq1LNGLysuvflHG4rwu+71YWZHdU2Zhtx6PYFgMGmROV4eVSjaq4/CrvtSfr34vGiTrbrfb/YzBC6+n/Pnq0ksWj66pjl9t/GxvAp71ttcbmaH127nnveuYa6VMv/9DUObTvPYKa0tWkzpJ4m/Qc16Wl2GyiZABevmrom4RPSF+XhZWtEsNjrqfP1BEpCBGmjpNYh9Qrcze0n70wiP1fcPgnCoTWi7DS6gni/f21sCNrKQNvbK+5U4cUNYzJk4Hyt4gc5xJCae5d129Q92OqqRoe/qasqzvneNkWRYPCL54juMpmcmX4D2kkPhCQnAKTTuKLKunciAz7AltBlJ7Wdl1eZ47jqNOIcGIcdripUJMVeC/xECoVWHV3Bao6RWjXt3r9ZXSC3vCkqqyRETRHxBaHVCP3qqs7zPSK2IiunvdawJeGL7X8FcI804RwYQQCtBrgEYP9lQ477e6bAba2uK6tBSzUWf1n0Pok7J+DTnVeovgmPcfR5urLiZfQhjhQX1FOofVXRfqVBFEndOzhtz6jzSHgZzz3JkDzGbhNsTCaDg/pFEYaJRqBylFfCTqRLskKZ0hnLSbIOyu4nZSrO5xaIORZ2K53ZadE1AszLeA7fdrZdCtMj1qK/PPjZyoLe95wNh2gsgZnnPLk0dpt4Vs2HirUx9CynlgbCWIHq6W7Hq5PE7Hgg0JZsPvhXw502q9sgtSY0uE42hZ7raTLwBJ7xUsZraAWfafGSVt02n+aiOYHCrKm9xj+cwxGrobXKUfauab3rStounYuqAgP7Ay5i1AdnV6t+a1zNZQI80Y0V07aXJ/maBVRZbl8AiWKcGH23WF8novQs3sbvdIkWk1TvpQEUT+szd7ptAQIUnY82KVpUrlxKkh6vFYXu4zuapAjJ2XoPQqRxL7yDsdxwYVUtbyJLqc0mh5XRxooq7Q/yvfJ2V6IekjZ5trL6UC1Jgl2Wojh64SfZV3y7OvrkBo0O1UmyOPIDyXMOdlJ7l3kZY8KVdzA4IVeoJTWnn13Qk4o1zrwn06sx06WOooC8qXBWuK921IUJkb2DTxvbVDe+kK3erfizDbG5aXQ9hnqXVQ76TnmNuiaUa5wVuuVzt9AEkdYDPMtebz0lY0N42bqvKudF64qjzUOYjqGFX9/PxbOgwU9iDElJQ2X6CG3i+mpolRBkvTsW6YCa4qD0UW7MkNTromjYMoSj6eABtTXXqk0woX4Pb5s8hCNLps6b2UsemZusqRem9nwMOz36lQQLIQJT97dnKxvgSSuJVV6SHOrGYuZRetjZ2jB5iIXSfsH3FEr1twY2HDoXyLNWdtafHPg8kQZLnNwA6YIXoDiFCxrA6oevouTKCPpYBI3h+hcsbdWalDJtjj0Z7uTrZqNOWTkpugSulANr4LE+ij/H+uoyldmn/W7L5hulMcYtBDB2WrhgMqaXgi1Z9Sp+ZoQL8Ko7SzVz6r5ER3aOoZzZkl2q0Svc9IjRJouOCqMv3U0HHH/+evmhrzGhBsuGVrw3vHhEvLKe1Dm2NSgfhOC/YAqIQz3oJzRzvtbdlGc8vtqV+aDfC7E3I7iUXbJa69sAZ+xK3BJvu2CZkYap/S0fOEHfKsyKK3kJqTlIEkx7WXbN4KwhN/TcZC8ZNKTp/SC/Y8xeVdiNmaUZMf32k6XPHJ+32JWgszcCY1WiaaGflsvXZuVr//poNeAP3ZO8oF9BKV+SyQSLMIlJ2Z5rKPCWgk+Fhe7jwr7VtMGIpoahyjBi+cSKQ14MybOJ186o8bmRkZXWPV/DiyT4GpEggccuz+RYRwMUocqZIBLptTbcLp9PFvk2J05tySJt9NGMKDgxa+XEWMvDAez+S3qEBVaUKnXolJ/WwycQdJ6iHxbzWqwoFs4IBqM2tH8lqWm3yCIiC5uUDyhFKBM3lzBjPW/azA7WGiwbpd6wHbkQxgGVK62QUCnYn1lSaJAbSbbD9Yfvg5DV/XTAQ4BA12K2pzDz41asw/B8swi6ULp7qLWNRfUrN3UjnDBvU4aNDso0aH7Ug0prUYf/RmG0L8++RVYkFaXdKPwxhL5rkgfZyQnaUoEtGTTB54+BMWWuSgDcO0fC6oE+pKPFCTWsF6+CNSQ9EOD2oUUyPGYHgjK1gJjOdgBaduJth3V1I9k0zbPhVi3Jfs7SRW9Kx+SCpnhv+4K5qRgNJRZNbyaipPZp1qZTxgene0AjEMtrP9ZpLRwOnKUJ3mDTWFeauLicQYtZkvJMJZcDbb4HY7XgVbjTXX7FswGDZvpSMUApq5+GW1Uel0I7jAYKPZVUVcYBksOm8OY032iezm8n3uLKGd8JZQdJHy8yrrCbBBcwUiqfQfCsTMZzWaCxsCWnIld0Hx5HL18ChuQBrJ+slM7U9pwyVJ8j4sa2g3Ah9gzgVdAmGZZl8mBqYFJ6WBemg9PKmBGVetkAXC49PXpoDqpawDg+Ajk2cdSNRnosGwXtVNZ05dAmEHLCD556Xxn4OY/grpt+RJeMDslNvNRCnhCsm3B7NyRfIGTN70/geRp1C4ko1mzPWwdnThkePFdQXAKKVxk2qBgv8JK4spq6Ptz9e5yr5En9uIroH1OBDuL+graBdESc80aVnz+vPVlSHpdShAPQOJovKE6OWkWIzflKRzSXmj93JL7i1GL4UFWxGhG0hQ8gmafiHr+iBtHFQ5Qwumra1bVJh1OmUdYjZ5Ism4WiXJgSJE9nO3dmIi7bWwDzr8MkPVJbFpEcXHoEuKQxvymm1J256oa7Yg8MDRVYdl5RUvjSRhIOPS8pNPWCBeRzX0KIhmqLp7XCjxPh9OIV0EqP1BKa4oFaDjhOq1OlRbB1zdox4cfsIVSl8oWonquoW2pHzNVbdJ3gAXl4hyX4tpJkv18eaeR3JuJW0IXQP+EmVLXFHnWUoInXvrJI2fzsRNpIUoxwfcUPP2WQCzBsoXtTV9Q5TUZGEbJKICqeoF/AI0bdRdoI9C7IHES7UkBhZxusxoQQ1n4lxZHrSZfstYoAWmmT2WlRBXbGZFZMbraZimvaRLV6NsIP8fKz4QiZrppdWBJ7aWv2i6wvSldM0XClHMXrjN9DEQbCyH5xMgXoNV35j6pq+VM1aXvtaGrdjNoSg21vLZr6lPU35xeWArfhCNPlZcvoPxZLZSAtr88fAZNR7O1ZrZv8F7xBS9T0fYIGK8oUuxXZTdiQaY+lurfgU7HqC9qf8fAPVGqU3/fwId3qU/19f1uzCh1vg416X6q3Bn6aP/G8UxdmGWI8v+ekRHEILsoJ2B4v8NgADftbbJ1QAWwG+0Yfgvwjz94BkkbboAAAAASUVORK5CYII="
                            alt="Claude AI Logo"
                            className="h-20 w-20 object-contain"
                          />
                        ) : (
                          userProfile.name.charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {showAvatar && (
                        <span className="text-xs text-muted-foreground px-1">
                          {userProfile.name} • {formatTime(message.createdAt)}
                        </span>
                      )}
                      
                      {/* Reply indicator */}
                      {message.replyTo && (
                        <div className="text-xs text-muted-foreground mb-1 px-3 py-1 bg-muted/50 rounded-lg">
                          <Reply className="h-3 w-3 inline mr-1" />
                          Replied to a message
                        </div>
                      )}

                      <div className="relative group">
                        {/* Message bubble */}
                        {editingMessageId === message.id ? (
                          <div className="flex items-center gap-2 p-3 bg-background border rounded-2xl">
                            <Input
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="text-sm border-none p-0 h-auto focus-visible:ring-0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleEditMessage(message.id)
                                }
                                if (e.key === 'Escape') {
                                  setEditingMessageId(null)
                                  setEditingContent('')
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => handleEditMessage(message.id)} className="h-6 px-2">
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessageId(null)
                                  setEditingContent('')
                                }}
                                className="h-6 px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className={`px-4 py-3 rounded-2xl ${
                            userProfile.isAI
                              ? 'bg-purple-50 text-purple-900 border border-purple-200'
                              : isOwn 
                                ? 'bg-blue-600 text-white ml-auto' 
                                : 'bg-gray-100 text-gray-900'
                          }`}>
                            {/* File attachment display */}
                            {(message.type === 'image' || message.type === 'file') && message.metadata ? (
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${isOwn ? 'bg-blue-500' : 'bg-gray-200'}`}>
                                  <Paperclip className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{message.metadata.fileName || 'Unknown file'}</p>
                                  {message.metadata.fileSize && (
                                    <p className="text-xs opacity-70">
                                      {(message.metadata.fileSize / 1024 / 1024).toFixed(1)} MB
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              renderMessageContent(message.content)
                            )}
                            {message.editedAt && (
                              <span className="text-xs opacity-70 mt-1 block">(edited)</span>
                            )}
                          </div>
                        )}

                        {/* Message actions */}
                        <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity p-1`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReplyToMessage(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReaction(message.id, '👍')}>
                                <ThumbsUpIcon className="h-4 w-4 mr-2 text-blue-500" />
                                Like
                              </DropdownMenuItem>
                              {isOwn && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMessageId(message.id)
                                      setEditingContent(message.content)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="text-red-600"
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {message.reactions.map((reaction, idx) => (
                            <TooltipProvider key={idx}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-6 px-2 flex items-center gap-1 ${
                                      reaction.users.includes(user?.uid || '') 
                                        ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                        : ''
                                    }`}
                                    onClick={() => handleReaction(message.id, reaction.emoji)}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    <span className="text-xs">{reaction.count}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {reaction.users
                                      .map(userId => getUserProfile(userId).name)
                                      .join(', ')}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        
        {/* Typing indicators */}
        {(typingUsers.length > 0 || isProcessingAI) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            {isProcessingAI ? (
              <>
                <span className="flex items-center gap-1">
                  Claude is thinking
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </span>
              </>
            ) : (
              <>
                <div className="flex -space-x-1">
                  {typingUsers.slice(0, 3).map(typing => {
                    const profile = getUserProfile(typing.userId)
                    return (
                      <Avatar key={typing.userId} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback className="text-xs">
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )
                  })}
                </div>
                <span>
                  {typingUsers.length === 1
                    ? `${getUserProfile(typingUsers[0].userId).name} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </>
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply banner */}
      {replyToMessage && (
        <div className={`fixed bottom-20 z-40 transition-all duration-300 ${
          sidebarState === "collapsed" 
            ? "left-[calc(14%+1.5rem)]" 
            : "left-1/2 transform -translate-x-1/2"
        } min-w-md px-4 lg:min-w-3xl md:min-w-3xl md:px-0 lg:px-0 mx-auto`}>
          <div className="bg-muted/90 backdrop-blur-sm p-3 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="h-4 w-4" />
              <span className="text-sm">
                Replying to <strong>{getUserProfile(replyToMessage.userId).name}</strong>
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-48">
                {replyToMessage.content}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className={`fixed bottom-6 z-50 transition-all duration-300 ${
        sidebarState === "collapsed" 
          ? "left-[calc(14%+1.5rem)]" 
          : "left-1/2 transform -translate-x-1/2"
      } min-w-md px-4 lg:min-w-3xl md:min-w-3xl md:px-0 lg:px-0 mx-auto`}>
        <div 
          className={`w-full max-w-3xl border bg-white shadow-sm transition-all duration-200 ${
            newMessage.toLowerCase().includes('@claude') 
              ? 'ring-2 ring-purple-200 border-purple-300' 
              : ''
          }`}
          style={{ borderRadius: 32 }}
        >
          <div className="flex items-center gap-2 p-3">
            {/* File attachment button */}
            <button
              onClick={handleFileAttachment}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Attach file"
              type="button"
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
              className="hidden"
            />

            {/* Text Input */}
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={
                  newMessage.toLowerCase().includes('@claude') 
                    ? "Claude is listening... Ask about projects, tasks, or team insights!"
                    : `Message ${currentWorkspace.name}... (use @claude for AI assistance)`
                }
                className="w-full border-0 outline-none bg-transparent text-base py-2 px-2 placeholder-gray-400"
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isProcessingAI}
              className={`p-3 rounded-full font-medium transition-all flex-shrink-0 ${
                !newMessage.trim() || isProcessingAI
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : newMessage.toLowerCase().includes('@claude')
                    ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-200'
                    : 'bg-black hover:bg-gray-800 text-white'
              }`}
              title={
                newMessage.toLowerCase().includes('@claude') 
                  ? "Send to Claude" 
                  : "Send message"
              }
              type="button"
            >
              {isProcessingAI ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}