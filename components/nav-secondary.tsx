import React from "react"
import { type LucideIcon } from "lucide-react"
import { useNavigation } from "@/contexts/navigation-context"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "./settings-dialog"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    badge?: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { activeItem, setActiveItem } = useNavigation()

  const handleItemClick = (title: string) => {
    const itemMap: { [key: string]: string } = {
      'Calendar': 'calendar',
      'Templates': 'templates',
      'Trash': 'trash',
      'Help': 'help'
    }
    if (itemMap[title]) {
      setActiveItem(itemMap[title] as 'calendar' | 'templates' | 'trash' | 'help')
    }
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const itemMap: { [key: string]: string } = {
              'Calendar': 'calendar',
              'Templates': 'templates',
              'Trash': 'trash',
              'Help': 'help'
            }
            const isActive = activeItem === itemMap[item.title]
            
            return (
              <SidebarMenuItem key={item.title}>
                {item.title === "Settings" ? (
                  <SettingsDialog />
                ) : (
                  <>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => handleItemClick(item.title)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
