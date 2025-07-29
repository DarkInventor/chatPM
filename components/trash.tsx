"use client"

import * as React from "react"
import { 
  Trash2, 
  Search, 
  Filter,
  RotateCcw,
  Trash,
  FileText,
  MessageCircle,
  Users,
  Calendar,
  MoreVertical
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Sample deleted items
const deletedItems = [
  {
    id: 1,
    name: "Old Project Documentation",
    type: "document",
    icon: FileText,
    color: "bg-blue-500",
    deletedBy: "Sam Smith",
    deletedAt: "2 days ago",
    size: "2.4 MB",
    originalLocation: "Projects > Mobile App > Docs"
  },
  {
    id: 2,
    name: "Marketing Team Chat",
    type: "conversation",
    icon: MessageCircle,
    color: "bg-green-500",
    deletedBy: "Jane Doe",
    deletedAt: "1 week ago",
    participants: 8,
    originalLocation: "Teams > Marketing"
  },
  {
    id: 3,
    name: "Q3 Planning Meeting",
    type: "event",
    icon: Calendar,
    color: "bg-purple-500",
    deletedBy: "John Smith",
    deletedAt: "3 days ago",
    attendees: 12,
    originalLocation: "Calendar > Meetings"
  },
  {
    id: 4,
    name: "Design Team Workspace",
    type: "workspace",
    icon: Users,
    color: "bg-orange-500",
    deletedBy: "Mike Johnson",
    deletedAt: "5 days ago",
    members: 6,
    originalLocation: "Workspaces > Design"
  }
]

const filters = [
  { label: "All", value: "all", count: 24 },
  { label: "Documents", value: "documents", count: 8 },
  { label: "Conversations", value: "conversations", count: 6 },
  { label: "Events", value: "events", count: 4 },
  { label: "Workspaces", value: "workspaces", count: 3 }
]

export function TrashPage() {
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedItems, setSelectedItems] = React.useState<number[]>([])

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const restoreSelectedItems = () => {
    // Logic to restore items
    setSelectedItems([])
  }

  const permanentlyDeleteSelected = () => {
    // Logic to permanently delete items
    setSelectedItems([])
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
              <p className="text-gray-500 mt-1">Manage deleted items and recover if needed</p>
            </div>
          </div>
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={restoreSelectedItems}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore ({selectedItems.length})
              </Button>
              <Button variant="destructive" onClick={permanentlyDeleteSelected}>
                <Trash className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-8 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search deleted items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
                <Badge variant="secondary" className="ml-1">
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Deleted Items */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {deletedItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Deleted by {item.deletedBy}</span>
                        <span>•</span>
                        <span>{item.deletedAt}</span>
                        <span>•</span>
                        <span>{item.originalLocation}</span>
                        {item.size && (
                          <>
                            <span>•</span>
                            <span>{item.size}</span>
                          </>
                        )}
                        {item.participants && (
                          <>
                            <span>•</span>
                            <span>{item.participants} participants</span>
                          </>
                        )}
                        {item.attendees && (
                          <>
                            <span>•</span>
                            <span>{item.attendees} attendees</span>
                          </>
                        )}
                        {item.members && (
                          <>
                            <span>•</span>
                            <span>{item.members} members</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {deletedItems.length === 0 && (
            <div className="text-center py-12">
              <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted items</h3>
              <p className="text-gray-500">Items you delete will appear here for 30 days</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 