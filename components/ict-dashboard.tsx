"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Users,
  FileText,
  Activity,
  MessageSquare,
  Server,
  HardDrive,
  Cpu,
  MemoryStickIcon as Memory,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react"
import type { User, PermitApplication, ActivityLog } from "@/types"
import { db } from "@/lib/database"
import { UserManagement } from "./user-management"
import { ICTApplicationManager } from "./ict-application-manager"
import { ICTLogEditor } from "./ict-log-editor"
import { ICTAdvancedFilters, type ICTFilterState } from "./ict-advanced-filters"
import { ICTReportsAnalytics } from "./ict-reports-analytics"
import { ICTSystemAdmin } from "./ict-system-admin"

interface ICTDashboardProps {
  user: User
}

export function ICTDashboard({ user }: ICTDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [systemStats, setSystemStats] = useState({
    totalApplications: 0,
    totalUsers: 0,
    totalLogs: 0,
    systemHealth: "excellent",
    uptime: "99.9%",
    lastBackup: new Date(),
    diskUsage: 45,
    memoryUsage: 62,
    cpuUsage: 23,
    networkStatus: "optimal",
  })

  // Filter states for different sections
  const [applicationFilters, setApplicationFilters] = useState<ICTFilterState>({
    searchTerm: "",
    dateRange: "all",
    startDate: "",
    endDate: "",
    applicationStatus: "all",
    applicationStage: "all",
    permitType: "all",
    waterSource: "all",
    applicantName: "",
    applicationId: "",
    landSizeMin: "",
    landSizeMax: "",
    waterAllocationMin: "",
    waterAllocationMax: "",
    logAction: "all",
    logUserType: "all",
    logUserId: "",
    logApplicationId: "",
    logDetails: "",
    reportType: "all",
    reportPeriod: "monthly",
    reportMetric: "count",
    reportGroupBy: "none",
    includeDeleted: false,
    includeArchived: false,
    exactMatch: false,
    caseSensitive: false,
  })

  const [logFilters, setLogFilters] = useState<ICTFilterState>({ ...applicationFilters })
  const [reportFilters, setReportFilters] = useState<ICTFilterState>({ ...applicationFilters })

  // Saved filter presets
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; filters: ICTFilterState }>>([
    {
      name: "Recent Applications",
      filters: { ...applicationFilters, dateRange: "last_30_days", applicationStatus: "submitted" },
    },
    { name: "System Errors", filters: { ...logFilters, logAction: "error", dateRange: "last_7_days" } },
    {
      name: "Approved This Month",
      filters: { ...applicationFilters, applicationStatus: "approved", dateRange: "this_month" },
    },
  ])

  const logICTActivity = async (action: string, details: string, applicationId?: string) => {
    await db.addLog({
      userId: user.id,
      userType: user.userType,
      action,
      details,
      applicationId,
    })
    // Refresh logs after adding
    loadDashboardData()
  }

  useEffect(() => {
    loadDashboardData()
    // Log ICT dashboard access
    logICTActivity("Dashboard Access", "ICT Administrator accessed the dashboard")

    const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [appsData, logsData, usersData] = await Promise.all([db.getApplications(), db.getLogs(), db.getUsers()])

      setApplications(appsData)
      setLogs(logsData)
      setUsers(usersData)

      // Update system stats
      setSystemStats((prev) => ({
        ...prev,
        totalApplications: appsData.length,
        totalUsers: usersData.length,
        totalLogs: logsData.length,
        lastBackup: new Date(),
        // Simulate system metrics
        diskUsage: Math.floor(Math.random() * 20) + 40,
        memoryUsage: Math.floor(Math.random() * 30) + 50,
        cpuUsage: Math.floor(Math.random() * 40) + 10,
      }))
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    }
  }

  const handleSavePreset = (name: string, filters: ICTFilterState) => {
    setSavedPresets((prev) => [...prev, { name, filters }])
  }

  const handleLoadPreset = (filters: ICTFilterState) => {
    setApplicationFilters(filters)
  }

  const handleExportData = (filters: ICTFilterState) => {
    // Export filtered data based on current tab
    console.log("Exporting data with filters:", filters)
  }

  const clearFilters = (type: "applications" | "logs" | "reports") => {
    const defaultFilters: ICTFilterState = {
      searchTerm: "",
      dateRange: "all",
      startDate: "",
      endDate: "",
      applicationStatus: "all",
      applicationStage: "all",
      permitType: "all",
      waterSource: "all",
      applicantName: "",
      applicationId: "",
      landSizeMin: "",
      landSizeMax: "",
      waterAllocationMin: "",
      waterAllocationMax: "",
      logAction: "all",
      logUserType: "all",
      logUserId: "",
      logApplicationId: "",
      logDetails: "",
      reportType: "all",
      reportPeriod: "monthly",
      reportMetric: "count",
      reportGroupBy: "none",
      includeDeleted: false,
      includeArchived: false,
      exactMatch: false,
      caseSensitive: false,
    }

    if (type === "applications") setApplicationFilters(defaultFilters)
    else if (type === "logs") setLogFilters(defaultFilters)
    else if (type === "reports") setReportFilters(defaultFilters)
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* ICT Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">ICT Administration Dashboard</h1>
            <p className="text-gray-600">Universal System Administrator - Full Access Control</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Healthy
          </Badge>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSystemHealthColor(systemStats.systemHealth)}`}>
              {systemStats.systemHealth.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground">Uptime: {systemStats.uptime}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {applications.filter((app) => app.status === "approved").length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active users in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">Total system activities</p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              <span className="text-sm font-bold">{systemStats.diskUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemStats.diskUsage}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Memory className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm font-bold">{systemStats.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${systemStats.memoryUsage}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm font-bold">{systemStats.cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${systemStats.cpuUsage}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {systemStats.networkStatus}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-2">Last backup: {systemStats.lastBackup.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main ICT Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{log.action}</div>
                        <div className="text-xs text-gray-500">{log.details}</div>
                      </div>
                      <div className="text-xs text-gray-400">{log.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">All systems operational</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Scheduled backup completed</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Disk usage at 45% - Monitor</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement currentUser={user} />
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <ICTAdvancedFilters
            filterType="applications"
            onFiltersChange={setApplicationFilters}
            currentFilters={applicationFilters}
            onClearFilters={() => clearFilters("applications")}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            savedPresets={savedPresets}
            onExport={handleExportData}
          />
          <ICTApplicationManager user={user} filters={applicationFilters} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <ICTAdvancedFilters
            filterType="logs"
            onFiltersChange={setLogFilters}
            currentFilters={logFilters}
            onClearFilters={() => clearFilters("logs")}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            savedPresets={savedPresets}
            onExport={handleExportData}
          />
          <ICTLogEditor user={user} filters={logFilters} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ICTAdvancedFilters
            filterType="reports"
            onFiltersChange={setReportFilters}
            currentFilters={reportFilters}
            onClearFilters={() => clearFilters("reports")}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            savedPresets={savedPresets}
            onExport={handleExportData}
          />
          <ICTReportsAnalytics user={user} filters={reportFilters} />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                System Messages & Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">ICT messaging system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <ICTSystemAdmin user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
