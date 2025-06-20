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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, X, Calendar, BarChart3, TrendingUp, MapPin, Filter, Download } from "lucide-react"

export interface ReportsFilterState {
  // Time-based filters
  reportPeriod: string
  startDate: string
  endDate: string
  dateField: string
  granularity: string
  compareWithPrevious: boolean

  // Report type filters
  reportType: string[]
  chartTypes: string[]
  includeCharts: boolean
  includeTables: boolean
  includeStatistics: boolean

  // Data filters
  statusFilter: string[]
  stageFilter: string[]
  permitTypeFilter: string[]
  waterSourceFilter: string[]
  userTypeFilter: string[]

  // Performance metrics
  showTrends: boolean
  showForecasts: boolean
  showComparisons: boolean
  showBenchmarks: boolean

  // Geographic filters
  regionFilter: string
  gpsAreaFilter: boolean
  gpsLatRange: number[]
  gpsLngRange: number[]

  // Range filters
  waterAllocationRange: number[]
  landSizeRange: number[]
  processingTimeRange: number[]
  applicationCountRange: number[]

  // Advanced analytics
  aggregationType: string
  groupBy: string[]
  sortBy: string
  sortDirection: string

  // Export options
  exportFormat: string
  includeRawData: boolean
  includeChartImages: boolean
  includeExecutiveSummary: boolean

  // Custom filters
  customMetrics: string[]
  kpiSelection: string[]
  alertThresholds: boolean
}

interface AdvancedReportsFiltersProps {
  onFiltersChange: (filters: ReportsFilterState) => void
  currentFilters: ReportsFilterState
  onClearFilters: () => void
  onExportReport: (format: string) => void
  totalRecords: number
  filteredRecords: number
}

export function AdvancedReportsFilters({
  onFiltersChange,
  currentFilters,
  onClearFilters,
  onExportReport,
  totalRecords,
  filteredRecords,
}: AdvancedReportsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const handleFilterChange = (field: keyof ReportsFilterState, value: any) => {
    const updatedFilters = { ...currentFilters, [field]: value }
    onFiltersChange(updatedFilters)
  }

  const handleArrayFilterChange = (field: keyof ReportsFilterState, value: string, checked: boolean) => {
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
                <Filter className="h-5 w-5 mr-2" />
                Advanced Reports Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {filteredRecords} of {totalRecords} records
                </Badge>
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
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="flex items-center text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="geographic" className="flex items-center text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Geographic
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </TabsTrigger>
              </TabsList>

              {/* Basic Filters Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Report Period</Label>
                    <Select
                      value={currentFilters.reportPeriod}
                      onValueChange={(value) => handleFilterChange("reportPeriod", value)}
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
                        <SelectItem value="last_quarter">Last Quarter</SelectItem>
                        <SelectItem value="this_year">This Year</SelectItem>
                        <SelectItem value="last_year">Last Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Group By</Label>
                    <Select
                      value={currentFilters.groupBy?.[0] || ""}
                      onValueChange={(value) => handleFilterChange("groupBy", [value])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="permit_type">Permit Type</SelectItem>
                        <SelectItem value="stage">Workflow Stage</SelectItem>
                        <SelectItem value="water_source">Water Source</SelectItem>
                        <SelectItem value="user_type">User Type</SelectItem>
                        <SelectItem value="region">Region</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="quarter">Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="compareWithPrevious"
                      checked={currentFilters.compareWithPrevious}
                      onCheckedChange={(checked) => handleFilterChange("compareWithPrevious", checked)}
                    />
                    <Label htmlFor="compareWithPrevious">Compare with previous period</Label>
                  </div>
                </div>
              </TabsContent>

              {/* Data Filters Tab */}
              <TabsContent value="data" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Application Status</Label>
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
                    <Label className="text-sm font-medium mb-3 block">Workflow Stage</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Permit Types</Label>
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
                    <Label className="text-sm font-medium mb-3 block">Water Source</Label>
                    <div className="space-y-2">
                      {["ground_water", "surface_water"].map((source) => (
                        <div key={source} className="flex items-center space-x-2">
                          <Checkbox
                            id={`source-${source}`}
                            checked={currentFilters.waterSourceFilter?.includes(source)}
                            onCheckedChange={(checked) =>
                              handleArrayFilterChange("waterSourceFilter", source, !!checked)
                            }
                          />
                          <Label htmlFor={`source-${source}`} className="capitalize">
                            {source.replace("_", " ")}
                          </Label>
                        </div>
                      ))}
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
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Report Types</Label>
                    <div className="space-y-2">
                      {[
                        "overview",
                        "performance",
                        "trends",
                        "forecasts",
                        "comparisons",
                        "benchmarks",
                        "kpi_dashboard",
                        "executive_summary",
                      ].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`report-${type}`}
                            checked={currentFilters.reportType?.includes(type)}
                            onCheckedChange={(checked) => handleArrayFilterChange("reportType", type, !!checked)}
                          />
                          <Label htmlFor={`report-${type}`} className="capitalize">
                            {type.replace("_", " ")}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Chart Types</Label>
                    <div className="space-y-2">
                      {["bar_chart", "line_chart", "pie_chart", "area_chart", "scatter_plot", "heatmap"].map(
                        (chart) => (
                          <div key={chart} className="flex items-center space-x-2">
                            <Checkbox
                              id={`chart-${chart}`}
                              checked={currentFilters.chartTypes?.includes(chart)}
                              onCheckedChange={(checked) => handleArrayFilterChange("chartTypes", chart, !!checked)}
                            />
                            <Label htmlFor={`chart-${chart}`} className="capitalize">
                              {chart.replace("_", " ")}
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Analytics Options</Label>
                    <div className="space-y-2">
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
                          id="showForecasts"
                          checked={currentFilters.showForecasts}
                          onCheckedChange={(checked) => handleFilterChange("showForecasts", checked)}
                        />
                        <Label htmlFor="showForecasts">Include forecasts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showComparisons"
                          checked={currentFilters.showComparisons}
                          onCheckedChange={(checked) => handleFilterChange("showComparisons", checked)}
                        />
                        <Label htmlFor="showComparisons">Period comparisons</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showBenchmarks"
                          checked={currentFilters.showBenchmarks}
                          onCheckedChange={(checked) => handleFilterChange("showBenchmarks", checked)}
                        />
                        <Label htmlFor="showBenchmarks">Industry benchmarks</Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Aggregation & Sorting</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Aggregation Type</Label>
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
                            <SelectItem value="median">Median</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Sort By</Label>
                        <Select
                          value={currentFilters.sortBy}
                          onValueChange={(value) => handleFilterChange("sortBy", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="value">Value</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Geographic Tab */}
              <TabsContent value="geographic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="gpsAreaFilter"
                      checked={currentFilters.gpsAreaFilter}
                      onCheckedChange={(checked) => handleFilterChange("gpsAreaFilter", checked)}
                    />
                    <Label htmlFor="gpsAreaFilter">Enable GPS area filtering</Label>
                  </div>
                </div>

                {currentFilters.gpsAreaFilter && (
                  <div className="border-t pt-4 space-y-4">
                    <Label className="text-base font-medium">GPS Coordinate Ranges</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Latitude Range: {currentFilters.gpsLatRange?.[0]} - {currentFilters.gpsLatRange?.[1]}
                        </Label>
                        <Slider
                          value={currentFilters.gpsLatRange || [-90, 90]}
                          onValueChange={(value) => handleFilterChange("gpsLatRange", value)}
                          min={-90}
                          max={90}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Longitude Range: {currentFilters.gpsLngRange?.[0]} - {currentFilters.gpsLngRange?.[1]}
                        </Label>
                        <Slider
                          value={currentFilters.gpsLngRange || [-180, 180]}
                          onValueChange={(value) => handleFilterChange("gpsLngRange", value)}
                          min={-180}
                          max={180}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Export Format</Label>
                    <Select
                      value={currentFilters.exportFormat}
                      onValueChange={(value) => handleFilterChange("exportFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                        <SelectItem value="excel">Excel Workbook</SelectItem>
                        <SelectItem value="csv">CSV Data</SelectItem>
                        <SelectItem value="json">JSON Data</SelectItem>
                        <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Export Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeRawData"
                          checked={currentFilters.includeRawData}
                          onCheckedChange={(checked) => handleFilterChange("includeRawData", checked)}
                        />
                        <Label htmlFor="includeRawData">Include raw data</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeChartImages"
                          checked={currentFilters.includeChartImages}
                          onCheckedChange={(checked) => handleFilterChange("includeChartImages", checked)}
                        />
                        <Label htmlFor="includeChartImages">Include chart images</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeExecutiveSummary"
                          checked={currentFilters.includeExecutiveSummary}
                          onCheckedChange={(checked) => handleFilterChange("includeExecutiveSummary", checked)}
                        />
                        <Label htmlFor="includeExecutiveSummary">Include executive summary</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Quick Export Actions</Label>
                      <p className="text-xs text-muted-foreground">Export filtered data in various formats</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onExportReport("csv")}>
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onExportReport("excel")}>
                        <Download className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onExportReport("pdf")}>
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
