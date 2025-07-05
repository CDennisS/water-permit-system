"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApplicationDetails } from "./application-details"
import type { Application } from "@/types"
import { LogOut, Mail, Bell, FileStack, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Eye,
  Save,
  ExternalLink,
  MapPin,
  Droplets,
  Building,
  X,
  Download,
  Calendar,
  TrendingUp,
  Target,
} from "lucide-react"
import type { PermitApplication, Document } from "@/types"
import { db } from "@/lib/database"
import { useEffect } from "react"

// Mock Data - Replace with API call
const mockApplications: Application[] = [
  {
    id: "APP-001",
    applicantName: "John Doe",
    permitType: "Borehole Drilling Permit",
    dateSubmitted: "2023-10-26",
    status: "Pending Review",
    details: { company: "Doe Farms", address: "123 Farm Lane, Harare", contact: "0777123456" },
    documents: [
      { id: "DOC-1", name: "Application Form.pdf", url: "#", uploadedAt: "2023-10-26" },
      { id: "DOC-2", name: "Site Plan.pdf", url: "#", uploadedAt: "2023-10-26" },
    ],
    comments: [
      {
        id: "CMT-1",
        author: "P. Moyo",
        authorRole: "Permitting Officer",
        text: "Application seems complete. Awaiting geological survey results.",
        createdAt: "2023-10-27",
      },
    ],
    isReviewedByChairperson: false,
  },
  {
    id: "APP-002",
    applicantName: "Jane Smith",
    permitType: "Dam Construction Permit",
    dateSubmitted: "2023-10-25",
    status: "Pending Review",
    details: { company: "Smith Holdings", address: "456 Industrial Rd, Bulawayo", contact: "0777654321" },
    documents: [
      { id: "DOC-3", name: "Application Form.pdf", url: "#", uploadedAt: "2023-10-25" },
      { id: "DOC-4", name: "Environmental Impact Assessment.pdf", url: "#", uploadedAt: "2023-10-25" },
    ],
    comments: [
      {
        id: "CMT-2",
        author: "P. Moyo",
        authorRole: "Permitting Officer",
        text: "EIA report needs clarification on section 3.2.",
        createdAt: "2023-10-26",
      },
    ],
    isReviewedByChairperson: false,
  },
  {
    id: "APP-003",
    applicantName: "Agricorp Inc.",
    permitType: "Bulk Water Abstraction",
    dateSubmitted: "2023-10-22",
    status: "Reviewed",
    details: { company: "Agricorp Inc.", address: "789 Agri Park, Gweru", contact: "0777112233" },
    documents: [{ id: "DOC-5", name: "Abstraction Proposal.pdf", url: "#", uploadedAt: "2023-10-22" }],
    comments: [
      {
        id: "CMT-3",
        author: "P. Moyo",
        authorRole: "Permitting Officer",
        text: "All documents in order.",
        createdAt: "2023-10-23",
      },
    ],
    isReviewedByChairperson: true,
  },
]

interface ChairpersonDashboardProps {
  user: any
}

export function ChairpersonDashboard({ user }: ChairpersonDashboardProps) {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(new Set())
  const [selectAllUnsubmitted, setSelectAllUnsubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationDocuments, setApplicationDocuments] = useState<{ [key: string]: Document[] }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    reviewedThisMonth: 0,
    approvalRate: 0,
  })
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleViewApplication = (app: PermitApplication) => {
    setSelectedApplication(app)
    setIsSheetOpen(true)
  }

  const pendingReviewCount = mockApplications.filter((a) => a.status === "Pending Review").length
  const reviewedCount = mockApplications.filter((a) => a.status === "Reviewed").length
  const totalApplications = mockApplications.length

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

      const documentsMap: { [key: string]: Document[] } = {}
      for (const app of relevantApplications) {
        try {
          const docs = await db.getDocumentsByApplication(app.id)
          documentsMap[app.id] = docs
        } catch (error) {
          console.error(`Failed to load documents for application ${app.id}:`, error)
          documentsMap[app.id] = []
        }
      }
      setApplicationDocuments(documentsMap)

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
    const documentUrl = `/placeholder-document.pdf?name=${encodeURIComponent(document.fileName)}`
    window.open(documentUrl, "_blank")
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
                  Review
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Application Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Info Bar */}
                <div className="grid grid-cols-4 gap-4">
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

                {/* Applicant Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Building className="h-5 w-5 mr-2 text-blue-600" />
                      Applicant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
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
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Postal Address
                          </label>
                          <p className="text-sm">{application.postalAddress}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Contact Number
                          </label>
                          <p className="text-sm">{application.cellularNumber}</p>
                        </div>
                      </div>
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
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
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
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Boreholes</label>
                        <p>{application.numberOfBoreholes}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Land Size</label>
                        <p>{application.landSize} hectares</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Water Allocation
                        </label>
                        <p className="font-semibold">{application.waterAllocation.toLocaleString()} m³/annum</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* GPS Coordinates */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-green-600" />
                      GPS Coordinates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
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

                {/* Documents */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Documents ({documents.length})
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {documents.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{document.fileName}</p>
                                <p className="text-xs text-gray-500">
                                  {document.fileType} • {(document.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleViewDocument(document)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No documents uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Status & Actions */}
              <div className="space-y-6">
                {/* Application Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Status Overview</CardTitle>
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
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Checkbox
                        id="application-reviewed"
                        checked={isReviewed}
                        onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                      />
                      <label htmlFor="application-reviewed" className="text-sm font-medium text-blue-800 flex-1">
                        I have reviewed this application and all supporting documents
                      </label>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Review Status"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Workflow Comments */}
                {application.workflowComments && application.workflowComments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Workflow History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-60">
                        <div className="space-y-3">
                          {application.workflowComments.map((comment, index) => (
                            <div key={comment.id} className="relative">
                              {index !== application.workflowComments!.length - 1 && (
                                <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                              )}
                              <div className="flex gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {comment.userType.replace("_", " ").toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {comment.createdAt.toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.comment}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
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
      <header className="bg-white dark:bg-gray-800 border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Chairperson's Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Mail className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">Chairperson</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="p-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileStack className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviewCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed by You</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications Requiring Review</CardTitle>
            <CardDescription>Select an application to view details, documents, and comments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Permit Type</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.applicantName}</TableCell>
                      <TableCell>{app.permitType}</TableCell>
                      <TableCell>{app.dateSubmitted}</TableCell>
                      <TableCell>
                        <Badge variant={app.status === "Pending Review" ? "destructive" : "secondary"}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleViewApplication(app)}>
                            View
                          </Button>
                        </SheetTrigger>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <SheetContent className="w-full sm:w-3/4 lg:w-1/2 p-0">
                {selectedApplication && (
                  <>
                    <SheetHeader className="p-6">
                      <SheetTitle>Application Details: {selectedApplication.id}</SheetTitle>
                    </SheetHeader>
                    <ApplicationDetails application={selectedApplication} onClose={() => setIsSheetOpen(false)} />
                  </>
                )}
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
