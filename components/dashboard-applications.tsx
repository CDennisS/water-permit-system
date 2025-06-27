"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { cn } from "@/lib/utils"

interface DashboardApplicationsProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (app: PermitApplication) => void
  onViewApplication: (app: PermitApplication) => void
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

const statusIcon: Record<string, React.ReactNode> = {
  unsubmitted: <FileText className="h-4 w-4" />,
  draft: <FileText className="h-4 w-4" />,
  submitted: <Clock className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
  under_review: <Clock className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
}

export function DashboardApplications({
  user,
  onNewApplication,
  onEditApplication,
  onViewApplication,
}: DashboardApplicationsProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

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

  const unsubmittedApplications = applications.filter((app) => app.status === "unsubmitted" || app.status === "draft")

  const submittedApplications = applications.filter((app) => app.status !== "unsubmitted" && app.status !== "draft")

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date)
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
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onNewApplication} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Selection for Unsubmitted Applications */}
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

      {/* Applications Pending Submission */}
      {unsubmittedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-600" />
              Applications Pending Submission ({unsubmittedApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unsubmittedApplications.map((app) => {
                const isSelected = selectedApplications.has(app.id)

                return (
                  <div
                    key={app.id}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg",
                      isSelected ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectApplication(app.id, checked as boolean)}
                        className="border-orange-400"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{app.applicationId}</span>
                          <Badge className="bg-orange-600 text-white text-xs">Not Submitted</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{app.applicantName}</p>
                        <p className="text-xs text-gray-500">Created: {formatDate(app.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => onViewApplication(app)}>
                        View
                      </Button>
                      {canEditApplication(app) && (
                        <Button size="sm" variant="outline" onClick={() => onEditApplication(app)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Active Applications ({submittedApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submittedApplications.length > 0 ? (
            <div className="space-y-3">
              {submittedApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn("p-2 rounded-full", statusColor[app.status])}>{statusIcon[app.status]}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{app.applicationId}</span>
                        <Badge className={cn(statusColor[app.status], "text-white capitalize")}>
                          {app.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{app.applicantName}</p>
                      <p className="text-xs text-gray-500">
                        Stage {app.currentStage} • Created: {formatDate(app.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => onViewApplication(app)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No active applications</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
