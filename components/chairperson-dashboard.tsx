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
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Save,
  ExternalLink,
  Search,
  MapPin,
  Droplets,
  Building,
  X,
} from "lucide-react"
import type { PermitApplication, Document } from "@/types"
import { db } from "@/lib/database"
import { StrictViewOnlyApplicationDetails } from "./strict-view-only-application-details"
import { MessagingSystem } from "./messaging-system"
import { ActivityLogs } from "./activity-logs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { AlertCircle } from "lucide-react" // Import AlertCircle here

interface ChairpersonDashboardProps {
  user: any
}

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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    reviewedThisMonth: 0,
    approvalRate: 0,
  })

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
    color = "blue",
  }: {
    title: string
    value: number | string
    icon: any
    trend?: string
    color?: "blue" | "green" | "yellow" | "purple" | "orange"
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600 text-white",
      green: "from-green-500 to-green-600 text-white",
      yellow: "from-yellow-500 to-yellow-600 text-white",
      purple: "from-purple-500 to-purple-600 text-white",
      orange: "from-orange-500 to-orange-600 text-white",
    }

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-br ${colorClasses[color]} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
                {trend && <p className="text-white/70 text-xs mt-1">{trend}</p>}
              </div>
              <Icon className="h-8 w-8 text-white/80" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ApplicationCard = ({ application }: { application: PermitApplication }) => {
    const isReviewed = reviewedApplications.has(application.id)
    const isUnsubmitted = application.currentStage === 2 && application.status === "submitted"
    const documents = applicationDocuments[application.id] || []

    return (
      <Card
        className={`transition-all duration-200 hover:shadow-lg ${
          isUnsubmitted ? "border-orange-200 bg-orange-50/50" : "border-gray-200"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{application.applicantName}</h3>
                <Badge variant="outline" className="text-xs">
                  {application.applicationId}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{application.customerAccountNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{application.physicalAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  <span>{application.permitType.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{documents.length} documents</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {isReviewed ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Reviewed
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unreviewed
                </Badge>
              )}

              {isUnsubmitted && (
                <Badge className="bg-orange-200 text-orange-900 border-orange-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Unsubmitted
                </Badge>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Stage {application.currentStage}</span>
              <span>•</span>
              <span>{application.submittedAt?.toLocaleDateString()}</span>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Eye className="h-4 w-4 mr-2" />
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
            <DialogTitle className="text-xl font-semibold">
              Application Review - {application.applicationId}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Column - Application Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Applicant Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Building className="h-5 w-5 mr-2 text-blue-600" />
                    Applicant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Number</label>
                    <p className="font-semibold">{application.customerAccountNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="font-semibold">{application.applicantName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Physical Address</label>
                    <p className="text-sm">{application.physicalAddress}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
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
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Permit Type</label>
                    <p className="font-semibold capitalize">{application.permitType.replace("_", " ")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Water Source</label>
                    <p className="capitalize">{application.waterSource}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Intended Use</label>
                    <p>{application.intendedUse}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Number of Boreholes</label>
                    <p>{application.numberOfBoreholes}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Land Size</label>
                    <p>{application.landSize} hectares</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Water Allocation</label>
                    <p className="font-semibold">{application.waterAllocation.toLocaleString()} m³/annum</p>
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
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Latitude</label>
                    <p className="font-mono text-sm">{application.gpsLatitude}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Longitude</label>
                    <p className="font-mono text-sm">{application.gpsLongitude}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                    Documents ({documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-sm">{document.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {document.fileType} • {(document.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleViewDocument(document)}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
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
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Status</label>
                    <Badge className="mt-1 bg-blue-100 text-blue-800 capitalize">
                      {application.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Stage</label>
                    <p className="font-semibold">Stage {application.currentStage}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                    <p>{application.submittedAt?.toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Review Section */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-800">Chairperson Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="application-reviewed"
                      checked={isReviewed}
                      onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                    />
                    <label htmlFor="application-reviewed" className="text-sm font-medium text-blue-800">
                      I have reviewed this application
                    </label>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Review"}
                  </Button>
                </CardContent>
              </Card>

              {/* Workflow Comments */}
              {application.workflowComments && application.workflowComments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {application.workflowComments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-xs">
                              {comment.userType.replace("_", " ").toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">{comment.createdAt.toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    )
  }

  const pendingApplications = applications.filter((app) => app.currentStage === 2 && app.status === "submitted")
  const allPendingReviewed =
    pendingApplications.length > 0 && pendingApplications.every((app) => reviewedApplications.has(app.id))

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chairperson Dashboard</h1>
            <p className="text-gray-600 text-sm">Upper Manyame Sub Catchment Council</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadMessageCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleViewMessages}>
                Messages ({unreadMessageCount})
              </Button>
            )}
            <Badge variant="secondary" className="px-3 py-1">
              <Users className="h-4 w-4 mr-1" />
              Chairperson
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
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
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Applications"
                value={stats.totalApplications}
                icon={FileText}
                color="blue"
                trend="All time"
              />
              <MetricCard
                title="Pending Review"
                value={stats.pendingReview}
                icon={Clock}
                color="orange"
                trend="Requires action"
              />
              <MetricCard
                title="Reviewed This Month"
                value={stats.reviewedThisMonth}
                icon={CheckCircle}
                color="green"
                trend="Current month"
              />
              <MetricCard
                title="Approval Rate"
                value={`${stats.approvalRate}%`}
                icon={AlertTriangle}
                color="purple"
                trend="Success rate"
              />
            </div>

            {/* Applications Requiring Review */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Applications Requiring Review</CardTitle>
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
                            {isSubmitting ? "Submitting..." : "Submit All"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {selectAllUnsubmitted && !allPendingReviewed && (
                  <p className="text-sm text-orange-600 mt-2">Please review all applications before submitting.</p>
                )}
              </CardHeader>
              <CardContent>
                {pendingApplications.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pendingApplications.map((application) => (
                      <ApplicationCard key={application.id} application={application} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No applications pending review</p>
                    <p className="text-sm">All applications have been processed</p>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Applications</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search applications..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-[120px]">Tracking #</TableHead>
                          <TableHead className="w-[140px]">Account #</TableHead>
                          <TableHead>Applicant Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead className="w-[120px]">Permit Type</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[80px]">Stage</TableHead>
                          <TableHead className="w-[100px]">Submitted</TableHead>
                          <TableHead className="w-[100px]">Expiry Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.length > 0 ? (
                          filteredApplications.map((application) => {
                            const expiryDate = application.approvedAt
                              ? new Date(application.approvedAt.getTime() + 5 * 365 * 24 * 60 * 60 * 1000)
                              : new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)

                            return (
                              <TableRow key={application.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{application.applicationId}</TableCell>
                                <TableCell className="font-medium">{application.customerAccountNumber}</TableCell>
                                <TableCell className="font-semibold">{application.applicantName}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={application.physicalAddress}>
                                  {application.physicalAddress}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {application.permitType.replace("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      application.status === "approved"
                                        ? "bg-green-100 text-green-800"
                                        : application.status === "rejected"
                                          ? "bg-red-100 text-red-800"
                                          : application.status === "submitted"
                                            ? "bg-blue-100 text-blue-800"
                                            : application.status === "under_review"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {application.status.replace("_", " ").toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="text-xs">
                                    {application.currentStage}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {application.submittedAt
                                    ? application.submittedAt.toLocaleDateString("en-ZA", {
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit",
                                      })
                                    : "Not submitted"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {application.status === "approved"
                                    ? expiryDate.toLocaleDateString("en-ZA", {
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit",
                                      })
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedApplication(application)}
                                    className="text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                              No applications found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessagingSystem user={user} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ActivityLogs user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
