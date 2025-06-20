"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, TrendingUp, Filter } from "lucide-react"
import type { User, PermitApplication, ActivityLog } from "@/types"
import { db } from "@/lib/database"
import type { ICTFilterState } from "./ict-advanced-filters"

interface ICTReportsAnalyticsProps {
  user: User
  filters: ICTFilterState
}

export function ICTReportsAnalytics({ user, filters }: ICTReportsAnalyticsProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [reportData, setReportData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReportData()
  }, [filters])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const [appsData, logsData] = await Promise.all([db.getApplications(), db.getLogs()])

      // Apply filters
      const filteredApps = applyApplicationFilters(appsData, filters)
      const filteredLogs = applyLogFilters(logsData, filters)

      setApplications(filteredApps)
      setLogs(filteredLogs)

      // Generate report data
      generateReportData(filteredApps, filteredLogs)
    } catch (error) {
      console.error("Failed to load report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyApplicationFilters = (apps: PermitApplication[], filters: ICTFilterState) => {
    let filtered = [...apps]

    if (filters.searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          app.applicationId.toLowerCase().includes(filters.searchTerm.toLowerCase()),
      )
    }

    if (filters.applicationStatus !== "all") {
      filtered = filtered.filter((app) => app.status === filters.applicationStatus)
    }

    if (filters.permitType !== "all") {
      filtered = filtered.filter((app) => app.permitType === filters.permitType)
    }

    // Date filtering
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.createdAt)
        const startDate = filters.startDate ? new Date(filters.startDate) : null
        const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null

        if (startDate && appDate < startDate) return false
        if (endDate && appDate > endDate) return false
        return true
      })
    }

    return filtered
  }

  const applyLogFilters = (logs: ActivityLog[], filters: ICTFilterState) => {
    let filtered = [...logs]

    if (filters.logAction !== "all") {
      filtered = filtered.filter((log) => log.action.toLowerCase().includes(filters.logAction.toLowerCase()))
    }

    if (filters.logUserType !== "all") {
      filtered = filtered.filter((log) => log.userType === filters.logUserType)
    }

    // Date filtering
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp)
        const startDate = filters.startDate ? new Date(filters.startDate) : null
        const endDate = filters.endDate ? new Date(filters.endDate + "T23:59:59") : null

        if (startDate && logDate < startDate) return false
        if (endDate && logDate > endDate) return false
        return true
      })
    }

    return filtered
  }

  const generateReportData = (apps: PermitApplication[], logs: ActivityLog[]) => {
    // Application statistics
    const appStats = {
      total: apps.length,
      approved: apps.filter((app) => app.status === "approved").length,
      rejected: apps.filter((app) => app.status === "rejected").length,
      pending: apps.filter((app) => app.status === "submitted" || app.status === "under_review").length,
      unsubmitted: apps.filter((app) => app.status === "unsubmitted").length,
    }

    // Permit type distribution
    const permitTypeData = apps.reduce(
      (acc, app) => {
        acc[app.permitType] = (acc[app.permitType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Monthly trends
    const monthlyData = apps.reduce(
      (acc, app) => {
        const month = app.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // User activity
    const userActivity = logs.reduce(
      (acc, log) => {
        acc[log.userType] = (acc[log.userType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Daily activity trends
    const dailyActivity = logs.reduce(
      (acc, log) => {
        const day = log.timestamp.toLocaleDateString()
        acc[day] = (acc[day] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    setReportData({
      appStats,
      permitTypeData: Object.entries(permitTypeData).map(([type, count]) => ({
        name: type.replace("_", " ").toUpperCase(),
        value: count,
      })),
      monthlyTrends: Object.entries(monthlyData)
        .map(([month, count]) => ({ month, applications: count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
      userActivity: Object.entries(userActivity).map(([type, count]) => ({
        userType: type.replace("_", " ").toUpperCase(),
        activities: count,
      })),
      dailyActivity: Object.entries(dailyActivity)
        .map(([day, count]) => ({ day, activities: count }))
        .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
        .slice(-30), // Last 30 days
    })
  }

  const exportReport = () => {
    const reportContent = [
      ["ICT COMPREHENSIVE SYSTEM REPORT"],
      ["Generated:", new Date().toLocaleString()],
      [
        "Filter Period:",
        filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : "All Time",
      ],
      [""],
      ["APPLICATION STATISTICS"],
      ["Total Applications:", reportData.appStats?.total || 0],
      ["Approved:", reportData.appStats?.approved || 0],
      ["Rejected:", reportData.appStats?.rejected || 0],
      ["Pending:", reportData.appStats?.pending || 0],
      ["Unsubmitted:", reportData.appStats?.unsubmitted || 0],
      [""],
      ["PERMIT TYPE DISTRIBUTION"],
      ...(reportData.permitTypeData?.map((item: any) => [item.name, item.value]) || []),
      [""],
      ["USER ACTIVITY SUMMARY"],
      ...(reportData.userActivity?.map((item: any) => [item.userType, item.activities]) || []),
      [""],
      ["DETAILED APPLICATION DATA"],
      ["Application ID", "Applicant", "Type", "Status", "Stage", "Created", "Water Allocation"],
      ...applications.map((app) => [
        app.applicationId,
        app.applicantName,
        app.permitType,
        app.status,
        app.currentStage,
        app.createdAt.toLocaleDateString(),
        app.waterAllocation,
      ]),
    ]

    const csvContent = reportContent.map((row) => (Array.isArray(row) ? row.join(",") : row)).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ict_comprehensive_report_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFCC02"]

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading comprehensive reports...</div>
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              ICT Comprehensive Reports & Analytics
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                <Filter className="h-3 w-3 mr-1" />
                {Object.values(filters).filter((v) => v && v !== "all" && v !== "" && v !== false).length} filters
              </Badge>
              <Button onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reportData.appStats?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reportData.appStats?.approved || 0}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{reportData.appStats?.rejected || 0}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{reportData.appStats?.pending || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{logs.length}</div>
              <div className="text-sm text-gray-600">Total Activities</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Application Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Permit Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.permitTypeData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(reportData.permitTypeData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.userActivity || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="userType" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="activities" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Daily System Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.dailyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="activities" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.slice(0, 10).map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.applicationId}</TableCell>
                    <TableCell>{app.applicantName}</TableCell>
                    <TableCell className="capitalize">{app.permitType.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          app.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : app.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : app.status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }
                      >
                        {app.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent System Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.timestamp.toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.userType.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          log.action.includes("Created") || log.action.includes("Approved")
                            ? "bg-green-100 text-green-800"
                            : log.action.includes("Rejected") || log.action.includes("Deleted")
                              ? "bg-red-100 text-red-800"
                              : log.action.includes("Updated")
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            System Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {reportData.appStats ? Math.round((reportData.appStats.approved / reportData.appStats.total) * 100) : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Approval Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {applications.reduce((sum, app) => sum + app.waterAllocation, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total ML Allocated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(
                  logs.length /
                    Math.max(
                      1,
                      (new Date().getTime() - new Date(logs[0]?.timestamp || new Date()).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                )}
              </div>
              <div className="text-sm text-gray-600">Avg Daily Activities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {
                  applications.filter((app) => {
                    const daysSinceCreated = Math.floor(
                      (new Date().getTime() - app.createdAt.getTime()) / (1000 * 60 * 60 * 24),
                    )
                    return daysSinceCreated <= 7
                  }).length
                }
              </div>
              <div className="text-sm text-gray-600">New This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
