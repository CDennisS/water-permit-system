"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  AreaChart,
  Area,
} from "recharts"
import { FileText, Download, AlertTriangle, Clock, TrendingUp, BarChart3, PieChartIcon, Activity } from "lucide-react"
import type { PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { AdvancedDashboardFilters, type DashboardFilterState } from "./advanced-dashboard-filters"

interface ReportFilters {
  dateRange: string
  startDate: string
  endDate: string
  permitTypeFilter: string[]
  statusFilter: string[]
  stageFilter: string[]
  waterSourceFilter: string[]
  regionFilter: string
  userTypeFilter: string[]
  reportType: string
  includeComparisons: boolean
  includeForecasts: boolean
  groupBy: string
  aggregationType: string
  waterAllocationMin: number
  waterAllocationMax: number
  landSizeMin: number
  landSizeMax: number
}

export function EnhancedReportsAnalytics() {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilterState>({
    timeRange: "last_30_days",
    startDate: "",
    endDate: "",
    compareWithPrevious: false,
    statusFilter: [],
    stageFilter: [],
    permitTypeFilter: [],
    waterSourceFilter: [],
    showTrends: true,
    showComparisons: false,
    showPredictions: false,
    regionFilter: "all",
    gpsAreaFilter: false,
    granularity: "monthly",
    aggregationType: "count",
    includeExpiring: false,
    includeOverdue: false,
    includeHighPriority: false,
    userTypeFilter: [],
    assignedToMe: false,
    waterAllocationRange: [0, 1000],
    landSizeRange: [0, 500],
    processingTimeRange: [0, 365],
  })

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, dashboardFilters])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const apps = await db.getApplications()
      if (apps && Array.isArray(apps)) {
        setApplications(apps)
      } else {
        setApplications([])
      }
    } catch (error) {
      console.error("Error loading applications:", error)
      setError("Failed to load applications. Please try again.")
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Apply status filters
    if (dashboardFilters.statusFilter && dashboardFilters.statusFilter.length > 0) {
      filtered = filtered.filter((app) => dashboardFilters.statusFilter.includes(app.status))
    }

    // Apply permit type filters
    if (dashboardFilters.permitTypeFilter && dashboardFilters.permitTypeFilter.length > 0) {
      filtered = filtered.filter((app) => dashboardFilters.permitTypeFilter.includes(app.permitType))
    }

    // Apply stage filters
    if (dashboardFilters.stageFilter && dashboardFilters.stageFilter.length > 0) {
      filtered = filtered.filter((app) => dashboardFilters.stageFilter.includes(app.currentStage.toString()))
    }

    // Apply water source filters
    if (dashboardFilters.waterSourceFilter && dashboardFilters.waterSourceFilter.length > 0) {
      filtered = filtered.filter((app) => dashboardFilters.waterSourceFilter.includes(app.waterSource))
    }

    // Apply water allocation range
    if (dashboardFilters.waterAllocationRange) {
      const [min, max] = dashboardFilters.waterAllocationRange
      filtered = filtered.filter((app) => app.waterAllocation >= min && app.waterAllocation <= max)
    }

    // Apply land size range
    if (dashboardFilters.landSizeRange) {
      const [min, max] = dashboardFilters.landSizeRange
      filtered = filtered.filter((app) => app.landSize >= min && app.landSize <= max)
    }

    // Apply date range filtering
    if (dashboardFilters.timeRange && dashboardFilters.timeRange !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dashboardFilters.timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "yesterday":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          break
        case "last_7_days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "last_30_days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "last_90_days":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter((app) => app.createdAt >= startDate)
    }

    // Apply custom date range
    if (dashboardFilters.startDate) {
      const startDate = new Date(dashboardFilters.startDate)
      filtered = filtered.filter((app) => app.createdAt >= startDate)
    }

    if (dashboardFilters.endDate) {
      const endDate = new Date(dashboardFilters.endDate)
      endDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter((app) => app.createdAt <= endDate)
    }

    // Apply region filter
    if (dashboardFilters.regionFilter && dashboardFilters.regionFilter !== "all") {
      // For now, we'll use a simple region mapping based on GPS coordinates
      filtered = filtered.filter((app) => {
        // This is a simplified region filter - in a real system, you'd have proper region mapping
        return true // Keep all for now since we don't have region data in our mock
      })
    }

    // Apply expiring permits filter
    if (dashboardFilters.includeExpiring) {
      filtered = filtered.filter((app) => {
        if (app.status !== "approved" || !app.approvedAt) return false
        const expiryDate = new Date(app.approvedAt)
        expiryDate.setFullYear(expiryDate.getFullYear() + 5)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0
      })
    }

    // Apply overdue filter
    if (dashboardFilters.includeOverdue) {
      filtered = filtered.filter((app) => {
        if (app.status === "approved" || app.status === "rejected") return false
        const daysSinceSubmission = app.submittedAt
          ? Math.ceil((Date.now() - app.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0
        return daysSinceSubmission > 30 // Consider overdue after 30 days
      })
    }

    setFilteredApplications(filtered)
  }

  const handleDashboardFiltersChange = (filters: DashboardFilterState) => {
    setDashboardFilters(filters)
  }

  const clearDashboardFilters = () => {
    setDashboardFilters({
      timeRange: "all",
      startDate: "",
      endDate: "",
      compareWithPrevious: false,
      statusFilter: [],
      stageFilter: [],
      permitTypeFilter: [],
      waterSourceFilter: [],
      showTrends: true,
      showComparisons: false,
      showPredictions: false,
      regionFilter: "all",
      gpsAreaFilter: false,
      granularity: "monthly",
      aggregationType: "count",
      includeExpiring: false,
      includeOverdue: false,
      includeHighPriority: false,
      userTypeFilter: [],
      assignedToMe: false,
      waterAllocationRange: [0, 1000],
      landSizeRange: [0, 500],
      processingTimeRange: [0, 365],
    })
  }

  const getStatistics = () => {
    const total = filteredApplications.length
    const approved = filteredApplications.filter((app) => app.status === "approved").length
    const rejected = filteredApplications.filter((app) => app.status === "rejected").length
    const pending = filteredApplications.filter(
      (app) => app.status === "submitted" || app.status === "under_review",
    ).length
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

    // Calculate expiring permits
    const expiringSoon = filteredApplications.filter((app) => {
      if (app.status !== "approved" || !app.approvedAt) return false
      const expiryDate = new Date(app.approvedAt)
      expiryDate.setFullYear(expiryDate.getFullYear() + 5)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length

    // Calculate processing times
    const processingTimes = filteredApplications
      .filter((app) => app.approvedAt && app.submittedAt)
      .map((app) => {
        const submitted = new Date(app.submittedAt!)
        const approved = new Date(app.approvedAt!)
        return Math.ceil((approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
      })

    const avgProcessingTime =
      processingTimes.length > 0
        ? Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length)
        : 0

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate,
      expiringSoon,
      avgProcessingTime,
      totalWaterAllocation: filteredApplications.reduce((sum, app) => sum + (app.waterAllocation || 0), 0),
      totalLandSize: filteredApplications.reduce((sum, app) => sum + (app.landSize || 0), 0),
    }
  }

  const getPermitTypeDistribution = () => {
    const distribution = filteredApplications.reduce(
      (acc, app) => {
        const type = app.permitType || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.replace("_", " ").toUpperCase(),
      value: count,
      percentage: filteredApplications.length > 0 ? Math.round((count / filteredApplications.length) * 100) : 0,
    }))
  }

  const getStatusDistribution = () => {
    const distribution = filteredApplications.reduce(
      (acc, app) => {
        const status = app.status || "unknown"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).map(([status, count]) => ({
      name: status.replace("_", " ").toUpperCase(),
      value: count,
      percentage: filteredApplications.length > 0 ? Math.round((count / filteredApplications.length) * 100) : 0,
    }))
  }

  const getMonthlyTrends = () => {
    const monthlyData = filteredApplications.reduce(
      (acc, app) => {
        const month = app.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        if (!acc[month]) {
          acc[month] = { month, applications: 0, approved: 0, rejected: 0, pending: 0 }
        }
        acc[month].applications++
        if (app.status === "approved") acc[month].approved++
        else if (app.status === "rejected") acc[month].rejected++
        else acc[month].pending++
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(monthlyData).sort(
      (a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime(),
    )
  }

  const getWaterAllocationTrends = () => {
    const monthlyData = filteredApplications.reduce(
      (acc, app) => {
        const month = app.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        if (!acc[month]) {
          acc[month] = { month, allocation: 0, applications: 0 }
        }
        acc[month].allocation += app.waterAllocation || 0
        acc[month].applications++
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(monthlyData)
      .map((data: any) => ({
        ...data,
        avgAllocation: Math.round(data.allocation / data.applications || 0),
      }))
      .sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  const exportDetailedReport = () => {
    try {
      const stats = getStatistics()
      const permitDistribution = getPermitTypeDistribution()
      const statusDistribution = getStatusDistribution()

      const reportData = [
        ["COMPREHENSIVE PERMIT MANAGEMENT REPORT"],
        ["Generated:", new Date().toLocaleString()],
        ["Filter Period:", dashboardFilters.timeRange.replace("_", " ").toUpperCase()],
        [""],
        ["EXECUTIVE SUMMARY"],
        ["Total Applications:", stats.total],
        ["Approved Applications:", stats.approved],
        ["Rejected Applications:", stats.rejected],
        ["Pending Applications:", stats.pending],
        ["Overall Approval Rate:", `${stats.approvalRate}%`],
        ["Average Processing Time:", `${stats.avgProcessingTime} days`],
        ["Permits Expiring Soon:", stats.expiringSoon],
        ["Total Water Allocation:", `${stats.totalWaterAllocation.toLocaleString()} ML`],
        ["Total Land Coverage:", `${stats.totalLandSize.toLocaleString()} hectares`],
        [""],
        ["PERMIT TYPE DISTRIBUTION"],
        ["Type", "Count", "Percentage"],
        ...permitDistribution.map((item) => [item.name, item.value, `${item.percentage}%`]),
        [""],
        ["STATUS DISTRIBUTION"],
        ["Status", "Count", "Percentage"],
        ...statusDistribution.map((item) => [item.name, item.value, `${item.percentage}%`]),
        [""],
        ["DETAILED APPLICATION DATA"],
        [
          "Application ID",
          "Applicant",
          "Type",
          "Status",
          "Stage",
          "Water Allocation",
          "Land Size",
          "Created",
          "Submitted",
          "Approved",
        ],
        ...filteredApplications.map((app) => [
          app.applicationId || "N/A",
          app.applicantName || "N/A",
          app.permitType || "N/A",
          app.status || "N/A",
          app.currentStage || "N/A",
          app.waterAllocation || 0,
          app.landSize || 0,
          app.createdAt.toLocaleDateString(),
          app.submittedAt?.toLocaleDateString() || "N/A",
          app.approvedAt?.toLocaleDateString() || "N/A",
        ]),
      ]

      const csvContent = reportData.map((row) => (Array.isArray(row) ? row.join(",") : row)).join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `comprehensive_permit_report_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting report:", error)
      alert("Failed to export report. Please try again.")
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Error Loading Analytics Data</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={loadApplications} variant="outline" className="border-red-300 text-red-700 bg-transparent">
              <TrendingUp className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  const stats = getStatistics()
  const permitDistribution = getPermitTypeDistribution()
  const statusDistribution = getStatusDistribution()
  const monthlyTrends = getMonthlyTrends()
  const waterAllocationTrends = getWaterAllocationTrends()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFCC02", "#FF6B6B"]

  return (
    <div className="space-y-6">
      {/* Advanced Dashboard Filters */}
      <AdvancedDashboardFilters
        onFiltersChange={handleDashboardFiltersChange}
        currentFilters={dashboardFilters}
        onClearFilters={clearDashboardFilters}
      />

      {/* Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Enhanced Reports & Analytics
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{filteredApplications.length} applications</Badge>
              <Button onClick={exportDetailedReport} disabled={filteredApplications.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export Detailed Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWaterAllocation.toLocaleString()} ML total allocation
            </p>
            <p className="text-xs text-muted-foreground">{stats.totalLandSize.toLocaleString()} ha total land</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved} approved, {stats.rejected} rejected
            </p>
            <p className="text-xs text-muted-foreground">Avg processing: {stats.avgProcessingTime} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts with Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Water Allocation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="rejected"
                      stackId="3"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Application Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Permit Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={permitDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {permitDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" />
                  <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Water Allocation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={waterAllocationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="allocation" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="avgAllocation" stroke="#00C49F" fill="#00C49F" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
