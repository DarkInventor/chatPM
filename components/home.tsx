"use client"

import * as React from "react"
import { 
  Plus, 
  Flag, 
  Search, 
  Sparkles, 
  CheckCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { useSidebar } from "@/components/ui/sidebar"

// Sample data
const projects = [
  {
    id: 1,
    name: "Mobile App Launch",
    description: "Launch new mobile app for iOS and Android.",
    color: "bg-blue-500",
    progress: 75,
    members: [
      { name: "Sam Smith", avatar: "/avatars/sam.jpg", initials: "SS" },
      { name: "Jane Doe", avatar: "/avatars/jane.jpg", initials: "JD" },
      { name: "John Smith", avatar: "/avatars/john.jpg", initials: "JS" }
    ]
  },
  {
    id: 2,
    name: "Website Redesign",
    description: "Complete redesign of the main marketing site.",
    color: "bg-green-500",
    progress: 40,
    members: [
      { name: "Sam Smith", avatar: "/avatars/sam.jpg", initials: "SS" },
      { name: "Jane Doe", avatar: "/avatars/jane.jpg", initials: "JD" }
    ]
  }
]

const deadlines = [
  {
    id: 1,
    title: "Finalize design mockups",
    project: "Website Redesign",
    due: "Today",
    priority: "high",
    color: "text-red-500"
  },
  {
    id: 2,
    title: "Setup beta testing group",
    project: "Mobile App Launch",
    due: "3 days",
    priority: "medium",
    color: "text-orange-500"
  },
  {
    id: 3,
    title: "Launch social media campaign",
    project: "Marketing Campaign",
    due: "1 week",
    priority: "low",
    color: "text-yellow-500"
  }
]

const recentActivity = [
  {
    id: 1,
    user: "Jane Doe",
    action: "commented on a task in",
    project: "Mobile App Launch",
    time: "15m ago",
    avatar: "/avatars/jane.jpg",
    initials: "JD"
  },
  {
    id: 2,
    user: "John Smith",
    action: "added a new file to",
    project: "Website Redesign",
    time: "1h ago",
    avatar: "/avatars/john.jpg",
    initials: "JS"
  },
  {
    id: 3,
    user: "You",
    action: "completed the task",
    task: "Create project brief",
    time: "3h ago",
    avatar: "/avatars/sam.jpg",
    initials: "SS"
  }
]

export function Home() {
  const { state: sidebarState } = useSidebar()

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 py-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good morning, <span className="bg-blue-100 text-blue-900 px-1 rounded">Sam</span>! ☀️</h1>
            <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening today.</p>
          </div>
          <Button className="flex items-center gap-2 shadow-none">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* My Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Projects</h2>
            <Button variant="ghost" size="sm" className="text-sm shadow-none">
              View all
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <span className={`w-3 h-3 rounded-full ${project.color} mr-3`}></span>
                    <h3 className="font-semibold">{project.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members.map((member, index) => (
                        <Avatar key={index} className="h-6 w-6 border-2 border-background shadow-none">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {project.progress}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <Card key={deadline.id} className="shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <Flag className={`h-5 w-5 mr-3 ${deadline.color}`} />
                    <div className="flex-1">
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-sm text-muted-foreground">{deadline.project}</p>
                    </div>
                    <span className={`text-sm font-semibold ${deadline.priority === 'high' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {deadline.due}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-40">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3 mt-1 shadow-none">
                  <AvatarImage src={activity.avatar} />
                  <AvatarFallback className="text-xs">{activity.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    {activity.project && (
                      <Button variant="link" className="p-0 h-auto text-sm font-semibold text-primary shadow-none">
                        {activity.project}
                      </Button>
                    )}
                    {activity.task && (
                      <span className="font-semibold text-foreground">&quot;{activity.task}&quot;</span>
                    )}
                    .
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat Input */}
      <div className={`fixed bottom-6 z-50 transition-all duration-300 ${
        sidebarState === "collapsed" 
          ? "left-[calc(14%+1.5rem)]" 
          : "left-1/2 transform -translate-x-1/2"
      } min-w-md px-4 lg:min-w-3xl md:min-w-3xl md:px-0 lg:px-0 mx-auto`}>
        <AIChatInput />
      </div>
    </div>
  )
} 