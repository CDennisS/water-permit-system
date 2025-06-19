"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, X, Filter, Search, Save, Download, RefreshCw } from "lucide-react"

export interface ICTFilterState {
  // Common filters
  searchTerm: string
  dateRange: string
  startDate: string
  endDate: string

  // Application filters
  applicationStatus: string
  applicationStage: string
  permitType: string
  waterSource: string
  applicantName: string
  applicationId: string
  landSizeMin: string
  landSizeMax: string
  waterAllocationMin: string
  waterAllocationMax: string

  // Log filters
  logAction: string
  logUserType: string
  logUserId: string
  logApplicationId: string
  logDetails: string

  // Report filters
  reportType: string
  reportPeriod: string
  reportMetric: string
  reportGroupBy: string

  // Advanced options
  includeDeleted: boolean
  includeArchived: boolean
  exactMatch: boolean
  caseSensitive: boolean
}

interface ICTAdvancedFiltersProps {
  filterType: "applications" | "logs" | "reports"
  onFiltersChange: (filters: ICTFilterState) => void
  currentFilters: ICTFilterState
  onClearFilters: () => void
  onSavePreset: (name: string, filters: ICTFilterState) => void
  onLoadPreset: (filters: ICTFilterState) => void
  savedPresets: Array<{ name: string; filters: ICTFilterState }>
  onExport: (filters: ICTFilterState) => void
}

export function ICTAdvancedFilters({
  filterType,
  onFiltersChange,
  currentFilters,
  onClearFilters,
  onSavePreset,
  onLoadPreset,
  savedPresets,
  onExport,
}: ICTAdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [showPresetSave, setShowPresetSave] = useState(false)

  const handleFilterChange = (field: keyof ICTFilterState, value: string | boolean) => {
    const updatedFilters = { ...currentFilters, [field]: value }

    // Handle date preset changes
    if (field === "dateRange" && typeof value === "string" && value !== "custom") {
      const presets = getDatePresets()
      if (value === "all") {
        updatedFilters.startDate = ""
        updatedFilters.endDate = ""
      } else if (presets[value as keyof typeof presets]) {
        const preset = presets[value as keyof typeof presets]
        updatedFilters.startDate = preset.start.toISOString().split("T")[0]
        updatedFilters.endDate = preset.end.toISOString().split("T")[0]
      }
    }

    onFiltersChange(updatedFilters)
  }

  const getDatePresets = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return {
      today: { start: today, end: now },
      yesterday: { start: new Date(today.getTime() - 24 * 60 * 60 * 1000), end: today },
      last_7_days: { start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
      last_30_days: { start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), end: now },
      last_90_days: { start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), end: now },
      this_month: { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
      last_month: {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      },
      this_year: { start: new Date(now.getFullYear(), 0, 1), end: now },
      last_year: { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear(), 0, 0) },
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "" && key !== "dateRange" && value !== false) {
        count++
      }
    })
    return count
  }

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), currentFilters)
      setPresetName("")
      setShowPresetSave(false)
    }
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Advanced ICT Filters - {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearFilters()
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onExport(currentFilters)
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Preset Management */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Filter Presets</Label>
                <Button variant="outline" size="sm" onClick={() => setShowPresetSave(!showPresetSave)}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Preset
                </Button>
              </div>

              {showPresetSave && (
                <div className="flex items-center space-x-2 mb-3">
                  <Input
                    placeholder="Preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setShowPresetSave(false)}>
                    Cancel
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {savedPresets.map((preset, index) => (
                  <Button key={index} variant="outline" size="sm" onClick={() => onLoadPreset(preset.filters)}>
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>

              {/* Basic Filters */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>Search Term</Label>
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Enter search term..."
                        value={currentFilters.searchTerm}
                        onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Date Range</Label>
                    <Select
                      value={currentFilters.dateRange}
                      onValueChange={(value) => handleFilterChange("dateRange", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                        <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                        <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="this_year">This Year</SelectItem>
                        <SelectItem value="last_year">Last Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {currentFilters.dateRange === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={currentFilters.startDate}
                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={currentFilters.endDate}
                        onChange={(e) => handleFilterChange("endDate", e.target.value)}
                        min={currentFilters.startDate}
                      />
                    </div>
                  </div>
                )}

                {/* Type-specific basic filters */}
                {filterType === "applications" && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={currentFilters.applicationStatus}
                        onValueChange={(value) => handleFilterChange("applicationStatus", value)}
                      >
                        <SelectTrigger>
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
                    <div>
                      <Label>Permit Type</Label>
                      <Select
                        value={currentFilters.permitType}
                        onValueChange={(value) => handleFilterChange("permitType", value)}
                      >
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
                      <Label>Stage</Label>
                      <Select
                        value={currentFilters.applicationStage}
                        onValueChange={(value) => handleFilterChange("applicationStage", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stages</SelectItem>
                          <SelectItem value="1">Stage 1 - Permitting Officer</SelectItem>
                          <SelectItem value="2">Stage 2 - Chairperson</SelectItem>
                          <SelectItem value="3">Stage 3 - Catchment Manager</SelectItem>
                          <SelectItem value="4">Stage 4 - Catchment Chairperson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Water Source</Label>
                      <Select
                        value={currentFilters.waterSource}
                        onValueChange={(value) => handleFilterChange("waterSource", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="ground_water">Ground Water</SelectItem>
                          <SelectItem value="surface_water">Surface Water</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {filterType === "logs" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Action Type</Label>
                      <Select
                        value={currentFilters.logAction}
                        onValueChange={(value) => handleFilterChange("logAction", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                          <SelectItem value="downloaded">Downloaded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>User Type</Label>
                      <Select
                        value={currentFilters.logUserType}
                        onValueChange={(value) => handleFilterChange("logUserType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                    <div>
                      <Label>Application ID</Label>
                      <Input
                        placeholder="Filter by application..."
                        value={currentFilters.logApplicationId}
                        onChange={(e) => handleFilterChange("logApplicationId", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {filterType === "reports" && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Report Type</Label>
                      <Select
                        value={currentFilters.reportType}
                        onValueChange={(value) => handleFilterChange("reportType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Reports</SelectItem>
                          <SelectItem value="applications">Applications</SelectItem>
                          <SelectItem value="approvals">Approvals</SelectItem>
                          <SelectItem value="rejections">Rejections</SelectItem>
                          <SelectItem value="user_activity">User Activity</SelectItem>
                          <SelectItem value="system_performance">System Performance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Period</Label>
                      <Select
                        value={currentFilters.reportPeriod}
                        onValueChange={(value) => handleFilterChange("reportPeriod", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Metric</Label>
                      <Select
                        value={currentFilters.reportMetric}
                        onValueChange={(value) => handleFilterChange("reportMetric", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="trend">Trend</SelectItem>
                          <SelectItem value="comparison">Comparison</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Group By</Label>
                      <Select
                        value={currentFilters.reportGroupBy}
                        onValueChange={(value) => handleFilterChange("reportGroupBy", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Grouping</SelectItem>
                          <SelectItem value="user_type">User Type</SelectItem>
                          <SelectItem value="permit_type">Permit Type</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Advanced Filters */}
              <TabsContent value="advanced" className="space-y-4">
                {filterType === "applications" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Applicant Name</Label>
                        <Input
                          placeholder="Filter by applicant name..."
                          value={currentFilters.applicantName}
                          onChange={(e) => handleFilterChange("applicantName", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Application ID</Label>
                        <Input
                          placeholder="Filter by application ID..."
                          value={currentFilters.applicationId}
                          onChange={(e) => handleFilterChange("applicationId", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {filterType === "logs" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>User ID</Label>
                        <Input
                          placeholder="Filter by user ID..."
                          value={currentFilters.logUserId}
                          onChange={(e) => handleFilterChange("logUserId", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Log Details</Label>
                        <Input
                          placeholder="Search in log details..."
                          value={currentFilters.logDetails}
                          onChange={(e) => handleFilterChange("logDetails", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Technical Filters */}
              <TabsContent value="technical" className="space-y-4">
                {filterType === "applications" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Land Size (hectares)</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={currentFilters.landSizeMin}
                            onChange={(e) => handleFilterChange("landSizeMin", e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={currentFilters.landSizeMax}
                            onChange={(e) => handleFilterChange("landSizeMax", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Water Allocation (ML)</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={currentFilters.waterAllocationMin}
                            onChange={(e) => handleFilterChange("waterAllocationMin", e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={currentFilters.waterAllocationMax}
                            onChange={(e) => handleFilterChange("waterAllocationMax", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Options */}
              <TabsContent value="options" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Search Options</Label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={currentFilters.exactMatch}
                          onChange={(e) => handleFilterChange("exactMatch", e.target.checked)}
                        />
                        <span className="text-sm">Exact match only</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={currentFilters.caseSensitive}
                          onChange={(e) => handleFilterChange("caseSensitive", e.target.checked)}
                        />
                        <span className="text-sm">Case sensitive</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Include Options</Label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={currentFilters.includeDeleted}
                          onChange={(e) => handleFilterChange("includeDeleted", e.target.checked)}
                        />
                        <span className="text-sm">Include deleted records</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={currentFilters.includeArchived}
                          onChange={(e) => handleFilterChange("includeArchived", e.target.checked)}
                        />
                        <span className="text-sm">Include archived records</span>
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <div className="border-t pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh Data
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                {activeFiltersCount > 0 && `${activeFiltersCount} filters active`}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
