"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Table, BarChart3, Filter, Settings } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/db"

interface EnhancedExportSystemProps {
  applications: PermitApplication[]
  user: User
  title?: string
}

interface ExportOptions {
  format: "csv" | "excel" | "pdf"
  includeFields: string[]
  dateRange: string
  statusFilter: string[]
  includeStatistics: boolean
  includeCharts: boolean
  groupBy: string
  sortBy: string
  sortDirection: "asc" | "desc"
}

export function EnhancedExportSystem({ applications, user, title = "Applications" }: EnhancedExportSystemProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    includeFields: ["applicationId", "applicantName", "permitType", "status", "waterAllocation", "createdAt"],
    dateRange: "all",
    statusFilter: [],
    includeStatistics: true,
    includeCharts: false,
    groupBy: "none",
    sortBy: "createdAt",
    sortDirection: "desc",
  })
  const [isExporting, setIsExporting] = useState(false)

  const availableFields = [
    { key: "applicationId", label: "Application ID" },
    { key: "applicantName", label: "Applicant Name" },
    { key: "customerAccountNumber", label: "Account Number" },
    { key: "physicalAddress", label: "Physical Address" },
    { key: "postalAddress", label: "Postal Address" },
    { key: "cellularNumber", label: "Phone Number" },
    { key: "permitType", label: "Permit Type" },
    { key: "waterSource", label: "Water Source" },
    { key: "intendedUse", label: "Intended Use" },
    { key: "waterAllocation", label: "Water Allocation (ML)" },
    { key: "landSize", label: "Land Size (ha)" },
    { key: "numberOfBoreholes", label: "Number of Boreholes" },
    { key: "gpsLatitude", label: "GPS Latitude" },
    { key: "gpsLongitude", label: "GPS Longitude" },
    { key: "status", label: "Status" },
    { key: "currentStage", label: "Current Stage" },
    { key: "createdAt", label: "Created Date" },
    { key: "submittedAt", label: "Submitted Date" },
    { key: "approvedAt", label: "Approved Date" },
    { key: "comments", label: "Comments" },
  ]

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    setExportOptions((prev) => ({
      ...prev,
      includeFields: checked ? [...prev.includeFields, fieldKey] : prev.includeFields.filter((f) => f !== fieldKey),
    }))
  }

  const handleStatusToggle = (status: string, checked: boolean) => {
    setExportOptions((prev) => ({
      ...prev,
      statusFilter: checked ? [...prev.statusFilter, status] : prev.statusFilter.filter((s) => s !== status),
    }))
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Apply status filter
    if (exportOptions.statusFilter.length > 0) {
      filtered = filtered.filter((app) => exportOptions.statusFilter.includes(app.status))
    }

    // Apply date range filter
    if (exportOptions.dateRange !== "all") {
      const now = new Date()
      let startDate = new Date()

      switch (exportOptions.dateRange) {
        case "last_7_days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "last_30_days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "last_90_days":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      filtered = filtered.filter((app) => app.createdAt >= startDate)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[exportOptions.sortBy as keyof PermitApplication]
      const bValue = b[exportOptions.sortBy as keyof PermitApplication]

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return exportOptions.sortDirection === "desc" ? -comparison : comparison
    })

    return filtered
  }

  const generateStatistics = (data: PermitApplication[]) => {
    const stats = {
      total: data.length,
      approved: data.filter((app) => app.status === "approved").length,
      rejected: data.filter((app) => app.status === "rejected").length,
      pending: data.filter((app) => app.status === "submitted" || app.status === "under_review").length,
      totalWaterAllocation: data.reduce((sum, app) => sum + app.waterAllocation, 0),
      totalLandSize: data.reduce((sum, app) => sum + app.landSize, 0),
      averageProcessingTime: 0, // Would calculate from actual data
      permitTypeDistribution: data.reduce(
        (acc, app) => {
          acc[app.permitType] = (acc[app.permitType] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    stats.averageProcessingTime = Math.round(
      data
        .filter((app) => app.approvedAt && app.submittedAt)
        .reduce((sum, app) => {
          const days = Math.ceil((app.approvedAt!.getTime() - app.submittedAt!.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0) / Math.max(1, data.filter((app) => app.approvedAt && app.submittedAt).length),
    )

    return stats
  }

  const exportData = async () => {
    setIsExporting(true)

    try {
      const filteredData = filterApplications()
      const stats = exportOptions.includeStatistics ? generateStatistics(filteredData) : null

      if (exportOptions.format === "csv") {
        await exportToCSV(filteredData, stats)
      } else if (exportOptions.format === "excel") {
        await exportToExcel(filteredData, stats)
      } else if (exportOptions.format === "pdf") {
        await exportToPDF(filteredData, stats)
      }

      // Log the export action
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Exported Data",
        details: `Exported ${filteredData.length} ${title.toLowerCase()} as ${exportOptions.format.toUpperCase()}`,
      })

      setIsExportDialogOpen(false)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToCSV = async (data: PermitApplication[], stats: any) => {
    const headers = exportOptions.includeFields.map(
      (field) => availableFields.find((f) => f.key === field)?.label || field,
    )

    const rows = data.map((app) =>
      exportOptions.includeFields.map((field) => {
        const value = app[field as keyof PermitApplication]
        if (value instanceof Date) {
          return value.toLocaleDateString()
        }
        return value?.toString() || ""
      }),
    )

    const csvContent = [
      [`${title} Export Report`],
      [`Generated: ${new Date().toLocaleString()}`],
      [`User: ${user.userType.replace("_", " ").toUpperCase()}`],
      [`Total Records: ${data.length}`],
      [""],
    ]

    if (stats && exportOptions.includeStatistics) {
      csvContent.push(
        ["STATISTICS"],
        [`Total Applications: ${stats.total}`],
        [`Approved: ${stats.approved}`],
        [`Rejected: ${stats.rejected}`],
        [`Pending: ${stats.pending}`],
        [`Total Water Allocation: ${stats.totalWaterAllocation.toLocaleString()} ML`],
        [`Total Land Size: ${stats.totalLandSize.toLocaleString()} ha`],
        [`Average Processing Time: ${stats.averageProcessingTime} days`],
        [""],
        ["PERMIT TYPE DISTRIBUTION"],
        ...Object.entries(stats.permitTypeDistribution).map(([type, count]) => [
          `${type.replace("_", " ").toUpperCase()}: ${count}`,
        ]),
        [""],
      )
    }

    csvContent.push(["APPLICATION DATA"], headers, ...rows)

    const csv = csvContent.map((row) => (Array.isArray(row) ? row.join(",") : row)).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_export_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToExcel = async (data: PermitApplication[], stats: any) => {
    // For now, export as CSV with Excel-friendly formatting
    await exportToCSV(data, stats)
  }

  const exportToPDF = async (data: PermitApplication[], stats: any) => {
    // Simulate PDF export - in production, this would generate an actual PDF
    const pdfContent = `
${title} Export Report
Generated: ${new Date().toLocaleString()}
User: ${user.userType.replace("_", " ").toUpperCase()}
Total Records: ${data.length}

${
  stats && exportOptions.includeStatistics
    ? `
STATISTICS
Total Applications: ${stats.total}
Approved: ${stats.approved}
Rejected: ${stats.rejected}
Pending: ${stats.pending}
Total Water Allocation: ${stats.totalWaterAllocation.toLocaleString()} ML
Total Land Size: ${stats.totalLandSize.toLocaleString()} ha
Average Processing Time: ${stats.averageProcessingTime} days

PERMIT TYPE DISTRIBUTION
${Object.entries(stats.permitTypeDistribution)
  .map(([type, count]) => `${type.replace("_", " ").toUpperCase()}: ${count}`)
  .join("\n")}
`
    : ""
}

APPLICATION DATA
${exportOptions.includeFields.map((field) => availableFields.find((f) => f.key === field)?.label || field).join(" | ")}

${data
  .map((app) =>
    exportOptions.includeFields
      .map((field) => {
        const value = app[field as keyof PermitApplication]
        if (value instanceof Date) {
          return value.toLocaleDateString()
        }
        return value?.toString() || ""
      })
      .join(" | "),
  )
  .join("\n")}
    `

    const blob = new Blob([pdfContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_export_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const selectAllFields = () => {
    setExportOptions((prev) => ({
      ...prev,
      includeFields: availableFields.map((f) => f.key),
    }))
  }

  const selectNoFields = () => {
    setExportOptions((prev) => ({
      ...prev,
      includeFields: [],
    }))
  }

  const selectDefaultFields = () => {
    setExportOptions((prev) => ({
      ...prev,
      includeFields: ["applicationId", "applicantName", "permitType", "status", "waterAllocation", "createdAt"],
    }))
  }

  const filteredCount = filterApplications().length

  return (
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export {title} ({applications.length} records)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Export Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="csv"
                    name="format"
                    checked={exportOptions.format === "csv"}
                    onChange={() => setExportOptions((prev) => ({ ...prev, format: "csv" }))}
                  />
                  <Label htmlFor="csv" className="flex items-center cursor-pointer">
                    <Table className="h-4 w-4 mr-2" />
                    CSV (Excel Compatible)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="excel"
                    name="format"
                    checked={exportOptions.format === "excel"}
                    onChange={() => setExportOptions((prev) => ({ ...prev, format: "excel" }))}
                  />
                  <Label htmlFor="excel" className="flex items-center cursor-pointer">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Excel (XLSX)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="pdf"
                    name="format"
                    checked={exportOptions.format === "pdf"}
                    onChange={() => setExportOptions((prev) => ({ ...prev, format: "pdf" }))}
                  />
                  <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Report
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Data Filters
                <Badge variant="secondary" className="ml-2">
                  {filteredCount} records will be exported
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Select
                    value={exportOptions.dateRange}
                    onValueChange={(value) => setExportOptions((prev) => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Sort By</Label>
                  <div className="flex space-x-2">
                    <Select
                      value={exportOptions.sortBy}
                      onValueChange={(value) => setExportOptions((prev) => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="applicantName">Applicant Name</SelectItem>
                        <SelectItem value="applicationId">Application ID</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="permitType">Permit Type</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={exportOptions.sortDirection}
                      onValueChange={(value) =>
                        setExportOptions((prev) => ({ ...prev, sortDirection: value as "asc" | "desc" }))
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">A-Z</SelectItem>
                        <SelectItem value="desc">Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Status Filter</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {["unsubmitted", "submitted", "under_review", "approved", "rejected"].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={exportOptions.statusFilter.includes(status)}
                        onCheckedChange={(checked) => handleStatusToggle(status, !!checked)}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                        {status.replace("_", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Fields to Include
                  <Badge variant="secondary" className="ml-2">
                    {exportOptions.includeFields.length} selected
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllFields}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectDefaultFields}>
                    Default
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectNoFields}>
                    Clear All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${field.key}`}
                      checked={exportOptions.includeFields.includes(field.key)}
                      onCheckedChange={(checked) => handleFieldToggle(field.key, !!checked)}
                    />
                    <Label htmlFor={`field-${field.key}`} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStatistics"
                  checked={exportOptions.includeStatistics}
                  onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeStatistics: !!checked }))}
                />
                <Label htmlFor="includeStatistics">Include summary statistics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={exportOptions.includeCharts}
                  onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeCharts: !!checked }))}
                />
                <Label htmlFor="includeCharts">Include charts and graphs (PDF only)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={exportData} disabled={isExporting || exportOptions.includeFields.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : `Export ${filteredCount} Records`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
