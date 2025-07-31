"use client"

import React, { useState, useEffect } from 'react'
import { Bell, X, MessageCircle, FileImage, Paperclip } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useNavigation } from '@/contexts/navigation-context'
import { useWorkspace } from '@/contexts/workspace-context'
import { NotificationService } from '@/lib/notification-service'
import { ChatNotification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NotificationsDropdownProps {
  children: React.ReactNode
}

export function NotificationsDropdown({ children }: NotificationsDropdownProps) {
  const { user } = useAuth()
  const { setActiveItem } = useNavigation()
  const { setCurrentWorkspace, workspaces } = useWorkspace()
  
  const [notifications, setNotifications] = useState<ChatNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Subscribe to notifications
  useEffect(() => {
    if (!user?.uid) return

    setIsLoading(true)
    const unsubscribe = NotificationService.subscribeToUserNotifications(
      user.uid,
      (newNotifications) => {
        setNotifications(newNotifications)
        setIsLoading(false)
      },
      20 // Limit for dropdown
    )

    return unsubscribe
  }, [user?.uid])

  // Handle notification click - navigate to workspace chat
  const handleNotificationClick = async (notification: ChatNotification) => {
    // Find the workspace
    const workspace = workspaces.find(w => w.id === notification.workspaceId)
    if (workspace) {
      // Switch to the workspace and chat view
      setCurrentWorkspace(workspace)
      setActiveItem('chat')
      
      // Mark notification as read
      await NotificationService.markNotificationAsRead(notification.id)
      
      // Close dropdown
      setIsOpen(false)
    }
  }

  // Clear all notifications
  const handleClearAllNotifications = async () => {
    if (!user?.uid) return
    
    try {
      // Use the new clearAllUserNotifications method
      const result = await NotificationService.clearAllUserNotifications(user.uid)
      
      if (result.success) {
        console.log('Successfully cleared notifications')
        setIsOpen(false) // Close dropdown after clearing
      } else {
        console.error('Failed to clear notifications:', result.error)
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  // Get icon for message type
  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return <FileImage className="h-3 w-3" />
      case 'file':
        return <Paperclip className="h-3 w-3" />
      default:
        return <MessageCircle className="h-3 w-3" />
    }
  }

  // Format time ago
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleClearAllNotifications}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">No notifications yet</div>
              <div className="text-xs text-muted-foreground mt-1">You'll see messages from your team here</div>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border mb-2 ${
                    notification.isRead 
                      ? 'bg-background hover:bg-muted/50 border-transparent' 
                      : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={notification.senderAvatar} />
                      <AvatarFallback className="text-xs">
                        {notification.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {notification.senderName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          in #{notification.workspaceName}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Message preview */}
                      <div className="flex items-start gap-1">
                        {getMessageIcon(notification.messageType)}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                      
                      {/* Time */}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}