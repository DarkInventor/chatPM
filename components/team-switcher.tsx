"use client"

import * as React from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { useWorkspace } from "@/contexts/workspace-context"
import { useAuth } from "@/contexts/auth-context"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
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
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { 
    organizations, 
    currentOrganization, 
    setCurrentOrganization,
    isLoadingOrganizations,
    createOrganization,
    deleteOrganization,
    refreshData
  } = useWorkspace()
  const { user } = useAuth()

  // Dialog state for creating new organization
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [newOrgName, setNewOrgName] = React.useState("")
  const [newOrgPlan, setNewOrgPlan] = React.useState("free")
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState("")

  // Dialog state for deleting organization
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [orgToDelete, setOrgToDelete] = React.useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState("")

  // Use Firebase organizations if available, fallback to props
  const activeTeams = organizations.length > 0 ? organizations.map(org => ({
    id: org.id,
    name: org.name,
    logo: teams[0]?.logo || (() => <div className="w-3 h-3 bg-blue-500 rounded" />),
    plan: org.plan.charAt(0).toUpperCase() + org.plan.slice(1)
  })) : teams.map((team, index) => ({
    id: `fallback-${index}`,
    name: team.name,
    logo: team.logo,
    plan: team.plan
  }))

  const activeTeam = currentOrganization ? {
    id: currentOrganization.id,
    name: currentOrganization.name,
    logo: teams[0]?.logo || (() => <div className="w-3 h-3 bg-blue-500 rounded" />),
    plan: currentOrganization.plan.charAt(0).toUpperCase() + currentOrganization.plan.slice(1)
  } : (activeTeams[0] || teams[0])

  if (!activeTeam || isLoadingOrganizations) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="w-fit px-1.5 py-5">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
              <div className="w-3 h-3 bg-gray-400 rounded animate-pulse" />
            </div>
            <span className="truncate font-medium text-gray-400">Loading...</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const handleTeamSelect = async (team: any) => {
    console.log('🔄 Switching to organization:', team.name)
    if (team.id && organizations.length > 0) {
      const org = organizations.find(o => o.id === team.id)
      if (org) {
        setCurrentOrganization(org)
        // Trigger refresh to ensure all data is current
        setTimeout(() => refreshData(), 100)
      }
    }
  }

  const handleAddOrganization = async () => {
    if (!newOrgName.trim()) return

    setIsCreating(true)
    setError("")

    try {
      const result = await createOrganization({
        name: newOrgName.trim(),
        plan: newOrgPlan as 'free' | 'startup' | 'enterprise',
      })

      if (result.success) {
        setNewOrgName("")
        setNewOrgPlan("free")
        setIsAddDialogOpen(false)
      } else {
        setError(result.error || "Failed to create organization")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      const result = await deleteOrganization(orgToDelete.id)

      if (result.success) {
        setIsDeleteDialogOpen(false)
        setOrgToDelete(null)
      } else {
        setDeleteError(result.error || "Failed to delete organization")
      }
    } catch (error) {
      setDeleteError("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const isUserAdmin = (org: any) => {
    return user?.uid && org.createdBy === user.uid
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5 py-5">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <activeTeam.logo className="size-3" />
              </div>
              <span className="truncate font-medium">{activeTeam.name}</span>
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {activeTeams.map((team, index) => (
              <div key={team.id || team.name} className="flex items-center">
                <DropdownMenuItem
                  onClick={() => handleTeamSelect(team)}
                  className="gap-2 p-2 flex-1"
                >
                  <div className="flex size-6 items-center justify-center rounded-xs border">
                    <team.logo className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">{team.plan}</span>
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
                {isUserAdmin(organizations.find(org => org.id === team.id)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOrgToDelete({ id: team.id, name: team.name })
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 p-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add Organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      
      {/* Add Organization Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage multiple workspaces and teams.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="Enter organization name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-plan">Plan</Label>
              <Select 
                value={newOrgPlan} 
                onValueChange={setNewOrgPlan}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
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
                setNewOrgName("")
                setNewOrgPlan("free")
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddOrganization} 
              disabled={isCreating || !newOrgName.trim()}
            >
              {isCreating ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{orgToDelete?.name}"? This action cannot be undone. 
              All workspaces, members, and data in this organization will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="text-sm text-red-600">{deleteError}</div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setOrgToDelete(null)
                setDeleteError("")
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteOrganization} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}
