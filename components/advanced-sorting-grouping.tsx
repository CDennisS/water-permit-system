"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ArrowUpDown, Group, X, SortAsc, SortDesc } from "lucide-react"

interface SortingGroupingProps {
  onSortingChange: (sorting: SortingState) => void
  onGroupingChange: (grouping: GroupingState) => void
  currentSorting: SortingState
  currentGrouping: GroupingState
  onClearAll: () => void
  dataType: "applications" | "reports" | "activity_logs"
}

export interface SortingState {
  primarySort: {
    field: string
    direction: "asc" | "desc"
  }
  secondarySort: {
    field: string
    direction: "asc" | "desc"
  }
  tertiarySort: {
    field: string
    direction: "asc" | "desc"
  }
}

export interface GroupingState {
  primaryGroup: string
  secondaryGroup: string
  showGroupCounts: boolean
  collapseGroups: boolean
  sortGroupsBy: "name" | "count" | "date"
  groupSortDirection: "asc" | "desc"
}

export function AdvancedSortingGrouping({
  onSortingChange,
  onGroupingChange,
  currentSorting,
  currentGrouping,
  onClearAll,
  dataType,
}: SortingGroupingProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSortFields = () => {
    const commonFields = {
      none: "None",
      created_date: "Created Date",
      updated_date: "Updated Date",
      alphabetical: "Alphabetical (A-Z)",
    }

    if (dataType === "applications") {
      return {
        ...commonFields,
        applicant_name: "Applicant Name",
        application_id: "Application ID",
        permit_type: "Permit Type",
        status: "Status",
        stage: "Workflow Stage",
        water_allocation: "Water Allocation",
        land_size: "Land Size",
        submitted_date: "Submitted Date",
        approved_date: "Approved Date",
        priority: "Priority Level",
        expiry_date: "Expiry Date",
      }
    } else if (dataType === "activity_logs") {
      return {
        ...commonFields,
        timestamp: "Timestamp",
        action: "Action Type",
        user_type: "User Type",
        application_id: "Application ID",
        importance: "Log Importance",
      }
    } else {
      return {
        ...commonFields,
        report_type: "Report Type",
        generated_date: "Generated Date",
        data_range: "Data Range",
        file_size: "File Size",
      }
    }
  }

  const getGroupFields = () => {
    const commonFields = {
      none: "No Grouping",
      date_created: "Date Created",
      month_created: "Month Created",
      year_created: "Year Created",
    }

    if (dataType === "applications") {
      return {
        ...commonFields,
        status: "Status",
        permit_type: "Permit Type",
        workflow_stage: "Workflow Stage",
        water_source: "Water Source",
        intended_use: "Intended Use",
        approval_month: "Approval Month",
        land_size_range: "Land Size Range",
        water_allocation_range: "Water Allocation Range",
        geographic_area: "Geographic Area",
        processing_time: "Processing Time Range",
        document_status: "Document Status",
        priority_level: "Priority Level",
      }
    } else if (dataType === "activity_logs") {
      return {
        ...commonFields,
        action_type: "Action Type",
        user_type: "User Type",
        application_status: "Application Status",
        time_of_day: "Time of Day",
        day_of_week: "Day of Week",
        severity: "Log Severity",
      }
    } else {
      return {
        ...commonFields,
        report_type: "Report Type",
        data_source: "Data Source",
        frequency: "Report Frequency",
        department: "Department",
      }
    }
  }

  const handleSortingChange = (
    level: "primary" | "secondary" | "tertiary",
    field: "field" | "direction",
    value: string,
  ) => {
    const newSorting = { ...currentSorting }
    if (field === "field") {
      newSorting[`${level}Sort`].field = value
    } else {
      newSorting[`${level}Sort`].direction = value as "asc" | "desc"
    }
    onSortingChange(newSorting)
  }

  const handleGroupingChange = (field: keyof GroupingState, value: string | boolean) => {
    const newGrouping = { ...currentGrouping, [field]: value }
    onGroupingChange(newGrouping)
  }

  const getActiveSortingCount = () => {
    let count = 0
    if (currentSorting.primarySort.field !== "none") count++
    if (currentSorting.secondarySort.field !== "none") count++
    if (currentSorting.tertiarySort.field !== "none") count++
    return count
  }

  const getActiveGroupingCount = () => {
    let count = 0
    if (currentGrouping.primaryGroup !== "none") count++
    if (currentGrouping.secondaryGroup !== "none") count++
    return count
  }

  const sortFields = getSortFields()
  const groupFields = getGroupFields()
  const activeSortingCount = getActiveSortingCount()
  const activeGroupingCount = getActiveGroupingCount()

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowUpDown className="h-5 w-5 mr-2" />
                Advanced Sorting & Grouping
                {(activeSortingCount > 0 || activeGroupingCount > 0) && (
                  <div className="flex space-x-2 ml-2">
                    {activeSortingCount > 0 && (
                      <Badge variant="secondary">
                        {activeSortingCount} sort{activeSortingCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {activeGroupingCount > 0 && (
                      <Badge variant="secondary">
                        {activeGroupingCount} group{activeGroupingCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {(activeSortingCount > 0 || activeGroupingCount > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearAll()
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
            {/* Multi-Level Sorting */}
            <div className="border-b pb-4">
              <Label className="text-base font-medium mb-3 block flex items-center">
                <SortAsc className="h-4 w-4 mr-2" />
                Multi-Level Sorting
              </Label>
              <div className="space-y-3">
                {/* Primary Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Primary Sort</Label>
                    <Select
                      value={currentSorting.primarySort.field}
                      onValueChange={(value) => handleSortingChange("primary", "field", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sortFields).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Direction</Label>
                    <Select
                      value={currentSorting.primarySort.direction}
                      onValueChange={(value) => handleSortingChange("primary", "direction", value)}
                      disabled={currentSorting.primarySort.field === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          <div className="flex items-center">
                            <SortAsc className="h-4 w-4 mr-2" />
                            Ascending
                          </div>
                        </SelectItem>
                        <SelectItem value="desc">
                          <div className="flex items-center">
                            <SortDesc className="h-4 w-4 mr-2" />
                            Descending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    {currentSorting.primarySort.field !== "none" && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Secondary Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Secondary Sort</Label>
                    <Select
                      value={currentSorting.secondarySort.field}
                      onValueChange={(value) => handleSortingChange("secondary", "field", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sortFields).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Direction</Label>
                    <Select
                      value={currentSorting.secondarySort.direction}
                      onValueChange={(value) => handleSortingChange("secondary", "direction", value)}
                      disabled={currentSorting.secondarySort.field === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          <div className="flex items-center">
                            <SortAsc className="h-4 w-4 mr-2" />
                            Ascending
                          </div>
                        </SelectItem>
                        <SelectItem value="desc">
                          <div className="flex items-center">
                            <SortDesc className="h-4 w-4 mr-2" />
                            Descending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    {currentSorting.secondarySort.field !== "none" && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tertiary Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Tertiary Sort</Label>
                    <Select
                      value={currentSorting.tertiarySort.field}
                      onValueChange={(value) => handleSortingChange("tertiary", "field", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sortFields).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Direction</Label>
                    <Select
                      value={currentSorting.tertiarySort.direction}
                      onValueChange={(value) => handleSortingChange("tertiary", "direction", value)}
                      disabled={currentSorting.tertiarySort.field === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          <div className="flex items-center">
                            <SortAsc className="h-4 w-4 mr-2" />
                            Ascending
                          </div>
                        </SelectItem>
                        <SelectItem value="desc">
                          <div className="flex items-center">
                            <SortDesc className="h-4 w-4 mr-2" />
                            Descending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    {currentSorting.tertiarySort.field !== "none" && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Grouping */}
            <div className="border-b pb-4">
              <Label className="text-base font-medium mb-3 block flex items-center">
                <Group className="h-4 w-4 mr-2" />
                Advanced Grouping
              </Label>
              <div className="space-y-4">
                {/* Primary and Secondary Grouping */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Primary Grouping</Label>
                    <Select
                      value={currentGrouping.primaryGroup}
                      onValueChange={(value) => handleGroupingChange("primaryGroup", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupFields).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Secondary Grouping</Label>
                    <Select
                      value={currentGrouping.secondaryGroup}
                      onValueChange={(value) => handleGroupingChange("secondaryGroup", value)}
                      disabled={currentGrouping.primaryGroup === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupFields).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Group Display Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Sort Groups By</Label>
                    <Select
                      value={currentGrouping.sortGroupsBy}
                      onValueChange={(value) => handleGroupingChange("sortGroupsBy", value)}
                      disabled={currentGrouping.primaryGroup === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Group Name</SelectItem>
                        <SelectItem value="count">Item Count</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Group Sort Direction</Label>
                    <Select
                      value={currentGrouping.groupSortDirection}
                      onValueChange={(value) => handleGroupingChange("groupSortDirection", value)}
                      disabled={currentGrouping.primaryGroup === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Display Options</Label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={currentGrouping.showGroupCounts}
                          onChange={(e) => handleGroupingChange("showGroupCounts", e.target.checked)}
                          disabled={currentGrouping.primaryGroup === "none"}
                        />
                        <span className="text-sm">Show Group Counts</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={currentGrouping.collapseGroups}
                          onChange={(e) => handleGroupingChange("collapseGroups", e.target.checked)}
                          disabled={currentGrouping.primaryGroup === "none"}
                        />
                        <span className="text-sm">Collapse Groups</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Configuration Summary */}
            {(activeSortingCount > 0 || activeGroupingCount > 0) && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Label className="text-sm font-medium text-blue-800 mb-2 block">Active Configuration</Label>
                <div className="space-y-2">
                  {activeSortingCount > 0 && (
                    <div className="text-sm text-blue-700">
                      <strong>Sorting:</strong>{" "}
                      {[
                        currentSorting.primarySort.field !== "none" &&
                          `${sortFields[currentSorting.primarySort.field]} (${currentSorting.primarySort.direction})`,
                        currentSorting.secondarySort.field !== "none" &&
                          `then ${sortFields[currentSorting.secondarySort.field]} (${currentSorting.secondarySort.direction})`,
                        currentSorting.tertiarySort.field !== "none" &&
                          `then ${sortFields[currentSorting.tertiarySort.field]} (${currentSorting.tertiarySort.direction})`,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  {activeGroupingCount > 0 && (
                    <div className="text-sm text-blue-700">
                      <strong>Grouping:</strong>{" "}
                      {[
                        currentGrouping.primaryGroup !== "none" && groupFields[currentGrouping.primaryGroup],
                        currentGrouping.secondaryGroup !== "none" && `→ ${groupFields[currentGrouping.secondaryGroup]}`,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      {currentGrouping.showGroupCounts && " (with counts)"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
