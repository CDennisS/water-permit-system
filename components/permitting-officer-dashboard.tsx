"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Search,
  Download,
  Send,
  BarChart3,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { ApplicationForm } from "./application-form"
import { ApplicationsTable } from "./applications-table"
import { ReportsAnalytics } from "./reports-analytics"
import { EnhancedExportSystem } from "./enhanced-export-system"

interface PermittingOfficerDashboardProps {
  user: User
}

interface DashboardStats {
  totalApplications: number
  submittedApplications: number
  approvedThisMonth: number
  awaitingApproval: number
  approvalRate: number
  expiringSoon: number
  totalWaterAllocation: number
  monthlyApplications: number
}

export function PermittingOfficerDashboard({ user }: PermittingOfficerDashboardProps) {
  const [currentView, setCurrentView] = useState<"dashboard" | "application-form" | "reports">("dashboard")
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    submittedApplications: 0,
    approvedThisMonth: 0,
    awaitingApproval: 0,
    approvalRate: 0,
    expiringSoon: 0,
    totalWaterAllocation: 0,
    monthlyApplications: 0,
  })

  // Optimized data loading with memoization
  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true)
      const apps = await db.getApplications()
      setApplications(apps)
      calculateStats(apps)
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Memoized stats calculation for performance
  const calculateStats = useCallback((apps: PermitApplication[]) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const submitted = apps.filter((app) => app.status === "submitted" || app.status === "under_review")
    const approved = apps.filter((app) => app.status === "approved")
    const approvedThisMonth = approved.filter((app) => {
      const approvedDate = app.approvedAt || app.createdAt
      return approvedDate.getMonth() === currentMonth && approvedDate.getFullYear() === currentYear
    })
    const awaitingApproval = apps.filter((app) => app.status === "submitted" || app.status === "under_review")

    // Calculate expiring permits (approved permits that expire within 30 days)
    const expiringSoon = approved.filter((app) => {
      if (!app.approvedAt) return false
      const expiryDate = new Date(app.approvedAt)
      expiryDate.setFullYear(expiryDate.getFullYear() + 5) // 5-year validity
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    })

    const monthlyApplications = apps.filter(
      (app) => app.createdAt.getMonth() === currentMonth && app.createdAt.getFullYear() === currentYear,
    )

    const totalWaterAllocation = apps.reduce((sum, app) => sum + app.waterAllocation, 0)
    const approvalRate = apps.length > 0 ? Math.round((approved.length / apps.length) * 100) : 0

    setStats({
      totalApplications: apps.length,
      submittedApplications: submitted.length,
      approvedThisMonth: approvedThisMonth.length,
      awaitingApproval: awaitingApproval.length,
      approvalRate,
      expiringSoon: expiringSoon.length,
      totalWaterAllocation,
      monthlyApplications: monthlyApplications.length,
    })
  }, [])

  // Optimized filtering with useMemo
  const filteredApps = useMemo(() => {
    let filtered = [...applications]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(search) ||
          app.applicationId.toLowerCase().includes(search) ||
          app.physicalAddress.toLowerCase().includes(search) ||
          app.customerAccountNumber.toLowerCase().includes(search) ||
          app.cellularNumber.includes(search) ||
          app.permitType.toLowerCase().includes(search) ||
          app.intendedUse.toLowerCase().includes(search),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    return filtered
  }, [applications, searchTerm, statusFilter])

  useEffect(() => {
    setFilteredApplications(filteredApps)
  }, [filteredApps])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Event handlers
  const handleNewApplication = () => {
    setSelectedApplication(null)
    setIsEditing(true)
    setCurrentView("application-form")
  }

  const handleEditApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setIsEditing(true)
    setCurrentView("application-form")
  }

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setIsEditing(false)
    setCurrentView("application-form")
  }

  const handleSaveApplication = async () => {
    await loadApplications()
    setCurrentView("dashboard")
    setSelectedApplication(null)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setCurrentView("dashboard")
    setSelectedApplication(null)
    setIsEditing(false)
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

    await loadApplications()
  }

  const exportToExcel = () => {
    const csvContent = [
      [
        "Application ID",
        "Applicant Name",
        "Permit Type",
        "Status",
        "Water Allocation (ML)",
        "Created Date",
        "GPS Coordinates",
      ],
      ...filteredApplications.map((app) => [
        app.applicationId,
        app.applicantName,
        app.permitType,
        app.status,
        app.waterAllocation,
        app.createdAt.toLocaleDateString(),
        `${app.gpsLatitude}, ${app.gpsLongitude}`,
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

  if (currentView === "application-form") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {isEditing ? (selectedApplication ? "Edit Application" : "New Application") : "View Application"}
          </h1>
          <Button variant="outline" onClick={handleCancelEdit}>
            ← Back to Dashboard
          </Button>
        </div>
        <ApplicationForm
          user={user}
          application={selectedApplication}
          onSave={handleSaveApplication}
          onCancel={handleCancelEdit}
        />
      </div>
    )
  }

  if (currentView === "reports") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <Button variant="outline" onClick={() => setCurrentView("dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
        <ReportsAnalytics />
      </div>
    )
  }

  const unsubmittedCount = applications.filter((app) => app.status === "unsubmitted").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permitting Officer Dashboard</h1>
          <p className="text-gray-600">Manage permit applications and track progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setCurrentView("reports")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <EnhancedExportSystem applications={filteredApplications} user={user} title="Applications" />
          {unsubmittedCount > 0 && (
            <Button onClick={handleSubmitAll} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Submit All ({unsubmittedCount})
            </Button>
          )}
          <Button onClick={handleNewApplication} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Key Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWaterAllocation.toLocaleString()} ML total allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyApplications}</div>
            <p className="text-xs text-muted-foreground">{stats.approvedThisMonth} approved this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">Overall success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.awaitingApproval}</div>
            <p className="text-xs text-muted-foreground">In review process</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {stats.expiringSoon > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Permits Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {stats.expiringSoon} permit(s) will expire within the next 30 days.
              <Button variant="link" className="p-0 ml-2 text-orange-800" onClick={() => setCurrentView("reports")}>
                View Details →
              </Button>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search applications (name, ID, address, phone, permit type)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unsubmitted">Unsubmitted</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export ({filteredApplications.length})
            </Button>
          </div>

          {searchTerm && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Search Results:</strong> {filteredApplications.length} applications found
                {filteredApplications.length > 0 && (
                  <span className="ml-2">
                    • Total Water Allocation:{" "}
                    {filteredApplications.reduce((sum, app) => sum + app.waterAllocation, 0).toLocaleString()} ML
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <ApplicationsTable
        user={user}
        onNewApplication={handleNewApplication}
        onEditApplication={handleEditApplication}
        onViewApplication={handleViewApplication}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={handleNewApplication} className="h-20 flex flex-col">
              <Plus className="h-6 w-6 mb-2" />
              Create New Application
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("reports")} className="h-20 flex flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              View Reports
            </Button>
            <Button
              variant="outline"
              onClick={handleSubmitAll}
              disabled={unsubmittedCount === 0}
              className="h-20 flex flex-col"
            >
              <Send className="h-6 w-6 mb-2" />
              Submit All ({unsubmittedCount})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
