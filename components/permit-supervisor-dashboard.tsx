"use client"

import { useState, useEffect } from "react"
import { Users, FileText, BarChart3, Activity, MessageSquare, Settings, Shield, Key, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { ApplicationsTable } from "./applications-table"
import { UserManagement } from "./user-management"
import { EnhancedReportsAnalytics } from "./enhanced-reports-analytics"
import { ActivityLogs } from "./activity-logs"
import { MessagingSystem } from "./messaging-system"

interface PermitSupervisorDashboardProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (application: PermitApplication) => void
  onViewApplication: (application: PermitApplication) => void
}

export function PermitSupervisorDashboard({
  user,
  onNewApplication,
  onEditApplication,
  onViewApplication,
}: PermitSupervisorDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeView, setActiveView] = useState("overview")
  const [stats, setStats] = useState({
    totalApplications: 0,
    approvedApplications: 0,
    pendingApplications: 0,
    totalUsers: 0,
    activeUsers: 0,
  })

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [apps, allUsers] = await Promise.all([db.getApplications(), db.getUsers()])

        setApplications(apps)

        // Filter out ICT users for permit supervisor
        const filteredUsers = allUsers.filter((u) => u.userType !== "ict")
        setUsers(filteredUsers)

        // Calculate stats
        setStats({
          totalApplications: apps.length,
          approvedApplications: apps.filter((app) => app.status === "approved").length,
          pendingApplications: apps.filter((app) => app.status !== "approved" && app.status !== "rejected").length,
          totalUsers: filteredUsers.length,
          activeUsers: filteredUsers.length, // In a real system, this would be based on recent activity
        })
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      }
    }

    loadDashboardData()
  }, [])

  /* ---------- local reusable UI bits ---------- */
  const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    onClick,
    variant = "default",
  }: {
    title: string
    description: string
    icon: any
    onClick: () => void
    variant?: "default" | "primary" | "secondary"
  }) => {
    const cardClass =
      variant === "primary"
        ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
        : variant === "secondary"
          ? "border-green-200 bg-green-50 hover:bg-green-100"
          : "hover:bg-gray-50"

    return (
      <Card className={`cursor-pointer transition-colors ${cardClass}`} onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-lg ${
                variant === "primary" ? "bg-blue-100" : variant === "secondary" ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <Icon
                className={`h-6 w-6 ${
                  variant === "primary" ? "text-blue-600" : variant === "secondary" ? "text-green-600" : "text-gray-600"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "blue",
  }: {
    title: string
    value: number
    icon: any
    color?: "blue" | "green" | "yellow" | "purple"
  }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      yellow: "bg-yellow-100 text-yellow-600",
      purple: "bg-purple-100 text-purple-600",
    }

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permit Supervisor Dashboard</h1>
          <p className="text-gray-600 mt-1">Administrative oversight and system management</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Shield className="h-4 w-4 mr-1" />
          Supervisor Access
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users" className="font-semibold">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="reports">Advanced Reports</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Applications" value={stats.totalApplications} icon={FileText} color="blue" />
            <StatCard title="Approved Permits" value={stats.approvedApplications} icon={UserCheck} color="green" />
            <StatCard title="Pending Review" value={stats.pendingApplications} icon={Activity} color="yellow" />
            <StatCard title="System Users" value={stats.totalUsers} icon={Users} color="purple" />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionCard
                title="Manage Users"
                description="Edit user credentials and manage access"
                icon={Users}
                onClick={() => setActiveView("users")}
                variant="primary"
              />
              <QuickActionCard
                title="View Applications"
                description="Review and manage permit applications"
                icon={FileText}
                onClick={() => setActiveView("applications")}
                variant="secondary"
              />
              <QuickActionCard
                title="Advanced Analytics"
                description="Generate comprehensive reports and analytics"
                icon={BarChart3}
                onClick={() => setActiveView("reports")}
              />
              <QuickActionCard
                title="Activity Monitoring"
                description="Track system usage and user activity"
                icon={Activity}
                onClick={() => setActiveView("logs")}
              />
              <QuickActionCard
                title="Communications"
                description="Manage system messages and notifications"
                icon={MessageSquare}
                onClick={() => setActiveView("messages")}
              />
              <QuickActionCard
                title="System Settings"
                description="Configure system preferences"
                icon={Settings}
                onClick={() => {
                  /* future settings */
                }}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">System operational - All services running</span>
                  </div>
                  <span className="text-xs text-gray-500">Now</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{stats.totalUsers} active users in system</span>
                  </div>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">{stats.pendingApplications} applications pending review</span>
                  </div>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User management */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">User Credential Management</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Manage user login credentials and access permissions</p>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center">
                  <Key className="h-3 w-3 mr-1" />
                  Credentials Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <UserManagement currentUser={user} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications */}
        <TabsContent value="applications">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Application Management</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Oversee permit applications and printing operations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ApplicationsTable
                user={user}
                onNewApplication={onNewApplication}
                onEditApplication={onEditApplication}
                onViewApplication={onViewApplication}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Reports */}
        <TabsContent value="reports">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Advanced Reports & Analytics</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Comprehensive system performance and data analytics</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <EnhancedReportsAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">System Communications</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Manage system-wide communications and notifications</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <MessagingSystem user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">System Activity Monitoring</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Track user activities and system operations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ActivityLogs user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
