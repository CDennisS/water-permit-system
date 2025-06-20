"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, X, Filter, Search, MapPin, Droplets } from "lucide-react"

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  currentFilters: FilterState
  onClearFilters: () => void
}

export interface FilterState {
  // Text search
  searchTerm: string
  searchField: "all" | "applicant" | "application_id" | "address" | "phone"

  // Date filters
  dateRange: string
  startDate: string
  endDate: string
  dateField: "created" | "submitted" | "approved" | "updated"

  // Status and workflow
  status: string
  stage: string
  permitType: string
  waterSource: string

  // Location and technical
  landSizeMin: string
  landSizeMax: string
  waterAllocationMin: string
  waterAllocationMax: string
  numberOfBoreholes: string

  // GPS coordinates
  gpsLatMin: string
  gpsLatMax: string
  gpsLngMin: string
  gpsLngMax: string

  // Advanced options
  hasComments: string
  hasDocuments: string
  intendedUse: string
}

export function AdvancedFilters({ onFiltersChange, currentFilters, onClearFilters }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    const updatedFilters = { ...currentFilters, [field]: value }

    // Handle date preset changes
    if (field === "dateRange" && value !== "custom") {
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
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "" && key !== "dateRange") {
        count++
      }
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
                <Filter className="h-5 w-5 mr-2" />
                Advanced Filters
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
            {/* Search Section */}
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
                <Label>Search In</Label>
                <Select
                  value={currentFilters.searchField}
                  onValueChange={(value) => handleFilterChange("searchField", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="applicant">Applicant Name</SelectItem>
                    <SelectItem value="application_id">Application ID</SelectItem>
                    <SelectItem value="address">Address</SelectItem>
                    <SelectItem value="phone">Phone Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Filters */}
            <div className="border-t pt-4">
              <Label className="text-base font-medium mb-3 block">Date Filters</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Date Field</Label>
                  <Select
                    value={currentFilters.dateField}
                    onValueChange={(value) => handleFilterChange("dateField", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Created Date</SelectItem>
                      <SelectItem value="submitted">Submitted Date</SelectItem>
                      <SelectItem value="approved">Approved Date</SelectItem>
                      <SelectItem value="updated">Last Updated</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={currentFilters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={currentFilters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    min={currentFilters.startDate}
                  />
                </div>
              </div>
            </div>

            {/* Status and Type Filters */}
            <div className="border-t pt-4">
              <Label className="text-base font-medium mb-3 block">Status & Type Filters</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={currentFilters.status} onValueChange={(value) => handleFilterChange("status", value)}>
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
                  <Label>Workflow Stage</Label>
                  <Select value={currentFilters.stage} onValueChange={(value) => handleFilterChange("stage", value)}>
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
                      <SelectItem value="institution">Institution</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="surface_water_storage">Surface Water (Storage)</SelectItem>
                      <SelectItem value="surface_water_flow">Surface Water (Flow)</SelectItem>
                      <SelectItem value="tempering">Tempering</SelectItem>
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
            </div>

            {/* Technical Filters */}
            <div className="border-t pt-4">
              <Label className="text-base font-medium mb-3 block flex items-center">
                <Droplets className="h-4 w-4 mr-2" />
                Technical Specifications
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <Label>Number of Boreholes</Label>
                  <Select
                    value={currentFilters.numberOfBoreholes}
                    onValueChange={(value) => handleFilterChange("numberOfBoreholes", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Number</SelectItem>
                      <SelectItem value="1">1 Borehole</SelectItem>
                      <SelectItem value="2">2 Boreholes</SelectItem>
                      <SelectItem value="3">3 Boreholes</SelectItem>
                      <SelectItem value="4">4 Boreholes</SelectItem>
                      <SelectItem value="5+">5+ Boreholes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location Filters */}
            <div className="border-t pt-4">
              <Label className="text-base font-medium mb-3 block flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                GPS Coordinates
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="Min Latitude"
                      value={currentFilters.gpsLatMin}
                      onChange={(e) => handleFilterChange("gpsLatMin", e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="Max Latitude"
                      value={currentFilters.gpsLatMax}
                      onChange={(e) => handleFilterChange("gpsLatMax", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Longitude Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="Min Longitude"
                      value={currentFilters.gpsLngMin}
                      onChange={(e) => handleFilterChange("gpsLngMin", e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="Max Longitude"
                      value={currentFilters.gpsLngMax}
                      onChange={(e) => handleFilterChange("gpsLngMax", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="border-t pt-4">
              <Label className="text-base font-medium mb-3 block">Additional Options</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Intended Use</Label>
                  <Input
                    placeholder="e.g., irrigation, urban supply"
                    value={currentFilters.intendedUse}
                    onChange={(e) => handleFilterChange("intendedUse", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Has Comments</Label>
                  <Select
                    value={currentFilters.hasComments}
                    onValueChange={(value) => handleFilterChange("hasComments", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="yes">With Comments</SelectItem>
                      <SelectItem value="no">Without Comments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Has Documents</Label>
                  <Select
                    value={currentFilters.hasDocuments}
                    onValueChange={(value) => handleFilterChange("hasDocuments", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="yes">With Documents</SelectItem>
                      <SelectItem value="no">Without Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
