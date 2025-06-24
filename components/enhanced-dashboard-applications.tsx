"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Filter,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  X,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  AlertTriangle,
  Users,
  TrendingUp,
} from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { PermittingOfficerAdvancedAnalytics } from "./permitting-officer-advanced-analytics"

interface EnhancedDashboardApplicationsProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (app: PermitApplication) => void
  onViewApplication: (app: PermitApplication) => void
}

interface AdvancedFilters {
  // Search and text filters
  searchTerm: string
  applicantNameFilter: string
  addressFilter: string

  // Date filters
  dateFilterType: "all" | "created" | "submitted" | "approved" | "custom"
  dateRange: string
  startDate: string
  endDate: string

  // Status and workflow filters
  statusFilter: string[]
  workflowStageFilter: string[]
  currentStageFilter: string[]

  // Permit classification filters
  permitTypeFilter: string[]
  intendedUseFilter: string[]
  waterSourceFilter: string[]

  // Numeric range filters
  waterAllocationRange: number[]
  landSizeRange: number[]
  validityPeriodRange: number[]
  numberOfBoreholesRange: number[]

  // Priority and assignment filters
  priorityFilter: string[]
  assignmentFilter: string
  overdueFilter: boolean
  documentsCompleteFilter: string

  // Sorting options
  sortBy: string
  sortOrder: "asc" | "desc"
  groupBy: string

  // Display options
  showArchived: boolean
  showDrafts: boolean
  compactView: boolean
}

export const EnhancedDashboardApplications = forwardRef<
  { refreshApplications: () => void },
  EnhancedDashboardApplicationsProps
>(({ user, onNewApplication, onEditApplication, onViewApplication }, ref) => {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [isLoading, setIsLoading] = useState(false)

  const [filters, setFilters] = useState<AdvancedFilters>({
    // Search and text filters
    searchTerm: "",
    applicantNameFilter: "",
    addressFilter: "",

    // Date filters
    dateFilterType: "all",
    dateRange: "all",
    startDate: "",
    endDate: "",

    // Status and workflow filters
    statusFilter: [],
    workflowStageFilter: [],
    currentStageFilter: [],

    // Permit classification filters
    permitTypeFilter: [],
    intendedUseFilter: [],
    waterSourceFilter: [],

    // Numeric range filters
    waterAllocationRange: [0, 1000],
    landSizeRange: [0, 500],
    validityPeriodRange: [1, 25],
    numberOfBoreholesRange: [1, 20],

    // Priority and assignment filters
    priorityFilter: [],
    assignmentFilter: "all",
    overdueFilter: false,
    documentsCompleteFilter: "all",

    // Sorting options
    sortBy: "createdAt",
    sortOrder: "desc",
    groupBy: "none",

    // Display options
    showArchived: false,
    showDrafts: true, // Make sure this is true by default
    compactView: false,
  })

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters])

  useImperativeHandle(ref, () => ({
    refreshApplications: loadApplications,
  }))

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      console.log("Loading applications...") // Add debugging
      const apps = await db.getApplications()
      console.log(
        "Loaded applications:",
        apps.length,
        apps.map((app) => ({
          id: app.applicationId,
          applicant: app.applicantName,
          status: app.status,
        })),
      ) // Add debugging
      setApplications(apps)
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    console.log("Applying filters to", applications.length, "applications") // Add debugging
    let filtered = [...applications]

    // Always show applications created by the current user, regardless of status
    // Only filter out other users' unsubmitted applications if showDrafts is false
    // Search term filter (searches across multiple fields)
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicationId.toLowerCase().includes(searchTerm) ||
          app.applicantName.toLowerCase().includes(searchTerm) ||
          app.physicalAddress.toLowerCase().includes(searchTerm) ||
          app.postalAddress.toLowerCase().includes(searchTerm) ||
          app.permitType.toLowerCase().includes(searchTerm) ||
          app.intendedUse.toLowerCase().includes(searchTerm) ||
          app.waterSource.toLowerCase().includes(searchTerm) ||
          app.comments.toLowerCase().includes(searchTerm),
      )
    }

    // Specific field filters
    if (filters.applicantNameFilter) {
      const nameFilter = filters.applicantNameFilter.toLowerCase()
      filtered = filtered.filter((app) => app.applicantName.toLowerCase().includes(nameFilter))
    }

    if (filters.addressFilter) {
      const addressFilter = filters.addressFilter.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.physicalAddress.toLowerCase().includes(addressFilter) ||
          app.postalAddress.toLowerCase().includes(addressFilter),
      )
    }

    // Date filters
    if (filters.dateFilterType !== "all") {
      const now = new Date()
      let startDate: Date | null = null
      let endDate: Date | null = null

      if (filters.dateRange !== "all" && filters.dateRange !== "custom") {
        switch (filters.dateRange) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case "yesterday":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
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
          case "last_month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0)
            break
          case "this_year":
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          case "last_year":
            startDate = new Date(now.getFullYear() - 1, 0, 1)
            endDate = new Date(now.getFullYear(), 0, 0)
            break
        }
      } else if (filters.dateRange === "custom") {
        if (filters.startDate) startDate = new Date(filters.startDate)
        if (filters.endDate) endDate = new Date(filters.endDate)
      }

      if (startDate || endDate) {
        filtered = filtered.filter((app) => {
          let dateToCheck: Date

          switch (filters.dateFilterType) {
            case "created":
              dateToCheck = app.createdAt
              break
            case "submitted":
              if (!app.submittedAt) return false
              dateToCheck = app.submittedAt
              break
            case "approved":
              if (!app.approvedAt) return false
              dateToCheck = app.approvedAt
              break
            default:
              dateToCheck = app.createdAt
          }

          if (startDate && dateToCheck < startDate) return false
          if (endDate && dateToCheck > endDate) return false
          return true
        })
      }
    }

    // Status filters
    if (filters.statusFilter.length > 0) {
      filtered = filtered.filter((app) => filters.statusFilter.includes(app.status))
    }

    // Workflow stage filters
    if (filters.currentStageFilter.length > 0) {
      filtered = filtered.filter((app) => filters.currentStageFilter.includes(app.currentStage.toString()))
    }

    // Permit classification filters
    if (filters.permitTypeFilter.length > 0) {
      filtered = filtered.filter((app) => filters.permitTypeFilter.includes(app.permitType))
    }

    if (filters.intendedUseFilter.length > 0) {
      filtered = filtered.filter((app) => filters.intendedUseFilter.includes(app.intendedUse))
    }

    if (filters.waterSourceFilter.length > 0) {
      filtered = filtered.filter((app) => filters.waterSourceFilter.includes(app.waterSource))
    }

    // Numeric range filters
    const [minWater, maxWater] = filters.waterAllocationRange
    filtered = filtered.filter((app) => app.waterAllocation >= minWater && app.waterAllocation <= maxWater)

    const [minLand, maxLand] = filters.landSizeRange
    filtered = filtered.filter((app) => app.landSize >= minLand && app.landSize <= maxLand)

    const [minValidity, maxValidity] = filters.validityPeriodRange
    filtered = filtered.filter((app) => app.validityPeriod >= minValidity && app.validityPeriod <= maxValidity)

    const [minBoreholes, maxBoreholes] = filters.numberOfBoreholesRange
    filtered = filtered.filter((app) => app.numberOfBoreholes >= minBoreholes && app.numberOfBoreholes <= maxBoreholes)

    // Assignment filter
    if (filters.assignmentFilter === "assigned_to_me") {
      filtered = filtered.filter((app) => app.createdBy === user.id || app.currentStage === 1)
    } else if (filters.assignmentFilter === "unassigned") {
      filtered = filtered.filter((app) => !app.createdBy || app.currentStage === 0)
    }

    // Overdue filter
    if (filters.overdueFilter) {
      filtered = filtered.filter((app) => {
        if (!app.submittedAt) return false
        const daysSinceSubmission = Math.ceil(
          (Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24),
        )
        return daysSinceSubmission > 30 && app.status !== "approved" && app.status !== "rejected"
      })
    }

    // Documents complete filter
    if (filters.documentsCompleteFilter === "complete") {
      filtered = filtered.filter((app) => app.documents && app.documents.length >= 3) // Assuming 3 required docs
    } else if (filters.documentsCompleteFilter === "incomplete") {
      filtered = filtered.filter((app) => !app.documents || app.documents.length < 3)
    }

    // Show/hide options
    if (!filters.showDrafts) {
      filtered = filtered.filter((app) => app.status !== "unsubmitted")
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "createdAt":
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case "submittedAt":
          aValue = a.submittedAt?.getTime() || 0
          bValue = b.submittedAt?.getTime() || 0
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
        case "priority":
          aValue = getPriorityScore(a)
          bValue = getPriorityScore(b)
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

    console.log("Filtered applications:", filtered.length) // Add debugging
    setFilteredApplications(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const getPriorityScore = (app: PermitApplication) => {
    let score = 0
    if (app.waterAllocation > 100) score += 3
    if (app.landSize > 50) score += 2
    if (app.permitType === "industrial" || app.permitType === "bulk_water") score += 3
    if (isOverdue(app)) score += 5
    return score
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

  const clearAllFilters = () => {
    setFilters({
      searchTerm: "",
      applicantNameFilter: "",
      addressFilter: "",
      dateFilterType: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
      statusFilter: [],
      workflowStageFilter: [],
      currentStageFilter: [],
      permitTypeFilter: [],
      intendedUseFilter: [],
      waterSourceFilter: [],
      waterAllocationRange: [0, 1000],
      landSizeRange: [0, 500],
      validityPeriodRange: [1, 25],
      numberOfBoreholesRange: [1, 20],
      priorityFilter: [],
      assignmentFilter: "all",
      overdueFilter: false,
      documentsCompleteFilter: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
      groupBy: "none",
      showArchived: false,
      showDrafts: true,
      compactView: false,
    })
  }

  const exportFilteredData = () => {
    const csvData = [
      [
        "Application ID",
        "Applicant Name",
        "Status",
        "Current Stage",
        "Permit Type",
        "Intended Use",
        "Water Source",
        "Water Allocation (ML)",
        "Land Size (ha)",
        "Number of Boreholes",
        "Validity Period (years)",
        "Physical Address",
        "Postal Address",
        "Cellular Number",
        "Customer Account Number",
        "Created Date",
        "Submitted Date",
        "Approved Date",
        "Processing Days",
        "Priority Score",
        "Is Overdue",
        "Documents Count",
      ],
      ...filteredApplications.map((app) => [
        app.applicationId,
        app.applicantName,
        app.status,
        app.currentStage,
        app.permitType,
        app.intendedUse,
        app.waterSource,
        app.waterAllocation,
        app.landSize,
        app.numberOfBoreholes,
        app.validityPeriod,
        app.physicalAddress,
        app.postalAddress,
        app.cellularNumber,
        app.customerAccountNumber,
        app.createdAt.toLocaleDateString(),
        app.submittedAt?.toLocaleDateString() || "N/A",
        app.approvedAt?.toLocaleDateString() || "N/A",
        getProcessingDays(app) || "N/A",
        getPriorityScore(app),
        isOverdue(app) ? "Yes" : "No",
        app.documents?.length || 0,
      ]),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `applications_export_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getProcessingDays = (app: PermitApplication) => {
    if (!app.submittedAt) return null
    if (app.approvedAt) {
      return Math.ceil(
        (new Date(app.approvedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24),
      )
    }
    return Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  const isOverdue = (app: PermitApplication) => {
    const processingDays = getProcessingDays(app)
    return processingDays !== null && processingDays > 30 && app.status !== "approved" && app.status !== "rejected"
  }

  const isHighPriority = (app: PermitApplication) => {
    return getPriorityScore(app) >= 5
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "under_review":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "submitted":
        return <FileText className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      rejected: "destructive",
      under_review: "secondary",
      submitted: "outline",
      unsubmitted: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const getPriorityBadge = (app: PermitApplication) => {
    const score = getPriorityScore(app)
    if (score >= 8) return <Badge variant="destructive">Critical</Badge>
    if (score >= 5) return <Badge variant="secondary">High</Badge>
    if (score >= 3) return <Badge variant="outline">Medium</Badge>
    return <Badge variant="outline">Normal</Badge>
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) return true
    if (typeof value === "boolean" && value && key !== "showDrafts") return true
    if (typeof value === "string" && value && value !== "all" && value !== "" && value !== "none") return true
    if (key.includes("Range") && Array.isArray(value)) {
      const [min, max] = value
      const defaultRanges = {
        waterAllocationRange: [0, 1000],
        landSizeRange: [0, 500],
        validityPeriodRange: [1, 25],
        numberOfBoreholesRange: [1, 20],
      }
      const [defaultMin, defaultMax] = defaultRanges[key as keyof typeof defaultRanges] || [0, 100]
      return min > defaultMin || max < defaultMax
    }
    return false
  }).length

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex)

  // Quick stats
  const quickStats = {
    total: filteredApplications.length,
    submitted: filteredApplications.filter((app) => app.status === "submitted").length,
    underReview: filteredApplications.filter((app) => app.status === "under_review").length,
    approved: filteredApplications.filter((app) => app.status === "approved").length,
    rejected: filteredApplications.filter((app) => app.status === "rejected").length,
    overdue: filteredApplications.filter((app) => isOverdue(app)).length,
    highPriority: filteredApplications.filter((app) => isHighPriority(app)).length,
    assignedToMe: filteredApplications.filter((app) => app.createdBy === user.id || app.currentStage === 1).length,
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {quickStats.submitted} submitted, {quickStats.underReview} under review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Workload</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.assignedToMe}</div>
            <p className="text-xs text-muted-foreground">Applications assigned to me</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{quickStats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {quickStats.overdue} overdue, {quickStats.highPriority} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quickStats.approved + quickStats.rejected > 0
                ? Math.round((quickStats.approved / (quickStats.approved + quickStats.rejected)) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {quickStats.approved} approved, {quickStats.rejected} rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debug Panel removed to fix NODE_ENV client-side access issue */}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="applications" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button onClick={onNewApplication}>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
            <Button variant="outline" onClick={exportFilteredData} disabled={filteredApplications.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={loadApplications} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="applications" className="space-y-4">
          {/* Advanced Filters Panel */}
          <Card>
            <Collapsible open={isFiltersExpanded} onOpenChange={setIsFiltersExpanded}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="h-5 w-5 mr-2" />
                      Advanced Filters & Search
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount} active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
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
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isFiltersExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Search Filters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">Search & Text Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Global Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search across all fields..."
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Applicant Name</Label>
                        <Input
                          placeholder="Filter by applicant name..."
                          value={filters.applicantNameFilter}
                          onChange={(e) => handleFilterChange("applicantNameFilter", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          placeholder="Filter by address..."
                          value={filters.addressFilter}
                          onChange={(e) => handleFilterChange("addressFilter", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Date Filters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">Date Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Date Type</Label>
                        <Select
                          value={filters.dateFilterType}
                          onValueChange={(value) => handleFilterChange("dateFilterType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Dates</SelectItem>
                            <SelectItem value="created">Created Date</SelectItem>
                            <SelectItem value="submitted">Submitted Date</SelectItem>
                            <SelectItem value="approved">Approved Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date Range</Label>
                        <Select
                          value={filters.dateRange}
                          onValueChange={(value) => handleFilterChange("dateRange", value)}
                        >
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
                            <SelectItem value="last_month">Last Month</SelectItem>
                            <SelectItem value="this_year">This Year</SelectItem>
                            <SelectItem value="last_year">Last Year</SelectItem>
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
                    </div>
                  </div>

                  <Separator />

                  {/* Status and Workflow Filters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">Status & Workflow Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Application Status</Label>
                        <div className="space-y-2">
                          {["unsubmitted", "submitted", "under_review", "approved", "rejected"].map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`status-${status}`}
                                checked={filters.statusFilter.includes(status)}
                                onCheckedChange={(checked) =>
                                  handleArrayFilterChange("statusFilter", status, !!checked)
                                }
                              />
                              <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                                {status.replace("_", " ")}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Current Stage</Label>
                        <div className="space-y-2">
                          {["0", "1", "2", "3", "4", "5"].map((stage) => (
                            <div key={stage} className="flex items-center space-x-2">
                              <Checkbox
                                id={`stage-${stage}`}
                                checked={filters.currentStageFilter.includes(stage)}
                                onCheckedChange={(checked) =>
                                  handleArrayFilterChange("currentStageFilter", stage, !!checked)
                                }
                              />
                              <Label htmlFor={`stage-${stage}`} className="text-sm">
                                Stage {stage}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Assignment & Priority</Label>
                        <div className="space-y-2">
                          <div>
                            <Label>Assignment</Label>
                            <Select
                              value={filters.assignmentFilter}
                              onValueChange={(value) => handleFilterChange("assignmentFilter", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Applications</SelectItem>
                                <SelectItem value="assigned_to_me">Assigned to Me</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="overdue"
                              checked={filters.overdueFilter}
                              onCheckedChange={(checked) => handleFilterChange("overdueFilter", checked)}
                            />
                            <Label htmlFor="overdue" className="text-sm">
                              Show overdue only
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Permit Classification Filters */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">Permit Classification Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Permit Type</Label>
                        <div className="space-y-2">
                          {[
                            "urban",
                            "bulk_water",
                            "irrigation",
                            "institution",
                            "industrial",
                            "surface_water_storage",
                          ].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`permit-${type}`}
                                checked={filters.permitTypeFilter.includes(type)}
                                onCheckedChange={(checked) =>
                                  handleArrayFilterChange("permitTypeFilter", type, !!checked)
                                }
                              />
                              <Label htmlFor={`permit-${type}`} className="text-sm capitalize">
                                {type.replace("_", " ")}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Intended Use</Label>
                        <div className="space-y-2">
                          {["domestic", "irrigation", "industrial", "commercial", "institutional", "livestock"].map(
                            (use) => (
                              <div key={use} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`use-${use}`}
                                  checked={filters.intendedUseFilter.includes(use)}
                                  onCheckedChange={(checked) =>
                                    handleArrayFilterChange("intendedUseFilter", use, !!checked)
                                  }
                                />
                                <Label htmlFor={`use-${use}`} className="text-sm capitalize">
                                  {use}
                                </Label>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Water Source</Label>
                        <div className="space-y-2">
                          {["borehole", "surface_water", "spring", "well", "river", "dam"].map((source) => (
                            <div key={source} className="flex items-center space-x-2">
                              <Checkbox
                                id={`source-${source}`}
                                checked={filters.waterSourceFilter.includes(source)}
                                onCheckedChange={(checked) =>
                                  handleArrayFilterChange("waterSourceFilter", source, !!checked)
                                }
                              />
                              <Label htmlFor={`source-${source}`} className="text-sm capitalize">
                                {source.replace("_", " ")}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Sorting Options */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">Sorting Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Sort By</Label>
                        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="createdAt">Created Date</SelectItem>
                            <SelectItem value="submittedAt">Submitted Date</SelectItem>
                            <SelectItem value="applicantName">Applicant Name</SelectItem>
                            <SelectItem value="waterAllocation">Water Allocation</SelectItem>
                            <SelectItem value="landSize">Land Size</SelectItem>
                            <SelectItem value="processingTime">Processing Time</SelectItem>
                            <SelectItem value="priority">Priority Score</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Sort Order</Label>
                        <Select
                          value={filters.sortOrder}
                          onValueChange={(value) => handleFilterChange("sortOrder", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">
                              <div className="flex items-center">
                                <SortDesc className="h-4 w-4 mr-2" />
                                Descending
                              </div>
                            </SelectItem>
                            <SelectItem value="asc">
                              <div className="flex items-center">
                                <SortAsc className="h-4 w-4 mr-2" />
                                Ascending
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Items per Page</Label>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => setItemsPerPage(Number.parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Applications ({filteredApplications.length})
                  {activeFiltersCount > 0 && (
                    <Badge variant="outline" className="ml-2">
                      Filtered
                    </Badge>
                  )}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compactView"
                      checked={filters.compactView}
                      onCheckedChange={(checked) => handleFilterChange("compactView", checked)}
                    />
                    <Label htmlFor="compactView" className="text-sm">
                      Compact view
                    </Label>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedApplications.length === paginatedApplications.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedApplications(paginatedApplications.map((app) => app.id))
                            } else {
                              setSelectedApplications([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Permit Type</TableHead>
                      <TableHead>Water (ML)</TableHead>
                      <TableHead>Land (ha)</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Processing Days</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApplications.map((app) => (
                      <TableRow
                        key={app.id}
                        className={`${isOverdue(app) ? "bg-red-50" : ""} ${
                          isHighPriority(app) ? "border-l-4 border-l-orange-400" : ""
                        }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedApplications.includes(app.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedApplications([...selectedApplications, app.id])
                              } else {
                                setSelectedApplications(selectedApplications.filter((id) => id !== app.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <span>{app.applicationId}</span>
                            {isOverdue(app) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={filters.compactView ? "text-sm" : ""}>
                            <div className="font-medium">{app.applicantName}</div>
                            {!filters.compactView && (
                              <div className="text-sm text-gray-500 max-w-xs truncate" title={app.physicalAddress}>
                                {app.physicalAddress}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Stage {app.currentStage}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{app.permitType.replace("_", " ")}</TableCell>
                        <TableCell>{app.waterAllocation}</TableCell>
                        <TableCell>{app.landSize}</TableCell>
                        <TableCell>{getPriorityBadge(app)}</TableCell>
                        <TableCell className="text-sm">{app.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {getProcessingDays(app) ? (
                            <span className={getProcessingDays(app)! > 30 ? "text-red-600 font-medium" : ""}>
                              {getProcessingDays(app)} days
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onViewApplication(app)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {(app.status === "unsubmitted" || user.userType === "ict") && (
                                <DropdownMenuItem onClick={() => onEditApplication(app)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Export Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of{" "}
                    {filteredApplications.length} applications
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <PermittingOfficerAdvancedAnalytics user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
})

EnhancedDashboardApplications.displayName = "EnhancedDashboardApplications"
