"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Filter, Eye, CheckCircle, XCircle, Clock, Search, RotateCcw, MessageSquare } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { EnhancedExportSystem } from "./enhanced-export-system"
import { StrictViewOnlyApplicationDetails } from "./strict-view-only-application-details"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ChairpersonApplicationHistoryProps {
  user: User
}

interface FilterOptions {
  startDate: string
  endDate: string
  status: string
  permitType: string
  searchTerm: string
  reviewStatus: string
}

export function ChairpersonApplicationHistory({ user }: ChairpersonApplicationHistoryProps) {
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
    reviewStatus: "all",
  })
  const [stats, setStats] = useState({
    totalProcessed: 0,
    reviewed: 0,
    pendingReview: 0,
    submittedToManager: 0,
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

      // Get applications that have reached Stage 2 (Sub Catchment Chairperson level) or beyond
      const historyApplications = allApplications.filter(
        (app) =>
          app.currentStage >= 2 || (app.currentStage > 1 && (app.status === "approved" || app.status === "rejected")),
      )

      // Sort by most recent first
      historyApplications.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

      setApplications(historyApplications)

      // Calculate statistics
      const totalProcessed = historyApplications.length
      const pendingReview = historyApplications.filter(
        (app) => app.currentStage === 2 && app.status === "under_review",
      ).length
      const reviewed = historyApplications.filter((app) => app.currentStage > 2).length
      const submittedToManager = historyApplications.filter((app) => app.currentStage >= 3).length

      setStats({ totalProcessed, reviewed, pendingReview, submittedToManager })
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

    // Review status filter (specific to chairperson reviews)
    if (filters.reviewStatus !== "all") {
      if (filters.reviewStatus === "reviewed") {
        filtered = filtered.filter((app) => app.currentStage > 2)
      } else if (filters.reviewStatus === "pending") {
        filtered = filtered.filter((app) => app.currentStage === 2 && app.status === "under_review")
      } else if (filters.reviewStatus === "submitted") {
        filtered = filtered.filter((app) => app.currentStage >= 3)
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
      reviewStatus: "all",
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
    if (application.currentStage === 2 && application.status === "under_review") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      )
    }
    return <Badge variant="secondary">{application.status}</Badge>
  }

  const getReviewStatusBadge = (application: PermitApplication) => {
    if (application.currentStage > 2) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <MessageSquare className="h-3 w-3 mr-1" />
          Reviewed
        </Badge>
      )
    }
    if (application.currentStage === 2 && application.status === "under_review") {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      )
    }
    return <Badge variant="outline">Not Reviewed</Badge>
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
    color?: "blue" | "green" | "orange" | "purple"
  }) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
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
          <p className="text-gray-600">Complete record of all applications processed by Sub Catchment Chairperson</p>
        </div>
        <EnhancedExportSystem
          applications={filteredApplications}
          user={user}
          title="Sub Catchment Chairperson Application History"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Processed" value={stats.totalProcessed} icon={FileText} color="blue" />
        <StatCard title="Reviewed" value={stats.reviewed} icon={MessageSquare} color="green" />
        <StatCard title="Pending Review" value={stats.pendingReview} icon={Clock} color="orange" />
        <StatCard title="Submitted to Manager" value={stats.submittedToManager} icon={CheckCircle} color="purple" />
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

            {/* Review Status Filter */}
            <div>
              <Label className="text-sm font-medium">Review Status</Label>
              <Select value={filters.reviewStatus} onValueChange={(value) => handleFilterChange("reviewStatus", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="submitted">Submitted to Manager</SelectItem>
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
                  <TableHead>Review Status</TableHead>
                  <TableHead>Current Stage</TableHead>
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
                    <TableCell>{getReviewStatusBadge(application)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Stage {application.currentStage}</Badge>
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
