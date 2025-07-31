"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

type NavigationItem = 'home' | 'search' | 'chat' | 'ask-ai' | 'inbox' | 'calendar' | 'templates' | 'trash' | 'help'

interface NavigationContextType {
  activeItem: NavigationItem
  setActiveItem: (item: NavigationItem) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeItem, setActiveItem] = useState<NavigationItem>(() => {
    // Restore navigation state from localStorage on initial load
    if (typeof window !== 'undefined') {
      const savedActiveItem = localStorage.getItem('activeNavigationItem')
      if (savedActiveItem && ['home', 'search', 'chat', 'ask-ai', 'inbox', 'calendar', 'templates', 'trash', 'help'].includes(savedActiveItem)) {
        return savedActiveItem as NavigationItem
      }
    }
    return 'home'
  })

  const setActiveItemWithPersistence = (item: NavigationItem) => {
    setActiveItem(item)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeNavigationItem', item)
    }
  }

  return (
    <NavigationContext.Provider value={{ activeItem, setActiveItem: setActiveItemWithPersistence }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
} 