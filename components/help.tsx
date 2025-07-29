"use client"

import * as React from "react"
import { 
  HelpCircle, 
  Search, 
  BookOpen,
  MessageCircle,
  Video,
  FileText,
  ExternalLink,
  ChevronRight,
  Star,
  Users
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Sample help articles
const helpArticles = [
  {
    id: 1,
    title: "Getting Started with ChatPM",
    description: "Learn the basics of using ChatPM for project management and team collaboration",
    category: "Getting Started",
    icon: BookOpen,
    color: "bg-blue-500",
    readTime: "5 min read",
    isPopular: true
  },
  {
    id: 2,
    title: "Creating and Managing Projects",
    description: "Step-by-step guide to creating projects, adding team members, and setting up workflows",
    category: "Projects",
    icon: FileText,
    color: "bg-green-500",
    readTime: "8 min read",
    isPopular: false
  },
  {
    id: 3,
    title: "Using AI Assistant Effectively",
    description: "Discover how to leverage AI features to boost your productivity and project management",
    category: "AI Features",
    icon: MessageCircle,
    color: "bg-purple-500",
    readTime: "6 min read",
    isPopular: true
  },
  {
    id: 4,
    title: "Team Collaboration Best Practices",
    description: "Tips and tricks for effective team collaboration and communication",
    category: "Collaboration",
    icon: Users,
    color: "bg-orange-500",
    readTime: "10 min read",
    isPopular: false
  }
]

const categories = [
  { label: "All", value: "all", count: 24 },
  { label: "Getting Started", value: "getting-started", count: 6 },
  { label: "Projects", value: "projects", count: 8 },
  { label: "AI Features", value: "ai-features", count: 4 },
  { label: "Collaboration", value: "collaboration", count: 6 }
]

const quickActions = [
  {
    title: "Contact Support",
    description: "Get help from our support team",
    icon: MessageCircle,
    color: "bg-blue-500",
    action: "contact"
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    icon: Video,
    color: "bg-green-500",
    action: "videos"
  },
  {
    title: "Documentation",
    description: "Browse complete documentation",
    icon: FileText,
    color: "bg-purple-500",
    action: "docs"
  },
  {
    title: "Community Forum",
    description: "Connect with other users",
    icon: Users,
    color: "bg-orange-500",
    action: "community"
  }
]

export function HelpPage() {
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <div className="flex-1 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              <p className="text-gray-500 mt-1">Find answers and get the help you need</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              className="pl-10 pr-4 py-3 text-lg"
              placeholder="Search for help articles, tutorials, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 py-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Categories */}
          <div className="mb-8">
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

          {/* Popular Articles */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {helpArticles.filter(article => article.isPopular).map((article) => (
                <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg ${article.color} flex items-center justify-center`}>
                        <article.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-500">{article.readTime}</span>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{article.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{article.description}</p>
                        <div className="flex items-center justify-between">
                          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                            Read Article
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Articles */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Help Articles</h2>
            <div className="space-y-4">
              {helpArticles.map((article) => (
                <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg ${article.color} flex items-center justify-center`}>
                        <article.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900">{article.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {article.category}
                            </Badge>
                            <span className="text-xs text-gray-500">{article.readTime}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{article.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
              <p className="text-gray-600 mb-4">Our support team is here to help you get the most out of ChatPM</p>
              <div className="flex items-center justify-center space-x-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 