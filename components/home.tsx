"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  Plus, 
  Flag, 
  Search, 
  Sparkles, 
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  Brain,
  Folder
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { AIChatInput } from "@/components/ui/ai-chat-input"
import { useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { DashboardDataService, DashboardData } from "@/lib/dashboard-data-service"
import { AIDashboardService, DashboardInsights } from "@/lib/ai-dashboard-service"

export function Home() {
  const { state: sidebarState } = useSidebar()
  const { user, userProfile } = useAuth()
  const { currentOrganization, currentWorkspace } = useWorkspace()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [insights, setInsights] = useState<DashboardInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [productivityInsights, setProductivityInsights] = useState<any>(null)
  const [realtimeActivity, setRealtimeActivity] = useState<any[]>([])
  const [isActivityLoading, setIsActivityLoading] = useState(false)

  // Load comprehensive dashboard data and AI insights
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || !currentOrganization) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('Loading dashboard data for user:', user.uid, 'org:', currentOrganization.id)

        // Load real Firebase data and AI insights in parallel
        const [realData, aiInsights, userInsights] = await Promise.all([
          DashboardDataService.getComprehensiveDashboardData(
            user.uid,
            currentOrganization.id,
            currentWorkspace?.id
          ),
          AIDashboardService.generateDashboardInsights(
            user.uid,
            currentOrganization.id,
            currentWorkspace?.id,
            userProfile?.displayName || user.displayName || 'User'
          ),
          DashboardDataService.getUserProductivityInsights(
            user.uid,
            currentOrganization.id
          )
        ])

        console.log('Dashboard data loaded:', {
          projects: realData.projects.length,
          tasks: realData.tasks.length,
          hasInsights: !!aiInsights,
          hasProductivity: !!userInsights
        })

        setDashboardData(realData)
        setInsights(aiInsights)
        setProductivityInsights(userInsights)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user, currentOrganization, currentWorkspace, userProfile])

  // Real-time activity feed
  useEffect(() => {
    if (!user || !currentOrganization) return

    let unsubscribe: (() => void) | undefined

    const setupRealtimeActivity = async () => {
      try {
        setIsActivityLoading(true)
        
        // Subscribe to real-time activity updates
        unsubscribe = await DashboardDataService.subscribeToRealtimeActivity(
          user.uid,
          currentOrganization.id,
          currentWorkspace?.id,
          (activities) => {
            const formattedActivity = activities.slice(0, 15).map(activity => ({
              id: activity.id,
              user: activity.userName,
              action: activity.action,
              project: activity.projectName,
              task: activity.taskTitle,
              time: DashboardDataService.formatTimeAgo(activity.timestamp),
              avatar: '',
              initials: activity.userInitials
            }))
            setRealtimeActivity(formattedActivity)
            setIsActivityLoading(false)
          }
        )
      } catch (error) {
        console.error('Error setting up real-time activity:', error)
        setIsActivityLoading(false)
      }
    }

    setupRealtimeActivity()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user, currentOrganization, currentWorkspace])

  // Prepare real data for display
  const displayProjects = dashboardData?.projects.slice(0, 4).map(project => ({
    id: project.id,
    name: project.name,
    description: `${project.description || 'No description'} • Health: ${dashboardData.healthScores[project.id] || 50}/100`,
    color: (dashboardData.healthScores[project.id] || 50) > 70 ? "bg-green-500" : 
           (dashboardData.healthScores[project.id] || 50) > 40 ? "bg-yellow-500" : "bg-red-500",
    progress: project.progress || 0,
    members: project.members?.slice(0, 3).map(memberId => ({
      name: 'Team Member', // You'd get this from user profiles
      avatar: '',
      initials: 'TM'
    })) || []
  })) || []

  const displayDeadlines = dashboardData?.upcomingDeadlines.slice(0, 5).map(task => {
    const project = dashboardData.projects.find(p => p.id === task.projectId)
    return {
      id: task.id,
      title: task.title,
      project: project?.name || 'Unknown Project',
      due: DashboardDataService.formatDueDate(task.dueDate!.toDate()),
      priority: task.priority || 'medium',
      color: DashboardDataService.getPriorityColor(task.priority || 'medium')
    }
  }) || []

  // Use real-time activity if available, otherwise fall back to dashboard data
  const displayActivity = realtimeActivity.length > 0 
    ? realtimeActivity 
    : dashboardData?.teamActivity.slice(0, 10).map(activity => ({
        id: activity.id,
        user: activity.userName,
        action: activity.action,
        project: activity.projectName,
        task: activity.taskTitle,
        time: DashboardDataService.formatTimeAgo(activity.timestamp),
        avatar: '',
        initials: activity.userInitials
      })) || []

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 py-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Brain className="h-6 w-6 animate-pulse text-purple-500" />
                  Loading insights...
                </span>
              ) : (
                <>
                  {insights?.greeting ? (
                    (() => {
                      const displayName = userProfile?.displayName || 'User';
                      const greeting = insights.greeting;
                      // Use a regex to match the name (case-insensitive, word boundary)
                      const regex = new RegExp(`\\b${displayName}\\b`, 'i');
                      const parts = greeting.split(regex);
                      const match = greeting.match(regex);
                      if (parts.length === 2 && match) {
                        return (
                          <>
                            {parts[0]}
                            <span
                              className="px-1 rounded bg-blue-200 text-gray-900 font-semibold"
                              style={{ backgroundColor: '#bfdbfe', boxShadow: '0 0 0 2px #60a5fa' }}
                            >
                              {match[0]}
                            </span>
                            {parts[1]}
                          </>
                        );
                      }
                      // fallback: just show greeting
                      return greeting;
                    })()
                  ) : (
                    <>
                      Welcome back, {' '}
                      <span
                        className="px-1 rounded bg-blue-200 text-blue-700 font-semibold"
                        style={{ backgroundColor: '#bfdbfe', boxShadow: '0 0 0 2px #60a5fa' }}
                      >
                        {userProfile?.displayName || 'User'}
                      </span>
                      !
                    </>
                  )}
                </>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dashboardData ? (
                <>
                  {dashboardData.projects.length > 0 ? (
                    `${dashboardData.projects.length} project${dashboardData.projects.length > 1 ? 's' : ''}, 
                     ${dashboardData.tasks.length} task${dashboardData.tasks.length > 1 ? 's' : ''}, 
                     ${dashboardData.overdueTasks.length} overdue`
                  ) : (
                    "Ready to start your first project?"
                  )}
                </>
              ) : (
                "Here's your AI-powered workspace overview."
              )}
            </p>
          </div>
          <Button className="flex items-center gap-2 shadow-none">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* AI-Powered Insights & Metrics */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                      <div className="h-8 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dashboardData ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-none border border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground">Projects</CardTitle>
                  <div className="text-2xl font-bold text-foreground">{dashboardData.projectStats.total}</div>
                </div>
                <div className="flex items-center justify-center rounded-full bg-blue-100 p-2">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mt-2">
                  {dashboardData.projectStats.active} active, {dashboardData.projectStats.atRisk} at risk
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground">Tasks</CardTitle>
                  <div className="text-2xl font-bold text-foreground">{dashboardData.taskStats.total}</div>
                </div>
                <div className="flex items-center justify-center rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mt-2">
                  {dashboardData.taskStats.completionRate}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
                  <div className="text-2xl font-bold text-destructive">{dashboardData.overdueTasks.length}</div>
                </div>
                <div className="flex items-center justify-center rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mt-2">
                  Needs immediate attention
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-purple-700">This Week</CardTitle>
                  <div className="text-2xl font-bold text-purple-900">{productivityInsights?.completedThisWeek || 0}</div>
                </div>
                <div className="flex items-center justify-center rounded-full bg-purple-100 p-2">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mt-2">
                  Tasks completed
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* AI Suggestions */}
        {productivityInsights?.suggestions && productivityInsights.suggestions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {/* <Brain className="h-5 w-5 text-purple-500" /> */}
              AI Suggestions
            </h2>
            <Card className="shadow-none bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {productivityInsights.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* My Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Projects</h2>
            <Button variant="ghost" size="sm" className="text-sm shadow-none">
              View all
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              [...Array(2)].map((_, i) => (
                <Card key={i} className="shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-3 h-3 rounded-full bg-muted animate-pulse mr-3"></div>
                      <div className="h-5 w-32 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="h-4 w-full bg-muted animate-pulse rounded mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="w-6 h-6 rounded-full bg-muted animate-pulse"></div>
                        ))}
                      </div>
                      <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : displayProjects.length > 0 ? displayProjects.map((project) => (
              <Card key={project.id} className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full ${project.color} mr-3`}></span>
                      <h3 className="font-semibold">{project.name}</h3>
                    </div>
                    {dashboardData?.healthScores[project.id] && (
                      <div className="flex items-center gap-1">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          (dashboardData.healthScores[project.id] || 0) > 70 
                            ? 'bg-green-100 text-green-700' 
                            : (dashboardData.healthScores[project.id] || 0) > 40 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {dashboardData.healthScores[project.id]}/100
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                  
                  {/* AI Health Insights */}
                  {/* @ts-ignore */}
                  {insights?.projectUpdates.find(p => p.projectId === project.id)?.risks && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-orange-700">
                          {/* @ts-ignore */}
                          {insights.projectUpdates.find(p => p.projectId === project.id)?.risks?.[0]}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members.map((member, index) => (
                        <Avatar key={index} className="h-6 w-6 border-2 border-background shadow-none">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {project.progress}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="shadow-none col-span-full">
                <CardContent className="p-6 text-center">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground">Create your first project to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Smart Task Prioritization */}
        {/* @ts-ignore */}
        {insights?.priorityInsights && insights.priorityInsights.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Claude's Priority Recommendations
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {/* @ts-ignore */}
              {insights.priorityInsights.slice(0, 3).map((insight: any, index: number) => (
                <Card key={index} className="shadow-none border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{insight.project}</p>
                        <p className="text-sm text-gray-700">{insight.reason}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        insight.urgency === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : insight.urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {insight.urgency}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {displayDeadlines.length > 0 ? displayDeadlines.map((deadline) => (
              <Card key={deadline.id} className="shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center">
                    <Flag className={`h-5 w-5 mr-3 ${deadline.color}`} />
                    <div className="flex-1">
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-sm text-muted-foreground">{deadline.project}</p>
                    </div>
                    <span className={`text-sm font-semibold ${deadline.priority === 'high' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {deadline.due}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="shadow-none">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No upcoming deadlines</h3>
                  <p className="text-sm text-muted-foreground">You're all caught up!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Recent Activity
              {realtimeActivity.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                </span>
              )}
            </h2>
            {isActivityLoading && (
              <div className="text-sm text-muted-foreground">Updating...</div>
            )}
          </div>
          <div className="space-y-4">
            {displayActivity.length > 0 ? displayActivity.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3 mt-1 shadow-none">
                  <AvatarImage src={activity.avatar} />
                  <AvatarFallback className="text-xs">{activity.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    {activity.project && (
                      <Button variant="link" className="p-0 h-auto text-sm font-semibold text-primary shadow-none">
                        {activity.project}
                      </Button>
                    )}
                    {activity.task && (
                      <span className="font-semibold text-foreground">&quot;{activity.task}&quot;</span>
                    )}
                    .
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )) : (
              <Card className="shadow-none">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No recent activity</h3>
                  <p className="text-sm text-muted-foreground">Team activity will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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