"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"

interface PermittingOfficerApplicationsTableProps {
  user: User
  onView: (application: PermitApplication) => void
  onEdit?: (application: PermitApplication) => void
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

export default function PermittingOfficerApplicationsTable({
  user,
  onView,
  onEdit,
}: PermittingOfficerApplicationsTableProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, statusFilter])

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

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const unsubmittedApplications = applications.filter((app) => app.status === "unsubmitted" || app.status === "draft")

  const canEditApplication = (app: PermitApplication) => {
    return app.status === "unsubmitted" || app.status === "draft"
  }

  const handleSelectApplication = (appId: string, checked: boolean) => {
    const newSelected = new Set(selectedApplications)
    if (checked) {
      newSelected.add(appId)
    } else {
      newSelected.delete(appId)
    }
    setSelectedApplications(newSelected)
  }

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

  const selectedUnsubmittedCount = unsubmittedApplications.filter((app) => selectedApplications.has(app.id)).length

  const allUnsubmittedSelected =
    unsubmittedApplications.length > 0 && selectedUnsubmittedCount === unsubmittedApplications.length

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
      {unsubmittedApplications.length > 0 && (
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Applications</CardTitle>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Filter by Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unsubmitted">Unsubmitted</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead className="w-[140px]">Reference</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px] text-center">Stage</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => {
                    const isUnsubmitted = app.status === "unsubmitted" || app.status === "draft"
                    const isSelected = selectedApplications.has(app.id)

                    return (
                      <TableRow key={app.id} className={isSelected ? "bg-orange-50" : ""}>
                        <TableCell>
                          {isUnsubmitted && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectApplication(app.id, checked as boolean)}
                              className="border-orange-400"
                            />
                          )}
                        </TableCell>
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
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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
