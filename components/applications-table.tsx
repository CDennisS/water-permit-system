"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import type { FilterState } from "./advanced-filters"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplicationsTableProps {
  user: User
  onView: (application: PermitApplication) => void
  onEdit?: (application: PermitApplication) => void
  showBulkActions?: boolean
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

function formatDate(dateString: string | Date) {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date)
  } catch {
    return "N/A"
  }
}

export function ApplicationsTable({ user, onView, onEdit, showBulkActions = false }: ApplicationsTableProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

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
      setLoading(true)
      const apps = await db.getApplications()
      setApplications(apps)
    } catch (error) {
      console.error("Error loading applications:", error)
    } finally {
      setLoading(false)
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

  // Get unsubmitted applications for selection (only for permitting officers)
  const unsubmittedApplications = applications.filter((app) => app.status === "unsubmitted" || app.status === "draft")

  // Check if all unsubmitted applications are selected
  const selectedUnsubmittedCount = unsubmittedApplications.filter((app) => selectedApplications.has(app.id)).length

  const allUnsubmittedSelected =
    unsubmittedApplications.length > 0 && selectedUnsubmittedCount === unsubmittedApplications.length

  // Handle select all unsubmitted applications
  const handleSelectAllUnsubmitted = (checked: boolean) => {
    if (checked) {
      const unsubmittedIds = unsubmittedApplications.map((app) => app.id)
      setSelectedApplications(new Set([...selectedApplications, ...unsubmittedIds]))
    } else {
      const newSelected = new Set(selectedApplications)
      unsubmittedApplications.forEach((app) => newSelected.delete(app.id))
      setSelectedApplications(newSelected)
    }
  }

  // Handle individual application selection
  const handleSelectApplication = (appId: string, checked: boolean) => {
    const newSelected = new Set(selectedApplications)
    if (checked) {
      newSelected.add(appId)
    } else {
      newSelected.delete(appId)
    }
    setSelectedApplications(newSelected)
  }

  // Submit selected unsubmitted applications
  const handleSubmitSelected = async () => {
    if (selectedUnsubmittedCount === 0) return

    setIsSubmitting(true)
    try {
      const selectedUnsubmittedIds = unsubmittedApplications
        .filter((app) => selectedApplications.has(app.id))
        .map((app) => app.id)

      // Update applications to submitted status
      for (const appId of selectedUnsubmittedIds) {
        await db.updateApplication(appId, {
          status: "submitted",
          currentStage: 2,
          submittedAt: new Date(),
        })

        // Add activity log
        await db.addLog({
          userId: user.id,
          action: "Application submitted",
          details: `Application submitted to Upper Manyame Sub Catchment Council Chairman for review`,
          applicationId: appId,
        })
      }

      // Reload applications and clear selection
      await loadApplications()
      setSelectedApplications(new Set())

      alert(`Successfully submitted ${selectedUnsubmittedIds.length} application(s) to the Chairman for review.`)
    } catch (error) {
      console.error("Error submitting applications:", error)
      alert("Error submitting applications. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAll = async () => {
    const unsubmittedApps = applications.filter((app) => app.status === "unsubmitted" || app.status === "draft")

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
    const colors = {
      unsubmitted: "bg-gray-100 text-gray-800",
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[status as keyof typeof colors]}>{status.replace("_", " ").toUpperCase()}</Badge>
  }

  const canEditApplication = (app: PermitApplication) => {
    return app.status === "unsubmitted" || app.status === "draft"
  }

  const canPrintApplication = (app: PermitApplication) => {
    return app.status === "approved" && ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
  }

  const handleReopenApplication = async (application: PermitApplication) => {
    if (!["permit_supervisor", "ict"].includes(user.userType)) return

    try {
      await db.updateApplication(application.id, {
        status: "unsubmitted",
        currentStage: 1,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Reopened Application",
        details: `Reopened rejected application ${application.applicationId} for editing`,
        applicationId: application.id,
      })

      loadApplications()
    } catch (error) {
      console.error("Failed to reopen application:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading applications...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Selection Card */}
      {showBulkActions && unsubmittedApplications.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-800">Bulk Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-unsubmitted"
                  checked={allUnsubmittedSelected}
                  onCheckedChange={handleSelectAllUnsubmitted}
                  className="border-orange-400"
                />
                <label htmlFor="select-all-unsubmitted" className="text-sm font-medium text-orange-800">
                  Select All Unsubmitted Applications ({unsubmittedApplications.length})
                </label>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {selectedUnsubmittedCount} selected
              </Badge>
            </div>

            {allUnsubmittedSelected && (
              <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                <p className="text-sm text-orange-700">
                  Selected applications will be sent to the Upper Manyame Sub Catchment Council Chairman for review.
                </p>
                <Button
                  onClick={handleSubmitSelected}
                  disabled={isSubmitting || selectedUnsubmittedCount === 0}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit All Unsubmitted Applications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {showBulkActions && <TableHead className="w-[50px]">Select</TableHead>}
                  <TableHead className="w-[140px]">Reference</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px] text-center">Stage</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length > 0 ? (
                  applications.map((app) => {
                    const isUnsubmitted = app.status === "unsubmitted" || app.status === "draft"
                    const isSelected = selectedApplications.has(app.id)

                    return (
                      <TableRow key={app.id} className={isSelected ? "bg-orange-50" : ""}>
                        {showBulkActions && (
                          <TableCell>
                            {isUnsubmitted && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectApplication(app.id, checked as boolean)}
                                className="border-orange-400"
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{app.applicationId}</span>
                            {isUnsubmitted && <Badge className="bg-orange-600 text-white text-xs">Not Submitted</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{app.applicantName}</TableCell>
                        <TableCell>
                          <Badge className={cn(statusColor[app.status], "text-white capitalize")}>
                            {app.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{app.currentStage}</TableCell>
                        <TableCell>{formatDate(app.createdAt)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="secondary" onClick={() => onView(app)}>
                            View
                          </Button>
                          {canEditApplication(app) && onEdit && (
                            <Button size="sm" variant="outline" onClick={() => onEdit(app)}>
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={showBulkActions ? 7 : 6} className="py-8 text-center text-muted-foreground">
                      No applications to display.
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
