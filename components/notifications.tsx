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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'

interface NotificationsProps {
  className?: string
}

export function Notifications({ className }: NotificationsProps) {
  const { user } = useAuth()
  const { setActiveItem } = useNavigation()
  const { setCurrentWorkspace, workspaces } = useWorkspace()
  
  const [notifications, setNotifications] = useState<ChatNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      50 // Get more notifications
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
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return
    await NotificationService.markAllNotificationsAsRead(user.uid)
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
    <SidebarGroup className={className}>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </SidebarGroupLabel>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={handleMarkAllAsRead}
          >
            Mark all read
          </Button>
        )}
      </div>
      <SidebarGroupContent>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="text-sm text-muted-foreground">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">No notifications yet</div>
              <div className="text-xs text-muted-foreground mt-1">You'll see messages from your team here</div>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
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
      </SidebarGroupContent>
    </SidebarGroup>
  )
}