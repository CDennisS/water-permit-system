"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
} from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"

interface PermittingOfficerApplicationsTableProps {
  user: User
  onViewApplication: (app: PermitApplication) => void
  onEditApplication: (app: PermitApplication) => void
}

interface TableFilters {
  search: string
  statusFilter: string[]
  permitTypeFilter: string[]
  dateRange: string
  startDate: string
  endDate: string
  waterAllocationRange: number[]
  landSizeRange: number[]
  processingTimeRange: number[]
  priorityFilter: string[]
  regionFilter: string
  showOnlyAssignedToMe: boolean
  showOverdueOnly: boolean
  showHighPriorityOnly: boolean
  sortBy: string
  sortOrder: "asc" | "desc"
}

export function PermittingOfficerApplicationsTable({
  user,
  onViewApplication,
  onEditApplication,
}: PermittingOfficerApplicationsTableProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const [filters, setFilters] = useState<TableFilters>({
    search: "",
    statusFilter: [],
    permitTypeFilter: [],
    dateRange: "all",
    startDate: "",
    endDate: "",
    waterAllocationRange: [0, 1000],
    landSizeRange: [0, 500],
    processingTimeRange: [0, 365],
    priorityFilter: [],
    regionFilter: "all",
    showOnlyAssignedToMe: false,
    showOverdueOnly: false,
    showHighPriorityOnly: false,
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

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicationId.toLowerCase().includes(searchTerm) ||
          app.applicantName.toLowerCase().includes(searchTerm) ||
          app.physicalAddress.toLowerCase().includes(searchTerm) ||
          app.permitType.toLowerCase().includes(searchTerm),
      )
    }

    // Status filter
    if (filters.statusFilter.length > 0) {
      filtered = filtered.filter((app) => filters.statusFilter.includes(app.status))
    }

    // Permit type filter
    if (filters.permitTypeFilter.length > 0) {
      filtered = filtered.filter((app) => filters.permitTypeFilter.includes(app.permitType))
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
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

    // Range filters
    const [minWater, maxWater] = filters.waterAllocationRange
    filtered = filtered.filter((app) => app.waterAllocation >= minWater && app.waterAllocation <= maxWater)

    const [minLand, maxLand] = filters.landSizeRange
    filtered = filtered.filter((app) => app.landSize >= minLand && app.landSize <= maxLand)

    // Processing time filter
    const [minDays, maxDays] = filters.processingTimeRange
    filtered = filtered.filter((app) => {
      if (!app.submittedAt) return true
      const processingDays = app.approvedAt
        ? Math.ceil((new Date(app.approvedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
      return processingDays >= minDays && processingDays <= maxDays
    })

    // Quick filters
    if (filters.showOnlyAssignedToMe) {
      filtered = filtered.filter((app) => app.createdBy === user.id || app.currentStage === 1)
    }

    if (filters.showOverdueOnly) {
      filtered = filtered.filter((app) => {
        if (!app.submittedAt) return false
        const daysSinceSubmission = Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceSubmission > 30 && app.status !== "approved" && app.status !== "rejected"
      })
    }

    if (filters.showHighPriorityOnly) {
      filtered = filtered.filter(
        (app) =>
          app.waterAllocation > 100 ||
          app.landSize > 50 ||
          app.permitType === "industrial" ||
          app.permitType === "bulk_water",
      )
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
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleFilterChange = (key: keyof TableFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleArrayFilterChange = (key: keyof TableFilters, value: string, checked: boolean) => {
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
      search: "",
      statusFilter: [],
      permitTypeFilter: [],
      dateRange: "all",
      startDate: "",
      endDate: "",
      waterAllocationRange: [0, 1000],
      landSizeRange: [0, 500],
      processingTimeRange: [0, 365],
      priorityFilter: [],
      regionFilter: "all",
      showOnlyAssignedToMe: false,
      showOverdueOnly: false,
      showHighPriorityOnly: false,
      sortBy: "createdAt",
      sortOrder: "desc",
    })
  }

  const exportFilteredData = () => {
    const csvData = [
      [
        "Application ID",
        "Applicant Name",
        "Status",
        "Permit Type",
        "Water Allocation (ML)",
        "Land Size (ha)",
        "Physical Address",
        "Created Date",
        "Submitted Date",
        "Processing Days",
      ],
      ...filteredApplications.map((app) => [
        app.applicationId,
        app.applicantName,
        app.status,
        app.permitType,
        app.waterAllocation,
        app.landSize,
        app.physicalAddress,
        app.createdAt.toLocaleDateString(),
        app.submittedAt?.toLocaleDateString() || "N/A",
        app.submittedAt
          ? Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
          : "N/A",
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
      return Math.ceil((new Date(app.approvedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    }
    return Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  const isOverdue = (app: PermitApplication) => {
    const processingDays = getProcessingDays(app)
    return processingDays !== null && processingDays > 30 && app.status !== "approved" && app.status !== "rejected"
  }

  const isHighPriority = (app: PermitApplication) => {
    return (
      app.waterAllocation > 100 || app.landSize > 50 || app.permitType === "industrial" || app.permitType === "bulk_water"
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "under_review":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) return true
    if (typeof value === "boolean" && value) return true
    if (typeof value === "string" && value && value !== "all" && value !== "") return true
    if (key.includes("Range") && Array.isArray(value)) {
      const [min, max] = value
      const defaultMax = key === "processingTimeRange" ? 365 : key === "waterAllocationRange" ? 1000 : 500
      return min > 0 || max < defaultMax
    }
    return false
  }).length

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications Management</h2>
          <p className="text-gray-600">
            Showing {filteredApplications.length} of {applications.length} applications
            {activeFiltersCount > 0 && ` (${activeFiltersCount} filters active)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportFilteredData} disabled={filteredApplications.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadApplications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card>
        <Collapsible open={isFiltersExpanded} onOpenChange={setIsFiltersExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Advanced Filters
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
                        clearFilters()
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
            <CardContent className="space-y-6">
              {/* Search and Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label>Search Applications</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by ID, name, address, or permit type..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
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
                <div>
                  <Label>Items per Page</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number.parseInt(value))}>
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

              {/* Status and Type Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Application Status</Label>
                  <div className="space-y-2">
                    {["unsubmitted", "submitted", "under_review", "approved", "rejected"].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-
