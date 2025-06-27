"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, X, Calendar, TrendingUp, MapPin, Filter } from "lucide-react"

interface DashboardFiltersProps {
  onFiltersChange: (filters: DashboardFilterState) => void
  currentFilters: DashboardFilterState
  onClearFilters: () => void
}

export interface DashboardFilterState {
  // Time-based filters
  timeRange: string
  startDate: string
  endDate: string
  compareWithPrevious: boolean

  // Status and workflow filters
  statusFilter: string[]
  stageFilter: string[]
  permitTypeFilter: string[]
  waterSourceFilter: string[]

  // Performance metrics
  showTrends: boolean
  showComparisons: boolean
  showPredictions: boolean

  // Geographic filters
  regionFilter: string
  gpsAreaFilter: boolean

  // Data granularity
  granularity: string // daily, weekly, monthly, yearly
  aggregationType: string // count, sum, average, percentage

  // Advanced metrics
  includeExpiring: boolean
  includeOverdue: boolean
  includeHighPriority: boolean

  // User-specific filters
  userTypeFilter: string[]
  assignedToMe: boolean

  // Custom ranges
  waterAllocationRange: number[]
  landSizeRange: number[]
  processingTimeRange: number[]
}

export function AdvancedDashboardFilters({ onFiltersChange, currentFilters, onClearFilters }: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<DashboardFilterState>(currentFilters)

  // Sync local state with props
  useEffect(() => {
    setLocalFilters(currentFilters)
  }, [currentFilters])

  const handleFilterChange = (field: keyof DashboardFilterState, value: any) => {
    const updatedFilters = { ...localFilters, [field]: value }
    setLocalFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const handleArrayFilterChange = (field: keyof DashboardFilterState, value: string, checked: boolean) => {
    const currentArray = (localFilters[field] as string[]) || []
    let updatedArray: string[]

    if (checked) {
      updatedArray = [...currentArray, value]
    } else {
      updatedArray = currentArray.filter((item) => item !== value)
    }

    handleFilterChange(field, updatedArray)
  }

  const handleClearAll = () => {
    const clearedFilters: DashboardFilterState = {
      timeRange: "all",
      startDate: "",
      endDate: "",
      compareWithPrevious: false,
      statusFilter: [],
      stageFilter: [],
      permitTypeFilter: [],
      waterSourceFilter: [],
      showTrends: true,
      showComparisons: false,
      showPredictions: false,
      regionFilter: "all",
      gpsAreaFilter: false,
      granularity: "monthly",
      aggregationType: "count",
      includeExpiring: false,
      includeOverdue: false,
      includeHighPriority: false,
      userTypeFilter: [],
      assignedToMe: false,
      waterAllocationRange: [0, 1000],
      landSizeRange: [0, 500],
      processingTimeRange: [0, 365],
    }
    setLocalFilters(clearedFilters)
    onClearFilters()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.entries(localFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++
      else if (typeof value === "boolean" && value && !["showTrends"].includes(key)) count++
      else if (
        typeof value === "string" &&
        value &&
        value !== "all" &&
        value !== "" &&
        value !== "monthly" &&
        value !== "count"
      )
        count++
      else if (Array.isArray(value) && key.includes("Range")) {
        if (key === "waterAllocationRange" && (value[0] > 0 || value[1] < 1000)) count++
        else if (key === "landSizeRange" && (value[0] > 0 || value[1] < 500)) count++
        else if (key === "processingTimeRange" && (value[0] > 0 || value[1] < 365)) count++
      }
    })
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="h-5 w-5 mr-2 text-blue-600" />
                Dashboard Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
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
                      handleClearAll()
                    }}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Time Range Filters */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center text-gray-900">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Time Range & Granularity
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Time Range</Label>
                  <Select
                    value={localFilters.timeRange || "all"}
                    onValueChange={(value) => handleFilterChange("timeRange", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time range" />
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
                      <SelectItem value="this_quarter">This Quarter</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Data Granularity</Label>
                  <Select
                    value={localFilters.granularity || "monthly"}
                    onValueChange={(value) => handleFilterChange("granularity", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select granularity" />
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                  <Input
                    type="date"
                    value={localFilters.startDate || ""}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">End Date</Label>
                  <Input
                    type="date"
                    value={localFilters.endDate || ""}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    min={localFilters.startDate || undefined}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compareWithPrevious"
                    checked={localFilters.compareWithPrevious || false}
                    onCheckedChange={(checked) => handleFilterChange("compareWithPrevious", !!checked)}
                  />
                  <Label htmlFor="compareWithPrevious" className="text-sm text-gray-700">
                    Compare with previous period
                  </Label>
                </div>
              </div>
            </div>

            {/* Status and Workflow Filters */}
            <div className="border-t pt-6 space-y-4">
              <Label className="text-base font-medium text-gray-900">Status & Workflow Filters</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Application Status</Label>
                  <div className="space-y-2">
                    {[
                      { value: "unsubmitted", label: "Unsubmitted" },
                      { value: "submitted", label: "Submitted" },
                      { value: "under_review", label: "Under Review" },
                      { value: "approved", label: "Approved" },
                      { value: "rejected", label: "Rejected" },
                    ].map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.value}`}
                          checked={localFilters.statusFilter?.includes(status.value) || false}
                          onCheckedChange={(checked) =>
                            handleArrayFilterChange("statusFilter", status.value, !!checked)
                          }
                        />
                        <Label htmlFor={`status-${status.value}`} className="text-sm text-gray-700">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Workflow Stage</Label>
                  <div className="space-y-2">
                    {[
                      { value: "1", label: "Stage 1 - Permitting Officer" },
                      { value: "2", label: "Stage 2 - Chairperson" },
                      { value: "3", label: "Stage 3 - Catchment Manager" },
                      { value: "4", label: "Stage 4 - Catchment Chairperson" },
                    ].map((stage) => (
                      <div key={stage.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`stage-${stage.value}`}
                          checked={localFilters.stageFilter?.includes(stage.value) || false}
                          onCheckedChange={(checked) => handleArrayFilterChange("stageFilter", stage.value, !!checked)}
                        />
                        <Label htmlFor={`stage-${stage.value}`} className="text-sm text-gray-700">
                          {stage.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Permit Type and Water Source */}
            <div className="border-t pt-6 space-y-4">
              <Label className="text-base font-medium text-gray-900">Permit Classification</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Permit Types</Label>
                  <div className="space-y-2">
                    {[
                      { value: "urban", label: "Urban" },
                      { value: "bulk_water", label: "Bulk Water" },
                      { value: "irrigation", label: "Irrigation" },
                      { value: "institution", label: "Institution" },
                      { value: "industrial", label: "Industrial" },
                      { value: "surface_water_storage", label: "Surface Water Storage" },
                      { value: "surface_water_flow", label: "Surface Water Flow" },
                      { value: "tempering", label: "Tempering" },
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permit-${type.value}`}
                          checked={localFilters.permitTypeFilter?.includes(type.value) || false}
                          onCheckedChange={(checked) =>
                            handleArrayFilterChange("permitTypeFilter", type.value, !!checked)
                          }
                        />
                        <Label htmlFor={`permit-${type.value}`} className="text-sm text-gray-700">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Water Source</Label>
                  <div className="space-y-2">
                    {[
                      { value: "ground_water", label: "Ground Water" },
                      { value: "surface_water", label: "Surface Water" },
                    ].map((source) => (
                      <div key={source.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`source-${source.value}`}
                          checked={localFilters.waterSourceFilter?.includes(source.value) || false}
                          onCheckedChange={(checked) =>
                            handleArrayFilterChange("waterSourceFilter", source.value, !!checked)
                          }
                        />
                        <Label htmlFor={`source-${source.value}`} className="text-sm text-gray-700">
                          {source.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Range Filters */}
            <div className="border-t pt-6 space-y-4">
              <Label className="text-base font-medium text-gray-900">Range Filters</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Water Allocation (ML): {localFilters.waterAllocationRange?.[0] || 0} -{" "}
                    {localFilters.waterAllocationRange?.[1] || 1000}
                  </Label>
                  <Slider
                    value={localFilters.waterAllocationRange || [0, 1000]}
                    onValueChange={(value) => handleFilterChange("waterAllocationRange", value)}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 ML</span>
                    <span>1000 ML</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Land Size (ha): {localFilters.landSizeRange?.[0] || 0} - {localFilters.landSizeRange?.[1] || 500}
                  </Label>
                  <Slider
                    value={localFilters.landSizeRange || [0, 500]}
                    onValueChange={(value) => handleFilterChange("landSizeRange", value)}
                    max={500}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 ha</span>
                    <span>500 ha</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Processing Time (days): {localFilters.processingTimeRange?.[0] || 0} -{" "}
                    {localFilters.processingTimeRange?.[1] || 365}
                  </Label>
                  <Slider
                    value={localFilters.processingTimeRange || [0, 365]}
                    onValueChange={(value) => handleFilterChange("processingTimeRange", value)}
                    max={365}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 days</span>
                    <span>365 days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="border-t pt-6 space-y-4">
              <Label className="text-base font-medium flex items-center text-gray-900">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                Advanced Analytics Options
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showTrends"
                      checked={localFilters.showTrends || false}
                      onCheckedChange={(checked) => handleFilterChange("showTrends", !!checked)}
                    />
                    <Label htmlFor="showTrends" className="text-sm text-gray-700">
                      Show trend analysis
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showComparisons"
                      checked={localFilters.showComparisons || false}
                      onCheckedChange={(checked) => handleFilterChange("showComparisons", !!checked)}
                    />
                    <Label htmlFor="showComparisons" className="text-sm text-gray-700">
                      Show period comparisons
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPredictions"
                      checked={localFilters.showPredictions || false}
                      onCheckedChange={(checked) => handleFilterChange("showPredictions", !!checked)}
                    />
                    <Label htmlFor="showPredictions" className="text-sm text-gray-700">
                      Show predictions
                    </Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeExpiring"
                      checked={localFilters.includeExpiring || false}
                      onCheckedChange={(checked) => handleFilterChange("includeExpiring", !!checked)}
                    />
                    <Label htmlFor="includeExpiring" className="text-sm text-gray-700">
                      Include expiring permits
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeOverdue"
                      checked={localFilters.includeOverdue || false}
                      onCheckedChange={(checked) => handleFilterChange("includeOverdue", !!checked)}
                    />
                    <Label htmlFor="includeOverdue" className="text-sm text-gray-700">
                      Include overdue applications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHighPriority"
                      checked={localFilters.includeHighPriority || false}
                      onCheckedChange={(checked) => handleFilterChange("includeHighPriority", !!checked)}
                    />
                    <Label htmlFor="includeHighPriority" className="text-sm text-gray-700">
                      Include high priority only
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic and User Filters */}
            <div className="border-t pt-6 space-y-4">
              <Label className="text-base font-medium flex items-center text-gray-900">
                <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                Geographic & User Filters
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Region Filter</Label>
                  <Select
                    value={localFilters.regionFilter || "all"}
                    onValueChange={(value) => handleFilterChange("regionFilter", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="north">North Region</SelectItem>
                      <SelectItem value="south">South Region</SelectItem>
                      <SelectItem value="east">East Region</SelectItem>
                      <SelectItem value="west">West Region</SelectItem>
                      <SelectItem value="central">Central Region</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Aggregation Type</Label>
                  <Select
                    value={localFilters.aggregationType || "count"}
                    onValueChange={(value) => handleFilterChange("aggregationType", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select aggregation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="median">Median</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="assignedToMe"
                    checked={localFilters.assignedToMe || false}
                    onCheckedChange={(checked) => handleFilterChange("assignedToMe", !!checked)}
                  />
                  <Label htmlFor="assignedToMe" className="text-sm text-gray-700">
                    Show only assigned to me
                  </Label>
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {activeFiltersCount > 0 ? `${activeFiltersCount} filter(s) applied` : "No filters applied"}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleClearAll} disabled={activeFiltersCount === 0}>
                    Reset All
                  </Button>
                  <Button size="sm" onClick={() => setIsExpanded(false)} className="bg-blue-600 hover:bg-blue-700">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
