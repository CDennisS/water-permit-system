"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Search, Filter, Download, Eye, Edit, FileText, ChevronDown, ChevronRight } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { PermitPrinter } from "./permit-printer"
import { CommentsPrinter } from "./comments-printer"
import { AdvancedSortingGrouping, type SortingState, type GroupingState } from "./advanced-sorting-grouping"

interface EnhancedApplicationsTableProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (application: PermitApplication) => void
  onViewApplication: (application: PermitApplication) => void
}

interface GroupedData {
  [key: string]: {
    items: PermitApplication[]
    subGroups?: { [key: string]: PermitApplication[] }
    count: number
  }
}

export function EnhancedApplicationsTable({
  user,
  onNewApplication,
  onEditApplication,
  onViewApplication,
}: EnhancedApplicationsTableProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const [sorting, setSorting] = useState<SortingState>({
    primarySort: { field: "created_date", direction: "desc" },
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
    loadApplications()
  }, [user])

  const loadApplications = async () => {
    try {
      const apps = await db.getApplications()
      setApplications(apps)
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApplications = useMemo(() => {
    let filtered = [...applications]

    // Basic filtering
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.permitType.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Role-based filtering
    if (user.userType === "chairperson") {
      filtered = filtered.filter((app) => app.status === "submitted" && app.currentStage === 2)
    } else if (user.userType === "catchment_manager") {
      filtered = filtered.filter((app) => app.currentStage === 3)
    } else if (user.userType === "catchment_chairperson") {
      filtered = filtered.filter((app) => app.currentStage === 4)
    }

    return filtered
  }, [applications, searchTerm, statusFilter, user.userType])

  const sortedApplications = useMemo(() => {
    const sorted = [...filteredApplications]

    const applySorting = (apps: PermitApplication[], sortField: string, direction: "asc" | "desc") => {
      if (sortField === "none") return apps

      return apps.sort((a, b) => {
        let aValue: any, bValue: any

        switch (sortField) {
          case "applicant_name":
            aValue = a.applicantName
            bValue = b.applicantName
            break
          case "application_id":
            aValue = a.applicationId
            bValue = b.applicationId
            break
          case "permit_type":
            aValue = a.permitType
            bValue = b.permitType
            break
          case "status":
            aValue = a.status
            bValue = b.status
            break
          case "stage":
            aValue = a.currentStage
            bValue = b.currentStage
            break
          case "water_allocation":
            aValue = a.waterAllocation
            bValue = b.waterAllocation
            break
          case "land_size":
            aValue = a.landSize
            bValue = b.landSize
            break
          case "created_date":
            aValue = a.createdAt
            bValue = b.createdAt
            break
          case "submitted_date":
            aValue = a.submittedAt || new Date(0)
            bValue = b.submittedAt || new Date(0)
            break
          case "approved_date":
            aValue = a.approvedAt || new Date(0)
            bValue = b.approvedAt || new Date(0)
            break
          default:
            return 0
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1
        if (aValue > bValue) return direction === "asc" ? 1 : -1
        return 0
      })
    }

    // Apply multi-level sorting
    let result = applySorting(sorted, sorting.primarySort.field, sorting.primarySort.direction)
    if (sorting.secondarySort.field !== "none") {
      result = applySorting(result, sorting.secondarySort.field, sorting.secondarySort.direction)
    }
    if (sorting.tertiarySort.field !== "none") {
      result = applySorting(result, sorting.tertiarySort.field, sorting.tertiarySort.direction)
    }

    return result
  }, [filteredApplications, sorting])

  const groupedApplications = useMemo(() => {
    if (grouping.primaryGroup === "none") {
      return null
    }

    const getGroupKey = (app: PermitApplication, groupField: string): string => {
      switch (groupField) {
        case "status":
          return app.status.toUpperCase()
        case "permit_type":
          return app.permitType.replace("_", " ").toUpperCase()
        case "workflow_stage":
          return `Stage ${app.currentStage}`
        case "water_source":
          return app.waterSource || "Unknown"
        case "month_created":
          return app.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        case "year_created":
          return app.createdAt.getFullYear().toString()
        case "land_size_range":
          if (app.landSize <= 1) return "Small (≤1 ha)"
          if (app.landSize <= 5) return "Medium (1-5 ha)"
          if (app.landSize <= 20) return "Large (5-20 ha)"
          return "Very Large (>20 ha)"
        case "water_allocation_range":
          if (app.waterAllocation <= 10) return "Low (≤10 ML)"
          if (app.waterAllocation <= 50) return "Medium (10-50 ML)"
          if (app.waterAllocation <= 200) return "High (50-200 ML)"
          return "Very High (>200 ML)"
        case "geographic_area":
          // Simple geographic grouping based on GPS coordinates
          const lat = app.gpsLatitude || 0
          if (lat > -17) return "Northern Region"
          if (lat > -18) return "Central Region"
          return "Southern Region"
        default:
          return "Other"
      }
    }

    const grouped: GroupedData = {}

    sortedApplications.forEach((app) => {
      const primaryKey = getGroupKey(app, grouping.primaryGroup)

      if (!grouped[primaryKey]) {
        grouped[primaryKey] = { items: [], count: 0, subGroups: {} }
      }

      if (grouping.secondaryGroup !== "none") {
        const secondaryKey = getGroupKey(app, grouping.secondaryGroup)
        if (!grouped[primaryKey].subGroups![secondaryKey]) {
          grouped[primaryKey].subGroups![secondaryKey] = []
        }
        grouped[primaryKey].subGroups![secondaryKey].push(app)
      } else {
        grouped[primaryKey].items.push(app)
      }

      grouped[primaryKey].count++
    })

    return grouped
  }, [sortedApplications, grouping])

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

  const renderApplicationRow = (application: PermitApplication) => (
    <TableRow key={application.id}>
      <TableCell className="font-medium">{application.applicationId}</TableCell>
      <TableCell>{application.applicantName}</TableCell>
      <TableCell className="capitalize">{application.permitType.replace("_", " ")}</TableCell>
      <TableCell>
        <Badge
          className={
            {
              unsubmitted: "bg-gray-100 text-gray-800",
              submitted: "bg-blue-100 text-blue-800",
              under_review: "bg-yellow-100 text-yellow-800",
              approved: "bg-green-100 text-green-800",
              rejected: "bg-red-100 text-red-800",
            }[application.status as keyof typeof Object] || "bg-gray-100 text-gray-800"
          }
        >
          {application.status.replace("_", " ").toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">Stage {application.currentStage}</Badge>
      </TableCell>
      <TableCell>{application.createdAt.toLocaleDateString()}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onViewApplication(application)}>
            <Eye className="h-4 w-4" />
          </Button>
          {user.userType === "permitting_officer" && application.status === "unsubmitted" && (
            <Button variant="ghost" size="sm" onClick={() => onEditApplication(application)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onViewApplication(application)} title="View documents">
            <FileText className="h-4 w-4" />
          </Button>
          {(application.status === "rejected" || application.workflowComments.length > 0) && (
            <CommentsPrinter application={application} user={user} />
          )}
          {application.status === "approved" &&
            ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType) && (
              <PermitPrinter application={application} />
            )}
        </div>
      </TableCell>
    </TableRow>
  )

  const renderGroupedTable = () => {
    if (!groupedApplications) return null

    const sortedGroupKeys = Object.keys(groupedApplications).sort((a, b) => {
      const aGroup = groupedApplications[a]
      const bGroup = groupedApplications[b]

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
          const group = groupedApplications[groupKey]
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
                                  <TableHead>Application ID</TableHead>
                                  <TableHead>Applicant Name</TableHead>
                                  <TableHead>Permit Type</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Stage</TableHead>
                                  <TableHead>Created</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>{subGroupItems.map(renderApplicationRow)}</TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Application ID</TableHead>
                            <TableHead>Applicant Name</TableHead>
                            <TableHead>Permit Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>{group.items.map(renderApplicationRow)}</TableBody>
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
    return <div className="flex justify-center p-8">Loading applications...</div>
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
        dataType="applications"
      />

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {user.userType === "permitting_officer" && (
            <Button onClick={onNewApplication}>
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
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

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Applications Display */}
      {groupedApplications ? (
        renderGroupedTable()
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Applications ({sortedApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Permit Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{sortedApplications.map(renderApplicationRow)}</TableBody>
            </Table>

            {sortedApplications.length === 0 && (
              <div className="text-center py-8 text-gray-500">No applications found matching your criteria.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
