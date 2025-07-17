"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Clock, MousePointer, TrendingUp, TrendingDown } from "lucide-react"
import { getCurrentUser } from "@/lib/ticket-utils"
import { getActivitySummary, getUserActivityData, getCurrentSessionStatus } from "@/lib/activity-storage"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface ActivityStats {
  totalActiveTime: number
  totalInactiveTime: number
  totalInactivityAlerts: number
  todayActiveTime: number
  todayInactiveTime: number
  todayActiveSessions: number
  todayInactiveSessions: number
  lastActivity: string
  isCurrentlyActive: boolean
}

interface ActivitySession {
  userId: string
  startTime: number
  endTime?: number
  type: 'active' | 'inactive' | 'break'
  duration?: number
}

export default function ActivityPage() {
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [activitySessions, setActivitySessions] = useState<ActivitySession[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [currentSessionStatus, setCurrentSessionStatus] = useState<any>(null)

  useEffect(() => {
    const loadActivityData = () => {
      const currentUser = getCurrentUser()
      if (currentUser) {
        const stats = getActivitySummary(currentUser.email)
        const fullData = getUserActivityData(currentUser.email)
        const sessionStatus = getCurrentSessionStatus(currentUser.email)
        setActivityStats(stats)
        setActivitySessions(fullData?.activitySessions || [])
        setCurrentSessionStatus(sessionStatus)
        setLastUpdateTime(new Date().toLocaleTimeString())
      }
      setLoading(false)
    }

    loadActivityData()
    
    // Refresh data every 5 seconds for real-time updates
    const interval = setInterval(loadActivityData, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Real-time current session duration update
  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(0)
  
  useEffect(() => {
    if (currentSessionStatus?.startTime && currentSessionStatus?.type !== 'break') {
      const updateCurrentSession = () => {
        const now = Date.now()
        const duration = now - currentSessionStatus.startTime
        setCurrentSessionDuration(duration)
      }
      
      updateCurrentSession() // Update immediately
      const interval = setInterval(updateCurrentSession, 1000) // Update every second
      
      return () => clearInterval(interval)
    } else {
      setCurrentSessionDuration(0)
    }
  }, [currentSessionStatus])

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActivityPercentage = () => {
    if (!activityStats) return 0
    
    const totalTime = activityStats.totalActiveTime + activityStats.totalInactiveTime
    return totalTime > 0 ? (activityStats.totalActiveTime / totalTime) * 100 : 0
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="flex-1 flex flex-col gap-6 p-6 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Dashboard</h1>
                <p className="text-muted-foreground">
                  Track your activity and inactivity patterns
                </p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 w-4 bg-muted rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!activityStats) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="flex-1 flex flex-col gap-6 p-6 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Dashboard</h1>
                <p className="text-muted-foreground">
                  Track your activity and inactivity patterns
                </p>
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity data available</p>
                  <p className="text-sm">Start using the application to see your activity statistics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const activityPercentage = getActivityPercentage()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 flex flex-col gap-6 p-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activity Dashboard</h1>
              <p className="text-muted-foreground">
                Track your activity and inactivity patterns
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                currentSessionStatus?.type === 'break' ? "secondary" :
                currentSessionStatus?.type === 'active' ? "default" : "secondary"
              } className="text-sm">
                {currentSessionStatus?.type === 'active' ? 'Active Session' :
                 currentSessionStatus?.type === 'inactive' ? 'Inactive Session' :
                 currentSessionStatus?.type === 'break' ? 'Break Session' :
                 'No Session'}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Updated: {lastUpdateTime}
              </Badge>
            </div>
          </div>

      {/* Activity Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(activityStats.totalActiveTime)}</div>
            <p className="text-xs text-muted-foreground">
              {activityPercentage.toFixed(1)}% of total time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inactive Time</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(activityStats.totalInactiveTime)}</div>
            <p className="text-xs text-muted-foreground">
              {(100 - activityPercentage).toFixed(1)}% of total time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Session</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentSessionStatus?.type === 'break' ? 'On Break' : formatDuration(currentSessionDuration)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSessionStatus?.type === 'active' ? 'Active Session Ongoing' :
               currentSessionStatus?.type === 'inactive' ? 'Inactive Session' :
               currentSessionStatus?.type === 'break' ? 'Break Session' :
               'No Active Session'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivity Alerts</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.totalInactivityAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {activityStats.todayInactiveSessions} inactive sessions today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>
            Your productivity score based on active vs inactive time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Productivity Score</span>
              <span className="font-medium">
                {activityStats.totalActiveTime + activityStats.totalInactiveTime > 0 
                  ? Math.round((activityStats.totalActiveTime / (activityStats.totalActiveTime + activityStats.totalInactiveTime)) * 100)
                  : 0}%
              </span>
            </div>
            <Progress 
              value={activityStats.totalActiveTime + activityStats.totalInactiveTime > 0 
                ? (activityStats.totalActiveTime / (activityStats.totalActiveTime + activityStats.totalInactiveTime)) * 100
                : 0
              } 
              className="w-full" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Active: {formatDuration(activityStats.totalActiveTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Inactive: {formatDuration(activityStats.totalInactiveTime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Sessions</CardTitle>
          <CardDescription>
            Your latest active and inactive sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activitySessions.slice(-10).reverse().map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    session.type === 'active' ? 'bg-green-500' : 
                    session.type === 'inactive' ? 'bg-orange-500' : 
                    'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium">
                      {session.type === 'active' ? 'Active Session' : 
                       session.type === 'inactive' ? 'Inactive Session' : 
                       'Break Session'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started: {formatTime(session.startTime)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {session.type === 'break' ? 'On Break' :
                     session.duration ? formatDuration(session.duration) : 'Ongoing'}
                  </p>
                  {session.endTime && session.type !== 'break' && (
                    <p className="text-xs text-muted-foreground">
                      Ended: {formatTime(session.endTime)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 