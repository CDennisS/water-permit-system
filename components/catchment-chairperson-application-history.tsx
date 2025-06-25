"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Filter, Eye, CheckCircle, XCircle, Clock, Search, RotateCcw } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { EnhancedExportSystem } from "./enhanced-export-system"
import { StrictViewOnlyApplicationDetails } from "./strict-view-only-application-details"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CatchmentChairpersonApplicationHistoryProps {
  user: User
}

interface FilterOptions {
  startDate: string
  endDate: string
  status: string
  permitType: string
  searchTerm: string
  decision: string
}

export function CatchmentChairpersonApplicationHistory({ user }: CatchmentChairpersonApplicationHistoryProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: "",
    endDate: "",
    status: "all",
    permitType: "all",
    searchTerm: "",
    decision: "all",
  })
  const [stats, setStats] = useState({
    totalProcessed: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  })

  useEffect(() => {
    loadApplicationHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters])

  const loadApplicationHistory = async () => {
    setLoading(true)
    try {
      const allApplications = await db.getApplications()

      // Get applications that have reached Stage 4 (Catchment Chairperson level) or beyond
      const historyApplications = allApplications.filter(
        (app) =>
          app.currentStage >= 4 || (app.currentStage > 1 && (app.status === "approved" || app.status === "rejected")),
      )

      // Sort by most recent first
      historyApplications.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

      setApplications(historyApplications)

      // Calculate statistics
      const totalProcessed = historyApplications.length
      const approved = historyApplications.filter((app) => app.status === "approved").length
      const rejected = historyApplications.filter((app) => app.status === "rejected").length
      const pending = historyApplications.filter(
        (app) => app.currentStage === 4 && app.status === "under_review",
      ).length

      setStats({ totalProcessed, approved, rejected, pending })
    } catch (error) {
      console.error("Failed to load application history:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...applications]

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      filtered = filtered.filter((app) => app.createdAt >= startDate)
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999) // Include the entire end date
      filtered = filtered.filter((app) => app.createdAt <= endDate)
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((app) => app.status === filters.status)
    }

    // Permit type filter
    if (filters.permitType !== "all") {
      filtered = filtered.filter((app) => app.permitType === filters.permitType)
    }

    // Decision filter (specific to chairperson decisions)
    if (filters.decision !== "all") {
      if (filters.decision === "approved") {
        filtered = filtered.filter((app) => app.status === "approved")
      } else if (filters.decision === "rejected") {
        filtered = filtered.filter((app) => app.status === "rejected")
      } else if (filters.decision === "pending") {
        filtered = filtered.filter((app) => app.currentStage === 4 && app.status === "under_review")
      }
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicationId.toLowerCase().includes(searchLower) ||
          app.applicantName.toLowerCase().includes(searchLower) ||
          app.physicalAddress.toLowerCase().includes(searchLower) ||
          app.cellularNumber.includes(filters.searchTerm),
      )
    }

    setFilteredApplications(filtered)
  }

  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "all",
      permitType: "all",
      searchTerm: "",
      decision: "all",
    })
  }

  const getStatusBadge = (application: PermitApplication) => {
    if (application.status === "approved") {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    }
    if (application.status === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    }
    if (application.currentStage === 4 && application.status === "under_review") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Decision
        </Badge>
      )
    }
    return <Badge variant="secondary">{application.status}</Badge>
  }

  const getDecisionInfo = async (application: PermitApplication) => {
    if (application.status === "approved" || application.status === "rejected") {
      const comments = await db.getCommentsByApplication(application.id)
      const chairpersonComment = comments.find((c) => c.userType === "catchment_chairperson" && c.stage === 4)
      return {
        decision: application.status,
        date: application.updatedAt,
        comment: chairpersonComment?.comment || "No comment recorded",
      }
    }
    return null
  }

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setIsViewDialogOpen(true)
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "blue",
  }: {
    title: string
    value: number
    icon: any
    color?: "blue" | "green" | "red" | "yellow"
  }) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      red: "bg-red-100 text-red-600",
      yellow: "bg-yellow-100 text-yellow-600",
    }

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className={`p-2 rounded-lg ${colors[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading application history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Application History</h2>
          <p className="text-gray-600">Complete record of all applications processed by Catchment Chairperson</p>
        </div>
        <EnhancedExportSystem
          applications={filteredApplications}
          user={user}
          title="Catchment Chairperson Application History"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Processed" value={stats.totalProcessed} icon={FileText} color="blue" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        <StatCard title="Pending Decision" value={stats.pending} icon={Clock} color="yellow" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
              <Badge variant="secondary" className="ml-2">
                {filteredApplications.length} of {applications.length} applications
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center">
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min={filters.startDate}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Decision Filter */}
            <div>
              <Label className="text-sm font-medium">Decision</Label>
              <Select value={filters.decision} onValueChange={(value) => handleFilterChange("decision", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decisions</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending Decision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permit Type Filter */}
            <div>
              <Label className="text-sm font-medium">Permit Type</Label>
              <Select value={filters.permitType} onValueChange={(value) => handleFilterChange("permitType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="borehole">Borehole</SelectItem>
                  <SelectItem value="surface_water">Surface Water</SelectItem>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="bulk_water">Bulk Water</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="ID, Name, Address..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Application History Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Permit Type</TableHead>
                  <TableHead>Water Allocation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision Date</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{application.applicationId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{application.applicantName}</p>
                        <p className="text-sm text-gray-500">{application.cellularNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{application.permitType.replace("_", " ").toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{application.waterAllocation} ML</TableCell>
                    <TableCell>{getStatusBadge(application)}</TableCell>
                    <TableCell>
                      {application.status === "approved" || application.status === "rejected"
                        ? application.updatedAt.toLocaleDateString()
                        : application.currentStage === 4
                          ? "Pending"
                          : "N/A"}
                    </TableCell>
                    <TableCell>{application.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewApplication(application)}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No applications found</p>
                <p className="text-gray-400 text-sm">
                  {applications.length === 0
                    ? "No applications have been processed yet"
                    : "Try adjusting your filters to see more results"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details: {selectedApplication?.applicationId}</DialogTitle>
          </DialogHeader>
          {selectedApplication && <StrictViewOnlyApplicationDetails user={user} application={selectedApplication} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
