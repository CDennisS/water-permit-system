"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Download, Eye, Edit, FileText, Send } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { PermitPrinter } from "./permit-printer"
import { CommentsPrinter } from "./comments-printer"
import { AdvancedFilters, type FilterState } from "./advanced-filters"

interface ApplicationsTableProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (application: PermitApplication) => void
  onViewApplication: (application: PermitApplication) => void
}

export function ApplicationsTable({
  user,
  onNewApplication,
  onEditApplication,
  onViewApplication,
}: ApplicationsTableProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    searchTerm: "",
    searchField: "all",
    dateRange: "all",
    startDate: "",
    endDate: "",
    dateField: "created",
    status: "all",
    stage: "all",
    permitType: "all",
    waterSource: "all",
    landSizeMin: "",
    landSizeMax: "",
    waterAllocationMin: "",
    waterAllocationMax: "",
    numberOfBoreholes: "all",
    gpsLatMin: "",
    gpsLatMax: "",
    gpsLngMin: "",
    gpsLngMax: "",
    hasComments: "all",
    hasDocuments: "all",
    intendedUse: "",
  })

  useEffect(() => {
    loadApplications()
  }, [user])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter, advancedFilters])

  const loadApplications = async () => {
    try {
      const apps = await db.getApplications()
      setApplications(apps)
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Apply advanced search
    if (advancedFilters.searchTerm) {
      const searchTerm = advancedFilters.searchTerm.toLowerCase()
      filtered = filtered.filter((app) => {
        switch (advancedFilters.searchField) {
          case "applicant":
            return app.applicantName.toLowerCase().includes(searchTerm)
          case "application_id":
            return app.applicationId.toLowerCase().includes(searchTerm)
          case "address":
            return app.physicalAddress.toLowerCase().includes(searchTerm)
          case "phone":
            return app.cellularNumber.includes(searchTerm)
          default:
            return (
              app.applicantName.toLowerCase().includes(searchTerm) ||
              app.applicationId.toLowerCase().includes(searchTerm) ||
              app.physicalAddress.toLowerCase().includes(searchTerm) ||
              app.cellularNumber.includes(searchTerm)
            )
        }
      })
    }

    // Apply status filter
    if (advancedFilters.status !== "all") {
      filtered = filtered.filter((app) => app.status === advancedFilters.status)
    }

    // Apply permit type filter
    if (advancedFilters.permitType !== "all") {
      filtered = filtered.filter((app) => app.permitType === advancedFilters.permitType)
    }

    // Apply stage filter
    if (advancedFilters.stage !== "all") {
      filtered = filtered.filter((app) => app.currentStage.toString() === advancedFilters.stage)
    }

    // Apply water source filter
    if (advancedFilters.waterSource !== "all") {
      filtered = filtered.filter((app) => app.waterSource === advancedFilters.waterSource)
    }

    // Apply land size range
    if (advancedFilters.landSizeMin) {
      filtered = filtered.filter((app) => app.landSize >= Number.parseFloat(advancedFilters.landSizeMin))
    }
    if (advancedFilters.landSizeMax) {
      filtered = filtered.filter((app) => app.landSize <= Number.parseFloat(advancedFilters.landSizeMax))
    }

    // Apply water allocation range
    if (advancedFilters.waterAllocationMin) {
      filtered = filtered.filter((app) => app.waterAllocation >= Number.parseFloat(advancedFilters.waterAllocationMin))
    }
    if (advancedFilters.waterAllocationMax) {
      filtered = filtered.filter((app) => app.waterAllocation <= Number.parseFloat(advancedFilters.waterAllocationMax))
    }

    // Apply date range filtering
    if (advancedFilters.startDate) {
      const startDate = new Date(advancedFilters.startDate)
      filtered = filtered.filter((app) => {
        const compareDate =
          advancedFilters.dateField === "created"
            ? app.createdAt
            : advancedFilters.dateField === "submitted"
              ? app.submittedAt
              : advancedFilters.dateField === "approved"
                ? app.approvedAt
                : app.updatedAt
        return compareDate && compareDate >= startDate
      })
    }

    if (advancedFilters.endDate) {
      const endDate = new Date(advancedFilters.endDate)
      filtered = filtered.filter((app) => {
        const compareDate =
          advancedFilters.dateField === "created"
            ? app.createdAt
            : advancedFilters.dateField === "submitted"
              ? app.submittedAt
              : advancedFilters.dateField === "approved"
                ? app.approvedAt
                : app.updatedAt
        return compareDate && compareDate <= endDate
      })
    }

    // Apply GPS coordinate filters
    if (advancedFilters.gpsLatMin) {
      filtered = filtered.filter((app) => app.gpsLatitude >= Number.parseFloat(advancedFilters.gpsLatMin))
    }
    if (advancedFilters.gpsLatMax) {
      filtered = filtered.filter((app) => app.gpsLatitude <= Number.parseFloat(advancedFilters.gpsLatMax))
    }
    if (advancedFilters.gpsLngMin) {
      filtered = filtered.filter((app) => app.gpsLongitude >= Number.parseFloat(advancedFilters.gpsLngMin))
    }
    if (advancedFilters.gpsLngMax) {
      filtered = filtered.filter((app) => app.gpsLongitude <= Number.parseFloat(advancedFilters.gpsLngMax))
    }

    // Apply comments filter
    if (advancedFilters.hasComments !== "all") {
      const hasComments = advancedFilters.hasComments === "yes"
      filtered = filtered.filter((app) => app.workflowComments.length > 0 === hasComments)
    }

    // Apply documents filter
    if (advancedFilters.hasDocuments !== "all") {
      const hasDocuments = advancedFilters.hasDocuments === "yes"
      filtered = filtered.filter((app) => app.documents.length > 0 === hasDocuments)
    }

    // Apply intended use filter
    if (advancedFilters.intendedUse) {
      filtered = filtered.filter((app) =>
        app.intendedUse.toLowerCase().includes(advancedFilters.intendedUse.toLowerCase()),
      )
    }

    // Apply number of boreholes filter
    if (advancedFilters.numberOfBoreholes !== "all") {
      if (advancedFilters.numberOfBoreholes === "5+") {
        filtered = filtered.filter((app) => app.numberOfBoreholes >= 5)
      } else {
        filtered = filtered.filter(
          (app) => app.numberOfBoreholes === Number.parseInt(advancedFilters.numberOfBoreholes),
        )
      }
    }

    // Filter based on user role and workflow stage
    if (user.userType === "chairperson") {
      filtered = filtered.filter((app) => app.status === "submitted" && app.currentStage === 2)
    } else if (user.userType === "catchment_manager") {
      filtered = filtered.filter((app) => app.currentStage === 3)
    } else if (user.userType === "catchment_chairperson") {
      filtered = filtered.filter((app) => app.currentStage === 4)
    }

    setFilteredApplications(filtered)
  }

  const handleSubmitAll = async () => {
    const unsubmittedApps = applications.filter((app) => app.status === "unsubmitted")

    for (const app of unsubmittedApps) {
      await db.updateApplication(app.id, {
        status: "submitted",
        currentStage: 2,
        submittedAt: new Date(),
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Submitted Application",
        details: `Submitted application ${app.applicationId} for review`,
        applicationId: app.id,
      })
    }

    loadApplications()
  }

  const handleIndividualSubmit = async (application: PermitApplication) => {
    await db.updateApplication(application.id, {
      status: "submitted",
      currentStage: 2,
      submittedAt: new Date(),
    })

    await db.addLog({
      userId: user.id,
      userType: user.userType,
      action: "Submitted Application",
      details: `Submitted application ${application.applicationId} for review`,
      applicationId: application.id,
    })

    loadApplications()
  }

  const handleBatchSubmit = async () => {
    const readyApps = filteredApplications.filter((app) => {
      if (user.userType === "chairperson") {
        return app.status === "submitted" && app.currentStage === 2
      } else if (user.userType === "catchment_manager") {
        return app.currentStage === 3
      } else if (user.userType === "catchment_chairperson") {
        return app.currentStage === 4
      }
      return false
    })

    for (const app of readyApps) {
      let nextStage = app.currentStage + 1
      let newStatus = app.status

      if (user.userType === "catchment_chairperson") {
        // Final stage - return to permitting officer
        nextStage = 1
        newStatus = app.status === "approved" ? "approved" : "rejected"
      }

      await db.updateApplication(app.id, {
        currentStage: nextStage,
        status: newStatus,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Advanced Application",
        details: `Advanced application ${app.applicationId} to next stage`,
        applicationId: app.id,
      })
    }

    loadApplications()
  }

  const exportToExcel = () => {
    const csvContent = [
      ["Application ID", "Applicant Name", "Permit Type", "Status", "Created Date"],
      ...filteredApplications.map((app) => [
        app.applicationId,
        app.applicantName,
        app.permitType,
        app.status,
        app.createdAt.toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `applications_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      unsubmitted: "secondary",
      submitted: "default",
      under_review: "default",
      approved: "default",
      rejected: "destructive",
    } as const

    const colors = {
      unsubmitted: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[status as keyof typeof colors]}>{status.replace("_", " ").toUpperCase()}</Badge>
  }

  const canEdit = (application: PermitApplication) => {
    return user.userType === "permitting_officer" && application.status === "unsubmitted"
  }

  const canPrint = (application: PermitApplication) => {
    return (
      application.status === "approved" && ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
    )
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {user.userType === "permitting_officer" && (
            <Button onClick={onNewApplication}>
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unsubmitted">Unsubmitted</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {user.userType === "permitting_officer" && (
            <>
              <Button onClick={handleSubmitAll} className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                Submit All Unsubmitted ({applications.filter((app) => app.status === "unsubmitted").length})
              </Button>
            </>
          )}

          {["chairperson", "catchment_manager", "catchment_chairperson"].includes(user.userType) && (
            <Button onClick={handleBatchSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Submit Applications
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        onFiltersChange={setAdvancedFilters}
        currentFilters={advancedFilters}
        onClearFilters={() =>
          setAdvancedFilters({
            searchTerm: "",
            searchField: "all",
            dateRange: "all",
            startDate: "",
            endDate: "",
            dateField: "created",
            status: "all",
            stage: "all",
            permitType: "all",
            waterSource: "all",
            landSizeMin: "",
            landSizeMax: "",
            waterAllocationMin: "",
            waterAllocationMax: "",
            numberOfBoreholes: "all",
            gpsLatMin: "",
            gpsLatMax: "",
            gpsLngMin: "",
            gpsLngMax: "",
            hasComments: "all",
            hasDocuments: "all",
            intendedUse: "",
          })
        }
      />

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Permit Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.applicationId}</TableCell>
                  <TableCell>{application.applicantName}</TableCell>
                  <TableCell className="capitalize">{application.permitType.replace("_", " ")}</TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Stage {application.currentStage}</Badge>
                  </TableCell>
                  <TableCell>{application.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewApplication(application)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      {canEdit(application) && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => onEditApplication(application)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          {application.status === "unsubmitted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleIndividualSubmit(application)}
                              className="text-green-600 hover:text-green-800"
                              title="Submit for review"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewApplication(application)}
                        title="View documents"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>

                      {(application.status === "rejected" || application.workflowComments.length > 0) && (
                        <CommentsPrinter application={application} user={user} />
                      )}

                      {canPrint(application) && <PermitPrinter application={application} />}

                      {application.status === "approved" && canPrint(application) && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 ml-2">
                          Ready to Print
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredApplications.length === 0 && (
            <div className="text-center py-8 text-gray-500">No applications found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
