"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, Download, AlertTriangle, Clock, TrendingUp } from "lucide-react"
import type { PermitApplication } from "@/types"
import { db } from "@/lib/database"

export function ReportsAnalytics() {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [dateRange, setDateRange] = useState("last_30_days")
  const [permitTypeFilter, setPermitTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const apps = await db.getApplications()
    setApplications(apps)
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Date range filter
    const now = new Date()
    if (dateRange !== "all") {
      const daysBack =
        {
          last_7_days: 7,
          last_30_days: 30,
          last_90_days: 90,
          last_year: 365,
        }[dateRange] || 30

      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
      filtered = filtered.filter((app) => app.createdAt >= cutoffDate)
    }

    // Permit type filter
    if (permitTypeFilter !== "all") {
      filtered = filtered.filter((app) => app.permitType === permitTypeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    return filtered
  }

  const getStatistics = () => {
    const filtered = filterApplications()
    const total = filtered.length
    const approved = filtered.filter((app) => app.status === "approved").length
    const rejected = filtered.filter((app) => app.status === "rejected").length
    const pending = filtered.filter((app) => app.status === "submitted" || app.status === "under_review").length
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

    // Expiring permits (approved permits nearing 5-year expiry)
    const expiringSoon = filtered.filter((app) => {
      if (app.status !== "approved" || !app.approvedAt) return false
      const expiryDate = new Date(app.approvedAt)
      expiryDate.setFullYear(expiryDate.getFullYear() + 5)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate,
      expiringSoon,
    }
  }

  const getPermitTypeDistribution = () => {
    const filtered = filterApplications()
    const distribution = filtered.reduce(
      (acc, app) => {
        acc[app.permitType] = (acc[app.permitType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.replace("_", " ").toUpperCase(),
      value: count,
    }))
  }

  const getMonthlyTrends = () => {
    const filtered = filterApplications()
    const monthlyData = filtered.reduce(
      (acc, app) => {
        const month = app.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, applications: count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  const getTotalWaterAllocation = () => {
    const filtered = filterApplications()
    return filtered.reduce((total, app) => total + app.waterAllocation, 0)
  }

  const exportReport = () => {
    const filtered = filterApplications()
    const stats = getStatistics()

    const reportData = [
      ["PERMIT MANAGEMENT SYSTEM REPORT"],
      ["Generated:", new Date().toLocaleString()],
      [""],
      ["SUMMARY STATISTICS"],
      ["Total Applications:", stats.total],
      ["Approved:", stats.approved],
      ["Rejected:", stats.rejected],
      ["Pending:", stats.pending],
      ["Approval Rate:", `${stats.approvalRate}%`],
      ["Expiring Soon:", stats.expiringSoon],
      ["Total Water Allocation:", `${getTotalWaterAllocation().toLocaleString()} ML`],
      [""],
      ["APPLICATION DETAILS"],
      ["Application ID", "Applicant Name", "Permit Type", "Status", "Water Allocation (ML)", "Created Date"],
      ...filtered.map((app) => [
        app.applicationId,
        app.applicantName,
        app.permitType,
        app.status,
        app.waterAllocation.toString(),
        app.createdAt.toLocaleDateString(),
      ]),
    ]

    const csvContent = reportData.map((row) => (Array.isArray(row) ? row.join(",") : row)).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `permit_report_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stats = getStatistics()
  const permitDistribution = getPermitTypeDistribution()
  const monthlyTrends = getMonthlyTrends()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFCC02"]

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Reports & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Permit Type</Label>
              <Select value={permitTypeFilter} onValueChange={setPermitTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="bulk_water">Bulk Water</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="institution">Institution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={exportReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {getTotalWaterAllocation().toLocaleString()} ML total allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved} approved, {stats.rejected} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Application Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Permit Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={permitDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {permitDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
