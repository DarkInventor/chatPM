"use client"

import * as React from "react"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Settings, 
  Search, 
  Inbox, 
  Calendar, 
  Plus, 
  Hash
} from "react-feather";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "./settings-dialog";

const mainMenuItems = [
  {
    title: "Search",
    icon: Search,
    href: "#",
  },
  {
    title: "Inbox",
    icon: Inbox,
    href: "#",
  },
  {
    title: "My Tasks",
    icon: Calendar,
    href: "#",
  },
];

const projects = [
  {
    title: "Website Redesign",
    color: "bg-green-500",
    href: "#",
  },
  {
    title: "Mobile App Launch",
    color: "bg-blue-500",
    href: "#",
    active: true,
  },
  {
    title: "Marketing Campaign",
    color: "bg-yellow-500",
    href: "#",
  },
];

const channels = [
  {
    title: "announcements",
    href: "#",
  },
  {
    title: "general",
    href: "#",
    active: true,
  },
  {
    title: "design",
    href: "#",
  },
  {
    title: "engineering",
    href: "#",
  },
];

export function IndieHackSidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
              <Avatar className="w-5 h-5">
                <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1oO7r4Ht2g8GXtjPXNjZEwaCvZksSCCE8gPX4qKg1FsrInRHmYiePnEyECKXsOv0q8WrSmc58uB3BoxhESrJZpqnd1nC4amTt45c_wIBvn_Op4vXLJLLt5XFVbEZ4DWfUqmCTG4PlDSmkOp3LFMCS5U3i-Iw2Fj-Mm2mbrUX7DLyU48DzTWpcI17zJEFTQ6vfFKuHX6bvxgmOHYKDDp01Ld5sKarm4cezl1dp0Tu5OPKFpNIz0nNC-fJIRSaoIUv0lZzSis5qUlAh" />
                <AvatarFallback>SS</AvatarFallback>
              </Avatar>
            </div>
            <span className="truncate font-medium">IndieHack OS</span>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-gray-700">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
        
        <SidebarMenu>
          {mainMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 py-1.5">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-gray-600">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem key={project.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={project.active}
                  >
                    <a href={project.href}>
                      <Badge variant="secondary" className={`w-2.5 h-2.5 rounded-full ${project.color} p-0`} />
                      <span>{project.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {channels.map((channel) => (
                <SidebarMenuItem key={channel.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={channel.active}
                  >
                    <a href={channel.href}>
                      <Hash className="h-3 w-3" />
                      <span>{channel.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}