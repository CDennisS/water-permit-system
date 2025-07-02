"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Save,
  ExternalLink,
  FileIcon,
  MapPin,
  Phone,
  Mail,
  Droplets,
  Calendar,
  UserIcon,
} from "lucide-react"
import type { User, PermitApplication, Document } from "@/types"
import { db } from "@/lib/database"
import { StrictViewOnlyApplicationDetails } from "./strict-view-only-application-details"
import { MessagingSystem } from "./messaging-system"
import { ActivityLogs } from "./activity-logs"
import { UnreadMessageNotification } from "./unread-message-notification"

interface ChairpersonDashboardProps {
  user: User
}

export function ChairpersonDashboard({ user }: ChairpersonDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(new Set())
  const [selectAllUnsubmitted, setSelectAllUnsubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    reviewedThisMonth: 0,
    approvalRate: 0,
  })

  useEffect(() => {
    loadDashboardData()
    loadUnreadMessages()

    // Set up polling for unread messages
    const messageInterval = setInterval(loadUnreadMessages, 30000)
    return () => clearInterval(messageInterval)
  }, [user.id])

  const loadDashboardData = async () => {
    try {
      const allApplications = await db.getApplications()

      // Filter applications that are at stage 2 (chairperson review) or have been reviewed
      const relevantApplications = allApplications.filter(
        (app) => app.currentStage === 2 || (app.currentStage > 2 && app.status !== "unsubmitted"),
      )

      setApplications(relevantApplications)

      // Calculate statistics
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

    // Add activity log for review
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
      // Mark all pending applications as reviewed
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

        // Add workflow comment
        await db.addComment({
          applicationId: app.id,
          userId: user.id,
          userType: user.userType,
          comment:
            "Application reviewed and approved by Upper Manyame Sub Catchment Council Chairman. Forwarding to Catchment Manager for technical assessment.",
          stage: 2,
          isRejectionReason: false,
        })

        // Add activity log
        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Application Submitted to Next Stage",
          details: `Application ${app.applicationId} submitted to Catchment Manager for technical review`,
          applicationId: app.id,
        })
      }

      // Reset states
      setReviewedApplications(new Set())
      setSelectAllUnsubmitted(false)

      // Reload data
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
    // Open document in new tab/window
    if (document.fileUrl) {
      window.open(document.fileUrl, "_blank")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getPermitTypeDisplay = (permitType: string) => {
    const types: Record<string, string> = {
      water_abstraction: "Water Abstraction",
      irrigation: "Irrigation",
      domestic_use: "Domestic Use",
      commercial_use: "Commercial Use",
      industrial_use: "Industrial Use",
    }
    return types[permitType] || permitType
  }

  const getWaterSourceDisplay = (waterSource: string) => {
    const sources: Record<string, string> = {
      borehole: "Borehole",
      river: "River",
      dam: "Dam",
      spring: "Spring",
    }
    return sources[waterSource] || waterSource
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "blue",
  }: {
    title: string
    value: number | string
    icon: any
    color?: "blue" | "green" | "yellow" | "purple"
  }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      yellow: "bg-yellow-100 text-yellow-600",
      purple: "bg-purple-100 text-purple-600",
    }

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ApplicationDetailDialog = ({ application }: { application: PermitApplication }) => {
    const [isReviewed, setIsReviewed] = useState(reviewedApplications.has(application.id))

    const handleSave = async () => {
      await handleApplicationReviewed(application.id, isReviewed)
      alert("Application review status saved successfully!")
    }

    return (
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Application Details - {application.applicationId}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Applicant Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Applicant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Number</p>
                  <p className="font-semibold">{application.customerAccountNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="font-semibold">{application.applicantName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Physical Address</p>
                  <p>{application.physicalAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Postal Address</p>
                  <p>{application.postalAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {application.cellularNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {application.emailAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Permit Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Permit Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Permit Type</p>
                  <p className="font-semibold">{getPermitTypeDisplay(application.permitType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Water Source</p>
                  <p className="font-semibold">{getWaterSourceDisplay(application.waterSource)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Intended Use</p>
                  <p>{application.intendedUse}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Number of Boreholes</p>
                  <p className="font-semibold">{application.numberOfBoreholes}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Land Size</p>
                  <p className="font-semibold">{application.landSize} hectares</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Water Allocation</p>
                  <p className="font-semibold">{application.waterAllocation.toLocaleString()} m³/annum</p>
                </div>
              </div>
            </div>

            {/* GPS Coordinates */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                GPS Coordinates
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Latitude</p>
                    <p className="font-semibold">{application.gpsLatitude}°</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Longitude</p>
                    <p className="font-semibold">{application.gpsLongitude}°</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Status
              </h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Status</p>
                    <Badge variant={application.status === "submitted" ? "default" : "secondary"}>
                      {application.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Submitted Date</p>
                    <p className="font-semibold">
                      {application.submittedAt ? application.submittedAt.toLocaleDateString() : "Not submitted"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="font-semibold">{application.updatedAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uploaded Documents ({application.documents.length})
                </h3>
                <div className="space-y-3">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.fileSize)} • Uploaded {doc.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow Comments */}
            {application.workflowComments && application.workflowComments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Workflow Comments</h3>
                <div className="space-y-3">
                  {application.workflowComments
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .map((comment) => (
                      <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{comment.userType.replace("_", " ").toUpperCase()}</Badge>
                          <span className="text-sm text-gray-500">{comment.createdAt.toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Review Checkbox */}
            <Separator />
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`review-${application.id}`}
                  checked={isReviewed}
                  onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                />
                <label
                  htmlFor={`review-${application.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have reviewed this application and all supporting documents
                </label>
              </div>
              <Button onClick={handleSave} className="mt-3 flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Review Status
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    )
  }

  if (activeView === "messages") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Messages</h1>
          <Button variant="outline" onClick={() => setActiveView("overview")}>
            Back to Dashboard
          </Button>
        </div>
        <MessagingSystem user={user} />
      </div>
    )
  }

  if (activeView === "activity") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <Button variant="outline" onClick={() => setActiveView("overview")}>
            Back to Dashboard
          </Button>
        </div>
        <ActivityLogs user={user} />
      </div>
    )
  }

  if (activeView === "application-details" && selectedApplication) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Application Details</h1>
          <Button variant="outline" onClick={() => setActiveView("overview")}>
            Back to Dashboard
          </Button>
        </div>
        <StrictViewOnlyApplicationDetails application={selectedApplication} user={user} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upper Manyame Sub Catchment Council</h1>
          <p className="text-gray-600">Chairman Dashboard - {user.username}</p>
        </div>
        <div className="flex items-center gap-4">
          <UnreadMessageNotification count={unreadMessageCount} onClick={handleViewMessages} />
          <Button variant="outline" onClick={() => setActiveView("activity")}>
            Activity Logs
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Applications" value={stats.totalApplications} icon={FileText} color="blue" />
        <StatCard title="Pending Review" value={stats.pendingReview} icon={Clock} color="yellow" />
        <StatCard title="Reviewed This Month" value={stats.reviewedThisMonth} icon={CheckCircle} color="green" />
        <StatCard title="Approval Rate" value={`${stats.approvalRate}%`} icon={Users} color="purple" />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Review ({stats.pendingReview})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Applications Requiring Review */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Recent Applications Requiring Review
              </CardTitle>
              {applications.filter((app) => app.currentStage === 2 && app.status === "submitted").length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-unsubmitted"
                      checked={selectAllUnsubmitted}
                      onCheckedChange={handleSelectAllUnsubmitted}
                    />
                    <label htmlFor="select-all-unsubmitted" className="text-sm font-medium">
                      Select all for submission
                    </label>
                  </div>
                  <Button
                    onClick={handleSubmitPermits}
                    disabled={!selectAllUnsubmitted || isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Submitting..." : "Submit to Next Stage"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .filter((app) => app.currentStage === 2 && app.status === "submitted")
                  .slice(0, 5)
                  .map((app) => (
                    <div
                      key={app.id}
                      className={`p-4 border rounded-lg ${
                        reviewedApplications.has(app.id)
                          ? "bg-green-50 border-green-200"
                          : "bg-orange-50 border-orange-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{app.applicationId}</h3>
                            <Badge
                              variant={reviewedApplications.has(app.id) ? "default" : "secondary"}
                              className={
                                reviewedApplications.has(app.id)
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }
                            >
                              {reviewedApplications.has(app.id) ? "Reviewed" : "Unreviewed"}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{app.applicantName}</p>
                          <p className="text-sm text-gray-500">
                            {getPermitTypeDisplay(app.permitType)} • {app.waterAllocation.toLocaleString()} m³/annum
                          </p>
                          <p className="text-sm text-gray-500">Submitted: {app.submittedAt?.toLocaleDateString()}</p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <ApplicationDetailDialog application={app} />
                        </Dialog>
                      </div>
                    </div>
                  ))}

                {applications.filter((app) => app.currentStage === 2 && app.status === "submitted").length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No applications currently pending review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recently Reviewed Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recently Reviewed Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .filter((app) => app.currentStage > 2)
                  .slice(0, 3)
                  .map((app) => (
                    <div key={app.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{app.applicationId}</h3>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {app.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{app.applicantName}</p>
                          <p className="text-sm text-gray-500">
                            {getPermitTypeDisplay(app.permitType)} • {app.waterAllocation.toLocaleString()} m³/annum
                          </p>
                          <p className="text-sm text-gray-500">Last Updated: {app.updatedAt.toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app)
                            setActiveView("application-details")
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}

                {applications.filter((app) => app.currentStage > 2).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No reviewed applications yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Applications Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .filter((app) => app.currentStage === 2 && app.status === "submitted")
                  .map((app) => (
                    <div
                      key={app.id}
                      className={`p-4 border rounded-lg ${
                        reviewedApplications.has(app.id)
                          ? "bg-green-50 border-green-200"
                          : "bg-orange-50 border-orange-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{app.applicationId}</h3>
                            <Badge
                              variant={reviewedApplications.has(app.id) ? "default" : "secondary"}
                              className={
                                reviewedApplications.has(app.id)
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }
                            >
                              {reviewedApplications.has(app.id) ? "Reviewed" : "Unreviewed"}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{app.applicantName}</p>
                          <p className="text-sm text-gray-500">
                            {getPermitTypeDisplay(app.permitType)} • {app.waterAllocation.toLocaleString()} m³/annum
                          </p>
                          <p className="text-sm text-gray-500">Submitted: {app.submittedAt?.toLocaleDateString()}</p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <ApplicationDetailDialog application={app} />
                        </Dialog>
                      </div>
                    </div>
                  ))}

                {applications.filter((app) => app.currentStage === 2 && app.status === "submitted").length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No applications currently pending review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reviewed Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .filter((app) => app.currentStage > 2)
                  .map((app) => (
                    <div key={app.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{app.applicationId}</h3>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {app.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{app.applicantName}</p>
                          <p className="text-sm text-gray-500">
                            {getPermitTypeDisplay(app.permitType)} • {app.waterAllocation.toLocaleString()} m³/annum
                          </p>
                          <p className="text-sm text-gray-500">Last Updated: {app.updatedAt.toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app)
                            setActiveView("application-details")
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}

                {applications.filter((app) => app.currentStage > 2).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No reviewed applications yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
