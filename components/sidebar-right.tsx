"use client"

import * as React from "react"
import { Plus, Users, Bot, X, UserPlus } from "lucide-react"

import { NavUser } from "@/components/nav-user"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  const [members, setMembers] = React.useState<Member[]>(data.members)
  const [selectedModel, setSelectedModel] = React.useState(AI_MODELS[1])
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false)
  const [newMemberEmail, setNewMemberEmail] = React.useState("")

  const handleAddMember = () => {
    if (newMemberEmail.trim()) {
      const newMember: Member = {
        id: `member-${Date.now()}`,
        name: newMemberEmail.split("@")[0],
        email: newMemberEmail.trim(),
        status: "offline",
      }
      setMembers([...members, newMember])
      setNewMemberEmail("")
      setIsAddMemberOpen(false)
    }
  }

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id))
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const getStatusColor = (status: Member["status"]) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "away": return "bg-yellow-500"
      case "offline": return "bg-gray-400"
    }
  }

  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </SidebarGroupLabel>
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember}>Add Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {members.map((member) => (
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
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Model
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <Bot className="h-4 w-4" />
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Plus />
              <span>New Workspace</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
