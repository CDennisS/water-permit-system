"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, X, Calendar, BarChart3, TrendingUp, MapPin } from "lucide-react"

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

  const handleFilterChange = (field: keyof DashboardFilterState, value: any) => {
    const updatedFilters = { ...currentFilters, [field]: value }
    onFiltersChange(updatedFilters)
  }

  const handleArrayFilterChange = (field: keyof DashboardFilterState, value: string, checked: boolean) => {
    const currentArray = (currentFilters[field] as string[]) || []
    let updatedArray: string[]

    if (checked) {
      updatedArray = [...currentArray, value]
    } else {
      updatedArray = currentArray.filter((item) => item !== value)
    }

    handleFilterChange(field, updatedArray)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++
      else if (typeof value === "boolean" && value) count++
      else if (typeof value === "string" && value && value !== "all" && value !== "") count++
      else if (Array.isArray(value) && key.includes("Range") && (value[0] > 0 || value[1] < 100)) count++
    })
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Dashboard Filters
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
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Time Range Filters */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Time Range & Granularity
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Time Range</Label>
                  <Select
                    value={currentFilters.timeRange}
                    onValueChange={(value) => handleFilterChange("timeRange", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                <div>
                  <Label>Data Granularity</Label>
                  <Select
                    value={currentFilters.granularity}
                    onValueChange={(value) => handleFilterChange("granularity", value)}
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
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compareWithPrevious"
                    checked={currentFilters.compareWithPrevious}
                    onCheckedChange={(checked) => handleFilterChange("compareWithPrevious", checked)}
                  />
                  <Label htmlFor="compareWithPrevious">Compare with previous period</Label>
                </div>
              </div>
            </div>

            {/* Status and Workflow Filters */}
            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-medium">Status & Workflow Filters</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Application Status</Label>
                  <div className="space-y-2">
                    {["unsubmitted", "submitted", "under_review", "approved", "rejected"].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={currentFilters.statusFilter?.includes(status)}
                          onCheckedChange={(checked) => handleArrayFilterChange("statusFilter", status, !!checked)}
                        />
                        <Label htmlFor={`status-${status}`} className="capitalize">
                          {status.replace("_", " ")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Workflow Stage</Label>
                  <div className="space-y-2">
                    {["1", "2", "3", "4"].map((stage) => (
                      <div key={stage} className="flex items-center space-x-2">
                        <Checkbox
                          id={`stage-${stage}`}
                          checked={currentFilters.stageFilter?.includes(stage)}
                          onCheckedChange={(checked) => handleArrayFilterChange("stageFilter", stage, !!checked)}
                        />
                        <Label htmlFor={`stage-${stage}`}>
                          Stage {stage} -{" "}
                          {stage === "1"
                            ? "Permitting Officer"
                            : stage === "2"
                              ? "Chairperson"
                              : stage === "3"
                                ? "Catchment Manager"
                                : "Catchment Chairperson"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Permit Type and Water Source */}
            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-medium">Permit Classification</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Permit Types</Label>
                  <div className="space-y-2">
                    {[
                      "urban",
                      "bulk_water",
                      "irrigation",
                      "institution",
                      "industrial",
                      "surface_water_storage",
                      "surface_water_flow",
                      "tempering",
                    ].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permit-${type}`}
                          checked={currentFilters.permitTypeFilter?.includes(type)}
                          onCheckedChange={(checked) => handleArrayFilterChange("permitTypeFilter", type, !!checked)}
                        />
                        <Label htmlFor={`permit-${type}`} className="capitalize">
                          {type.replace("_", " ")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Water Source</Label>
                  <div className="space-y-2">
                    {["ground_water", "surface_water"].map((source) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={`source-${source}`}
                          checked={currentFilters.waterSourceFilter?.includes(source)}
                          onCheckedChange={(checked) => handleArrayFilterChange("waterSourceFilter", source, !!checked)}
                        />
                        <Label htmlFor={`source-${source}`} className="capitalize">
                          {source.replace("_", " ")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Range Filters */}
            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-medium">Range Filters</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Water Allocation (ML): {currentFilters.waterAllocationRange?.[0]} -{" "}
                    {currentFilters.waterAllocationRange?.[1]}
                  </Label>
                  <Slider
                    value={currentFilters.waterAllocationRange || [0, 1000]}
                    onValueChange={(value) => handleFilterChange("waterAllocationRange", value)}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Land Size (ha): {currentFilters.landSizeRange?.[0]} - {currentFilters.landSizeRange?.[1]}
                  </Label>
                  <Slider
                    value={currentFilters.landSizeRange || [0, 500]}
                    onValueChange={(value) => handleFilterChange("landSizeRange", value)}
                    max={500}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Processing Time (days): {currentFilters.processingTimeRange?.[0]} -{" "}
                    {currentFilters.processingTimeRange?.[1]}
                  </Label>
                  <Slider
                    value={currentFilters.processingTimeRange || [0, 365]}
                    onValueChange={(value) => handleFilterChange("processingTimeRange", value)}
                    max={365}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Advanced Analytics Options
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showTrends"
                      checked={currentFilters.showTrends}
                      onCheckedChange={(checked) => handleFilterChange("showTrends", checked)}
                    />
                    <Label htmlFor="showTrends">Show trend analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showComparisons"
                      checked={currentFilters.showComparisons}
                      onCheckedChange={(checked) => handleFilterChange("showComparisons", checked)}
                    />
                    <Label htmlFor="showComparisons">Show period comparisons</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPredictions"
                      checked={currentFilters.showPredictions}
                      onCheckedChange={(checked) => handleFilterChange("showPredictions", checked)}
                    />
                    <Label htmlFor="showPredictions">Show predictions</Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeExpiring"
                      checked={currentFilters.includeExpiring}
                      onCheckedChange={(checked) => handleFilterChange("includeExpiring", checked)}
                    />
                    <Label htmlFor="includeExpiring">Include expiring permits</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeOverdue"
                      checked={currentFilters.includeOverdue}
                      onCheckedChange={(checked) => handleFilterChange("includeOverdue", checked)}
                    />
                    <Label htmlFor="includeOverdue">Include overdue applications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHighPriority"
                      checked={currentFilters.includeHighPriority}
                      onCheckedChange={(checked) => handleFilterChange("includeHighPriority", checked)}
                    />
                    <Label htmlFor="includeHighPriority">Include high priority only</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic and User Filters */}
            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Geographic & User Filters
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Region Filter</Label>
                  <Select
                    value={currentFilters.regionFilter}
                    onValueChange={(value) => handleFilterChange("regionFilter", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <Label>Aggregation Type</Label>
                  <Select
                    value={currentFilters.aggregationType}
                    onValueChange={(value) => handleFilterChange("aggregationType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    checked={currentFilters.assignedToMe}
                    onCheckedChange={(checked) => handleFilterChange("assignedToMe", checked)}
                  />
                  <Label htmlFor="assignedToMe">Show only assigned to me</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
