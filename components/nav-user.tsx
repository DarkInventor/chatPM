"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { MemberService } from "@/lib/member-service"
import { NotificationService } from "@/lib/notification-service"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import * as React from "react"

export function NavUser({
  user,
}: {
  user?: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user: authUser, userProfile, logout } = useAuth()
  const [pendingInvitations, setPendingInvitations] = React.useState(0)
  const [unreadNotifications, setUnreadNotifications] = React.useState(0)

  // Use authenticated user data if available, fallback to prop
  const displayUser = authUser && userProfile ? {
    name: userProfile.displayName || authUser.displayName || 'User',
    email: authUser.email || '',
    avatar: userProfile.photoURL || authUser.photoURL || ''
  } : user

  // Load pending invitations count
  React.useEffect(() => {
    const loadPendingInvitations = async () => {
      if (userProfile?.email) {
        try {
          const invitations = await MemberService.getPendingInvitationsForUser(userProfile.email)
          setPendingInvitations(invitations.length)
        } catch (error) {
          console.error('Error loading pending invitations:', error)
        }
      }
    }

    loadPendingInvitations()
  }, [userProfile?.email])

  // Subscribe to notification count
  React.useEffect(() => {
    if (!authUser?.uid) return

    const unsubscribe = NotificationService.subscribeToUserNotifications(
      authUser.uid,
      (notifications) => {
        const unreadCount = notifications.filter(n => !n.isRead).length
        setUnreadNotifications(unreadCount)
      },
      50
    )

    return unsubscribe
  }, [authUser?.uid])

  if (!displayUser) {
    return null
  }

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(displayUser.name, displayUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayUser.name}</span>
                <span className="truncate text-xs">{displayUser.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(displayUser.name, displayUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayUser.name}</span>
                  <span className="truncate text-xs">{displayUser.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <NotificationsDropdown>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Bell />
                  <div className="flex items-center justify-between w-full">
                    <span>Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadNotifications > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {unreadNotifications} new
                        </span>
                      )}
                      {pendingInvitations > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                          {pendingInvitations} invites
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              </NotificationsDropdown>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
