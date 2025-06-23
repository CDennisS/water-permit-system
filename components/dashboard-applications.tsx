"use client"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Filter,
  X,
  ChevronDown,
  Calendar,
  MapPin,
  Settings,
  Download,
  RefreshCw,
  SortAsc,
  SortDesc,
} from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface DashboardApplicationsProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (application: PermitApplication) => void
  onViewApplication: (application: PermitApplication) => void
}

interface AdvancedFilters {
  // Text search filters
  searchTerm: string
  searchFields: string[]

  // Date filters
  dateField: string
  startDate: string
  endDate: string
  datePreset: string

  // Status and workflow
  statusFilter: string[]
  stageFilter: string[]
  permitTypeFilter: string[]
  waterSourceFilter: string[]

  // Technical specifications
  waterAllocationRange: number[]
  landSizeRange: number[]
  boreholeCountRange: number[]

  // Geographic filters
  gpsLatRange: number[]
  gpsLngRange: number[]
  regionFilter: string

  // Document and comments
  hasDocuments: boolean | null
  hasComments: boolean | null
  documentTypes: string[]

  // User and assignment
  createdByFilter: string[]
  assignedToFilter: string[]
  priorityFilter: string[]

  // Advanced options
  includeExpired: boolean
  includeArchived: boolean
  showOnlyMyApplications: boolean

  // Sorting
  sortField: string
  sortDirection: "asc" | "desc"
  secondarySortField: string
  secondarySortDirection: "asc" | "desc"
}

const defaultFilters: AdvancedFilters = {
  searchTerm: "",
  searchFields: ["all"],
  dateField: "createdAt",
  startDate: "",
  endDate: "",
  datePreset: "all",
  statusFilter: [],
  stageFilter: [],
  permitTypeFilter: [],
  waterSourceFilter: [],
  waterAllocationRange: [0, 1000],
  landSizeRange: [0, 500],
  boreholeCountRange: [0, 50],
  gpsLatRange: [-90, 90],
  gpsLngRange: [-180, 180],
  regionFilter: "all",
  hasDocuments: null,
  hasComments: null,
  documentTypes: [],
  createdByFilter: [],
  assignedToFilter: [],
  priorityFilter: [],
  includeExpired: true,
  includeArchived: false,
  showOnlyMyApplications: false,
  sortField: "createdAt",
  sortDirection: "desc",
  secondarySortField: "",
  secondarySortDirection: "asc",
}

export const DashboardApplications = forwardRef<{ refreshApplications: () => void }, DashboardApplicationsProps>(
  ({ user, onNewApplication, onEditApplication, onViewApplication }, ref) => {
    const [applications, setApplications] = useState<PermitApplication[]>([])
    const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
    const [filters, setFilters] = useState<AdvancedFilters>(defaultFilters)
    const [isLoading, setIsLoading] = useState(true)
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
    const [availableUsers, setAvailableUsers] = useState<User[]>([])

    useEffect(() => {
      loadApplications()
      loadUsers()
    }, [user])

    useEffect(() => {
      applyFilters()
    }, [applications, filters])

    const loadApplications = async () => {
      try {
        setIsLoading(true)
        const apps = await db.getApplications()
        setApplications(apps)
      } catch (error) {
        console.error("Failed to load applications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const loadUsers = async () => {
      try {
        const users = await db.getUsers()
        setAvailableUsers(users)
      } catch (error) {
        console.error("Failed to load users:", error)
      }
    }

    const applyFilters = () => {
      let filtered = [...applications]

      // Apply role-based filtering FIRST, before other filters
      if (user.userType === "permitting_officer") {
        // Permitting officers should see ALL applications with status "unsubmitted"
        filtered = filtered.filter((app) => app.status === "unsubmitted")
      } else if (user.userType === "chairperson") {
        filtered = filtered.filter((app) => app.status === "submitted" && app.currentStage === 2)
      } else if (user.userType === "catchment_manager") {
        filtered = filtered.filter((app) => app.currentStage === 3)
      } else if (user.userType === "catchment_chairperson") {
        filtered = filtered.filter((app) => app.currentStage === 4)
      }

      // Text search
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        filtered = filtered.filter((app) => {
          if (filters.searchFields.includes("all")) {
            return (
              app.applicationId.toLowerCase().includes(searchLower) ||
              app.applicantName.toLowerCase().includes(searchLower) ||
              app.customerAccountNumber.toLowerCase().includes(searchLower) ||
              app.physicalAddress.toLowerCase().includes(searchLower) ||
              app.cellularNumber.includes(searchLower) ||
              app.intendedUse.toLowerCase().includes(searchLower)
            )
          } else {
            return filters.searchFields.some((field) => {
              const value = app[field as keyof PermitApplication]
              return value && value.toString().toLowerCase().includes(searchLower)
            })
          }
        })
      }

      // Date filters
      if (filters.startDate || filters.endDate) {
        filtered = filtered.filter((app) => {
          const appDate = new Date(app[filters.dateField as keyof PermitApplication] as string)
          const start = filters.startDate ? new Date(filters.startDate) : new Date("1900-01-01")
          const end = filters.endDate ? new Date(filters.endDate) : new Date("2100-12-31")
          return appDate >= start && appDate <= end
        })
      }

      // Date presets
      if (filters.datePreset !== "all") {
        const now = new Date()
        let startDate: Date

        switch (filters.datePreset) {
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
          case "this_month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case "last_month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            break
          default:
            startDate = new Date("1900-01-01")
        }

        filtered = filtered.filter((app) => {
          const appDate = new Date(app[filters.dateField as keyof PermitApplication] as string)
          return appDate >= startDate
        })
      }

      // Status filters
      if (filters.statusFilter.length > 0) {
        filtered = filtered.filter((app) => filters.statusFilter.includes(app.status))
      }

      // Stage filters
      if (filters.stageFilter.length > 0) {
        filtered = filtered.filter((app) => filters.stageFilter.includes(app.currentStage.toString()))
      }

      // Permit type filters
      if (filters.permitTypeFilter.length > 0) {
        filtered = filtered.filter((app) => filters.permitTypeFilter.includes(app.permitType))
      }

      // Water source filters
      if (filters.waterSourceFilter.length > 0) {
        filtered = filtered.filter((app) => filters.waterSourceFilter.includes(app.waterSource))
      }

      // Range filters
      filtered = filtered.filter((app) => {
        const waterAllocation = Number.parseFloat(app.waterAllocation) || 0
        const landSize = Number.parseFloat(app.landSize) || 0
        const boreholeCount = Number.parseInt(app.numberOfBoreholes) || 0

        return (
          waterAllocation >= filters.waterAllocationRange[0] &&
          waterAllocation <= filters.waterAllocationRange[1] &&
          landSize >= filters.landSizeRange[0] &&
          landSize <= filters.landSizeRange[1] &&
          boreholeCount >= filters.boreholeCountRange[0] &&
          boreholeCount <= filters.boreholeCountRange[1]
        )
      })

      // GPS range filters
      filtered = filtered.filter((app) => {
        const lat = Number.parseFloat(app.gpsLatitude) || 0
        const lng = Number.parseFloat(app.gpsLongitude) || 0

        return (
          lat >= filters.gpsLatRange[0] &&
          lat <= filters.gpsLatRange[1] &&
          lng >= filters.gpsLngRange[0] &&
          lng <= filters.gpsLngRange[1]
        )
      })

      // Document filters
      if (filters.hasDocuments !== null) {
        filtered = filtered.filter((app) => {
          const hasDocuments = app.documents && app.documents.length > 0
          return filters.hasDocuments ? hasDocuments : !hasDocuments
        })
      }

      // Comments filters
      if (filters.hasComments !== null) {
        filtered = filtered.filter((app) => {
          const hasComments = app.comments && app.comments.length > 0
          return filters.hasComments ? hasComments : !hasComments
        })
      }

      // User-specific filters
      if (filters.showOnlyMyApplications) {
        filtered = filtered.filter((app) => app.createdBy === user.id)
      }

      // Sorting
      filtered.sort((a, b) => {
        const aValue = a[filters.sortField as keyof PermitApplication]
        const bValue = b[filters.sortField as keyof PermitApplication]

        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1

        if (filters.sortDirection === "desc") comparison *= -1

        // Secondary sort
        if (comparison === 0 && filters.secondarySortField) {
          const aSecondary = a[filters.secondarySortField as keyof PermitApplication]
          const bSecondary = b[filters.secondarySortField as keyof PermitApplication]

          if (aSecondary < bSecondary) comparison = -1
          if (aSecondary > bSecondary) comparison = 1

          if (filters.secondarySortDirection === "desc") comparison *= -1
        }

        return comparison
      })

      setFilteredApplications(filtered)
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

    const clearAllFilters = () => {
      setFilters(defaultFilters)
    }

    const getActiveFiltersCount = () => {
      let count = 0
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "searchTerm" && value) count++
        else if (Array.isArray(value) && value.length > 0) count++
        else if (typeof value === "boolean" && value && !["includeExpired"].includes(key)) count++
        else if (typeof value === "string" && value && !["all", "", "createdAt", "desc", "asc"].includes(value)) count++
        else if (key.includes("Range") && Array.isArray(value)) {
          if (key === "waterAllocationRange" && (value[0] > 0 || value[1] < 1000)) count++
          else if (key === "landSizeRange" && (value[0] > 0 || value[1] < 500)) count++
          else if (key === "boreholeCountRange" && (value[0] > 0 || value[1] < 50)) count++
          else if (key === "gpsLatRange" && (value[0] > -90 || value[1] < 90)) count++
          else if (key === "gpsLngRange" && (value[0] > -180 || value[1] < 180)) count++
        }
      })
      return count
    }

    const exportFilteredData = () => {
      const csvContent = [
        // Headers
        [
          "Application ID",
          "Applicant Name",
          "Status",
          "Permit Type",
          "Water Source",
          "Land Size",
          "Water Allocation",
          "Boreholes",
          "Created Date",
          "GPS Coordinates",
        ].join(","),
        // Data
        ...filteredApplications.map((app) =>
          [
            app.applicationId,
            app.applicantName,
            app.status,
            app.permitType,
            app.waterSource,
            app.landSize,
            app.waterAllocation,
            app.numberOfBoreholes,
            new Date(app.createdAt).toLocaleDateString(),
            `${app.gpsLatitude}, ${app.gpsLongitude}`,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `applications-filtered-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }

    const getStatusBadge = (status: string) => {
      const statusConfig = {
        unsubmitted: { label: "Draft", variant: "secondary" as const, icon: FileText },
        submitted: { label: "Submitted", variant: "default" as const, icon: Clock },
        under_review: { label: "Under Review", variant: "default" as const, icon: Clock },
        approved: { label: "Approved", variant: "default" as const, icon: CheckCircle },
        rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
      }

      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
      const Icon = config.icon

      return (
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      )
    }

    const getApplicationStats = () => {
      const stats = {
        total: filteredApplications.length,
        draft: filteredApplications.filter((app) => app.status === "unsubmitted").length,
        submitted: filteredApplications.filter((app) => app.status === "submitted").length,
        under_review: filteredApplications.filter((app) => app.status === "under_review").length,
        approved: filteredApplications.filter((app) => app.status === "approved").length,
        rejected: filteredApplications.filter((app) => app.status === "rejected").length,
      }
      return stats
    }

    const activeFiltersCount = getActiveFiltersCount()
    const stats = getApplicationStats()

    useImperativeHandle(ref, () => ({
      refreshApplications: loadApplications,
    }))

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Applications Dashboard</h2>
            <p className="text-gray-600">
              Showing {filteredApplications.length} of {applications.length} applications
              {activeFiltersCount > 0 && ` (${activeFiltersCount} filters active)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportFilteredData}
              className="flex items-center gap-2"
              disabled={filteredApplications.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={loadApplications} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={onNewApplication} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Application
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
              <CardContent className="space-y-6">
                {/* Search Filters */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Search & Text Filters
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Search Term</Label>
                      <Input
                        placeholder="Search applications..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Search In Fields</Label>
                      <Select
                        value={filters.searchFields[0] || "all"}
                        onValueChange={(value) => handleFilterChange("searchFields", [value])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Fields</SelectItem>
                          <SelectItem value="applicationId">Application ID</SelectItem>
                          <SelectItem value="applicantName">Applicant Name</SelectItem>
                          <SelectItem value="customerAccountNumber">Account Number</SelectItem>
                          <SelectItem value="physicalAddress">Address</SelectItem>
                          <SelectItem value="intendedUse">Intended Use</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Date Filters */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Filters
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Date Field</Label>
                      <Select
                        value={filters.dateField}
                        onValueChange={(value) => handleFilterChange("dateField", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Created Date</SelectItem>
                          <SelectItem value="submittedAt">Submitted Date</SelectItem>
                          <SelectItem value="approvedAt">Approved Date</SelectItem>
                          <SelectItem value="updatedAt">Updated Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date Preset</Label>
                      <Select
                        value={filters.datePreset}
                        onValueChange={(value) => handleFilterChange("datePreset", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_time">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="yesterday">Yesterday</SelectItem>
                          <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                          <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="last_month">Last Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>
                </div>

                <Separator />

                {/* Status and Workflow Filters */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Status & Workflow Filters
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Application Status</Label>
                      <div className="space-y-2">
                        {["unsubmitted", "submitted", "under_review", "approved", "rejected"].map((status) => (
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
                      <Label className="text-sm font-medium mb-2 block">Workflow Stage</Label>
                      <div className="space-y-2">
                        {["1", "2", "3", "4"].map((stage) => (
                          <div key={stage} className="flex items-center space-x-2">
                            <Checkbox
                              id={`stage-${stage}`}
                              checked={filters.stageFilter.includes(stage)}
                              onCheckedChange={(checked) => handleArrayFilterChange("stageFilter", stage, !!checked)}
                            />
                            <Label htmlFor={`stage-${stage}`}>
                              Stage {stage} -{" "}
                              {stage === "1"
                                ? "Permitting Officer"
                                : stage === "2"
                                  ? "Chairperson"
                                  : stage === "3"
                                    ? "Catchment Manager"
                                    : "Catchment Chairperson"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Permit Classification */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Permit Classification</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Permit Types</Label>
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
                            <Label htmlFor={`permit-${type}`} className="capitalize">
                              {type.replace("_", " ")}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Water Source</Label>
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
                            <Label htmlFor={`source-${source}`} className="capitalize">
                              {source.replace("_", " ")}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Range Filters */}
                <div className="space-y-4">
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
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Boreholes: {filters.boreholeCountRange[0]} - {filters.boreholeCountRange[1]}
                      </Label>
                      <Slider
                        value={filters.boreholeCountRange}
                        onValueChange={(value) => handleFilterChange("boreholeCountRange", value)}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Geographic Filters */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Geographic Filters
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        GPS Latitude: {filters.gpsLatRange[0]} - {filters.gpsLatRange[1]}
                      </Label>
                      <Slider
                        value={filters.gpsLatRange}
                        onValueChange={(value) => handleFilterChange("gpsLatRange", value)}
                        min={-90}
                        max={90}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        GPS Longitude: {filters.gpsLngRange[0]} - {filters.gpsLngRange[1]}
                      </Label>
                      <Slider
                        value={filters.gpsLngRange}
                        onValueChange={(value) => handleFilterChange("gpsLngRange", value)}
                        min={-180}
                        max={180}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Document and Content Filters */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Document & Content Filters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Has Documents</Label>
                      <Select
                        value={filters.hasDocuments === null ? "all" : filters.hasDocuments.toString()}
                        onValueChange={(value) =>
                          handleFilterChange("hasDocuments", value === "all" ? null : value === "true")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_applications">All Applications</SelectItem>
                          <SelectItem value="true">With Documents</SelectItem>
                          <SelectItem value="false">Without Documents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Has Comments</Label>
                      <Select
                        value={filters.hasComments === null ? "all" : filters.hasComments.toString()}
                        onValueChange={(value) =>
                          handleFilterChange("hasComments", value === "all" ? null : value === "true")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_applications">All Applications</SelectItem>
                          <SelectItem value="true">With Comments</SelectItem>
                          <SelectItem value="false">Without Comments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="showOnlyMyApplications"
                        checked={filters.showOnlyMyApplications}
                        onCheckedChange={(checked) => handleFilterChange("showOnlyMyApplications", checked)}
                      />
                      <Label htmlFor="showOnlyMyApplications">Show only my applications</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sorting Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Sorting Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Primary Sort Field</Label>
                      <Select
                        value={filters.sortField}
                        onValueChange={(value) => handleFilterChange("sortField", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Created Date</SelectItem>
                          <SelectItem value="applicantName">Applicant Name</SelectItem>
                          <SelectItem value="applicationId">Application ID</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="permitType">Permit Type</SelectItem>
                          <SelectItem value="waterAllocation">Water Allocation</SelectItem>
                          <SelectItem value="landSize">Land Size</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Direction</Label>
                      <Select
                        value={filters.sortDirection}
                        onValueChange={(value) => handleFilterChange("sortDirection", value as "asc" | "desc")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">
                            <div className="flex items-center">
                              <SortAsc className="h-4 w-4 mr-2" />
                              Ascending
                            </div>
                          </SelectItem>
                          <SelectItem value="desc">
                            <div className="flex items-center">
                              <SortDesc className="h-4 w-4 mr-2" />
                              Descending
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Secondary Sort Field</Label>
                      <Select
                        value={filters.secondarySortField}
                        onValueChange={(value) => handleFilterChange("secondarySortField", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="createdAt">Created Date</SelectItem>
                          <SelectItem value="applicantName">Applicant Name</SelectItem>
                          <SelectItem value="applicationId">Application ID</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="permitType">Permit Type</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Secondary Direction</Label>
                      <Select
                        value={filters.secondarySortDirection}
                        onValueChange={(value) => handleFilterChange("secondarySortDirection", value as "asc" | "desc")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">
                            <div className="flex items-center">
                              <SortAsc className="h-4 w-4 mr-2" />
                              Ascending
                            </div>
                          </SelectItem>
                          <SelectItem value="desc">
                            <div className="flex items-center">
                              <SortDesc className="h-4 w-4 mr-2" />
                              Descending
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.submitted}</div>
              <div className="text-sm text-gray-600">Submitted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.under_review}</div>
              <div className="text-sm text-gray-600">Under Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600 mb-4">
                  {applications.length === 0
                    ? "Get started by creating your first permit application."
                    : "Try adjusting your search or filter criteria."}
                </p>
                {applications.length === 0 && (
                  <Button onClick={onNewApplication} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Application
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{application.applicationId}</h3>
                          {getStatusBadge(application.status)}
                          <Badge variant="outline">Stage {application.currentStage}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Applicant:</span> {application.applicantName}
                          </div>
                          <div>
                            <span className="font-medium">Account:</span> {application.customerAccountNumber}
                          </div>
                          <div>
                            <span className="font-medium">Permit Type:</span>{" "}
                            {application.permitType.replace("_", " ").toUpperCase()}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                          <div>
                            <span className="font-medium">Water Source:</span>{" "}
                            {application.waterSource.replace("_", " ")}
                          </div>
                          <div>
                            <span className="font-medium">Land Size:</span> {application.landSize} ha
                          </div>
                          <div>
                            <span className="font-medium">Water Allocation:</span> {application.waterAllocation} ML
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewApplication(application)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        {(application.status === "unsubmitted" || user.userType === "permitting_officer") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditApplication(application)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  },
)

DashboardApplications.displayName = "DashboardApplications"

export default DashboardApplications
