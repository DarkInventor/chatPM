"use client"

import * as React from "react"
import { Plus, X, Hash } from "lucide-react"
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

interface Workspace {
  name: string
  emoji: React.ReactNode
  id: string
}

export function NavWorkspaces({
  workspaces: initialWorkspaces,
  onWorkspaceSelect,
}: {
  workspaces: {
    name: string
    emoji: React.ReactNode
  }[]
  onWorkspaceSelect?: (workspace: Workspace) => void
}) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>(
    initialWorkspaces.map((w, i) => ({ ...w, id: `workspace-${i}` }))
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("")

  const handleAddWorkspace = () => {
    if (newWorkspaceName.trim()) {
      const newWorkspace: Workspace = {
        id: `workspace-${Date.now()}`,
        name: newWorkspaceName.trim(),
        emoji: "#",
      }
      setWorkspaces([...workspaces, newWorkspace])
      setNewWorkspaceName("")
      setIsAddDialogOpen(false)
    }
  }

  const handleRemoveWorkspace = (id: string) => {
    setWorkspaces(workspaces.filter(w => w.id !== id))
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
              <DialogTitle>Add New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace to organize your conversations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWorkspace()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWorkspace}>Add Workspace</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {workspaces.map((workspace) => (
            <SidebarMenuItem key={workspace.id}>
              <div className="flex items-center group">
                <SidebarMenuButton asChild className="flex-1">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      handleWorkspaceClick(workspace)
                    }}
                  >
                    <span>{workspace.emoji}</span>
                    <span>{workspace.name}</span>
                  </a>
                </SidebarMenuButton>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveWorkspace(workspace.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
