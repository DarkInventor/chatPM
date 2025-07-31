"use client"

import * as React from "react"
import {
  AudioWaveform,
  Blocks,
  Calendar,
  Command,
  Home,
  Inbox,
  MessageCircle,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavWorkspaces } from "@/components/nav-workspaces"
import { TeamSwitcher } from "@/components/team-switcher"
import { useWorkspace } from "@/contexts/workspace-context"
import { useNavigation } from "@/contexts/navigation-context"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: Command,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
    
    {
      title: "Home",
      url: "#",
      icon: Home,
      isActive: true,
    },
    // {
    //   title: "Chat",
    //   url: "#",
    //   icon: MessageCircle,
    //   isActive: false,
    // },
    {
      title: "Ask AI",
      url: "#",
      icon: Sparkles,
      isActive: true,
    },
    // {
    //   title: "Inbox",
    //   url: "#",
    //   icon: Inbox,
    //   badge: "10",
    // },
  ],
  navSecondary: [
    {
      title: "Calendar",
      url: "#",
      icon: Calendar,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Templates",
      url: "#",
      icon: Blocks,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
    },
    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
    },
  ],
  
  workspaces: [
    {
      name: "Personal Life Management",
      emoji: "#",
    },
    {
      name: "Professional Development",
      emoji: "#",
    },
    {
      name: "Creative Projects",
      emoji: "#",
    },
    {
      name: "Home Management",
      emoji: "#",
    },
    {
      name: "Travel & Adventure",
      emoji: "#",
    },
  ],
}

export function SidebarLeft({
  onWorkspaceSelect,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onWorkspaceSelect?: (workspace: { name: string; emoji: React.ReactNode; id: string }) => void
}) {
  const { 
    organizations, 
    workspaces, 
    currentWorkspace, 
    setCurrentWorkspace,
    isLoadingWorkspaces 
  } = useWorkspace()
  const { setActiveItem } = useNavigation()

  // Transform organizations to match TeamSwitcher interface
  const teams = organizations.map(org => ({
    name: org.name,
    logo: Command, // Default logo
    plan: org.plan.charAt(0).toUpperCase() + org.plan.slice(1) as "Free" | "Startup" | "Enterprise"
  }))

  // Transform workspaces to match NavWorkspaces interface
  const workspaceData = workspaces.map(workspace => ({
    name: workspace.name,
    emoji: workspace.emoji,
    id: workspace.id
  }))

  const handleWorkspaceSelect = (workspace: { name: string; emoji: React.ReactNode; id: string }) => {
    const selectedWorkspace = workspaces.find(w => w.id === workspace.id)
    if (selectedWorkspace) {
      setCurrentWorkspace(selectedWorkspace)
      // Automatically switch to chat when a workspace is selected
      setActiveItem('chat')
    }
    onWorkspaceSelect?.(workspace)
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r-0" 
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher teams={teams.length > 0 ? teams : data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavWorkspaces 
          workspaces={workspaceData} 
          onWorkspaceSelect={handleWorkspaceSelect}
          currentWorkspace={currentWorkspace}
          isLoading={isLoadingWorkspaces}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
