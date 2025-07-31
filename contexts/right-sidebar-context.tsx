"use client"

import React, { createContext, useContext, useState } from 'react'

interface RightSidebarContextType {
  isOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined)

export function RightSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  const toggle = () => setIsOpen(!isOpen)
  const setOpen = (open: boolean) => setIsOpen(open)

  return (
    <RightSidebarContext.Provider value={{ isOpen, toggle, setOpen }}>
      {children}
    </RightSidebarContext.Provider>
  )
}

export function useRightSidebar() {
  const context = useContext(RightSidebarContext)
  if (context === undefined) {
    throw new Error('useRightSidebar must be used within a RightSidebarProvider')
  }
  return context
}