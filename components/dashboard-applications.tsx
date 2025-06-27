"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Edit,
  RefreshCw,
  AlertCircle,
  Send,
  CheckSquare,
} from "lucide-react"
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
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, searchTerm])

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

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicationId.toLowerCase().includes(searchLower) ||
          app.applicantName.toLowerCase().includes(searchLower) ||
          app.customerAccountNumber.toLowerCase().includes(searchLower) ||
          app.physicalAddress.toLowerCase().includes(searchLower) ||
          app.cellularNumber.includes(searchLower) ||
          app.intendedUse.toLowerCase().includes(searchLower) ||
          app.waterSource.toLowerCase().includes(searchLower) ||
          app.permitType.toLowerCase().includes(searchLower),
      )
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredApplications(filtered)
  }

  const unsubmittedApplications = filteredApplications.filter(
    (app) => app.status === "unsubmitted" || app.status === "draft",
  )
  const submittedApplications = filteredApplications.filter(
    (app) => app.status !== "unsubmitted" && app.status !== "draft",
  )

  const canEditApplication = (app: PermitApplication) => {
    return user.userType === "permitting_officer" && (app.status === "unsubmitted" || app.status === "draft")
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
          userType: user.userType,
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

  const getApplicationStats = () => {
    const stats = {
      total: filteredApplications.length,
      draft: filteredApplications.filter((app) => app.status === "unsubmitted" || app.status === "draft").length,
      submitted: filteredApplications.filter((app) => app.status === "submitted").length,
      pending: filteredApplications.filter((app) => app.status === "pending").length,
      under_review: filteredApplications.filter((app) => app.status === "under_review").length,
      approved: filteredApplications.filter((app) => app.status === "approved").length,
      rejected: filteredApplications.filter((app) => app.status === "rejected").length,
    }
    return stats
  }

  const stats = getApplicationStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 font-medium">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Government Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Applications Dashboard</h1>
            <p className="text-blue-100 text-sm">
              Upper Manyame Sub Catchment Council • Water Permit Management System
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Displaying {filteredApplications.length} applications
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={loadApplications}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={onNewApplication} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Draft</p>
                <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Submitted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Review</p>
                <p className="text-2xl font-bold text-blue-600">{stats.under_review}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Search className="h-5 w-5 text-blue-600" />
            Search Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by Application ID, Applicant Name, Account Number, Address, Phone, Water Source, or Permit Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Found {filteredApplications.length} application(s) matching "{searchTerm}"
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-slate-600 hover:text-slate-800"
              >
                Clear Search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Selection for Unsubmitted Applications */}
      {user.userType === "permitting_officer" && unsubmittedApplications.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-800 flex items-center space-x-2">
              <CheckSquare className="h-5 w-5" />
              <span>Bulk Application Submission</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="select-all-unsubmitted"
                    checked={allUnsubmittedSelected}
                    onCheckedChange={handleSelectAllUnsubmitted}
                    className="border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                  <label
                    htmlFor="select-all-unsubmitted"
                    className="text-sm font-medium text-orange-800 cursor-pointer"
                  >
                    Select All Unsubmitted Applications
                  </label>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    {unsubmittedApplications.length} available
                  </Badge>
                </div>

                {selectedUnsubmittedCount > 0 && (
                  <Badge className="bg-orange-600 text-white">{selectedUnsubmittedCount} selected</Badge>
                )}
              </div>

              {allUnsubmittedSelected && (
                <Button
                  onClick={handleSubmitSelected}
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : `Submit All Unsubmitted Applications (${selectedUnsubmittedCount})`}
                </Button>
              )}
            </div>

            <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded">
              <strong>Note:</strong> Selected applications will be submitted to the Upper Manyame Sub Catchment Council
              Chairman for review and moved to Stage 2 of the approval process.
            </div>
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
                      {user.userType === "permitting_officer" && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectApplication(app.id, checked as boolean)}
                          className="border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{app.applicationId}</span>
                          <Badge className="bg-orange-600 text-white text-xs">Not Submitted</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{app.applicantName}</p>
                        <p className="text-xs text-gray-500">
                          {app.physicalAddress} • {app.cellularNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {app.permitType.replace("_", " ").toUpperCase()} • {app.waterSource.replace("_", " ")} •{" "}
                          {app.waterAllocation} ML
                        </p>
                        <p className="text-xs text-gray-500">Created: {formatDate(app.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onViewApplication(app)}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {canEditApplication(app) && (
                        <Button size="sm" variant="outline" onClick={() => onEditApplication(app)}>
                          <Edit className="h-3 w-3 mr-1" />
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
                    <div className={cn("p-2 rounded-full text-white", statusColor[app.status])}>
                      {statusIcon[app.status]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{app.applicationId}</span>
                        <Badge className={cn(statusColor[app.status], "text-white capitalize")}>
                          {app.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{app.applicantName}</p>
                      <p className="text-xs text-gray-500">
                        {app.physicalAddress} • {app.cellularNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {app.permitType.replace("_", " ").toUpperCase()} • {app.waterSource.replace("_", " ")} •{" "}
                        {app.waterAllocation} ML
                      </p>
                      <p className="text-xs text-gray-500">
                        Stage {app.currentStage} • Created: {formatDate(app.createdAt)}
                        {app.submittedAt && ` • Submitted: ${formatDate(app.submittedAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onViewApplication(app)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No active applications</p>
              <p className="text-gray-400 text-sm">Applications that have been submitted will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Results Message */}
      {searchTerm && filteredApplications.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No applications found</h3>
            <p className="text-gray-500 mb-4">
              No applications match your search for "{searchTerm}". Try adjusting your search terms.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
