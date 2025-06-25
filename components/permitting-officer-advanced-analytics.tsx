"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
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
import { Download, Clock, AlertTriangle, CheckCircle, Users, Filter, Target, Zap } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { ChartOrPlaceholder } from "./chart-or-placeholder"

interface PermittingOfficerAnalyticsProps {
  user: User
}

interface AdvancedFilters {
  dateRange: string
  startDate: string
  endDate: string
  statusFilter: string[]
  permitTypeFilter: string[]
  priorityFilter: string[]
  processingTimeRange: number[]
  waterAllocationRange: number[]
  landSizeRange: number[]
  applicantTypeFilter: string[]
  regionFilter: string
  complexityFilter: string[]
  documentStatusFilter: string[]
  showOnlyAssignedToMe: boolean
  showOverdueOnly: boolean
  showHighPriorityOnly: boolean
  groupBy: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

export function PermittingOfficerAdvancedAnalytics({ user }: PermittingOfficerAnalyticsProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [filters, setFilters] = useState<AdvancedFilters>({
    dateRange: "last_30_days",
    startDate: "",
    endDate: "",
    statusFilter: [],
    permitTypeFilter: [],
    priorityFilter: [],
    processingTimeRange: [0, 365],
    waterAllocationRange: [0, 1000],
    landSizeRange: [0, 500],
    applicantTypeFilter: [],
    regionFilter: "all",
    complexityFilter: [],
    documentStatusFilter: [],
    showOnlyAssignedToMe: false,
    showOverdueOnly: false,
    showHighPriorityOnly: false,
    groupBy: "status",
    sortBy: "createdAt",
    sortOrder: "desc",
  })

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters])

  const loadApplications = async () => {
    const apps = await db.getApplications()
    setApplications(apps)
  }

  const applyFilters = () => {
    let filtered = [...applications]

    // Date range filtering
    if (filters.dateRange !== "all") {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
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
        case "custom":
          if (filters.startDate) startDate = new Date(filters.startDate)
          else startDate = new Date(0)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter((app) => app.createdAt >= startDate)

      if (filters.dateRange === "custom" && filters.endDate) {
        const endDate = new Date(filters.endDate)
        filtered = filtered.filter((app) => app.createdAt <= endDate)
      }
    }

    // Status filtering
    if (filters.statusFilter.length > 0) {
      filtered = filtered.filter((app) => filters.statusFilter.includes(app.status))
    }

    // Permit type filtering
    if (filters.permitTypeFilter.length > 0) {
      filtered = filtered.filter((app) => filters.permitTypeFilter.includes(app.permitType))
    }

    // Water allocation range
    const [minWater, maxWater] = filters.waterAllocationRange
    filtered = filtered.filter((app) => app.waterAllocation >= minWater && app.waterAllocation <= maxWater)

    // Land size range
    const [minLand, maxLand] = filters.landSizeRange
    filtered = filtered.filter((app) => app.landSize >= minLand && app.landSize <= maxLand)

    // Processing time range (for completed applications)
    const [minDays, maxDays] = filters.processingTimeRange
    filtered = filtered.filter((app) => {
      if (!app.submittedAt) return true
      const processingDays = app.approvedAt
        ? Math.ceil((new Date(app.approvedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
      return processingDays >= minDays && processingDays <= maxDays
    })

    // Show only assigned to me
    if (filters.showOnlyAssignedToMe) {
      filtered = filtered.filter((app) => app.createdBy === user.id || app.currentStage === 1)
    }

    // Show overdue only
    if (filters.showOverdueOnly) {
      filtered = filtered.filter((app) => {
        if (!app.submittedAt) return false
        const daysSinceSubmission = Math.ceil(
          (Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24),
        )
        return daysSinceSubmission > 30 && app.status !== "approved" && app.status !== "rejected"
      })
    }

    // Show high priority only
    if (filters.showHighPriorityOnly) {
      filtered = filtered.filter((app) => {
        // Define high priority criteria
        return (
          app.waterAllocation > 100 ||
          app.landSize > 50 ||
          app.permitType === "industrial" ||
          app.permitType === "bulk_water"
        )
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "createdAt":
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case "applicantName":
          aValue = a.applicantName.toLowerCase()
          bValue = b.applicantName.toLowerCase()
          break
        case "waterAllocation":
          aValue = a.waterAllocation
          bValue = b.waterAllocation
          break
        case "landSize":
          aValue = a.landSize
          bValue = b.landSize
          break
        case "processingTime":
          aValue = a.submittedAt
            ? a.approvedAt
              ? new Date(a.approvedAt).getTime() - new Date(a.submittedAt).getTime()
              : Date.now() - new Date(a.submittedAt).getTime()
            : 0
          bValue = b.submittedAt
            ? b.approvedAt
              ? new Date(b.approvedAt).getTime() - new Date(b.submittedAt).getTime()
              : Date.now() - new Date(b.submittedAt).getTime()
            : 0
          break
        default:
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
      }

      if (filters.sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredApplications(filtered)
  }

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleArrayFilterChange = (key: keyof AdvancedFilters, value: string, checked: boolean) => {
    setFilters((prev) => {
      const currentArray = (prev[key] as string[]) || []
      let updatedArray: string[]

      if (checked) {
        updatedArray = [...currentArray, value]
      } else {
        updatedArray = currentArray.filter((item) => item !== value)
      }

      return { ...prev, [key]: updatedArray }
    })
  }

  const clearFilters = () => {
    setFilters({
      dateRange: "all",
      startDate: "",
      endDate: "",
      statusFilter: [],
      permitTypeFilter: [],
      priorityFilter: [],
      processingTimeRange: [0, 365],
      waterAllocationRange: [0, 1000],
      landSizeRange: [0, 500],
      applicantTypeFilter: [],
      regionFilter: "all",
      complexityFilter: [],
      documentStatusFilter: [],
      showOnlyAssignedToMe: false,
      showOverdueOnly: false,
      showHighPriorityOnly: false,
      groupBy: "status",
      sortBy: "createdAt",
      sortOrder: "desc",
    })
  }

  const getAdvancedStatistics = () => {
    const total = filteredApplications.length
    const submitted = filteredApplications.filter((app) => app.status === "submitted").length
    const underReview = filteredApplications.filter((app) => app.status === "under_review").length
    const approved = filteredApplications.filter((app) => app.status === "approved").length
    const rejected = filteredApplications.filter((app) => app.status === "rejected").length

    // Processing efficiency metrics
    const completedApps = filteredApplications.filter((app) => app.approvedAt && app.submittedAt)
    const processingTimes = completedApps.map((app) => {
      const submitted = new Date(app.submittedAt!)
      const approved = new Date(app.approvedAt!)
      return Math.ceil((approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
    })

    const avgProcessingTime =
      processingTimes.length > 0
        ? Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length)
        : 0

    const fastProcessed = processingTimes.filter((time) => time <= 14).length
    const slowProcessed = processingTimes.filter((time) => time > 30).length

    // Workload analysis
    const myApplications = filteredApplications.filter((app) => app.createdBy === user.id || app.currentStage === 1)
    const overdueApplications = filteredApplications.filter((app) => {
      if (!app.submittedAt) return false
      const daysSinceSubmission = Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceSubmission > 30 && app.status !== "approved" && app.status !== "rejected"
    })

    const highPriorityApps = filteredApplications.filter(
      (app) =>
        app.waterAllocation > 100 ||
        app.landSize > 50 ||
        app.permitType === "industrial" ||
        app.permitType === "bulk_water",
    )

    // Approval rate
    const approvalRate = completedApps.length > 0 ? Math.round((approved / completedApps.length) * 100) : 0

    return {
      total,
      submitted,
      underReview,
      approved,
      rejected,
      avgProcessingTime,
      fastProcessed,
      slowProcessed,
      myApplications: myApplications.length,
      overdueApplications: overdueApplications.length,
      highPriorityApps: highPriorityApps.length,
      approvalRate,
      totalWaterAllocation: filteredApplications.reduce((sum, app) => sum + app.waterAllocation, 0),
      totalLandSize: filteredApplications.reduce((sum, app) => sum + app.landSize, 0),
    }
  }

  const getProcessingEfficiencyData = () => {
    const monthlyData = filteredApplications.reduce(
      (acc, app) => {
        const month = app.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        if (!acc[month]) {
          acc[month] = {
            month,
            submitted: 0,
            processed: 0,
            avgProcessingTime: 0,
            totalProcessingTime: 0,
            processedCount: 0,
          }
        }

        if (app.status === "submitted" || app.status === "under_review") {
          acc[month].submitted++
        }

        if (app.approvedAt && app.submittedAt) {
          const processingTime = Math.ceil(
            (new Date(app.approvedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24),
          )
          acc[month].processed++
          acc[month].totalProcessingTime += processingTime
          acc[month].processedCount++
        }

        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(monthlyData)
      .map((data: any) => ({
        ...data,
        avgProcessingTime: data.processedCount > 0 ? Math.round(data.totalProcessingTime / data.processedCount) : 0,
        efficiency: data.submitted > 0 ? Math.round((data.processed / (data.submitted + data.processed)) * 100) : 0,
      }))
      .sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  const getWorkloadDistribution = () => {
    const permitTypes = filteredApplications.reduce(
      (acc, app) => {
        acc[app.permitType] = (acc[app.permitType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(permitTypes).map(([type, count]) => ({
      name: type.replace("_", " ").toUpperCase(),
      value: count,
      percentage: Math.round((count / filteredApplications.length) * 100),
    }))
  }

  const getProcessingTimeDistribution = () => {
    const completedApps = filteredApplications.filter((app) => app.approvedAt && app.submittedAt)
    const timeRanges = {
      "0-7 days": 0,
      "8-14 days": 0,
      "15-30 days": 0,
      "31-60 days": 0,
      "60+ days": 0,
    }

    completedApps.forEach((app) => {
      const processingTime = Math.ceil(
        (new Date(app.approvedAt!).getTime() - new Date(app.submittedAt!).getTime()) / (1000 * 60 * 60 * 24),
      )

      if (processingTime <= 7) timeRanges["0-7 days"]++
      else if (processingTime <= 14) timeRanges["8-14 days"]++
      else if (processingTime <= 30) timeRanges["15-30 days"]++
      else if (processingTime <= 60) timeRanges["31-60 days"]++
      else timeRanges["60+ days"]++
    })

    return Object.entries(timeRanges).map(([range, count]) => ({
      name: range,
      value: count,
      percentage: completedApps.length > 0 ? Math.round((count / completedApps.length) * 100) : 0,
    }))
  }

  const exportAdvancedReport = () => {
    const stats = getAdvancedStatistics()
    const efficiencyData = getProcessingEfficiencyData()
    const workloadData = getWorkloadDistribution()

    const reportData = [
      ["PERMITTING OFFICER ADVANCED ANALYTICS REPORT"],
      ["Generated:", new Date().toLocaleString()],
      ["Officer:", user.username],
      ["Filter Period:", filters.dateRange.replace("_", " ").toUpperCase()],
      [""],
      ["PERFORMANCE METRICS"],
      ["Total Applications Reviewed:", stats.total],
      ["Applications Submitted:", stats.submitted],
      ["Applications Under Review:", stats.underReview],
      ["Applications Approved:", stats.approved],
      ["Applications Rejected:", stats.rejected],
      ["Overall Approval Rate:", `${stats.approvalRate}%`],
      ["Average Processing Time:", `${stats.avgProcessingTime} days`],
      ["Fast Processed (≤14 days):", stats.fastProcessed],
      ["Slow Processed (>30 days):", stats.slowProcessed],
      [""],
      ["WORKLOAD ANALYSIS"],
      ["My Assigned Applications:", stats.myApplications],
      ["Overdue Applications:", stats.overdueApplications],
      ["High Priority Applications:", stats.highPriorityApps],
      ["Total Water Allocation Processed:", `${stats.totalWaterAllocation.toLocaleString()} ML`],
      ["Total Land Area Processed:", `${stats.totalLandSize.toLocaleString()} hectares`],
      [""],
      ["PERMIT TYPE DISTRIBUTION"],
      ["Type", "Count", "Percentage"],
      ...workloadData.map((item) => [item.name, item.value, `${item.percentage}%`]),
      [""],
      ["MONTHLY EFFICIENCY DATA"],
      ["Month", "Submitted", "Processed", "Avg Processing Time", "Efficiency %"],
      ...efficiencyData.map((item: any) => [
        item.month,
        item.submitted,
        item.processed,
        `${item.avgProcessingTime} days`,
        `${item.efficiency}%`,
      ]),
    ]

    const csvContent = reportData.map((row) => (Array.isArray(row) ? row.join(",") : row)).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `permitting_officer_analytics_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stats = getAdvancedStatistics()
  const efficiencyData = getProcessingEfficiencyData()
  const workloadData = getWorkloadDistribution()
  const processingTimeData = getProcessingTimeDistribution()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFCC02", "#FF6B6B"]

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) return true
    if (typeof value === "boolean" && value) return true
    if (typeof value === "string" && value && value !== "all" && value !== "") return true
    if (
      key.includes("Range") &&
      Array.isArray(value) &&
      (value[0] > 0 || value[1] < (key === "processingTimeRange" ? 365 : key === "waterAllocationRange" ? 1000 : 500))
    )
      return true
    return false
  }).length

  return (
    <div className="space-y-6">
      {/* Advanced Filters Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Advanced Analytics Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
              <Button onClick={exportAdvancedReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Range and Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Time Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filters.dateRange === "custom" && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    min={filters.startDate}
                  />
                </div>
              </>
            )}
            <div>
              <Label>Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="applicantName">Applicant Name</SelectItem>
                  <SelectItem value="waterAllocation">Water Allocation</SelectItem>
                  <SelectItem value="landSize">Land Size</SelectItem>
                  <SelectItem value="processingTime">Processing Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Type Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Application Status</Label>
              <div className="space-y-2">
                {["submitted", "under_review", "approved", "rejected"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statusFilter.includes(status)}
                      onCheckedChange={(checked) => handleArrayFilterChange("statusFilter", status, !!checked)}
                    />
                    <Label htmlFor={`status-${status}`} className="capitalize">
                      {status.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Permit Types</Label>
              <div className="space-y-2">
                {["urban", "bulk_water", "irrigation", "institution", "industrial", "surface_water_storage"].map(
                  (type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permit-${type}`}
                        checked={filters.permitTypeFilter.includes(type)}
                        onCheckedChange={(checked) => handleArrayFilterChange("permitTypeFilter", type, !!checked)}
                      />
                      <Label htmlFor={`permit-${type}`} className="capitalize">
                        {type.replace("_", " ")}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Processing Time (days): {filters.processingTimeRange[0]} - {filters.processingTimeRange[1]}
              </Label>
              <Slider
                value={filters.processingTimeRange}
                onValueChange={(value) => handleFilterChange("processingTimeRange", value)}
                max={365}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Water Allocation (ML): {filters.waterAllocationRange[0]} - {filters.waterAllocationRange[1]}
              </Label>
              <Slider
                value={filters.waterAllocationRange}
                onValueChange={(value) => handleFilterChange("waterAllocationRange", value)}
                max={1000}
                step={10}
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Land Size (ha): {filters.landSizeRange[0]} - {filters.landSizeRange[1]}
              </Label>
              <Slider
                value={filters.landSizeRange}
                onValueChange={(value) => handleFilterChange("landSizeRange", value)}
                max={500}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="assignedToMe"
                checked={filters.showOnlyAssignedToMe}
                onCheckedChange={(checked) => handleFilterChange("showOnlyAssignedToMe", checked)}
              />
              <Label htmlFor="assignedToMe">Show only assigned to me</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdueOnly"
                checked={filters.showOverdueOnly}
                onCheckedChange={(checked) => handleFilterChange("showOverdueOnly", checked)}
              />
              <Label htmlFor="overdueOnly">Show overdue applications only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="highPriorityOnly"
                checked={filters.showHighPriorityOnly}
                onCheckedChange={(checked) => handleFilterChange("showHighPriorityOnly", checked)}
              />
              <Label htmlFor="highPriorityOnly">Show high priority only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Workload</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myApplications}</div>
            <p className="text-xs text-muted-foreground">Applications assigned to me</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgProcessingTime} days</div>
            <p className="text-xs text-muted-foreground">Average processing time</p>
            <p className="text-xs text-muted-foreground">
              {stats.fastProcessed} fast, {stats.slowProcessed} slow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved} approved, {stats.rejected} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueApplications}</div>
            <p className="text-xs text-muted-foreground">Overdue applications</p>
            <p className="text-xs text-muted-foreground">{stats.highPriorityApps} high priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Charts */}
      <Tabs defaultValue="efficiency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="efficiency">Processing Efficiency</TabsTrigger>
          <TabsTrigger value="workload">Workload Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Processing Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartOrPlaceholder data={efficiencyData}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={efficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="efficiency" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area
                        type="monotone"
                        dataKey="avgProcessingTime"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartOrPlaceholder>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartOrPlaceholder data={processingTimeData}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={processingTimeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {processingTimeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartOrPlaceholder>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Permit Type Workload Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartOrPlaceholder data={workloadData}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workloadData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartOrPlaceholder>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Workload Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartOrPlaceholder data={efficiencyData}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={efficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="submitted" stroke="#F59E0B" strokeWidth={2} />
                      <Line type="monotone" dataKey="processed" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartOrPlaceholder>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartOrPlaceholder data={efficiencyData}>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="submitted"
                      stackId="1"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="processed"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartOrPlaceholder>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">Fast Processing Rate</span>
                  </div>
                  <Badge variant="secondary">{stats.fastProcessed} applications</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium">Overdue Applications</span>
                  </div>
                  <Badge variant="destructive">{stats.overdueApplications} applications</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium">Approval Success Rate</span>
                  </div>
                  <Badge variant="outline">{stats.approvalRate}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Allocation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Water Allocated</span>
                    <span className="text-sm font-medium">{stats.totalWaterAllocation.toLocaleString()} ML</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Land Area</span>
                    <span className="text-sm font-medium">{stats.totalLandSize.toLocaleString()} hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Applications Processed</span>
                    <span className="text-sm font-medium">{stats.approved + stats.rejected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Processing Time</span>
                    <span className="text-sm font-medium">{stats.avgProcessingTime} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
