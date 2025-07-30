"use client"

import * as React from "react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { useSidebar } from "@/components/ui/sidebar"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function Chat() {
  const { state: sidebarState } = useSidebar()
  const [messages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      role: "assistant",
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    }
  ])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Messages Area */}
      <div className="px-6 py-4 space-y-4 mb-40">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-transparent text-blue-600 text-lg">PM</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">Start a conversation</h3>
                <p className="text-sm text-muted-foreground">Ask me anything or start with a greeting</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                {message.role === 'user' ? (
                  <AvatarFallback className="bg-gray-100 text-gray-600">U</AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-blue-100 text-blue-700">PM</AvatarFallback>
                )}
              </Avatar>
              <div className={`min-w-3xl ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Chat Input */}
      <div className={`fixed bottom-6 z-50 transition-all duration-300 ${
        sidebarState === "collapsed" 
          ? "left-[calc(14%+1.5rem)]" 
          : "left-1/2 transform -translate-x-1/2"
      } min-w-md px-4 lg:min-w-3xl md:min-w-3xl md:px-0 lg:px-0 mx-auto`}>
        <AIChatInput />
      </div>
    </div>
  )
}