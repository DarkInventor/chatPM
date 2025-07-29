"use client"

import * as React from "react"
import { 
  Send, 
  Sparkles, 
  Bot, 
  User,
  Lightbulb,
  MessageCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Sample chat messages
const messages = [
  {
    id: 1,
    type: "ai",
    content: "Hello! I'm your AI assistant. How can I help you today?",
    timestamp: "2:30 PM"
  },
  {
    id: 2,
    type: "user",
    content: "Can you help me organize my tasks for this week?",
    timestamp: "2:31 PM"
  },
  {
    id: 3,
    type: "ai",
    content: "Of course! I can see you have several projects in progress. Let me analyze your current tasks and suggest a priority order based on deadlines and importance.",
    timestamp: "2:31 PM"
  }
]

const suggestions = [
  "Help me organize my tasks for this week",
  "Summarize the Mobile App Launch project status",
  "Create a meeting agenda for tomorrow's team sync",
  "Find all files related to the website redesign"
]

export function AskAI() {
  const [message, setMessage] = React.useState("")
  const [chatMessages, setChatMessages] = React.useState(messages)

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        type: "user" as const,
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages([...chatMessages, newMessage])
      setMessage("")
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: chatMessages.length + 2,
          type: "ai" as const,
          content: "I'm processing your request. This is a simulated response to demonstrate the chat interface.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setChatMessages(prev => [...prev, aiResponse])
      }, 1000)
    }
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-gray-500 mt-1">Your intelligent project management companion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-3 max-w-2xl ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={msg.type === 'ai' ? 'bg-indigo-500 text-white' : 'bg-gray-500 text-white'}>
                        {msg.type === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                      <Card className={`inline-block ${msg.type === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-50'}`}>
                        <CardContent className="p-4">
                          <p className="text-sm">{msg.content}</p>
                        </CardContent>
                      </Card>
                      <p className={`text-xs text-gray-500 mt-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-4">
                <Input
                  className="flex-1"
                  placeholder="Ask me anything about your projects..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions Sidebar */}
        <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Suggestions</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => setMessage(suggestion)}
                  >
                    <Lightbulb className="w-4 h-4 mr-2 text-indigo-500" />
                    <span className="text-sm">{suggestion}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What I can help with</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Project Management</p>
                    <p className="text-xs text-gray-500">Track progress, set priorities, manage deadlines</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Team Collaboration</p>
                    <p className="text-xs text-gray-500">Coordinate tasks, schedule meetings, share updates</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data Analysis</p>
                    <p className="text-xs text-gray-500">Generate reports, analyze trends, provide insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 