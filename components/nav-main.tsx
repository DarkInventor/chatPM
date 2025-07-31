"use client"

import { useState } from "react"
import { type LucideIcon } from "lucide-react"
import { useNavigation } from "@/contexts/navigation-context"
import { SearchDialog } from "@/components/search-dialog"

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
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)

  const handleItemClick = (title: string) => {
    if (title === 'Search') {
      setSearchDialogOpen(true)
      return
    }
    
    const itemMap: { [key: string]: string } = {
      'Ask AI': 'ask-ai',
      'Home': 'home',
      'Chat': 'chat', 
      'Inbox': 'inbox'
    }
    setActiveItem(itemMap[title] as 'ask-ai' | 'home' | 'chat' | 'inbox')
  }

  return (
    <>
      <SidebarMenu>
        {items.map((item) => {
          const itemMap: { [key: string]: string } = {
            'Ask AI': 'ask-ai',
            'Home': 'home',
            'Chat': 'chat',
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
      <SearchDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
      />
    </>
  )
}
