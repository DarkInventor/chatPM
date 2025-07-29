/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Users,
  MapPin,
  MoreVertical
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Sample events
const events = [
  {
    id: 1,
    title: "Team Standup",
    time: "9:00 AM - 9:30 AM",
    date: "2024-01-15",
    type: "meeting",
    attendees: ["Sam Smith", "Jane Doe", "John Smith"],
    location: "Conference Room A",
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Design Review",
    time: "2:00 PM - 3:00 PM",
    date: "2024-01-15",
    type: "review",
    attendees: ["Sam Smith", "Jane Doe"],
    location: "Design Studio",
    color: "bg-green-500"
  },
  {
    id: 3,
    title: "Client Meeting",
    time: "10:00 AM - 11:00 AM",
    date: "2024-01-16",
    type: "client",
    attendees: ["Sam Smith", "Mike Johnson"],
    location: "Zoom",
    color: "bg-purple-500"
  }
]

const today = new Date()
const currentMonth = today.getMonth()
const currentYear = today.getFullYear()

// Generate calendar days
const getDaysInMonth = (month: number, year: number) => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay()
  
  const days = []
  
  // Add empty days for padding
  for (let i = 0; i < startingDay; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }
  
  return days
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const days = getDaysInMonth(currentDate.getMonth(), currentDate.getFullYear())
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  return (
    <div className="flex-1 bg-white flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-500 mt-1">Manage your schedule and events</p>
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="px-8 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm">
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`min-h-32 p-2 border border-gray-200 ${
                  day ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-2 ${
                      isToday(day) ? 'bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-1">
                      {getEventsForDate(day).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded cursor-pointer ${event.color} text-white truncate`}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Events Sidebar */}
      <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-3 h-3 rounded-full ${event.color} mt-1`}></div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{event.title}</h4>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {event.attendees.length} attendees
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 