"use client"

import * as React from "react"
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Copy,
  Edit,
  Trash2,
  Star,
  Users,
  Calendar,
  Folder,
  MoreVertical
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Sample templates
const templates = [
  {
    id: 1,
    name: "Web Development Project",
    description: "Complete template for web development projects including design, development, and deployment phases",
    category: "Development",
    icon: FileText,
    color: "bg-blue-500",
    usage: 24,
    isStarred: true,
    lastUsed: "2 days ago",
    tasks: 15,
    members: 8
  },
  {
    id: 2,
    name: "Marketing Campaign",
    description: "Template for launching marketing campaigns with social media, email, and content marketing",
    category: "Marketing",
    icon: FileText,
    color: "bg-green-500",
    usage: 18,
    isStarred: false,
    lastUsed: "1 week ago",
    tasks: 12,
    members: 5
  },
  {
    id: 3,
    name: "Product Launch",
    description: "Comprehensive template for product launches including planning, execution, and post-launch",
    category: "Product",
    icon: FileText,
    color: "bg-purple-500",
    usage: 31,
    isStarred: true,
    lastUsed: "3 days ago",
    tasks: 20,
    members: 12
  },
  {
    id: 4,
    name: "Client Onboarding",
    description: "Streamlined process for onboarding new clients and setting up their projects",
    category: "Client",
    icon: FileText,
    color: "bg-orange-500",
    usage: 15,
    isStarred: false,
    lastUsed: "5 days ago",
    tasks: 8,
    members: 4
  }
]

const categories = [
  { label: "All", value: "all", count: 24 },
  { label: "Development", value: "development", count: 8 },
  { label: "Marketing", value: "marketing", count: 6 },
  { label: "Product", value: "product", count: 5 },
  { label: "Client", value: "client", count: 3 },
  { label: "Design", value: "design", count: 2 }
]

export function TemplatesPage() {
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <div className="flex-1 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-500 mt-1">Manage and use project templates</p>
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-8 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={activeCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.value)}
              >
                {category.label}
                <Badge variant="secondary" className="ml-1">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center`}>
                        <template.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Star className={`w-4 h-4 ${template.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {template.members}
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {template.tasks} tasks
                      </div>
                    </div>
                    <div className="text-xs">
                      Used {template.usage} times
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Last used: {template.lastUsed}
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-1" />
                        Use
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed border-2 border-gray-300 hover:border-indigo-500 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Import Template</h4>
                  <p className="text-sm text-gray-500">Import templates from other projects</p>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-gray-300 hover:border-indigo-500 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Schedule Template</h4>
                  <p className="text-sm text-gray-500">Set up recurring project schedules</p>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-gray-300 hover:border-indigo-500 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Team Templates</h4>
                  <p className="text-sm text-gray-500">Share templates with your team</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 