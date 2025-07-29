"use client"

import { type LucideIcon } from "lucide-react"
import { useNavigation } from "@/contexts/navigation-context"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
  }[]
}) {
  const { activeItem, setActiveItem } = useNavigation()

  const handleItemClick = (title: string) => {
    const itemMap: { [key: string]: string } = {
      'Search': 'search',
      'Ask AI': 'ask-ai',
      'Home': 'home',
      'Inbox': 'inbox'
    }
    setActiveItem(itemMap[title] as 'search' | 'ask-ai' | 'home' | 'inbox')
  }

  return (
    <SidebarMenu>
      {items.map((item) => {
        const itemMap: { [key: string]: string } = {
          'Search': 'search',
          'Ask AI': 'ask-ai',
          'Home': 'home',
          'Inbox': 'inbox'
        }
        const isActive = activeItem === itemMap[item.title]
        
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              isActive={isActive}
              onClick={() => handleItemClick(item.title)}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
