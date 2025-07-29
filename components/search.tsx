"use client"

import * as React from "react"
import { 
  Search, 
  FileText, 
  MessageCircle, 
  Users, 
  Calendar,
  Filter,
  Clock
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Sample search results
const searchResults = [
  {
    id: 1,
    type: "project",
    title: "Mobile App Launch",
    description: "Launch new mobile app for iOS and Android platforms",
    icon: FileText,
    color: "bg-blue-500",
    members: ["Sam Smith", "Jane Doe", "John Smith"],
    lastUpdated: "2 hours ago"
  },
  {
    id: 2,
    type: "message",
    title: "Design Review Discussion",
    description: "Latest feedback on the new UI components",
    icon: MessageCircle,
    color: "bg-green-500",
    participants: ["Sam Smith", "Jane Doe"],
    lastUpdated: "1 hour ago"
  },
  {
    id: 3,
    type: "team",
    title: "Development Team",
    description: "Core development team for the mobile app project",
    icon: Users,
    color: "bg-purple-500",
    members: ["Sam Smith", "Jane Doe", "John Smith", "Mike Johnson"],
    lastUpdated: "3 hours ago"
  },
  {
    id: 4,
    type: "event",
    title: "Sprint Planning Meeting",
    description: "Weekly sprint planning and task assignment",
    icon: Calendar,
    color: "bg-orange-500",
    date: "Tomorrow at 10:00 AM",
    participants: ["Sam Smith", "Jane Doe", "John Smith"]
  }
]

const filters = [
  { label: "All", value: "all", count: 24 },
  { label: "Projects", value: "projects", count: 8 },
  { label: "Messages", value: "messages", count: 12 },
  { label: "Teams", value: "teams", count: 3 },
  { label: "Events", value: "events", count: 1 }
]

export function SearchPage() {
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <div className="flex-1 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search</h1>
            <p className="text-gray-500 mt-1">Find projects, messages, and team members</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-8 border-b border-gray-200">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            className="w-full pl-10 pr-4 py-3 text-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search for projects, messages, teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
                className="flex items-center space-x-2"
              >
                <span>{filter.label}</span>
                <Badge variant="secondary" className="ml-1">
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Search Results ({searchResults.length})
            </h2>
            <p className="text-gray-500">
              Showing results for &quot;{searchQuery || 'all items'}&quot;
            </p>
          </div>

          <div className="space-y-4">
            {searchResults.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-lg ${result.color} flex items-center justify-center`}>
                      <result.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                        <Badge variant="outline" className="capitalize">
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{result.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {result.members && (
                            <div className="flex -space-x-2">
                              {result.members.slice(0, 3).map((member, index) => (
                                <Avatar key={index} className="w-6 h-6 border border-white">
                                  <AvatarFallback className="text-xs">
                                    {member.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {result.members.length > 3 && (
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 border border-white">
                                  +{result.members.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                          {result.participants && (
                            <div className="flex -space-x-2">
                              {result.participants.slice(0, 3).map((participant, index) => (
                                <Avatar key={index} className="w-6 h-6 border border-white">
                                  <AvatarFallback className="text-xs">
                                    {participant.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {result.lastUpdated || result.date}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 