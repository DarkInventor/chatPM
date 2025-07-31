/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Hash, Clock, Users, Folder, FileText, MessageCircle, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { useNavigation } from "@/contexts/navigation-context"
import { ChatService } from "@/lib/chat-service"
import { WorkspaceService } from "@/lib/workspace-service"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

const PLACEHOLDERS = [
  "Search workspaces, projects, or tasks...",
  "Find documents, notes, or files...",
  "Search for team members or messages...",
  "Look up deadlines or meetings...",
]

// Search result types
interface SearchResult {
  id: string
  name: string
  type: 'workspace' | 'member' | 'message'
  description?: string
  icon: React.ComponentType<any>
  onClick: () => void
  metadata?: any
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { user } = useAuth()
  const { workspaces, workspaceMembers, setCurrentWorkspace, isLoadingWorkspaces } = useWorkspace()
  const { setActiveItem } = useNavigation()
  
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load default workspaces whenever workspaces change or dialog opens
  useEffect(() => {
    if (open && !inputValue.trim()) {
      // Debug logging
      console.log('Loading default workspaces - workspaces:', workspaces)
      console.log('Workspaces length:', workspaces.length)
      
      // Load all workspaces as default results
      const defaultResults: SearchResult[] = workspaces.map(workspace => ({
        id: `workspace-${workspace.id}`,
        name: workspace.name,
        type: 'workspace' as const,
        description: workspace.description || 'Workspace',
        icon: Hash,
        onClick: () => {
          setCurrentWorkspace(workspace)
          setActiveItem('home')
          onOpenChange(false)
        }
      }))
      
      console.log('Setting default results:', defaultResults)
      setSearchResults(defaultResults)
    }
  }, [open, workspaces, inputValue, setCurrentWorkspace, setActiveItem, onOpenChange])

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
        setIsActive(true)
      }, 100)
    } else {
      setIsActive(false)
      setInputValue("")
      if (!open) {
        setSearchResults([])
      }
    }
  }, [open])

  // Perform search when input changes
  useEffect(() => {
    const performSearch = async () => {
      if (!inputValue.trim()) {
        // This is handled by the separate useEffect above
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      const query = inputValue.toLowerCase()
      const results: SearchResult[] = []

      try {
        // Search workspaces
        workspaces.forEach(workspace => {
          if (
            workspace.name.toLowerCase().includes(query) ||
            workspace.description?.toLowerCase().includes(query)
          ) {
            results.push({
              id: `workspace-${workspace.id}`,
              name: workspace.name,
              type: 'workspace',
              description: workspace.description || 'Workspace',
              icon: Hash,
              onClick: () => {
                setCurrentWorkspace(workspace)
                setActiveItem('home')
                onOpenChange(false)
              }
            })
          }
        })

        // Search team members
        workspaceMembers.forEach(member => {
          if (
            member.profile.displayName.toLowerCase().includes(query) ||
            member.profile.email.toLowerCase().includes(query)
          ) {
            results.push({
              id: `member-${member.userId}`,
              name: member.profile.displayName,
              type: 'member',
              description: member.profile.email,
              icon: User,
              onClick: () => {
                // Could open member profile or start chat
                console.log('Navigate to member:', member.profile.displayName)
                onOpenChange(false)
              },
              metadata: member
            })
          }
        })

        // Search messages in current workspace (if available)
        if (workspaces.length > 0) {
          for (const workspace of workspaces.slice(0, 3)) { // Limit to prevent too many requests
            try {
              const messages = await ChatService.searchMessages(workspace.id, query, 5)
              messages.forEach(message => {
                const member = workspaceMembers.find(m => m.userId === message.userId)
                results.push({
                  id: `message-${message.id}`,
                  name: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
                  type: 'message',
                  description: `by ${member?.profile.displayName || 'Unknown'} in #${workspace.name}`,
                  icon: MessageCircle,
                  onClick: () => {
                    setCurrentWorkspace(workspace)
                    setActiveItem('chat')
                    onOpenChange(false)
                  },
                  metadata: { message, workspace, member }
                })
              })
            } catch (error) {
              console.error('Error searching messages in workspace:', workspace.name, error)
            }
          }
        }

        setSearchResults(results.slice(0, 20)) // Limit results
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [inputValue, workspaces, workspaceMembers, setCurrentWorkspace, setActiveItem, onOpenChange])

  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue || !open) return

    const interval = setInterval(() => {
      setShowPlaceholder(false)
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
        setShowPlaceholder(true)
      }, 400)
    }, 3000)

    return () => clearInterval(interval)
  }, [isActive, inputValue, open])

  const handleActivate = () => setIsActive(true)

  const containerVariants = {
    collapsed: {
      height: 68,
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 68,
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  }

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  }

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 shadow-none" showCloseButton={false}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for workspaces, projects, and more
        </DialogDescription>
        
        {/* Search Input */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search workspaces..."
              className="flex-1 border-0 outline-0 text-sm bg-transparent placeholder-gray-400"
              onFocus={handleActivate}
            />
            {inputValue && (
              <span className="text-xs text-muted-foreground bg-gray-200 px-2 py-0.5 rounded">
                {isSearching ? '...' : searchResults.length}
              </span>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="px-4 py-3">
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            ) : isLoadingWorkspaces ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading workspaces...</p>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => {
                const IconComponent = result.icon
                return (
                  <div
                    key={result.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={result.onClick}
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-sm truncate">
                        {result.name}
                      </h3>
                      {result.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded capitalize">
                      {result.type}
                    </span>
                  </div>
                )
              })
            ) : inputValue ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">No workspaces found</p>
                <p className="text-xs text-muted-foreground">Create a workspace to get started</p>
                <p className="text-xs text-muted-foreground mt-2 opacity-75">Debug: {workspaces.length} workspaces loaded</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}