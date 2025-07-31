"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, MoreVertical, Reply, Edit, Trash, ThumbsUp, ThumbsUpIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { ChatService } from '@/lib/chat-service'
import { NotificationService } from '@/lib/notification-service'
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

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentWorkspace?.id || !currentOrganization?.id || !user?.uid) return

    const content = newMessage.trim()
    setNewMessage('')
    
    // Stop typing indicator
    if (isTyping) {
      ChatService.stopTyping(currentWorkspace.id, user.uid)
      setIsTyping(false)
    }

    const result = await ChatService.sendMessage(
      currentWorkspace.id,
      currentOrganization.id,
      user.uid,
      content,
      'text',
      null, // Use null instead of undefined
      replyToMessage?.id
    )

    if (!result.success) {
      console.error('Failed to send message:', result.error)
    }

    // Clear reply
    setReplyToMessage(null)
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
  const getUserProfile = (userId: string): { name: string; avatar?: string } => {
    const member = workspaceMembers.find(m => m.userId === userId)
    return {
      name: member?.profile.displayName || 'Unknown User',
      avatar: member?.profile.photoURL
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
                      <AvatarFallback className={isOwn ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}>
                        {userProfile.name.charAt(0).toUpperCase()}
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
                            isOwn 
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
                              <p className="text-sm leading-relaxed">{message.content}</p>
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
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
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
          className="w-full max-w-3xl border bg-white shadow-sm"
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
                placeholder={`Message ${currentWorkspace.name}...`}
                className="w-full border-0 outline-none bg-transparent text-base py-2 px-2 placeholder-gray-400"
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-full font-medium transition-all flex-shrink-0 ${
                newMessage.trim()
                  ? 'bg-black hover:bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Send message"
              type="button"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}