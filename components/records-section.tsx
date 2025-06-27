"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, RefreshCw, X } from "lucide-react"
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
  dateRange: string
  startDate: string
  endDate: string
}

const statusColor: Record<string, string> = {
  unsubmitted: "bg-orange-600",
  draft: "bg-orange-600",
  submitted: "bg-blue-600",
  pending: "bg-blue-600",
  under_review: "bg-yellow-500",
  approved: "bg-green-600",
  rejected: "bg-red-600",
}

export function RecordsSection({ user, onEditApplication, onViewApplication }: RecordsSectionProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
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
      const apps = await db.getApplications()
      setApplications(apps)
    } catch (error) {
      console.error("Error loading applications:", error)
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
          app.applicationId.toLowerCase().includes(searchTerm) ||
          app.applicantName.toLowerCase().includes(searchTerm) ||
          app.physicalAddress.toLowerCase().includes(searchTerm) ||
          app.permitType.toLowerCase().includes(searchTerm),
      )
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status)
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

    setFilteredApplications(filtered)
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
    })
  }

  const hasActiveFilters = () => {
    return (
      filters.search !== "" ||
      filters.status !== "all" ||
      filters.dateRange !== "all" ||
      filters.startDate !== "" ||
      filters.endDate !== ""
    )
  }

  const exportData = () => {
    const csvData = [
      [
        "Application ID",
        "Applicant Name",
        "Status",
        "Permit Type",
        "Water Allocation",
        "Land Size",
        "Physical Address",
        "Created Date",
        "Submitted Date",
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
      ]),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `permit_records_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date)
  }

  const canEditApplication = (app: PermitApplication) => {
    return app.status === "unsubmitted" || app.status === "draft"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Records & Search</h2>
          <p className="text-gray-600">Search and filter permit application records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportData} disabled={filteredApplications.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadApplications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search and Filter Records
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-2">
                Filters Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
              <Label>Filter by Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="unsubmitted">Unsubmitted</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                <SelectTrigger>
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
                  />
                </div>
              </>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters() && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Search Results ({filteredApplications.length} of {applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[140px]">Reference</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px] text-center">Stage</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="w-[120px]">Submitted</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.applicationId}</TableCell>
                      <TableCell className="whitespace-nowrap">{app.applicantName}</TableCell>
                      <TableCell>
                        <Badge className={cn(statusColor[app.status], "text-white capitalize")}>
                          {app.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{app.currentStage}</TableCell>
                      <TableCell>{formatDate(app.createdAt)}</TableCell>
                      <TableCell>{app.submittedAt ? formatDate(app.submittedAt) : "N/A"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => onViewApplication(app)}>
                          View
                        </Button>
                        {canEditApplication(app) && (
                          <Button size="sm" variant="outline" onClick={() => onEditApplication(app)}>
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No applications found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
