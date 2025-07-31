"use client"

import * as React from "react"
import { Plus, Users, Bot, X, UserPlus, Crown, MessageCircle } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { WorkspaceService } from "@/lib/workspace-service"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Notifications } from "@/components/notifications"
import { Message02, Trash } from "dicons"

// Workspace Creation Dialog Component
function WorkspaceCreationDialog() {
  const { createWorkspace } = useWorkspace()
  const [workspaceName, setWorkspaceName] = React.useState("")
  const [workspaceEmoji, setWorkspaceEmoji] = React.useState("💼")
  const [workspaceDescription, setWorkspaceDescription] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

  const emojis = ["💼", "🏢", "🚀", "💡", "🎯", "📊", "🔧", "🎨", "🔬", "📚", "🌟", "⚡"]

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return

    setIsCreating(true)
    setError("")

    try {
      const result = await createWorkspace({
        name: workspaceName.trim(),
        emoji: workspaceEmoji,
        description: workspaceDescription.trim() || undefined,
      })

      if (result.success) {
        setWorkspaceName("")
        setWorkspaceEmoji("💼")
        setWorkspaceDescription("")
        setIsOpen(false)
      } else {
        setError(result.error || "Failed to create workspace")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogDescription>
          Create a new workspace to organize your projects and collaborate with your team.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            placeholder="Enter workspace name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            disabled={isCreating}
          />
        </div>
        <div className="grid gap-2">
          <Label>Emoji</Label>
          <div className="flex flex-wrap gap-2">
            {emojis.map((emoji) => (
              <Button
                key={emoji}
                variant={workspaceEmoji === emoji ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setWorkspaceEmoji(emoji)}
                disabled={isCreating}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="workspace-description">Description (Optional)</Label>
          <Input
            id="workspace-description"
            placeholder="Brief description of this workspace"
            value={workspaceDescription}
            onChange={(e) => setWorkspaceDescription(e.target.value)}
            disabled={isCreating}
          />
        </div>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
      </div>
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => {
            setIsOpen(false)
            setError("")
            setWorkspaceName("")
            setWorkspaceEmoji("💼")
            setWorkspaceDescription("")
          }}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreateWorkspace} 
          disabled={isCreating || !workspaceName.trim()}
        >
          {isCreating ? "Creating..." : "Create Workspace"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

interface Member {
  id: string
  name: string
  email: string
  avatar?: string
  status: "online" | "offline" | "away"
}

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
]

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  members: [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      status: "online" as const,
    },
    {
      id: "2", 
      name: "Jane Smith",
      email: "jane@example.com",
      status: "away" as const,
    },
    {
      id: "3",
      name: "Bob Wilson",
      email: "bob@example.com", 
      status: "offline" as const,
    },
  ],
}

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, userProfile, loading } = useAuth()
  const { 
    workspaceMembers, 
    memberPresence, 
    currentWorkspace,
    currentOrganization,
    isLoadingMembers,
    inviteMember,
    removeMember,
    hasPermission,
    refreshData 
  } = useWorkspace()
  
  const [selectedModel, setSelectedModel] = React.useState(AI_MODELS[1])
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false)
  const [newMemberEmail, setNewMemberEmail] = React.useState("")
  const [isInviting, setIsInviting] = React.useState(false)
  const [inviteError, setInviteError] = React.useState("")

  // Show loading state while auth is loading
  if (loading) {
    return (
      <Sidebar
        collapsible="none"
        className="sticky top-0 hidden h-svh border-l lg:flex"
        {...props}
      >
        <SidebarHeader className="border-sidebar-border h-16 border-b">
          <div className="flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </SidebarHeader>
      </Sidebar>
    )
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !currentWorkspace) {
      return
    }

    setIsInviting(true)
    setInviteError("")

    try {
      const result = await inviteMember(newMemberEmail.trim(), 'member')
      
      if (result.success) {
        setNewMemberEmail("")
        setIsAddMemberOpen(false)
        // Refresh data to show invitation was sent
        await refreshData()
      } else {
        setInviteError(result.error || "Failed to invite member")
      }
    } catch (error) {
      console.error('Member invitation error:', error)
      setInviteError("An unexpected error occurred")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!currentOrganization) return

    // Confirm removal
    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName} from "${currentOrganization.name}"? They will be removed from all workspaces in this organization only. Their access to other organizations will remain unchanged.`
    )
    
    if (!confirmed) return

    try {
      // We'll need to create an organization-level remove member function
      const result = await removeOrganizationMember(userId)
      if (!result.success) {
        console.error("Failed to remove member:", result.error)
        alert("Failed to remove member: " + result.error)
      } else {
        // Success - refresh the data to update UI immediately
        await refreshData()
        alert(`${memberName} has been successfully removed from ${currentOrganization.name}.`)
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("An error occurred while removing the member.")
    }
  }

  // Organization-level member removal
  const removeOrganizationMember = async (userId: string) => {
    if (!currentOrganization?.id || !user?.uid) {
      return { success: false, error: "Missing organization or user data" }
    }
    
    return await WorkspaceService.removeOrganizationMember(
      currentOrganization.id,
      userId,
      user.uid
    )
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const getStatusColor = (status: "online" | "offline" | "away") => {
    switch (status) {
      case "online": return "bg-green-500"
      case "away": return "bg-yellow-500"
      case "offline": return "bg-gray-400"
    }
  }

  const getMemberStatus = (userId: string): "online" | "offline" | "away" => {
    const presence = memberPresence[userId]
    if (!presence) return "offline"
    
    // Check if lastSeen exists and user was last seen recently (within 5 minutes)
    if (!presence.lastSeen) {
      // If no lastSeen timestamp, fall back to presence status
      return presence.status === "online" ? "online" : 
             presence.status === "away" ? "away" : "offline"
    }
    
    const lastSeen = presence.lastSeen.toDate()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    if (presence.status === "online" && lastSeen > fiveMinutesAgo) {
      return "online"
    } else if (presence.status === "away") {
      return "away"
    } else {
      return "offline"
    }
  }

  // Transform workspace members to match the existing UI interface
  const displayMembers = workspaceMembers.map(member => ({
    id: member.userId,
    name: member.profile.displayName,
    email: member.profile.email,
    avatar: member.profile.photoURL,
    status: getMemberStatus(member.userId),
    isAdmin: currentOrganization?.createdBy === member.userId, // Check if this user is the org creator
    role: member.role
  }))

  const canInviteMembers = hasPermission('canInviteMembers')
  const canRemoveMembers = hasPermission('canManageRoles')
  const isCurrentUserAdmin = currentOrganization?.createdBy === user?.uid

  // Debug permissions
  React.useEffect(() => {
    console.log('Sidebar Right Debug:', {
      currentWorkspace: currentWorkspace?.name,
      currentWorkspaceId: currentWorkspace?.id,
      user: user?.uid,
      canInviteMembers,
      canRemoveMembers,
      workspaceMembersCount: workspaceMembers.length,
      isLoadingMembers,
      members: workspaceMembers.map(m => ({ 
        userId: m.userId,
        name: m.profile.displayName, 
        email: m.profile.email, 
        role: m.role,
        status: m.status,
        permissions: m.permissions,
        expectedDocId: `${currentWorkspace?.id}_${m.userId}`
      })),
      currentUserMember: workspaceMembers.find(m => m.userId === user?.uid)
    })
  }, [currentWorkspace, user, canInviteMembers, canRemoveMembers, workspaceMembers.length, isLoadingMembers, workspaceMembers])

  return (
    <Sidebar
      collapsible="none"
      side="right"
      className="sticky top-0 h-svh border-l"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-16 border-none">
        <NavUser />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({isLoadingMembers ? '...' : displayMembers.length})
            </SidebarGroupLabel>
            {(canInviteMembers || true) && ( // Temporarily always show for debugging
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <UserPlus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                    <DialogDescription>
                      Invite a new member to this workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      placeholder="Email address"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !isInviting && handleAddMember()}
                      disabled={isInviting}
                    />
                    {inviteError && (
                      <div className="text-sm text-red-600">{inviteError}</div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsAddMemberOpen(false)
                        setInviteError("")
                        setNewMemberEmail("")
                      }}
                      disabled={isInviting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddMember} 
                      disabled={isInviting || !newMemberEmail.trim()}
                    >
                      {isInviting ? "Inviting..." : "Invite Member"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingMembers ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm text-muted-foreground">Loading members...</div>
                </div>
              ) : displayMembers.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm text-muted-foreground">No members yet</div>
                </div>
              ) : (
                displayMembers.map((member) => (
                  <SidebarMenuItem key={member.id}>
                    <div className="flex items-center gap-2 group px-2 py-1">
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${getStatusColor(member.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          {member.isAdmin && (
                            <div title="Organization Admin">
                              <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {isCurrentUserAdmin && member.id !== user?.uid && !member.isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                        >
                          <Trash className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* <SidebarSeparator className="mx-0" /> */}

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            {/* <Bot className="h-4 w-4" /> */}
            AI Model
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <Message02 className="h-4 w-4" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{selectedModel.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedModel.provider}</p>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {AI_MODELS.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className="flex flex-col items-start gap-1"
                      >
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.provider}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* <SidebarSeparator className="mx-0" /> */}

        <Notifications />
      </SidebarContent>
      {/* <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton>
                  <Plus />
                  <span>New Workspace</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <WorkspaceCreationDialog />
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </Sidebar>
  )
}
