"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  FileText,
  Download,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  Activity,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  X,
} from "lucide-react"
import type { PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface SimpleFilters {
  searchText: string
  startDate: string
  endDate: string
  permitType: string
}

export function EnhancedReportsAnalytics() {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [filters, setFilters] = useState<SimpleFilters>({
    searchText: "",
    startDate: "",
    endDate: "",
    permitType: "all",
  })

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, filters])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const apps = await db.getApplications()
      if (apps && Array.isArray(apps)) {
        setApplications(apps)
        setLastUpdated(new Date())
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

    // Filter by search text (searches in applicant name, application ID, and permit type)
    if (filters.searchText.trim()) {
      const searchTerm = filters.searchText.toLowerCase().trim()
      filtered = filtered.filter(
        (app) =>
          app.applicantName?.toLowerCase().includes(searchTerm) ||
          app.applicationId?.toLowerCase().includes(searchTerm) ||
          app.permitType?.toLowerCase().includes(searchTerm) ||
          app.status?.toLowerCase().includes(searchTerm),
      )
    }

    // Filter by permit type
    if (filters.permitType && filters.permitType !== "all") {
      filtered = filtered.filter((app) => app.permitType === filters.permitType)
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      startDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((app) => app.createdAt >= startDate)
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((app) => app.createdAt <= endDate)
    }

    setFilteredApplications(filtered)
  }

  const handleFilterChange = (field: keyof SimpleFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      searchText: "",
      startDate: "",
      endDate: "",
      permitType: "all",
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.searchText.trim()) count++
    if (filters.startDate) count++
    if (filters.endDate) count++
    if (filters.permitType && filters.permitType !== "all") count++
    return count
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
        ["Filters Applied:", getActiveFiltersCount() > 0 ? "Yes" : "No"],
        ["Search Term:", filters.searchText || "None"],
        [
          "Date Range:",
          filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : "All dates",
        ],
        [
          "Permit Type:",
          filters.permitType === "all" ? "All Types" : filters.permitType.replace("_", " ").toUpperCase(),
        ],
        ["Last Updated:", lastUpdated.toLocaleString()],
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
      a.download = `permit_report_${new Date().toISOString().split("T")[0]}.csv`
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
              <RefreshCw className="h-4 w-4 mr-2" />
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
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest data...</p>
        </div>
      </div>
    )
  }

  const stats = getStatistics()
  const permitDistribution = getPermitTypeDistribution()
  const statusDistribution = getStatusDistribution()
  const monthlyTrends = getMonthlyTrends()
  const waterAllocationTrends = getWaterAllocationTrends()
  const activeFiltersCount = getActiveFiltersCount()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFCC02", "#FF6B6B"]

  return (
    <div className="space-y-6">
      {/* Simple Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-600 hover:text-red-800">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">
                Search Applications
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name, ID, type..."
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange("searchText", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  min={filters.startDate}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Permit Type Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="permitType" className="text-sm font-medium">
                Permit Type
              </Label>
              <Select value={filters.permitType} onValueChange={(value) => handleFilterChange("permitType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select permit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="bulk_water">Bulk Water</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="institution">Institution</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="surface_water_storage">Surface Water Storage</SelectItem>
                  <SelectItem value="surface_water_flow">Surface Water Flow</SelectItem>
                  <SelectItem value="tempering">Tempering</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <strong>Active Filters:</strong>
                  {filters.searchText && <span className="ml-2">Search: "{filters.searchText}"</span>}
                  {filters.startDate && <span className="ml-2">From: {filters.startDate}</span>}
                  {filters.endDate && <span className="ml-2">To: {filters.endDate}</span>}
                  {filters.permitType !== "all" && (
                    <span className="ml-2">Type: {filters.permitType.replace("_", " ").toUpperCase()}</span>
                  )}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Showing {filteredApplications.length} of {applications.length} applications
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Reports & Analytics
              <Badge variant="outline" className="ml-2 text-xs">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {filteredApplications.length} applications
              </Badge>
              <Button onClick={loadApplications} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={exportDetailedReport} disabled={filteredApplications.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
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

        <Card className="hover:shadow-md transition-shadow">
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

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
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
