"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Activity, Calendar, X, CalendarDays } from "lucide-react"
import type { ActivityLog, User } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface ActivityLogsProps {
  user: User
}

interface DateFilter {
  startDate: string
  endDate: string
  preset: string
}

export function ActivityLogs({ user }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: "",
    endDate: "",
    preset: "all",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, actionFilter, userTypeFilter, dateFilter])

  const loadLogs = async () => {
    const allLogs = await db.getLogs()
    setLogs(allLogs)
    setIsLoading(false)
  }

  const getDatePresets = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)

    return {
      today: { start: today, end: now },
      yesterday: { start: yesterday, end: today },
      last_7_days: { start: weekAgo, end: now },
      last_30_days: { start: monthAgo, end: now },
      last_90_days: { start: quarterAgo, end: now },
      last_year: { start: yearAgo, end: now },
      this_month: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      },
      last_month: {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      },
    }
  }

  const handleDatePresetChange = (preset: string) => {
    const presets = getDatePresets()

    if (preset === "all") {
      setDateFilter({
        startDate: "",
        endDate: "",
        preset: "all",
      })
    } else if (preset === "custom") {
      setDateFilter((prev) => ({
        ...prev,
        preset: "custom",
      }))
    } else {
      const presetData = presets[preset as keyof typeof presets]
      if (presetData) {
        setDateFilter({
          startDate: presetData.start.toISOString().split("T")[0],
          endDate: presetData.end.toISOString().split("T")[0],
          preset,
        })
      }
    }
  }

  const handleCustomDateChange = (field: "startDate" | "endDate", value: string) => {
    setDateFilter((prev) => ({
      ...prev,
      [field]: value,
      preset: "custom",
    }))
  }

  const clearDateFilter = () => {
    setDateFilter({
      startDate: "",
      endDate: "",
      preset: "all",
    })
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.applicationId && log.applicationId.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action.toLowerCase().includes(actionFilter.toLowerCase()))
    }

    // User type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.userType === userTypeFilter)
    }

    // Date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp)
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate + "T23:59:59") : null

        if (startDate && logDate < startDate) return false
        if (endDate && logDate > endDate) return false
        return true
      })
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredLogs(filtered)
  }

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "User Type", "Action", "Details", "Application ID", "Date Range"],
      ...filteredLogs.map((log) => [
        log.timestamp.toLocaleString(),
        getUserTypeLabel(log.userType),
        log.action,
        log.details,
        log.applicationId || "N/A",
        dateFilter.preset !== "all" ? `${dateFilter.startDate} to ${dateFilter.endDate}` : "All dates",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity_logs_${dateFilter.preset}_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes("Created") || action.includes("Added")) return "bg-green-100 text-green-800"
    if (action.includes("Updated") || action.includes("Advanced")) return "bg-blue-100 text-blue-800"
    if (action.includes("Deleted") || action.includes("Rejected")) return "bg-red-100 text-red-800"
    if (action.includes("Approved")) return "bg-green-100 text-green-800"
    if (action.includes("Submitted")) return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  const getDateRangeDisplay = () => {
    if (dateFilter.preset === "all") return "All time"
    if (dateFilter.preset === "custom") {
      if (dateFilter.startDate && dateFilter.endDate) {
        return `${new Date(dateFilter.startDate).toLocaleDateString()} - ${new Date(dateFilter.endDate).toLocaleDateString()}`
      }
      if (dateFilter.startDate) {
        return `From ${new Date(dateFilter.startDate).toLocaleDateString()}`
      }
      if (dateFilter.endDate) {
        return `Until ${new Date(dateFilter.endDate).toLocaleDateString()}`
      }
    }

    const presetLabels = {
      today: "Today",
      yesterday: "Yesterday",
      last_7_days: "Last 7 days",
      last_30_days: "Last 30 days",
      last_90_days: "Last 90 days",
      last_year: "Last year",
      this_month: "This month",
      last_month: "Last month",
    }

    return presetLabels[dateFilter.preset as keyof typeof presetLabels] || dateFilter.preset
  }

  const getActivitySummary = () => {
    const summary = filteredLogs.reduce(
      (acc, log) => {
        const action = log.action.split(" ")[0] // Get first word of action
        acc[action] = (acc[action] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(summary)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5 activities
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading activity logs...</div>
  }

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Activity Logs - Advanced Filtering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Basic Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="permitting_officer">Permitting Officer</SelectItem>
                  <SelectItem value="chairperson">Chairperson</SelectItem>
                  <SelectItem value="catchment_manager">Catchment Manager</SelectItem>
                  <SelectItem value="catchment_chairperson">Catchment Chairperson</SelectItem>
                  <SelectItem value="permit_supervisor">Permit Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filtering */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Label className="font-medium">Date Range Filter</Label>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilter}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Presets */}
                <div>
                  <Label className="text-sm">Quick Select</Label>
                  <Select value={dateFilter.preset} onValueChange={handleDatePresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Start Date */}
                <div>
                  <Label className="text-sm">Start Date</Label>
                  <Input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Custom End Date */}
                <div>
                  <Label className="text-sm">End Date</Label>
                  <Input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    min={dateFilter.startDate}
                  />
                </div>

                {/* Export Button */}
                <div className="flex items-end">
                  <Button onClick={exportLogs} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Active Filter Display */}
              {(dateFilter.startDate || dateFilter.endDate || dateFilter.preset !== "all") && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Showing activities for: {getDateRangeDisplay()}
                    </span>
                    <Badge variant="outline" className="text-blue-600">
                      {filteredLogs.length} records
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      {filteredLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredLogs.length}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </div>
              {getActivitySummary().map(([action, count]) => (
                <div key={action} className="text-center">
                  <div className="text-xl font-bold text-gray-800">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{action}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Activity History ({filteredLogs.length} records)
            {dateFilter.preset !== "all" && (
              <span className="text-sm font-normal text-gray-600 ml-2">- {getDateRangeDisplay()}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Application</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    <div>{log.timestamp.toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getUserTypeLabel(log.userType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    <div className="truncate" title={log.details}>
                      {log.details}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.applicationId && (
                      <Badge variant="outline" className="text-xs">
                        {log.applicationId}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No activity logs found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your filters or date range.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
