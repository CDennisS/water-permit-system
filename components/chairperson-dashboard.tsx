"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Save,
  Search,
  MapPin,
  Droplets,
  Building,
  X,
  Download,
  Calendar,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Zap,
  Target,
  MessageSquare,
  User,
  Check,
} from "lucide-react"
import type { PermitApplication, Document, WorkflowComment } from "@/types"
import { db } from "@/lib/database"
import { StrictViewOnlyApplicationDetails } from "./strict-view-only-application-details"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

interface ChairpersonDashboardProps {
  user: any
}

type Application = {
  id: string
  applicantName: string
  submittedAt: string
  status: "pending" | "reviewed"
  documents: Document[]
  officerComments: string
  details: Record<string, string>
}

/* --------------------------------------------------------
 * Dummy data – replace with a real fetch in production
 * ----------------------------------------------------- */
const mockApplications: Application[] = [
  {
    id: "APP-001",
    applicantName: "Greenfields Mining Ltd.",
    submittedAt: "2025-07-01",
    status: "pending",
    documents: [
      {
        id: "DOC-1",
        name: "EIA Report.pdf",
        url: "/placeholder.pdf",
      },
      {
        id: "DOC-2",
        name: "Site Plan.png",
        url: "/placeholder.svg",
      },
    ],
    officerComments: "All mandatory documents supplied. Recommend approval.",
    details: {
      "Permit Type": "Large-Scale Extraction",
      Location: "Block C – Upper Manyame",
      "Proposed Volume": "1 500 m3/day",
    },
  },
  {
    id: "APP-002",
    applicantName: "Mountain Springs Pvt (Ltd)",
    submittedAt: "2025-07-02",
    status: "pending",
    documents: [
      {
        id: "DOC-3",
        name: "Permit Renewal Form.pdf",
        url: "/placeholder.pdf",
      },
    ],
    officerComments: "Previous permit expired last month. No outstanding fines.",
    details: {
      "Permit Type": "Renewal",
      Location: "Section A – Upper Manyame",
      "Previous Permit #": "PM-722",
    },
  },
]

export function ChairpersonDashboard({ user }: ChairpersonDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(new Set())
  const [selectAllUnsubmitted, setSelectAllUnsubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationDocuments, setApplicationDocuments] = useState<{ [key: string]: Document[] }>({})
  const [applicationComments, setApplicationComments] = useState<{ [key: string]: WorkflowComment[] }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    reviewedThisMonth: 0,
    approvalRate: 0,
  })

  const [chairpersonApplications, setChairpersonApplications] = useState<Application[]>(mockApplications)
  const [selected, setSelected] = useState<Application | null>(null)
  const [saving, setSaving] = useState(false)

  const markReviewed = async (appId: string) => {
    setSaving(true)
    // 🔒 Hook up to real backend here
    await new Promise((r) => setTimeout(r, 750))
    setChairpersonApplications((apps) => apps.map((a) => (a.id === appId ? { ...a, status: "reviewed" } : a)))
    setSaving(false)
    toast({
      title: "Application reviewed",
      description: `${appId} has been marked as reviewed.`,
    })
  }

  useEffect(() => {
    loadDashboardData()
    loadUnreadMessages()

    const messageInterval = setInterval(loadUnreadMessages, 30000)
    return () => clearInterval(messageInterval)
  }, [user.id])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter])

  const filterApplications = () => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.customerAccountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const loadDashboardData = async () => {
    try {
      const allApplications = await db.getApplications()
      const relevantApplications = allApplications.filter(
        (app) => app.currentStage === 2 || (app.currentStage > 2 && app.status !== "unsubmitted"),
      )

      setApplications(relevantApplications)

      // Load documents and comments for each application
      const documentsMap: { [key: string]: Document[] } = {}
      const commentsMap: { [key: string]: WorkflowComment[] } = {}

      for (const app of relevantApplications) {
        try {
          const [docs, comments] = await Promise.all([
            db.getDocumentsByApplication(app.id),
            db.getCommentsByApplication(app.id),
          ])
          documentsMap[app.id] = docs
          commentsMap[app.id] = comments
        } catch (error) {
          console.error(`Failed to load data for application ${app.id}:`, error)
          documentsMap[app.id] = []
          commentsMap[app.id] = []
        }
      }

      setApplicationDocuments(documentsMap)
      setApplicationComments(commentsMap)

      const pendingReview = relevantApplications.filter(
        (app) => app.currentStage === 2 && app.status === "submitted",
      ).length

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const reviewedThisMonth = relevantApplications.filter(
        (app) => app.updatedAt >= thisMonth && app.currentStage > 2,
      ).length

      const totalReviewed = relevantApplications.filter((app) => app.currentStage > 2).length
      const approvedApps = relevantApplications.filter((app) => app.status === "approved").length

      setStats({
        totalApplications: relevantApplications.length,
        pendingReview,
        reviewedThisMonth,
        approvalRate: totalReviewed > 0 ? Math.round((approvedApps / totalReviewed) * 100) : 0,
      })
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    }
  }

  const loadUnreadMessages = async () => {
    try {
      const publicMsgs = await db.getMessages(user.id, true)
      const privateMsgs = await db.getMessages(user.id, false)

      const unreadPublic = publicMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length
      const unreadPrivate = privateMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length

      setUnreadMessageCount(unreadPublic + unreadPrivate)
    } catch (error) {
      console.error("Failed to load unread messages:", error)
    }
  }

  const handleViewMessages = () => {
    setActiveView("messages")
    setUnreadMessageCount(0)
  }

  const handleApplicationReviewed = async (applicationId: string, isReviewed: boolean) => {
    const newReviewed = new Set(reviewedApplications)
    if (isReviewed) {
      newReviewed.add(applicationId)
    } else {
      newReviewed.delete(applicationId)
    }
    setReviewedApplications(newReviewed)

    if (isReviewed) {
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Application Reviewed",
        details: `Application ${applications.find((app) => app.id === applicationId)?.applicationId} marked as reviewed by chairperson`,
        applicationId: applicationId,
      })
    }
  }

  const handleSelectAllUnsubmitted = (checked: boolean) => {
    setSelectAllUnsubmitted(checked)
    if (checked) {
      const pendingApps = applications.filter((app) => app.currentStage === 2 && app.status === "submitted")
      const newReviewed = new Set(reviewedApplications)
      pendingApps.forEach((app) => newReviewed.add(app.id))
      setReviewedApplications(newReviewed)
    }
  }

  const handleSubmitPermits = async () => {
    if (!selectAllUnsubmitted) return

    setIsSubmitting(true)
    try {
      const pendingApps = applications.filter(
        (app) => app.currentStage === 2 && app.status === "submitted" && reviewedApplications.has(app.id),
      )

      for (const app of pendingApps) {
        await db.updateApplication(app.id, {
          currentStage: 3,
          status: "under_review",
          updatedAt: new Date(),
        })

        await db.addComment({
          applicationId: app.id,
          userId: user.id,
          userType: user.userType,
          comment:
            "Application reviewed and approved by Upper Manyame Sub Catchment Council Chairman. Forwarding to Catchment Manager for technical assessment.",
          stage: 2,
          isRejectionReason: false,
        })

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Application Submitted to Next Stage",
          details: `Application ${app.applicationId} submitted to Catchment Manager for technical review`,
          applicationId: app.id,
        })
      }

      setReviewedApplications(new Set())
      setSelectAllUnsubmitted(false)
      await loadDashboardData()

      alert(`Successfully submitted ${pendingApps.length} application(s) to Catchment Manager for technical review.`)
    } catch (error) {
      console.error("Error submitting applications:", error)
      alert("Error submitting applications. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDocument = (document: Document) => {
    // Create a mock document URL for demonstration
    const documentUrl = `/placeholder-document.pdf?name=${encodeURIComponent(document.fileName)}`
    window.open(documentUrl, "_blank")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = "blue",
    progress,
  }: {
    title: string
    value: number | string
    icon: any
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    color?: "blue" | "green" | "yellow" | "purple" | "orange" | "red"
    progress?: number
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      yellow: "from-amber-500 to-orange-500",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-red-500",
      red: "from-red-500 to-red-600",
    }

    const trendColors = {
      up: "text-green-600 bg-green-50",
      down: "text-red-600 bg-red-50",
      neutral: "text-gray-600 bg-gray-50",
    }

    return (
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-90`} />
        <CardContent className="relative p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
              <p className="text-3xl font-bold mb-2">{value}</p>
              {progress !== undefined && (
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              {trend && trendValue && (
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}
                >
                  <TrendingUp className={`h-3 w-3 mr-1 ${trend === "down" ? "rotate-180" : ""}`} />
                  {trendValue}
                </div>
              )}
            </div>
            <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CompactApplicationCard = ({ application }: { application: PermitApplication }) => {
    const isReviewed = reviewedApplications.has(application.id)
    const isUnsubmitted = application.currentStage === 2 && application.status === "submitted"
    const documents = applicationDocuments[application.id] || []

    return (
      <Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm truncate">{application.applicantName}</h4>
                <p className="text-xs text-gray-500">{application.applicationId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isReviewed ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Reviewed
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              <span className="truncate">{application.customerAccountNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              <span className="truncate">{application.permitType.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{application.physicalAddress}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{documents.length} docs</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Stage {application.currentStage} • {application.submittedAt?.toLocaleDateString()}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <ApplicationDetailDialog application={application} onClose={() => loadDashboardData()} />
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ApplicationDetailDialog = ({
    application,
    onClose,
  }: { application: PermitApplication; onClose: () => void }) => {
    const [isReviewed, setIsReviewed] = useState(reviewedApplications.has(application.id))
    const [isSaving, setIsSaving] = useState(false)
    const documents = applicationDocuments[application.id] || []
    const comments = applicationComments[application.id] || []
    const permittingOfficerComments = comments.filter((comment) => comment.userType === "permitting_officer")

    const handleSave = async () => {
      setIsSaving(true)
      try {
        await handleApplicationReviewed(application.id, isReviewed)
        alert("Application review status saved successfully!")
        onClose()
      } catch (error) {
        console.error("Error saving review status:", error)
        alert("Error saving review status. Please try again.")
      } finally {
        setIsSaving(false)
      }
    }

    return (
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Application Review</DialogTitle>
                <p className="text-sm text-gray-500">{application.applicationId}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Application Details</TabsTrigger>
                <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
                <TabsTrigger value="review">Review & Actions</TabsTrigger>
              </TabsList>

              {/* Application Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Info Bar */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{application.currentStage}</div>
                        <div className="text-xs text-gray-500">Current Stage</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{documents.length}</div>
                        <div className="text-xs text-gray-500">Documents</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {application.waterAllocation.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">m³/annum</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{application.landSize}</div>
                        <div className="text-xs text-gray-500">Hectares</div>
                      </Card>
                    </div>
                  </div>

                  {/* Applicant Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        Applicant Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Account Number
                        </label>
                        <p className="font-semibold">{application.customerAccountNumber}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                        <p className="font-semibold">{application.applicantName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Physical Address
                        </label>
                        <p className="text-sm">{application.physicalAddress}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Contact Number
                        </label>
                        <p className="text-sm">{application.cellularNumber}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Permit Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Droplets className="h-5 w-5 mr-2 text-blue-600" />
                        Permit Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Permit Type</label>
                        <p className="font-semibold capitalize">{application.permitType.replace("_", " ")}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Water Source
                        </label>
                        <p className="capitalize">{application.waterSource}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Intended Use
                        </label>
                        <p>{application.intendedUse}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Water Allocation
                        </label>
                        <p className="font-semibold">{application.waterAllocation.toLocaleString()} m³/annum</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* GPS Coordinates */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-green-600" />
                        Property & Location Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Land Size</label>
                          <p className="font-semibold">{application.landSize} hectares</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Boreholes</label>
                          <p className="font-semibold">{application.numberOfBoreholes}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Latitude</label>
                          <p className="font-mono text-sm bg-gray-50 p-2 rounded">{application.gpsLatitude}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Longitude</label>
                          <p className="font-mono text-sm bg-gray-50 p-2 rounded">{application.gpsLongitude}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Uploaded Documents ({documents.length})
                      </div>
                      {documents.length > 0 && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download All
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{document.fileName}</p>
                                <p className="text-sm text-gray-500">
                                  {document.fileType} • {formatFileSize(document.fileSize)} • Uploaded{" "}
                                  {document.uploadedAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleViewDocument(document)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="secondary">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No documents uploaded</p>
                        <p className="text-sm">This application has no supporting documents</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Permitting Officer Comments */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center text-blue-600">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Permitting Officer Comments ({permittingOfficerComments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {permittingOfficerComments.length > 0 ? (
                        <div className="space-y-4">
                          {permittingOfficerComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  Stage {comment.stage}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No permitting officer comments yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* All Comments */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        All Workflow Comments ({comments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comments.length > 0 ? (
                        <ScrollArea className="h-80">
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <div key={comment.id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">{comment.userType.replace("_", " ")}</Badge>
                                    <Badge variant="secondary">Stage {comment.stage}</Badge>
                                  </div>
                                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.comment}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No workflow comments yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Review & Actions Tab */}
              <TabsContent value="review" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Application Status */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Application Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Current Status
                        </label>
                        <Badge className="mt-1 bg-blue-100 text-blue-800 capitalize">
                          {application.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</label>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Stage {application.currentStage} of 5</span>
                            <span>{Math.round((application.currentStage / 5) * 100)}%</span>
                          </div>
                          <Progress value={(application.currentStage / 5) * 100} className="h-2" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Submitted Date
                        </label>
                        <p className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {application.submittedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review Section */}
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-800 flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Chairperson Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border">
                        <Checkbox
                          id="application-reviewed"
                          checked={isReviewed}
                          onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor="application-reviewed"
                            className="text-sm font-medium text-blue-800 cursor-pointer"
                          >
                            I have reviewed this application and all supporting documents
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            By checking this box, you confirm that you have thoroughly reviewed the application details,
                            uploaded documents, and any comments from the permitting officer.
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Review Status"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    )
  }

  const pendingApplications = applications.filter((app) => app.currentStage === 2 && app.status === "submitted")
  const allPendingReviewed =
    pendingApplications.length > 0 && pendingApplications.every((app) => reviewedApplications.has(app.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chairperson Dashboard</h1>
                <p className="text-gray-600 text-sm">Upper Manyame Sub Catchment Council</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadMessageCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleViewMessages} className="relative bg-transparent">
                  Messages
                  <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">{unreadMessageCount}</Badge>
                </Button>
              )}
              <Badge variant="secondary" className="px-3 py-2 bg-blue-100 text-blue-800">
                <Zap className="h-4 w-4 mr-1" />
                Chairperson Access
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="relative data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Messages
              {unreadMessageCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Applications"
                value={stats.totalApplications}
                icon={FileText}
                color="blue"
                trend="up"
                trendValue="+12% this month"
                progress={75}
              />
              <MetricCard
                title="Pending Review"
                value={stats.pendingReview}
                icon={Clock}
                color="orange"
                trend="neutral"
                trendValue="Requires attention"
                progress={stats.pendingReview > 0 ? 100 : 0}
              />
              <MetricCard
                title="Reviewed This Month"
                value={stats.reviewedThisMonth}
                icon={CheckCircle}
                color="green"
                trend="up"
                trendValue="+8% vs last month"
                progress={85}
              />
              <MetricCard
                title="Approval Rate"
                value={`${stats.approvalRate}%`}
                icon={Target}
                color="purple"
                trend="up"
                trendValue="Above target"
                progress={stats.approvalRate}
              />
            </div>

            {/* Recent Applications Requiring Review */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Recent Applications Requiring Review</CardTitle>
                      <p className="text-sm text-gray-500">Review and approve applications for next stage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {pendingApplications.length > 0 && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="select-all"
                            checked={selectAllUnsubmitted}
                            onCheckedChange={handleSelectAllUnsubmitted}
                          />
                          <label htmlFor="select-all" className="text-sm font-medium">
                            Select All ({pendingApplications.length})
                          </label>
                        </div>
                        {selectAllUnsubmitted && allPendingReviewed && (
                          <Button
                            onClick={handleSubmitPermits}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ChevronRight className="h-4 w-4 mr-1" />
                            {isSubmitting ? "Submitting..." : "Submit All"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {selectAllUnsubmitted && !allPendingReviewed && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm text-amber-700">Please review all applications before submitting.</p>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {pendingApplications.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingApplications.map((application) => (
                      <CompactApplicationCard key={application.id} application={application} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No applications pending review at this time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            {selectedApplication ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Application Details</h2>
                  <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                    ← Back to List
                  </Button>
                </div>
                <StrictViewOnlyApplicationDetails user={user} application={selectedApplication} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enhanced Header with Quick Stats */}
                <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Applications Management</h2>
                        <p className="text-blue-100">Comprehensive view of all permit applications</p>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-3xl font-bold">{filteredApplications.length}</div>
                          <div className="text-blue-200 text-sm">Total</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-green-300">
                            {filteredApplications.filter((app) => app.status === "approved").length}
                          </div>
                          <div className="text-blue-200 text-sm">Approved</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-amber-300">
                            {filteredApplications.filter((app) => app.currentStage === 2).length}
                          </div>
                          <div className="text-blue-200 text-sm">Pending</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Filters and Search */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        Search & Filter Applications
                      </CardTitle>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                        Export ({filteredApplications.length})
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by name, ID, or account..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Permit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="urban">Urban</SelectItem>
                          <SelectItem value="irrigation">Irrigation</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="bulk_water">Bulk Water</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stages</SelectItem>
                          <SelectItem value="1">Stage 1</SelectItem>
                          <SelectItem value="2">Stage 2</SelectItem>
                          <SelectItem value="3">Stage 3</SelectItem>
                          <SelectItem value="4">Stage 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(searchTerm || statusFilter !== "all") && (
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Showing {filteredApplications.length} of {applications.length} applications
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("")
                            setStatusFilter("all")
                          }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Applications Grid/Table View */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle>Applications Overview</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Grid View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Table View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredApplications.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <TableRow>
                              <TableHead className="w-[140px] font-semibold">Application ID</TableHead>
                              <TableHead className="w-[120px] font-semibold">Account #</TableHead>
                              <TableHead className="font-semibold">Applicant Details</TableHead>
                              <TableHead className="w-[140px] font-semibold">Permit Info</TableHead>
                              <TableHead className="w-[100px] font-semibold text-center">Status</TableHead>
                              <TableHead className="w-[80px] font-semibold text-center">Stage</TableHead>
                              <TableHead className="w-[120px] font-semibold">Timeline</TableHead>
                              <TableHead className="w-[100px] font-semibold text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredApplications.map((application) => {
                              const expiryDate = application.approvedAt
                                ? new Date(application.approvedAt.getTime() + 5 * 365 * 24 * 60 * 60 * 1000)
                                : new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)

                              const isReviewed = reviewedApplications.has(application.id)
                              const documents = applicationDocuments[application.id] || []

                              return (
                                <TableRow key={application.id} className="hover:bg-blue-50/50 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-white" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-sm">{application.applicationId}</div>
                                        <div className="text-xs text-gray-500">{documents.length} docs</div>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="font-medium text-sm">{application.customerAccountNumber}</div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="font-semibold text-sm">{application.applicantName}</div>
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate max-w-[200px]" title={application.physicalAddress}>
                                          {application.physicalAddress}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Building className="h-3 w-3" />
                                        <span>{application.cellularNumber}</span>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="space-y-1">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {application.permitType.replace("_", " ")}
                                      </Badge>
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Droplets className="h-3 w-3" />
                                        <span>{application.waterAllocation.toLocaleString()} m³</span>
                                      </div>
                                      <div className="text-xs text-gray-500">{application.landSize} hectares</div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <div className="space-y-1">
                                      <Badge
                                        className={
                                          application.status === "approved"
                                            ? "bg-green-100 text-green-800 border-green-200"
                                            : application.status === "rejected"
                                              ? "bg-red-100 text-red-800 border-red-200"
                                              : application.status === "submitted"
                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                : application.status === "under_review"
                                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                                  : "bg-gray-100 text-gray-800 border-gray-200"
                                        }
                                      >
                                        {application.status.replace("_", " ").toUpperCase()}
                                      </Badge>
                                      {application.currentStage === 2 && (
                                        <div className="text-xs">
                                          {isReviewed ? (
                                            <Badge className="bg-green-100 text-green-700 text-xs">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Reviewed
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                                              <AlertCircle className="h-3 w-3 mr-1" />
                                              Pending
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <div className="space-y-1">
                                      <Badge variant="secondary" className="text-xs font-medium">
                                        Stage {application.currentStage}
                                      </Badge>
                                      <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div
                                          className="bg-blue-600 h-1 rounded-full transition-all"
                                          style={{ width: `${(application.currentStage / 5) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                          {application.submittedAt
                                            ? application.submittedAt.toLocaleDateString("en-ZA", {
                                                month: "short",
                                                day: "2-digit",
                                              })
                                            : "Not submitted"}
                                        </span>
                                      </div>
                                      {application.status === "approved" && (
                                        <div className="text-green-600 font-medium">
                                          Expires:{" "}
                                          {expiryDate.toLocaleDateString("en-ZA", {
                                            year: "2-digit",
                                            month: "short",
                                          })}
                                        </div>
                                      )}
                                      {application.currentStage === 2 && (
                                        <div className="text-orange-600 font-medium">Awaiting Review</div>
                                      )}
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => setSelectedApplication(application)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        {application.currentStage === 2 && (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              handleApplicationReviewed(application.id, !isReviewed)
                                            }}
                                          >
                                            {isReviewed ? (
                                              <>
                                                <X className="h-4 w-4 mr-2" />
                                                Mark as Pending
                                              </>
                                            ) : (
                                              <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Mark as Reviewed
                                              </>
                                            )}
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem>
                                          <Download className="h-4 w-4 mr-2" />
                                          Export Application
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <FileText className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-600">No applications found</p>
                        <p className="text-sm text-gray-500">
                          Adjust your search or filter criteria to view applications
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-semibold">Messages</h2>
              <p>This is where messages will be displayed.</p>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-semibold">Activity Log</h2>
              <p>This is where the activity log will be displayed.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ChairpersonDashboard
