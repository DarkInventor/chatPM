/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Hash, Clock, Users, Folder, FileText } from "lucide-react"

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

// Sample search results data
const sampleWorkspaces = [
  { 
    id: 1, 
    name: "Personal Life Management", 
    type: "workspace", 
    description: "Personal tasks and goals",
    icon: Hash,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  { 
    id: 2, 
    name: "Professional Development", 
    type: "workspace", 
    description: "Career growth and skills",
    icon: Users,
    color: "bg-gradient-to-br from-green-500 to-green-600",
    textColor: "text-green-600",
    bgColor: "bg-green-50"
  },
  { 
    id: 3, 
    name: "Creative Projects", 
    type: "workspace", 
    description: "Art, writing, and creative work",
    icon: Folder,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  { 
    id: 4, 
    name: "Home Management", 
    type: "workspace", 
    description: "Household tasks and maintenance",
    icon: FileText,
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  { 
    id: 5, 
    name: "Travel & Adventure", 
    type: "workspace", 
    description: "Trip planning and experiences",
    icon: Clock,
    color: "bg-gradient-to-br from-teal-500 to-teal-600",
    textColor: "text-teal-600",
    bgColor: "bg-teal-50"
  },
]

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [filteredResults, setFilteredResults] = useState(sampleWorkspaces)
  const inputRef = useRef<HTMLInputElement>(null)

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
      setFilteredResults(sampleWorkspaces)
    }
  }, [open])

  // Filter results based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredResults(sampleWorkspaces)
    } else {
      const filtered = sampleWorkspaces.filter(item =>
        item.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        item.description.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredResults(filtered)
    }
  }, [inputValue])

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
                {filteredResults.length}
              </span>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="px-4 py-3">
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    console.log(`Selected: ${result.name}`)
                    onOpenChange(false)
                  }}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-sm font-medium">#</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {result.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                    {result.type}
                  </span>
                </div>
              ))
            ) : inputValue ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">Search workspaces</p>
                <p className="text-xs text-muted-foreground">Find workspaces, projects, and tasks</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}