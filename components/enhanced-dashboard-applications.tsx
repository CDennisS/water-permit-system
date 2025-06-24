"use client"

import type React from "react"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Search,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  AlertTriangle,
  Users,
  TrendingUp,
  Send,
  CheckSquare,
  Settings,
  GripVertical,
  Lock,
} from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { PermittingOfficerAdvancedAnalytics } from "./permitting-officer-advanced-analytics"

interface EnhancedDashboardApplicationsProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (app: PermitApplication) => void
  onViewApplication: (app: PermitApplication) => void
}

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width: number
  resizable: boolean
}

export const EnhancedDashboardApplications = forwardRef<
  { refreshApplications: () => void },
  EnhancedDashboardApplicationsProps
>(({ user, onNewApplication, onEditApplication, onViewApplication }, ref) => {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Column management
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "checkbox", label: "", visible: true, width: 50, resizable: false },
    { key: "applicationId", label: "Application ID", visible: true, width: 150, resizable: true },
    { key: "applicantName", label: "Applicant Name", visible: true, width: 180, resizable: true },
    { key: "address", label: "Address", visible: true, width: 200, resizable: true },
    { key: "status", label: "Status", visible: true, width: 120, resizable: true },
    { key: "stage", label: "Stage", visible: true, width: 80, resizable: true },
    { key: "permitType", label: "Permit Type", visible: true, width: 140, resizable: true },
    { key: "customerAccountNumber", label: "Account Number", visible: true, width: 140, resizable: true },
    { key: "created", label: "Created", visible: true, width: 100, resizable: true },
    { key: "processingDays", label: "Processing Days", visible: true, width: 120, resizable: true },
    { key: "waterAllocation", label: "Water (ML)", visible: false, width: 100, resizable: true },
    { key: "landSize", label: "Land (ha)", visible: false, width: 100, resizable: true },
    { key: "cellularNumber", label: "Phone", visible: false, width: 120, resizable: true },
    { key: "intendedUse", label: "Intended Use", visible: false, width: 150, resizable: true },
    { key: "actions", label: "Actions", visible: true, width: 200, resizable: false },
  ])

  // Resizing state
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // Simple filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, searchTerm, statusFilter, sortBy, sortOrder])

  useImperativeHandle(ref, () => ({
    refreshApplications: loadApplications,
  }))

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      console.log("Loading applications...")
      const apps = await db.getApplications()
      console.log(
        "Loaded applications:",
        apps.length,
        apps.map((app) => ({
          id: app.applicationId,
          applicant: app.applicantName,
          status: app.status,
        })),
      )
      setApplications(apps)
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    console.log("Applying simple filters to", applications.length, "applications")
    let filtered = [...applications]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicationId.toLowerCase().includes(search) ||
          app.applicantName.toLowerCase().includes(search) ||
          app.physicalAddress.toLowerCase().includes(search) ||
          app.permitType.toLowerCase().includes(search) ||
          app.intendedUse.toLowerCase().includes(search),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "createdAt":
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case "applicantName":
          aValue = a.applicantName.toLowerCase()
          bValue = b.applicantName.toLowerCase()
          break
        case "customerAccountNumber":
          aValue = a.customerAccountNumber
          bValue = b.customerAccountNumber
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    console.log("Filtered applications:", filtered.length)
    setFilteredApplications(filtered)
    setCurrentPage(1)
  }

  const handleSelectAllUnsubmitted = () => {
    const unsubmittedApps = filteredApplications.filter((app) => app.status === "unsubmitted").map((app) => app.id)
    setSelectedApplications(unsubmittedApps)
  }

  const handleSubmitSelected = async () => {
    if (selectedApplications.length === 0) return

    setIsSubmitting(true)
    try {
      const selectedApps = applications.filter((app) => selectedApplications.includes(app.id))

      for (const app of selectedApps) {
        if (app.status === "unsubmitted") {
          await db.updateApplication(app.id, {
            status: "submitted",
            currentStage: 2,
            submittedAt: new Date(),
          })

          await db.addLog({
            userId: user.id,
            userType: user.userType,
            action: "Submitted Application",
            details: `Submitted application ${app.applicationId} for review`,
            applicationId: app.id,
          })
        }
      }

      // Clear selection and reload
      setSelectedApplications([])
      await loadApplications()

      console.log(`Successfully submitted ${selectedApps.length} applications`)
    } catch (error) {
      console.error("Failed to submit applications:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitSingle = async (application: PermitApplication) => {
    if (application.status !== "unsubmitted") return

    try {
      await db.updateApplication(application.id, {
        status: "submitted",
        currentStage: 2,
        submittedAt: new Date(),
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Submitted Application",
        details: `Submitted application ${application.applicationId} for review`,
        applicationId: application.id,
      })

      await loadApplications()
      console.log(`Successfully submitted application ${application.applicationId}`)
    } catch (error) {
      console.error("Failed to submit application:", error)
    }
  }

  const canEditApplication = (app: PermitApplication) => {
    // Can only edit if application is unsubmitted or user is ICT
    return app.status === "unsubmitted" || user.userType === "ict"
  }

  const getEditTooltipText = (app: PermitApplication) => {
    if (app.status === "unsubmitted") {
      return "Edit application details"
    }
    if (user.userType === "ict") {
      return "Edit application details (ICT access)"
    }
    return "Cannot edit - application has been submitted"
  }

  const handleColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    setColumns((prev) => prev.map((col) => (col.key === columnKey ? { ...col, visible } : col)))
  }

  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    setIsResizing(true)
    setResizingColumn(columnKey)
    setStartX(e.clientX)
    const column = columns.find((col) => col.key === columnKey)
    setStartWidth(column?.width || 100)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return

    const diff = e.clientX - startX
    const newWidth = Math.max(50, startWidth + diff)

    setColumns((prev) => prev.map((col) => (col.key === resizingColumn ? { ...col, width: newWidth } : col)))
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    setResizingColumn(null)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, resizingColumn, startX, startWidth])

  const exportFilteredData = () => {
    const visibleColumns = columns.filter((col) => col.visible && col.key !== "checkbox" && col.key !== "actions")
    const csvData = [
      visibleColumns.map((col) => col.label),
      ...filteredApplications.map((app) =>
        visibleColumns.map((col) => {
          switch (col.key) {
            case "applicationId":
              return app.applicationId
            case "applicantName":
              return app.applicantName
            case "address":
              return app.physicalAddress
            case "status":
              return app.status
            case "stage":
              return app.currentStage
            case "permitType":
              return app.permitType
            case "customerAccountNumber":
              return app.customerAccountNumber
            case "created":
              return app.createdAt.toLocaleDateString()
            case "processingDays":
              return getProcessingDays(app) || "N/A"
            case "waterAllocation":
              return app.waterAllocation
            case "landSize":
              return app.landSize
            case "cellularNumber":
              return app.cellularNumber
            case "intendedUse":
              return app.intendedUse
            default:
              return ""
          }
        }),
      ),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `applications_export_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getProcessingDays = (app: PermitApplication) => {
    if (!app.submittedAt) return null
    if (app.approvedAt) {
      return Math.ceil(
        (new Date(app.approvedAt).getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24),
      )
    }
    return Math.ceil((Date.now() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
  }

  const isOverdue = (app: PermitApplication) => {
    const processingDays = getProcessingDays(app)
    return processingDays !== null && processingDays > 30 && app.status !== "approved" && app.status !== "rejected"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "under_review":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "submitted":
        return <FileText className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      rejected: "destructive",
      under_review: "secondary",
      submitted: "outline",
      unsubmitted: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const renderCellContent = (app: PermitApplication, columnKey: string) => {
    switch (columnKey) {
      case "checkbox":
        return (
          <Checkbox
            checked={selectedApplications.includes(app.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedApplications([...selectedApplications, app.id])
              } else {
                setSelectedApplications(selectedApplications.filter((id) => id !== app.id))
              }
            }}
          />
        )
      case "applicationId":
        return (
          <div className="flex items-center space-x-2">
            {getStatusIcon(app.status)}
            <span className="font-medium">{app.applicationId}</span>
            {isOverdue(app) && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        )
      case "applicantName":
        return <div className="font-medium">{app.applicantName}</div>
      case "address":
        return (
          <div className="text-sm max-w-xs truncate" title={app.physicalAddress}>
            {app.physicalAddress}
          </div>
        )
      case "status":
        return getStatusBadge(app.status)
      case "stage":
        return <Badge variant="outline">Stage {app.currentStage}</Badge>
      case "permitType":
        return <span className="capitalize">{app.permitType.replace("_", " ")}</span>
      case "customerAccountNumber":
        return app.customerAccountNumber
      case "created":
        return <span className="text-sm">{app.createdAt.toLocaleDateString()}</span>
      case "processingDays":
        return getProcessingDays(app) ? (
          <span className={getProcessingDays(app)! > 30 ? "text-red-600 font-medium" : ""}>
            {getProcessingDays(app)} days
          </span>
        ) : (
          "N/A"
        )
      case "waterAllocation":
        return `${app.waterAllocation} ML`
      case "landSize":
        return `${app.landSize} ha`
      case "cellularNumber":
        return app.cellularNumber
      case "intendedUse":
        return (
          <div className="text-sm max-w-xs truncate" title={app.intendedUse}>
            {app.intendedUse}
          </div>
        )
      case "actions":
        return (
          <TooltipProvider>
            <div className="flex items-center space-x-1">
              {/* View Button - Always visible */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onViewApplication(app)} className="h-8 px-2">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View application details</p>
                </TooltipContent>
              </Tooltip>

              {/* Edit Button - Conditional visibility with clear restrictions */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (canEditApplication(app) ? onEditApplication(app) : undefined)}
                      disabled={!canEditApplication(app)}
                      className={`h-8 px-2 ${
                        canEditApplication(app)
                          ? "hover:bg-blue-50 hover:border-blue-300"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {canEditApplication(app) ? <Edit className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getEditTooltipText(app)}</p>
                </TooltipContent>
              </Tooltip>

              {/* Submit Button - Only for unsubmitted */}
              {app.status === "unsubmitted" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-green-600 hover:text-green-800 hover:bg-green-50 hover:border-green-300"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Submit Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to submit application {app.applicationId} to the next level?
                            <br />
                            <strong className="text-red-600">
                              Warning: Once submitted, the application cannot be edited.
                            </strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleSubmitSingle(app)}>
                            Submit Application
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Submit application for review</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Export Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    View Documents
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-gray-500">
                    <span className="text-xs">
                      Status: {app.status} | Stage: {app.currentStage}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
        )
      default:
        return null
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex)

  // Quick stats
  const quickStats = {
    total: filteredApplications.length,
    unsubmitted: filteredApplications.filter((app) => app.status === "unsubmitted").length,
    submitted: filteredApplications.filter((app) => app.status === "submitted").length,
    underReview: filteredApplications.filter((app) => app.status === "under_review").length,
    approved: filteredApplications.filter((app) => app.status === "approved").length,
    rejected: filteredApplications.filter((app) => app.status === "rejected").length,
    overdue: filteredApplications.filter((app) => isOverdue(app)).length,
    assignedToMe: filteredApplications.filter((app) => app.createdBy === user.id).length,
  }

  const unsubmittedCount = quickStats.unsubmitted
  const selectedUnsubmittedCount = selectedApplications.filter((id) => {
    const app = applications.find((a) => a.id === id)
    return app?.status === "unsubmitted"
  }).length

  const visibleColumns = columns.filter((col) => col.visible)

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {quickStats.unsubmitted} unsubmitted, {quickStats.submitted} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.assignedToMe}</div>
            <p className="text-xs text-muted-foreground">Applications I created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submission</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{quickStats.unsubmitted}</div>
            <p className="text-xs text-muted-foreground">Ready to submit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quickStats.approved + quickStats.rejected > 0
                ? Math.round((quickStats.approved / (quickStats.approved + quickStats.rejected)) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {quickStats.approved} approved, {quickStats.rejected} rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="applications" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button onClick={onNewApplication}>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
            <Button variant="outline" onClick={exportFilteredData} disabled={filteredApplications.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={loadApplications} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {/* Column Management */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns
                  .filter((col) => col.key !== "checkbox" && col.key !== "actions")
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={column.visible}
                      onCheckedChange={(checked) => handleColumnVisibilityChange(column.key, checked)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="applications" className="space-y-4">
          {/* Simple Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="applicantName">Applicant Name</SelectItem>
                      <SelectItem value="customerAccountNumber">Account Number</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {unsubmittedCount > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Unsubmitted Applications ({unsubmittedCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={handleSelectAllUnsubmitted}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select All Unsubmitted ({unsubmittedCount})
                    </Button>
                    {selectedUnsubmittedCount > 0 && (
                      <span className="text-sm text-orange-700">
                        {selectedUnsubmittedCount} unsubmitted applications selected
                      </span>
                    )}
                  </div>
                  {selectedUnsubmittedCount > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white" disabled={isSubmitting}>
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? "Submitting..." : `Submit Selected (${selectedUnsubmittedCount})`}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Submit Applications</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to submit {selectedUnsubmittedCount} application(s) to the next level?
                            <br />
                            <strong className="text-red-600">
                              Warning: Once submitted, applications cannot be edited.
                            </strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSubmitSelected}>Submit Applications</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Applications ({filteredApplications.length})</span>
                <div className="flex items-center space-x-2">
                  <Label>Items per page:</Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => setItemsPerPage(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map((column) => (
                        <TableHead key={column.key} style={{ width: column.width }} className="relative">
                          <div className="flex items-center justify-between">
                            <span>{column.label}</span>
                            {column.resizable && (
                              <div
                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                                onMouseDown={(e) => handleMouseDown(e, column.key)}
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApplications.map((app) => (
                      <TableRow key={app.id} className={`${isOverdue(app) ? "bg-red-50" : ""}`}>
                        {visibleColumns.map((column) => (
                          <TableCell key={column.key} style={{ width: column.width }}>
                            {renderCellContent(app, column.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of{" "}
                    {filteredApplications.length} applications
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <PermittingOfficerAdvancedAnalytics user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
})

EnhancedDashboardApplications.displayName = "EnhancedDashboardApplications"
