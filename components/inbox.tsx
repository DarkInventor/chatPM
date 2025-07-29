"use client"

import * as React from "react"
import { 
  Inbox, 
  Search, 
  Filter,
  MoreVertical,
  Reply,
  Forward,
  Trash2,
  Star,
  Clock,
  User,
  MessageCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Sample messages
const messages = [
  {
    id: 1,
    sender: "Jane Doe",
    subject: "Design Review Feedback",
    preview: "Hi Sam, I've reviewed the latest design mockups and have some feedback to share...",
    time: "2 min ago",
    isUnread: true,
    isStarred: false,
    avatar: "/avatars/jane.jpg",
    initials: "JD"
  },
  {
    id: 2,
    sender: "John Smith",
    subject: "Mobile App Launch Update",
    preview: "Great news! The beta testing phase is complete and we're ready to move forward...",
    time: "1 hour ago",
    isUnread: true,
    isStarred: true,
    avatar: "/avatars/john.jpg",
    initials: "JS"
  },
  {
    id: 3,
    sender: "Mike Johnson",
    subject: "Weekly Team Meeting",
    preview: "Reminder: We have our weekly team sync tomorrow at 10 AM. Agenda attached...",
    time: "3 hours ago",
    isUnread: false,
    isStarred: false,
    avatar: "/avatars/mike.jpg",
    initials: "MJ"
  },
  {
    id: 4,
    sender: "Sarah Wilson",
    subject: "Website Redesign Progress",
    preview: "The homepage redesign is 80% complete. Here's the current status and next steps...",
    time: "1 day ago",
    isUnread: false,
    isStarred: false,
    avatar: "/avatars/sarah.jpg",
    initials: "SW"
  }
]

const filters = [
  { label: "All", value: "all", count: 24 },
  { label: "Unread", value: "unread", count: 8 },
  { label: "Starred", value: "starred", count: 3 },
  { label: "Important", value: "important", count: 5 }
]

export function InboxPage() {
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [selectedMessage, setSelectedMessage] = React.useState<typeof messages[0] | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <div className="flex-1 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
              <p className="text-gray-500 mt-1">Manage your messages and communications</p>
            </div>
          </div>
          <Badge variant="destructive">10 unread</Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-8 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search messages..."
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

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Message List */}
        <div className="w-96 border-r border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                } ${message.isUnread ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={message.avatar} />
                    <AvatarFallback>{message.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-medium truncate ${message.isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {message.sender}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {message.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                        <span className="text-xs text-gray-500">{message.time}</span>
                      </div>
                    </div>
                    <h4 className={`text-sm font-medium truncate ${message.isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {message.subject}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {message.preview}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="flex-1 flex flex-col">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedMessage.avatar} />
                      <AvatarFallback>{selectedMessage.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedMessage.sender}</h2>
                      <p className="text-sm text-gray-500">{selectedMessage.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Reply className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{selectedMessage.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Star className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {selectedMessage.preview}
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reply Area */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-4">
                  <Input
                    className="flex-1"
                    placeholder="Type your reply..."
                  />
                  <Button>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a message</h3>
                <p className="text-gray-500">Choose a message from the list to view its content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 