"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  Eye,
  Edit,
  FileText,
  MapPin,
  CreditCard,
  Calendar,
  Building2,
  Droplets,
  Archive,
  Loader2,
} from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { cn } from "@/lib/utils"

interface RecordsSectionProps {
  user: User
  onEditApplication: (app: PermitApplication) => void
  onViewApplication: (app: PermitApplication) => void
}

interface Filters {
  search: string
  status: string
  permitType: string
  dateRange: string
  startDate: string
  endDate: string
}

const statusConfig = {
  unsubmitted: {
    label: "Not Submitted",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: FileText,
  },
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: FileText,
  },
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FileText,
  },
  pending: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: FileText,
  },
  under_review: {
    label: "Under Review",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: FileText,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: FileText,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: FileText,
  },
}

export function RecordsSection({ user, onEditApplication, onViewApplication }: RecordsSectionProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    permitType: "all",
    dateRange: "all",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters])

  const loadApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      const apps = await db.getApplications()
      setApplications(apps || [])
    } catch (error) {
      console.error("Error loading applications:", error)
      setError("Failed to load applications. Please try again.")
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...applications]

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicationId?.toLowerCase().includes(searchTerm) ||
          app.applicantName?.toLowerCase().includes(searchTerm) ||
          app.customerAccountNumber?.toLowerCase().includes(searchTerm) ||
          app.physicalAddress?.toLowerCase().includes(searchTerm) ||
          app.permitType?.toLowerCase().includes(searchTerm) ||
          app.waterSource?.toLowerCase().includes(searchTerm) ||
          app.intendedUse?.toLowerCase().includes(searchTerm),
      )
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status)
    }

    // Permit type filter
    if (filters.permitType !== "all") {
      filtered = filtered.filter((app) => app.permitType === filters.permitType)
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
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case "custom":
          if (filters.startDate) {
            startDate = new Date(filters.startDate)
            filtered = filtered.filter((app) => app.createdAt >= startDate)
          }
          if (filters.endDate) {
            const endDate = new Date(filters.endDate)
            filtered = filtered.filter((app) => app.createdAt <= endDate)
          }
          break
        default:
          startDate = new Date(0)
      }

      if (filters.dateRange !== "custom") {
        filtered = filtered.filter((app) => app.createdAt >= startDate)
      }
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredApplications(filtered)
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      permitType: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
    })
  }

  const hasActiveFilters = () => {
    return (
      filters.search !== "" ||
      filters.status !== "all" ||
      filters.permitType !== "all" ||
      filters.dateRange !== "all" ||
      filters.startDate !== "" ||
      filters.endDate !== ""
    )
  }

  const exportData = () => {
    try {
      const csvData = [
        [
          "Application ID",
          "Applicant Name",
          "Account Number",
          "Physical Address",
          "Permit Type",
          "Water Source",
          "Status",
          "Water Allocation (ML)",
          "Land Size (ha)",
          "Created Date",
          "Submitted Date",
          "Current Stage",
        ],
        ...filteredApplications.map((app) => [
          app.applicationId || "",
          app.applicantName || "",
          app.customerAccountNumber || "",
          app.physicalAddress || "",
          app.permitType?.replace("_", " ").toUpperCase() || "",
          app.waterSource?.replace("_", " ") || "",
          app.status?.replace("_", " ").toUpperCase() || "",
          app.waterAllocation || "",
          app.landSize || "",
          app.createdAt ? app.createdAt.toLocaleDateString("en-ZA") : "",
          app.submittedAt ? app.submittedAt.toLocaleDateString("en-ZA") : "N/A",
          `Stage ${app.currentStage || 1}`,
        ]),
      ]

      const csvContent = csvData.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `umscc_permit_records_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Failed to export data. Please try again.")
    }
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A"
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      return new Intl.DateTimeFormat("en-ZA", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(dateObj)
    } catch {
      return "Invalid Date"
    }
  }

  const formatPermitType = (type: string | undefined) => {
    if (!type) return "Unknown"
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatWaterSource = (source: string | undefined) => {
    if (!source) return "Unknown"
    return source.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const canEditApplication = (app: PermitApplication) => {
    return app.status === "unsubmitted" || app.status === "draft"
  }

  const getApplicationStats = () => {
    return {
      total: filteredApplications.length,
      approved: filteredApplications.filter((app) => app.status === "approved").length,
      rejected: filteredApplications.filter((app) => app.status === "rejected").length,
      pending: filteredApplications.filter((app) => ["submitted", "pending", "under_review"].includes(app.status))
        .length,
      draft: filteredApplications.filter((app) => ["unsubmitted", "draft"].includes(app.status)).length,
    }
  }

  const stats = getApplicationStats()

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <Archive className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Error Loading Records</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={loadApplications} variant="outline" className="border-red-300 text-red-700 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Government Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Water Permit Records Database</h1>
            <p className="text-slate-200 text-sm">Upper Manyame Sub Catchment Council • Ministry of Environment</p>
            <p className="text-slate-300 text-sm mt-1">
              Comprehensive permit application records and management system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={exportData}
              disabled={filteredApplications.length === 0 || loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Records
            </Button>
            <Button
              variant="secondary"
              onClick={loadApplications}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Records</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Under Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Draft</p>
              <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Advanced Search & Filtering
            </div>
            {hasActiveFilters() && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-800">
                <X className="h-4 w-4 mr-1" />
                Clear All Filters
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div>
            <Label className="text-sm font-medium text-slate-700">Search Records</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Application ID, Applicant Name, Account Number, Address, or Permit Type..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Status Filter</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger className="mt-1 border-slate-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="unsubmitted">Not Submitted</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Permit Type</Label>
              <Select value={filters.permitType} onValueChange={(value) => handleFilterChange("permitType", value)}>
                <SelectTrigger className="mt-1 border-slate-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Permit Types</SelectItem>
                  <SelectItem value="water_abstraction">Water Abstraction</SelectItem>
                  <SelectItem value="borehole_drilling">Borehole Drilling</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="industrial">Industrial Use</SelectItem>
                  <SelectItem value="domestic">Domestic Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                <SelectTrigger className="mt-1 border-slate-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded border">
                <strong>{filteredApplications.length}</strong> of <strong>{applications.length}</strong> records
                {hasActiveFilters() && " (filtered)"}
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="mt-1 border-slate-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  min={filters.startDate}
                  className="mt-1 border-slate-300 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-blue-600" />
            Permit Application Records ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Loading permit records...</p>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Archive className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Records Found</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {applications.length === 0
                  ? "No permit records are available in the system database."
                  : "No records match your current search and filter criteria. Try adjusting your filters."}
              </p>
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-blue-200 text-blue-700 bg-transparent"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                    <TableHead className="font-semibold text-slate-700 py-4">Application Reference</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Applicant Details</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Account & Address</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Permit Information</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Status & Progress</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4">Timeline</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => {
                    const statusInfo =
                      statusConfig[application.status as keyof typeof statusConfig] || statusConfig.submitted
                    const StatusIcon = statusInfo.icon

                    return (
                      <TableRow
                        key={application.id}
                        className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-sm">{application.applicationId || "N/A"}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Stage {application.currentStage || 1} of 4
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 text-sm">
                              {application.applicantName || "Unknown"}
                            </div>
                            <div className="text-xs text-slate-600">{application.cellularNumber || "N/A"}</div>
                            <div className="text-xs text-slate-500">{application.emailAddress || "N/A"}</div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
                              <CreditCard className="h-3 w-3 text-blue-600" />
                              {application.customerAccountNumber || "N/A"}
                            </div>
                            <div className="flex items-start gap-1 text-xs text-slate-600 max-w-xs">
                              <MapPin className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">
                                {application.physicalAddress || "No address provided"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
                              <Building2 className="h-3 w-3 text-green-600" />
                              {formatPermitType(application.permitType)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Droplets className="h-3 w-3 text-blue-500" />
                              {formatWaterSource(application.waterSource)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {application.waterAllocation || 0} ML • {application.landSize || 0} ha
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Badge className={cn("text-xs font-medium border", statusInfo.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <div className="text-xs text-slate-500">
                              Progress: {Math.round(((application.currentStage || 1) / 4) * 100)}%
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-1 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span className="font-medium">Created:</span>
                            </div>
                            <div className="ml-4">{formatDate(application.createdAt)}</div>
                            {application.submittedAt && (
                              <>
                                <div className="flex items-center gap-1 mt-2">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  <span className="font-medium">Submitted:</span>
                                </div>
                                <div className="ml-4">{formatDate(application.submittedAt)}</div>
                              </>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewApplication(application)}
                              className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {canEditApplication(application) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditApplication(application)}
                                className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RecordsSection
