"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Download, Activity, ChevronDown, ChevronRight } from "lucide-react"
import type { ActivityLog, User } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"
import { AdvancedSortingGrouping, type SortingState, type GroupingState } from "./advanced-sorting-grouping"

interface EnhancedActivityLogsProps {
  user: User
}

interface GroupedLogs {
  [key: string]: {
    items: ActivityLog[]
    subGroups?: { [key: string]: ActivityLog[] }
    count: number
  }
}

export function EnhancedActivityLogs({ user }: EnhancedActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const [sorting, setSorting] = useState<SortingState>({
    primarySort: { field: "timestamp", direction: "desc" },
    secondarySort: { field: "none", direction: "asc" },
    tertiarySort: { field: "none", direction: "asc" },
  })

  const [grouping, setGrouping] = useState<GroupingState>({
    primaryGroup: "none",
    secondaryGroup: "none",
    showGroupCounts: true,
    collapseGroups: false,
    sortGroupsBy: "name",
    groupSortDirection: "asc",
  })

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    const allLogs = await db.getLogs()
    setLogs(allLogs)
    setIsLoading(false)
  }

  const filteredLogs = useMemo(() => {
    let filtered = [...logs]

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.applicationId && log.applicationId.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action.toLowerCase().includes(actionFilter.toLowerCase()))
    }

    if (userTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.userType === userTypeFilter)
    }

    return filtered
  }, [logs, searchTerm, actionFilter, userTypeFilter])

  const sortedLogs = useMemo(() => {
    const sorted = [...filteredLogs]

    const applySorting = (logs: ActivityLog[], sortField: string, direction: "asc" | "desc") => {
      if (sortField === "none") return logs

      return logs.sort((a, b) => {
        let aValue: any, bValue: any

        switch (sortField) {
          case "timestamp":
            aValue = a.timestamp
            bValue = b.timestamp
            break
          case "action":
            aValue = a.action
            bValue = b.action
            break
          case "user_type":
            aValue = a.userType
            bValue = b.userType
            break
          case "application_id":
            aValue = a.applicationId || ""
            bValue = b.applicationId || ""
            break
          default:
            return 0
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1
        if (aValue > bValue) return direction === "asc" ? 1 : -1
        return 0
      })
    }

    let result = applySorting(sorted, sorting.primarySort.field, sorting.primarySort.direction)
    if (sorting.secondarySort.field !== "none") {
      result = applySorting(result, sorting.secondarySort.field, sorting.secondarySort.direction)
    }
    if (sorting.tertiarySort.field !== "none") {
      result = applySorting(result, sorting.tertiarySort.field, sorting.tertiarySort.direction)
    }

    return result
  }, [filteredLogs, sorting])

  const groupedLogs = useMemo(() => {
    if (grouping.primaryGroup === "none") {
      return null
    }

    const getGroupKey = (log: ActivityLog, groupField: string): string => {
      switch (groupField) {
        case "action_type":
          return log.action.split(" ")[0] // First word of action
        case "user_type":
          return getUserTypeLabel(log.userType)
        case "time_of_day":
          const hour = log.timestamp.getHours()
          if (hour < 6) return "Night (12AM-6AM)"
          if (hour < 12) return "Morning (6AM-12PM)"
          if (hour < 18) return "Afternoon (12PM-6PM)"
          return "Evening (6PM-12AM)"
        case "day_of_week":
          return log.timestamp.toLocaleDateString("en-US", { weekday: "long" })
        case "month_created":
          return log.timestamp.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        case "year_created":
          return log.timestamp.getFullYear().toString()
        default:
          return "Other"
      }
    }

    const grouped: GroupedLogs = {}

    sortedLogs.forEach((log) => {
      const primaryKey = getGroupKey(log, grouping.primaryGroup)

      if (!grouped[primaryKey]) {
        grouped[primaryKey] = { items: [], count: 0, subGroups: {} }
      }

      if (grouping.secondaryGroup !== "none") {
        const secondaryKey = getGroupKey(log, grouping.secondaryGroup)
        if (!grouped[primaryKey].subGroups![secondaryKey]) {
          grouped[primaryKey].subGroups![secondaryKey] = []
        }
        grouped[primaryKey].subGroups![secondaryKey].push(log)
      } else {
        grouped[primaryKey].items.push(log)
      }

      grouped[primaryKey].count++
    })

    return grouped
  }, [sortedLogs, grouping])

  const toggleGroupCollapse = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey)
    } else {
      newCollapsed.add(groupKey)
    }
    setCollapsedGroups(newCollapsed)
  }

  const clearAllSortingGrouping = () => {
    setSorting({
      primarySort: { field: "none", direction: "asc" },
      secondarySort: { field: "none", direction: "asc" },
      tertiarySort: { field: "none", direction: "asc" },
    })
    setGrouping({
      primaryGroup: "none",
      secondaryGroup: "none",
      showGroupCounts: true,
      collapseGroups: false,
      sortGroupsBy: "name",
      groupSortDirection: "asc",
    })
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes("Created") || action.includes("Added")) return "bg-green-100 text-green-800"
    if (action.includes("Updated") || action.includes("Advanced")) return "bg-blue-100 text-blue-800"
    if (action.includes("Deleted") || action.includes("Rejected")) return "bg-red-100 text-red-800"
    if (action.includes("Approved")) return "bg-green-100 text-green-800"
    if (action.includes("Submitted")) return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  const renderLogRow = (log: ActivityLog) => (
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
  )

  const renderGroupedTable = () => {
    if (!groupedLogs) return null

    const sortedGroupKeys = Object.keys(groupedLogs).sort((a, b) => {
      const aGroup = groupedLogs[a]
      const bGroup = groupedLogs[b]

      switch (grouping.sortGroupsBy) {
        case "count":
          return grouping.groupSortDirection === "asc" ? aGroup.count - bGroup.count : bGroup.count - aGroup.count
        case "name":
        default:
          return grouping.groupSortDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a)
      }
    })

    return (
      <div className="space-y-4">
        {sortedGroupKeys.map((groupKey) => {
          const group = groupedLogs[groupKey]
          const isCollapsed = collapsedGroups.has(groupKey)

          return (
            <Card key={groupKey}>
              <Collapsible open={!isCollapsed} onOpenChange={() => toggleGroupCollapse(groupKey)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        )}
                        {groupKey}
                        {grouping.showGroupCounts && (
                          <Badge variant="secondary" className="ml-2">
                            {group.count} item{group.count !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    {grouping.secondaryGroup !== "none" && group.subGroups ? (
                      <div className="space-y-4">
                        {Object.entries(group.subGroups).map(([subGroupKey, subGroupItems]) => (
                          <div key={subGroupKey}>
                            <h4 className="font-medium mb-2 flex items-center">
                              {subGroupKey}
                              <Badge variant="outline" className="ml-2">
                                {subGroupItems.length}
                              </Badge>
                            </h4>
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
                              <TableBody>{subGroupItems.map(renderLogRow)}</TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    ) : (
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
                        <TableBody>{group.items.map(renderLogRow)}</TableBody>
                      </Table>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading activity logs...</div>
  }

  return (
    <div className="space-y-6">
      {/* Advanced Sorting & Grouping Controls */}
      <AdvancedSortingGrouping
        onSortingChange={setSorting}
        onGroupingChange={setGrouping}
        currentSorting={sorting}
        currentGrouping={grouping}
        onClearAll={clearAllSortingGrouping}
        dataType="activity_logs"
      />

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Activity Logs - Enhanced View
          </CardTitle>
        </CardHeader>
        <CardContent>
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

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Display */}
      {groupedLogs ? (
        renderGroupedTable()
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Activity History ({sortedLogs.length} records)</CardTitle>
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
              <TableBody>{sortedLogs.map(renderLogRow)}</TableBody>
            </Table>

            {sortedLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No activity logs found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
