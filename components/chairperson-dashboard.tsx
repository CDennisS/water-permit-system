"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Users, CheckCircle, Clock, AlertTriangle, Eye, Save } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { StrictViewOnlyApplicationDetails } from "./strict-view-only-application-details"
import { MessagingSystem } from "./messaging-system"
import { ActivityLogs } from "./activity-logs"
import { UnreadMessageNotification } from "./unread-message-notification"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details - {application.applicationId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Account Number</label>
                <p className="text-sm font-semibold">{application.customerAccountNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Applicant Name</label>
                <p className="text-sm font-semibold">{application.applicantName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Physical Address</label>
                <p className="text-sm">{application.physicalAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Postal Address</label>
                <p className="text-sm">{application.postalAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cellular Number</label>
                <p className="text-sm">{application.cellularNumber}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Permit Type</label>
                <p className="text-sm font-semibold capitalize">{application.permitType.replace("_", " ")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Water Source</label>
                <p className="text-sm capitalize">{application.waterSource}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Intended Use</label>
                <p className="text-sm">{application.intendedUse}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Number of Boreholes</label>
                <p className="text-sm">{application.numberOfBoreholes}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Land Size (hectares)</label>
                <p className="text-sm">{application.landSize}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Water Allocation (m³/annum)</label>
                <p className="text-sm font-semibold">{application.waterAllocation.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">GPS Latitude</label>
              <p className="text-sm">{application.gpsLatitude}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">GPS Longitude</label>
              <p className="text-sm">{application.gpsLongitude}</p>
            </div>
          </div>

          {/* Application Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Current Status</label>
              <Badge className="mt-1 bg-blue-100 text-blue-800 capitalize">
                {application.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Current Stage</label>
              <p className="text-sm font-semibold">Stage {application.currentStage}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Submitted Date</label>
              <p className="text-sm">{application.submittedAt?.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Workflow Comments */}
          {application.workflowComments && application.workflowComments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Workflow Comments</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {application.workflowComments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {comment.userType.replace("_", " ")} - Stage {comment.stage}
                      </span>
                      <span className="text-xs text-gray-500">{comment.createdAt.toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Checkbox and Save Button */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="application-reviewed"
                  checked={isReviewed}
                  onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                />
                <label htmlFor="application-reviewed" className="text-sm font-medium">
                  Application Reviewed
                </label>
              </div>
              <Button onClick={handleSave} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chairperson Dashboard</h1>
          <p className="text-gray-600 mt-1">Upper Manyame Sub Catchment Council</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Users className="h-4 w-4 mr-1" />
          Chairperson Access
        </Badge>
      </div>

      {/* Unread Messages Notification */}
      {unreadMessageCount > 0 && (
        <UnreadMessageNotification
          unreadCount={unreadMessageCount}
          onViewMessages={handleViewMessages}
          className="mb-6"
        />
      )}

      {/* Navigation Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Applications" value={stats.totalApplications} icon={FileText} color="blue" />
            <StatCard title="Pending Review" value={stats.pendingReview} icon={Clock} color="yellow" />
            <StatCard title="Reviewed This Month" value={stats.reviewedThisMonth} icon={CheckCircle} color="green" />
            <StatCard title="Approval Rate" value={`${stats.approvalRate}%`} icon={AlertTriangle} color="purple" />
          </div>

          {/* Recent Applications Requiring Review */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications Requiring Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bulk Submit Section */}
                {pendingApplications.length > 0 && (
                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all-unsubmitted"
                          checked={selectAllUnsubmitted}
                          onCheckedChange={handleSelectAllUnsubmitted}
                        />
                        <label htmlFor="select-all-unsubmitted" className="text-sm font-medium">
                          Select All Unsubmitted Permits ({pendingApplications.length})
                        </label>
                      </div>
                      {selectAllUnsubmitted && allPendingReviewed && (
                        <Button
                          onClick={handleSubmitPermits}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? "Submitting..." : "Submit Permits"}
                        </Button>
                      )}
                    </div>
                    {selectAllUnsubmitted && !allPendingReviewed && (
                      <p className="text-sm text-orange-600 mt-2">
                        Please review all applications before submitting permits.
                      </p>
                    )}
                  </div>
                )}

                {/* Applications List */}
                <div className="space-y-3">
                  {pendingApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Account Number</p>
                          <p className="font-semibold">{application.customerAccountNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Applicant Name</p>
                          <p className="font-semibold">{application.applicantName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Address</p>
                          <p className="text-sm">{application.physicalAddress}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Permit Type</p>
                          <Badge variant="outline" className="capitalize">
                            {application.permitType.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 ml-4">
                        {reviewedApplications.has(application.id) && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex items-center space-x-1 bg-transparent">
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </Button>
                          </DialogTrigger>
                          <ApplicationDetailDialog application={application} />
                        </Dialog>
                      </div>
                    </div>
                  ))}

                  {pendingApplications.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No applications pending review</p>
                  )}
                </div>
              </div>
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
                <CardTitle>All Applications</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[120px]">Tracking Number</TableHead>
                        <TableHead className="w-[140px]">Account Number</TableHead>
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
                      {applications.length > 0 ? (
                        applications.map((application) => {
                          // Calculate expiry date (assuming 5 years from approval date or current date if not approved)
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
  )
}
