"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  Calendar,
  Filter,
  X,
  ChevronDown,
  CalendarDays,
  Clock3,
  MapPin,
  BarChart3,
} from "lucide-react"
import type { PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface DateFilter {
  field: string
  startDate: string
  endDate: string
  preset: string
  includeTime: boolean
  timeRange: string[]
}

interface AdvancedFilters {
  dateFilters: DateFilter[]
  statusFilter: string[]
  permitTypeFilter: string[]
  stageFilter: string[]
  waterSourceFilter: string[]
  userTypeFilter: string[]
  waterAllocationRange: number[]
  landSizeRange: number[]
  processingTimeRange: number[]
  regionFilter: string
  gpsAreaFilter: boolean
  gpsLatRange: number[]
  gpsLngRange: number[]
  hasDocuments: boolean | null
  hasComments: boolean | null
  priorityFilter: string[]
  expiryFilter: string
  searchText: string
  searchFields: string[]
  groupBy: string
  sortBy: string
  sortDirection: string
  chartType: string
  showTrends: boolean
  showForecasts: boolean
  compareWithPrevious: boolean
}

export function ReportsAnalytics() {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar")

  const [filters, setFilters] = useState<AdvancedFilters>({
    dateFilters: [
      {
        field: "created",
        startDate: "",
        endDate: "",
        preset: "last_30_days",
        includeTime: false,
        timeRange: ["00:00", "23:59"],
      },
    ],
    statusFilter: [],
    permitTypeFilter: [],
    stageFilter: [],
    waterSourceFilter: [],
    userTypeFilter: [],
    waterAllocationRange: [0, 1000],
    landSizeRange: [0, 500],
    processingTimeRange: [0, 365],
    regionFilter: "all",
    gpsAreaFilter: false,
    gpsLatRange: [-90, 90],
    gpsLngRange: [-180, 180],
    hasDocuments: null,
    hasComments: null,
    priorityFilter: [],
    expiryFilter: "all",
    searchText: "",
    searchFields: [],
    groupBy: "status",
    sortBy: "date",
    sortDirection: "desc",
    chartType: "bar",
    showTrends: false,
    showForecasts: false,
    compareWithPrevious: false,
  })

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const apps = await db.getApplications()
    setApplications(apps)
  }

  const handleFilterChange = (field: keyof AdvancedFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayFilterChange = (field: keyof AdvancedFilters, value: string, checked: boolean) => {
    const currentArray = (filters[field] as string[]) || []
    let updatedArray: string[]

    if (checked) {
      updatedArray = [...currentArray, value]
    } else {
      updatedArray = currentArray.filter((item) => item !== value)
    }

    handleFilterChange(field, updatedArray)
  }

  const handleDateFilterChange = (index: number, field: keyof DateFilter, value: any) => {
    const updatedDateFilters = [...filters.dateFilters]
    updatedDateFilters[index] = { ...updatedDateFilters[index], [field]: value }

    // Auto-set dates based on preset
    if (field === "preset" && value !== "custom") {
      const now = new Date()
      let startDate = new Date()

      switch (value) {
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
        case "this_week":
          const dayOfWeek = now.getDay()
          startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
          break
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "this_quarter":
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case "last_month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          now.setMonth(now.getMonth(), 0) // Last day of previous month
          break
        case "last_quarter":
          const lastQuarter = Math.floor(now.getMonth() / 3) - 1
          startDate = new Date(now.getFullYear(), lastQuarter * 3, 1)
          now.setMonth((lastQuarter + 1) * 3, 0)
          break
        case "last_year":
          startDate = new Date(now.getFullYear() - 1, 0, 1)
          now.setFullYear(now.getFullYear() - 1, 11, 31)
          break
      }

      updatedDateFilters[index].startDate = startDate.toISOString().split("T")[0]
      updatedDateFilters[index].endDate = now.toISOString().split("T")[0]
    }

    setFilters((prev) => ({ ...prev, dateFilters: updatedDateFilters }))
  }

  const addDateFilter = () => {
    const newFilter: DateFilter = {
      field: "created",
      startDate: "",
      endDate: "",
      preset: "custom",
      includeTime: false,
      timeRange: ["00:00", "23:59"],
    }
    setFilters((prev) => ({ ...prev, dateFilters: [...prev.dateFilters, newFilter] }))
  }

  const removeDateFilter = (index: number) => {
    if (filters.dateFilters.length > 1) {
      const updatedFilters = filters.dateFilters.filter((_, i) => i !== index)
      setFilters((prev) => ({ ...prev, dateFilters: updatedFilters }))
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Apply date filters
    filters.dateFilters.forEach((dateFilter) => {
      if (dateFilter.startDate && dateFilter.endDate) {
        const startDate = new Date(dateFilter.startDate)
        const endDate = new Date(dateFilter.endDate)

        if (dateFilter.includeTime) {
          const [startHour, startMin] = dateFilter.timeRange[0].split(":")
          const [endHour, endMin] = dateFilter.timeRange[1].split(":")
          startDate.setHours(Number.parseInt(startHour), Number.parseInt(startMin))
          endDate.setHours(Number.parseInt(endHour), Number.parseInt(endMin))
        } else {
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
        }

        filtered = filtered.filter((app) => {
          let dateToCheck: Date
          switch (dateFilter.field) {
            case "created":
              dateToCheck = app.createdAt
              break
            case "submitted":
              dateToCheck = app.submittedAt || app.createdAt
              break
            case "approved":
              dateToCheck = app.approvedAt || app.createdAt
              break
            case "updated":
              dateToCheck = app.updatedAt || app.createdAt
              break
            default:
              dateToCheck = app.createdAt
          }
          return dateToCheck >= startDate && dateToCheck <= endDate
        })
      }
    })

    // Apply other filters
    if (filters.statusFilter.length > 0) {
      filtered = filtered.filter((app) => filters.statusFilter.includes(app.status))
    }

    if (filters.permitTypeFilter.length > 0) {
      filtered = filtered.filter((app) => filters.permitTypeFilter.includes(app.permitType))
    }

    if (filters.stageFilter.length > 0) {
      filtered = filtered.filter((app) => filters.stageFilter.includes(app.currentStage?.toString() || "1"))
    }

    if (filters.waterSourceFilter.length > 0) {
      filtered = filtered.filter((app) => filters.waterSourceFilter.includes(app.waterSource))
    }

    // Range filters
    filtered = filtered.filter(
      (app) =>
        app.waterAllocation >= filters.waterAllocationRange[0] &&
        app.waterAllocation <= filters.waterAllocationRange[1],
    )

    filtered = filtered.filter(
      (app) => app.landSize >= filters.landSizeRange[0] && app.landSize <= filters.landSizeRange[1],
    )

    // GPS filtering
    if (filters.gpsAreaFilter) {
      filtered = filtered.filter(
        (app) =>
          app.gpsLatitude >= filters.gpsLatRange[0] &&
          app.gpsLatitude <= filters.gpsLatRange[1] &&
          app.gpsLongitude >= filters.gpsLngRange[0] &&
          app.gpsLongitude <= filters.gpsLngRange[1],
      )
    }

    // Document/Comments filters
    if (filters.hasDocuments !== null) {
      filtered = filtered.filter((app) =>
        filters.hasDocuments ? app.documents && app.documents.length > 0 : !app.documents || app.documents.length === 0,
      )
    }

    if (filters.hasComments !== null) {
      filtered = filtered.filter((app) =>
        filters.hasComments ? app.comments && app.comments.length > 0 : !app.comments || app.comments.length === 0,
      )
    }

    // Search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter((app) => {
        if (filters.searchFields.length === 0) {
          // Search all fields
          return (
            app.applicantName.toLowerCase().includes(searchLower) ||
            app.applicationId.toLowerCase().includes(searchLower) ||
            app.physicalAddress.toLowerCase().includes(searchLower) ||
            app.customerAccountNumber.toLowerCase().includes(searchLower) ||
            app.cellularNumber.toLowerCase().includes(searchLower) ||
            app.permitType.toLowerCase().includes(searchLower) ||
            app.waterSource.toLowerCase().includes(searchLower) ||
            (app.intendedUse && app.intendedUse.toLowerCase().includes(searchLower))
          )
        } else {
          // Search specific fields
          return filters.searchFields.some((field) => {
            switch (field) {
              case "applicantName":
                return app.applicantName.toLowerCase().includes(searchLower)
              case "applicationId":
                return app.applicationId.toLowerCase().includes(searchLower)
              case "address":
                return app.physicalAddress.toLowerCase().includes(searchLower)
              case "account":
                return app.customerAccountNumber.toLowerCase().includes(searchLower)
              case "phone":
                return app.cellularNumber.toLowerCase().includes(searchLower)
              case "permitType":
                return app.permitType.toLowerCase().includes(searchLower)
              case "waterSource":
                return app.waterSource.toLowerCase().includes(searchLower)
              case "intendedUse":
                return app.intendedUse && app.intendedUse.toLowerCase().includes(searchLower)
              default:
                return false
            }
          })
        }
      })
    }

    return filtered
  }

  const getStatistics = () => {
    const filtered = filterApplications()
    const total = filtered.length
    const approved = filtered.filter((app) => app.status === "approved").length
    const rejected = filtered.filter((app) => app.status === "rejected").length
    const pending = filtered.filter((app) => app.status === "submitted" || app.status === "under_review").length
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

    // Processing time analysis
    const processingTimes = filtered
      .filter((app) => app.approvedAt && app.submittedAt)
      .map((app) => Math.ceil((app.approvedAt!.getTime() - app.submittedAt!.getTime()) / (1000 * 60 * 60 * 24)))

    const avgProcessingTime =
      processingTimes.length > 0 ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length) : 0

    // Expiring permits
    const expiringSoon = filtered.filter((app) => {
      if (app.status !== "approved" || !app.approvedAt) return false
      const expiryDate = new Date(app.approvedAt)
      expiryDate.setFullYear(expiryDate.getFullYear() + 5)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate,
      expiringSoon,
      avgProcessingTime,
      totalWaterAllocation: filtered.reduce((sum, app) => sum + app.waterAllocation, 0),
      totalLandSize: filtered.reduce((sum, app) => sum + app.landSize, 0),
    }
  }

  const getChartData = () => {
    const filtered = filterApplications()

    switch (filters.groupBy) {
      case "status":
        return getStatusDistribution(filtered)
      case "permitType":
        return getPermitTypeDistribution(filtered)
      case "month":
        return getMonthlyTrends(filtered)
      case "stage":
        return getStageDistribution(filtered)
      case "waterSource":
        return getWaterSourceDistribution(filtered)
      default:
        return getStatusDistribution(filtered)
    }
  }

  const getStatusDistribution = (data: PermitApplication[]) => {
    const distribution = data.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).map(([status, count]) => ({
      name: status.replace("_", " ").toUpperCase(),
      value: count,
      percentage: Math.round((count / data.length) * 100),
    }))
  }

  const getPermitTypeDistribution = (data: PermitApplication[]) => {
    const distribution = data.reduce(
      (acc, app) => {
        acc[app.permitType] = (acc[app.permitType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.replace("_", " ").toUpperCase(),
      value: count,
      percentage: Math.round((count / data.length) * 100),
    }))
  }

  const getMonthlyTrends = (data: PermitApplication[]) => {
    const monthlyData = data.reduce(
      (acc, app) => {
        const month = app.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, applications: count, name: month, value: count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  const getStageDistribution = (data: PermitApplication[]) => {
    const distribution = data.reduce(
      (acc, app) => {
        const stage = `Stage ${app.currentStage || 1}`
        acc[stage] = (acc[stage] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).map(([stage, count]) => ({
      name: stage,
      value: count,
      percentage: Math.round((count / data.length) * 100),
    }))
  }

  const getWaterSourceDistribution = (data: PermitApplication[]) => {
    const distribution = data.reduce(
      (acc, app) => {
        acc[app.waterSource] = (acc[app.waterSource] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).map(([source, count]) => ({
      name: source.replace("_", " ").toUpperCase(),
      value: count,
      percentage: Math.round((count / data.length) * 100),
    }))
  }

  const exportReport = (format = "csv") => {
    const filtered = filterApplications()
    const stats = getStatistics()

    const reportData = [
      ["UMSCC PERMIT MANAGEMENT SYSTEM - ADVANCED REPORT"],
      ["Generated:", new Date().toLocaleString()],
      ["Filter Applied:", `${getActiveFiltersCount()} filters active`],
      [""],
      ["SUMMARY STATISTICS"],
      ["Total Applications:", stats.total],
      ["Approved:", stats.approved],
      ["Rejected:", stats.rejected],
      ["Pending:", stats.pending],
      ["Approval Rate:", `${stats.approvalRate}%`],
      ["Average Processing Time:", `${stats.avgProcessingTime} days`],
      ["Expiring Soon:", stats.expiringSoon],
      ["Total Water Allocation:", `${stats.totalWaterAllocation.toLocaleString()} ML`],
      ["Total Land Size:", `${stats.totalLandSize.toLocaleString()} ha`],
      [""],
      ["DETAILED APPLICATION DATA"],
      [
        "Application ID",
        "Applicant Name",
        "Permit Type",
        "Status",
        "Stage",
        "Water Source",
        "Water Allocation (ML)",
        "Land Size (ha)",
        "GPS Lat",
        "GPS Lng",
        "Created Date",
        "Submitted Date",
        "Approved Date",
        "Processing Days",
      ],
      ...filtered.map((app) => [
        app.applicationId,
        app.applicantName,
        app.permitType,
        app.status,
        app.currentStage || 1,
        app.waterSource,
        app.waterAllocation,
        app.landSize,
        app.gpsLatitude,
        app.gpsLongitude,
        app.createdAt.toLocaleDateString(),
        app.submittedAt?.toLocaleDateString() || "",
        app.approvedAt?.toLocaleDateString() || "",
        app.approvedAt && app.submittedAt
          ? Math.ceil((app.approvedAt.getTime() - app.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
          : "",
      ]),
    ]

    const csvContent = reportData.map((row) => (Array.isArray(row) ? row.join(",") : row)).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `umscc_advanced_report_${new Date().toISOString().split("T")[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAllFilters = () => {
    setFilters({
      dateFilters: [
        {
          field: "created",
          startDate: "",
          endDate: "",
          preset: "last_30_days",
          includeTime: false,
          timeRange: ["00:00", "23:59"],
        },
      ],
      statusFilter: [],
      permitTypeFilter: [],
      stageFilter: [],
      waterSourceFilter: [],
      userTypeFilter: [],
      waterAllocationRange: [0, 1000],
      landSizeRange: [0, 500],
      processingTimeRange: [0, 365],
      regionFilter: "all",
      gpsAreaFilter: false,
      gpsLatRange: [-90, 90],
      gpsLngRange: [-180, 180],
      hasDocuments: null,
      hasComments: null,
      priorityFilter: [],
      expiryFilter: "all",
      searchText: "",
      searchFields: [],
      groupBy: "status",
      sortBy: "date",
      sortDirection: "desc",
      chartType: "bar",
      showTrends: false,
      showForecasts: false,
      compareWithPrevious: false,
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0

    // Count date filters
    filters.dateFilters.forEach((df) => {
      if (df.startDate && df.endDate) count++
    })

    // Count array filters
    if (filters.statusFilter.length > 0) count++
    if (filters.permitTypeFilter.length > 0) count++
    if (filters.stageFilter.length > 0) count++
    if (filters.waterSourceFilter.length > 0) count++
    if (filters.userTypeFilter.length > 0) count++
    if (filters.priorityFilter.length > 0) count++
    if (filters.searchFields.length > 0) count++

    // Count other filters
    if (filters.regionFilter !== "all") count++
    if (filters.gpsAreaFilter) count++
    if (filters.hasDocuments !== null) count++
    if (filters.hasComments !== null) count++
    if (filters.expiryFilter !== "all") count++
    if (filters.searchText) count++
    if (filters.waterAllocationRange[0] > 0 || filters.waterAllocationRange[1] < 1000) count++
    if (filters.landSizeRange[0] > 0 || filters.landSizeRange[1] < 500) count++
    if (filters.processingTimeRange[0] > 0 || filters.processingTimeRange[1] < 365) count++

    return count
  }

  const stats = getStatistics()
  const chartData = getChartData()
  const filteredCount = filterApplications().length
  const activeFiltersCount = getActiveFiltersCount()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFCC02", "#FF6B6B", "#4ECDC4"]

  // --- helper to render the correct Recharts element ------------------------
  const renderChart = () => {
    switch (filters.chartType) {
      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        )
      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" />
          </LineChart>
        )
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
          </AreaChart>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card>
        <Collapsible open={isFiltersExpanded} onOpenChange={setIsFiltersExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Advanced Reports & Analytics Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount} active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredCount} of {applications.length} records
                  </Badge>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearAllFilters()
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersExpanded ? "rotate-180" : ""}`} />
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="calendar" className="flex items-center text-xs">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="filters" className="flex items-center text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Filters
                  </TabsTrigger>
                  <TabsTrigger value="ranges" className="flex items-center text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Ranges
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Analytics
                  </TabsTrigger>
                </TabsList>

                {/* Calendar Filters Tab */}
                <TabsContent value="calendar" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Date & Time Filters</Label>
                    <Button variant="outline" size="sm" onClick={addDateFilter}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Add Date Filter
                    </Button>
                  </div>

                  {filters.dateFilters.map((dateFilter, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="font-medium">Date Filter {index + 1}</Label>
                        {filters.dateFilters.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDateFilter(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm">Date Field</Label>
                          <Select
                            value={dateFilter.field}
                            onValueChange={(value) => handleDateFilterChange(index, "field", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created">Created Date</SelectItem>
                              <SelectItem value="submitted">Submitted Date</SelectItem>
                              <SelectItem value="approved">Approved Date</SelectItem>
                              <SelectItem value="updated">Last Updated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Date Preset</Label>
                          <Select
                            value={dateFilter.preset}
                            onValueChange={(value) => handleDateFilterChange(index, "preset", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="yesterday">Yesterday</SelectItem>
                              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                              <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                              <SelectItem value="this_week">This Week</SelectItem>
                              <SelectItem value="this_month">This Month</SelectItem>
                              <SelectItem value="this_quarter">This Quarter</SelectItem>
                              <SelectItem value="this_year">This Year</SelectItem>
                              <SelectItem value="last_month">Last Month</SelectItem>
                              <SelectItem value="last_quarter">Last Quarter</SelectItem>
                              <SelectItem value="last_year">Last Year</SelectItem>
                              <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Start Date</Label>
                          <Input
                            type="date"
                            value={dateFilter.startDate}
                            onChange={(e) => handleDateFilterChange(index, "startDate", e.target.value)}
                          />
                        </div>

                        <div>
                          <Label className="text-sm">End Date</Label>
                          <Input
                            type="date"
                            value={dateFilter.endDate}
                            onChange={(e) => handleDateFilterChange(index, "endDate", e.target.value)}
                            min={dateFilter.startDate}
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`includeTime-${index}`}
                            checked={dateFilter.includeTime}
                            onCheckedChange={(checked) => handleDateFilterChange(index, "includeTime", checked)}
                          />
                          <Label htmlFor={`includeTime-${index}`} className="text-sm">
                            Include specific time range
                          </Label>
                        </div>

                        {dateFilter.includeTime && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Start Time</Label>
                              <Input
                                type="time"
                                value={dateFilter.timeRange[0]}
                                onChange={(e) =>
                                  handleDateFilterChange(index, "timeRange", [e.target.value, dateFilter.timeRange[1]])
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-sm">End Time</Label>
                              <Input
                                type="time"
                                value={dateFilter.timeRange[1]}
                                onChange={(e) =>
                                  handleDateFilterChange(index, "timeRange", [dateFilter.timeRange[0], e.target.value])
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {/* Filters Tab */}
                <TabsContent value="filters" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Application Status</Label>
                      <div className="space-y-2">
                        {["unsubmitted", "submitted", "under_review", "approved", "rejected"].map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={filters.statusFilter.includes(status)}
                              onCheckedChange={(checked) => handleArrayFilterChange("statusFilter", status, !!checked)}
                            />
                            <Label htmlFor={`status-${status}`} className="capitalize text-sm">
                              {status.replace("_", " ")}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Workflow Stage</Label>
                      <div className="space-y-2">
                        {[
                          { value: "1", label: "Stage 1 - Permitting Officer" },
                          { value: "2", label: "Stage 2 - Chairperson" },
                          { value: "3", label: "Stage 3 - Catchment Manager" },
                          { value: "4", label: "Stage 4 - Catchment Chairperson" },
                        ].map((stage) => (
                          <div key={stage.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`stage-${stage.value}`}
                              checked={filters.stageFilter.includes(stage.value)}
                              onCheckedChange={(checked) =>
                                handleArrayFilterChange("stageFilter", stage.value, !!checked)
                              }
                            />
                            <Label htmlFor={`stage-${stage.value}`} className="text-sm">
                              {stage.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Permit Types</Label>
                      <div className="space-y-2">
                        {[
                          "urban",
                          "bulk_water",
                          "irrigation",
                          "institution",
                          "industrial",
                          "surface_water_storage",
                          "surface_water_flow",
                          "tempering",
                        ].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permit-${type}`}
                              checked={filters.permitTypeFilter.includes(type)}
                              onCheckedChange={(checked) =>
                                handleArrayFilterChange("permitTypeFilter", type, !!checked)
                              }
                            />
                            <Label htmlFor={`permit-${type}`} className="capitalize text-sm">
                              {type.replace("_", " ")}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Water Source</Label>
                      <div className="space-y-2">
                        {["ground_water", "surface_water"].map((source) => (
                          <div key={source} className="flex items-center space-x-2">
                            <Checkbox
                              id={`source-${source}`}
                              checked={filters.waterSourceFilter.includes(source)}
                              onCheckedChange={(checked) =>
                                handleArrayFilterChange("waterSourceFilter", source, !!checked)
                              }
                            />
                            <Label htmlFor={`source-${source}`} className="capitalize text-sm">
                              {source.replace("_", " ")}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Search Filters */}
                  <div className="border-t pt-4 space-y-4">
                    <Label className="text-base font-medium">Search & Text Filters</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Search Text</Label>
                        <Input
                          placeholder="Search applications..."
                          value={filters.searchText}
                          onChange={(e) => handleFilterChange("searchText", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Search In Fields (leave empty for all)</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { value: "applicantName", label: "Name" },
                            { value: "applicationId", label: "ID" },
                            { value: "address", label: "Address" },
                            { value: "account", label: "Account" },
                            { value: "phone", label: "Phone" },
                            { value: "permitType", label: "Type" },
                            { value: "waterSource", label: "Source" },
                            { value: "intendedUse", label: "Use" },
                          ].map((field) => (
                            <div key={field.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`search-${field.value}`}
                                checked={filters.searchFields.includes(field.value)}
                                onCheckedChange={(checked) =>
                                  handleArrayFilterChange("searchFields", field.value, !!checked)
                                }
                              />
                              <Label htmlFor={`search-${field.value}`} className="text-xs">
                                {field.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document & Comments Filters */}
                  <div className="border-t pt-4 space-y-4">
                    <Label className="text-base font-medium">Content Filters</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Documents</Label>
                        <Select
                          value={filters.hasDocuments === null ? "all" : filters.hasDocuments ? "yes" : "no"}
                          onValueChange={(value) =>
                            handleFilterChange("hasDocuments", value === "all" ? null : value === "yes")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Applications</SelectItem>
                            <SelectItem value="yes">With Documents</SelectItem>
                            <SelectItem value="no">Without Documents</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Comments</Label>
                        <Select
                          value={filters.hasComments === null ? "all" : filters.hasComments ? "yes" : "no"}
                          onValueChange={(value) =>
                            handleFilterChange("hasComments", value === "all" ? null : value === "yes")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Applications</SelectItem>
                            <SelectItem value="yes">With Comments</SelectItem>
                            <SelectItem value="no">Without Comments</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Expiry Status</Label>
                        <Select
                          value={filters.expiryFilter}
                          onValueChange={(value) => handleFilterChange("expiryFilter", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Permits</SelectItem>
                            <SelectItem value="expiring_soon">Expiring Soon (30 days)</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="valid">Valid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Ranges Tab */}
                <TabsContent value="ranges" className="space-y-6">
                  <Label className="text-base font-medium">Range Filters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0 ML</span>
                        <span>1000 ML</span>
                      </div>
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
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0 ha</span>
                        <span>500 ha</span>
                      </div>
                    </div>

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
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0 days</span>
                        <span>365 days</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm">Region Filter</Label>
                      <Select
                        value={filters.regionFilter}
                        onValueChange={(value) => handleFilterChange("regionFilter", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Regions</SelectItem>
                          <SelectItem value="north">North Region</SelectItem>
                          <SelectItem value="south">South Region</SelectItem>
                          <SelectItem value="east">East Region</SelectItem>
                          <SelectItem value="west">West Region</SelectItem>
                          <SelectItem value="central">Central Region</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="gpsAreaFilter"
                        checked={filters.gpsAreaFilter}
                        onCheckedChange={(checked) => handleFilterChange("gpsAreaFilter", checked)}
                      />
                      <Label htmlFor="gpsAreaFilter" className="text-sm">
                        Enable GPS coordinate filtering
                      </Label>
                    </div>
                  </div>

                  {filters.gpsAreaFilter && (
                    <div className="border-t pt-4 space-y-4">
                      <Label className="text-base font-medium">GPS Coordinate Ranges</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Latitude Range: {filters.gpsLatRange[0]} - {filters.gpsLatRange[1]}
                          </Label>
                          <Slider
                            value={filters.gpsLatRange}
                            onValueChange={(value) => handleFilterChange("gpsLatRange", value)}
                            min={-90}
                            max={90}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>-90°</span>
                            <span>90°</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Longitude Range: {filters.gpsLngRange[0]} - {filters.gpsLngRange[1]}
                          </Label>
                          <Slider
                            value={filters.gpsLngRange}
                            onValueChange={(value) => handleFilterChange("gpsLngRange", value)}
                            min={-180}
                            max={180}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>-180°</span>
                            <span>180°</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm">Group By</Label>
                      <Select value={filters.groupBy} onValueChange={(value) => handleFilterChange("groupBy", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="permitType">Permit Type</SelectItem>
                          <SelectItem value="stage">Workflow Stage</SelectItem>
                          <SelectItem value="waterSource">Water Source</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Chart Type</Label>
                      <Select
                        value={filters.chartType}
                        onValueChange={(value) => handleFilterChange("chartType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Sort By</Label>
                      <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="value">Value</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Analytics Options</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showTrends"
                          checked={filters.showTrends}
                          onCheckedChange={(checked) => handleFilterChange("showTrends", checked)}
                        />
                        <Label htmlFor="showTrends" className="text-sm">
                          Show trend analysis
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showForecasts"
                          checked={filters.showForecasts}
                          onCheckedChange={(checked) => handleFilterChange("showForecasts", checked)}
                        />
                        <Label htmlFor="showForecasts" className="text-sm">
                          Include forecasts
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="compareWithPrevious"
                          checked={filters.compareWithPrevious}
                          onCheckedChange={(checked) => handleFilterChange("compareWithPrevious", checked)}
                        />
                        <Label htmlFor="compareWithPrevious" className="text-sm">
                          Compare with previous period
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.totalWaterAllocation.toLocaleString()} ML total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.approved} approved</p>
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
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">days average</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Data Visualization</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportReport("csv")}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {renderChart()}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtered Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{filteredCount}</div>
                  <div className="text-sm text-blue-800">Filtered Records</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{applications.length}</div>
                  <div className="text-sm text-green-800">Total Records</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Water Allocation:</span>
                  <span className="text-sm font-medium">{stats.totalWaterAllocation.toLocaleString()} ML</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Land Size:</span>
                  <span className="text-sm font-medium">{stats.totalLandSize.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Processing Time:</span>
                  <span className="text-sm font-medium">{stats.avgProcessingTime} days</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => exportReport("excel")} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Detailed Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
