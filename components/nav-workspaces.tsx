"use client"

import * as React from "react"
import { Plus, X, Hash } from "lucide-react"
import { useWorkspace } from "@/contexts/workspace-context"
import { Workspace as WorkspaceType } from "@/lib/types"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Workspace {
  name: string
  emoji: React.ReactNode
  id: string
}

export function NavWorkspaces({
  workspaces,
  onWorkspaceSelect,
  currentWorkspace,
  isLoading
}: {
  workspaces: {
    name: string
    emoji: React.ReactNode
    id: string
  }[]
  onWorkspaceSelect?: (workspace: Workspace) => void
  currentWorkspace?: WorkspaceType | null
  isLoading?: boolean
}) {
  const { createWorkspace, deleteWorkspace, hasPermission } = useWorkspace()
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("")
  const [newWorkspaceEmoji, setNewWorkspaceEmoji] = React.useState("#")
  const [newWorkspaceDescription, setNewWorkspaceDescription] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState("")


  const handleAddWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setIsCreating(true)
    setError("")

    try {
      const workspaceData: any = {
        name: newWorkspaceName.trim(),
        emoji: newWorkspaceEmoji,
      };
      
      // Only include description if it has a value
      const trimmedDescription = newWorkspaceDescription.trim();
      if (trimmedDescription) {
        workspaceData.description = trimmedDescription;
      }
      
      const result = await createWorkspace(workspaceData)

      if (result.success) {
        setNewWorkspaceName("")
        setNewWorkspaceEmoji("#")
        setNewWorkspaceDescription("")
        setIsAddDialogOpen(false)
      } else {
        setError(result.error || "Failed to create workspace")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleRemoveWorkspace = async (id: string) => {
    if (!hasPermission('canDeleteWorkspace', id)) return

    try {
      await deleteWorkspace(id)
    } catch (error) {
      console.error("Error deleting workspace:", error)
    }
  }

  const handleWorkspaceClick = (workspace: Workspace) => {
    onWorkspaceSelect?.(workspace)
  }

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
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
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="grid gap-2">
                <Label>Symbol</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={true}
                  >
                    #
                  </Button>
                  <span className="text-sm text-muted-foreground">All workspaces use the # symbol</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workspace-description">Description (Optional)</Label>
                <Input
                  id="workspace-description"
                  placeholder="Brief description of this workspace"
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
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
                  setIsAddDialogOpen(false)
                  setError("")
                  setNewWorkspaceName("")
                  setNewWorkspaceEmoji("#")
                  setNewWorkspaceDescription("")
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddWorkspace} 
                disabled={isCreating || !newWorkspaceName.trim()}
              >
                {isCreating ? "Creating..." : "Create Workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="text-sm text-muted-foreground">Loading workspaces...</div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <div className="text-sm text-muted-foreground">No workspaces yet</div>
            </div>
          ) : (
            workspaces.map((workspace) => (
              <SidebarMenuItem key={workspace.id}>
                <div className="flex items-center group">
                  <SidebarMenuButton 
                    asChild 
                    className={`flex-1 ${currentWorkspace?.id === workspace.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                  >
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        handleWorkspaceClick(workspace)
                      }}
                    >
                      <Hash className="size-4" />
                      <span>{workspace.name}</span>
                    </a>
                  </SidebarMenuButton>
                  {hasPermission('canDeleteWorkspace', workspace.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveWorkspace(workspace.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
