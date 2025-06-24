"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, CheckCircle, Clock, Droplets, Send, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { CatchmentManagerReviewWorkflow } from "./catchment-manager-review-workflow"
import { MessagingSystem } from "./messaging-system"
import { ActivityLogs } from "./activity-logs"
import { UnreadMessageNotification } from "./unread-message-notification"

interface CatchmentManagerDashboardProps {
  user: User
}

export function CatchmentManagerDashboard({ user }: CatchmentManagerDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(new Set())
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    reviewedThisMonth: 0,
    totalWaterAllocation: 0,
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

      // Filter applications that are at stage 3 (catchment manager review) or have been reviewed
      const relevantApplications = allApplications.filter(
        (app) => app.currentStage === 3 || (app.currentStage > 3 && app.status !== "unsubmitted"),
      )

      setApplications(relevantApplications)

      // Load review status for each application
      const reviewedSet = new Set<string>()
      for (const app of relevantApplications) {
        if (await isApplicationReviewed(app.id)) {
          reviewedSet.add(app.id)
        }
      }
      setReviewedApplications(reviewedSet)

      // Calculate statistics - exclude already reviewed applications from pending count
      const pendingReview = relevantApplications.filter(
        (app) => app.currentStage === 3 && app.status === "under_review" && !reviewedSet.has(app.id),
      ).length

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const reviewedThisMonth = relevantApplications.filter(
        (app) => app.updatedAt >= thisMonth && app.currentStage > 3,
      ).length

      const totalWaterAllocation = relevantApplications
        .filter((app) => app.status === "approved")
        .reduce((sum, app) => sum + app.waterAllocation, 0)

      setStats({
        totalApplications: relevantApplications.length,
        pendingReview,
        reviewedThisMonth,
        totalWaterAllocation,
      })
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    }
  }

  const isApplicationReviewed = async (applicationId: string): Promise<boolean> => {
    const comments = await db.getCommentsByApplication(applicationId)
    return comments.some((c) => c.userType === "catchment_manager" && c.action === "review")
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

  const handleApplicationUpdate = () => {
    loadDashboardData() // Refresh the dashboard data
    setSelectedApplication(null) // Return to overview
    setActiveView("overview")
  }

  // Check if ALL applications requiring review have been completed
  const getAllApplicationsRequiringReview = () => {
    return applications.filter((app) => app.currentStage === 3 && app.status === "under_review")
  }

  const getReviewedApplicationsAtStage3 = () => {
    return applications.filter((app) => app.currentStage === 3 && reviewedApplications.has(app.id))
  }

  const getPendingApplicationsAtStage3 = () => {
    return applications.filter(
      (app) => app.currentStage === 3 && app.status === "under_review" && !reviewedApplications.has(app.id),
    )
  }

  const areAllApplicationsReviewed = () => {
    const applicationsRequiringReview = getAllApplicationsRequiringReview()
    const pendingApplications = getPendingApplicationsAtStage3()
    return applicationsRequiringReview.length > 0 && pendingApplications.length === 0
  }

  const handleBulkSubmit = async () => {
    const applicationsRequiringReview = getAllApplicationsRequiringReview()
    const reviewedApps = getReviewedApplicationsAtStage3()
    const pendingApps = getPendingApplicationsAtStage3()

    // Check if there are any applications requiring review
    if (applicationsRequiringReview.length === 0) {
      alert("❌ No applications requiring review at this stage.")
      return
    }

    // Check if ALL applications have been reviewed
    if (pendingApps.length > 0) {
      alert(
        `❌ Cannot submit: ${pendingApps.length} application(s) still pending review. All applications must be reviewed before submission.\n\nPending applications:\n${pendingApps.map((app) => `• ${app.applicationId} - ${app.applicantName}`).join("\n")}`,
      )
      return
    }

    // Validate that all reviewed applications have mandatory comments
    let missingComments = 0
    for (const app of reviewedApps) {
      const appComments = await db.getCommentsByApplication(app.id)
      const managerComment = appComments.find((c) => c.userType === "catchment_manager" && c.action === "review")
      if (!managerComment || !managerComment.comment.trim()) {
        missingComments++
      }
    }

    if (missingComments > 0) {
      alert(
        `❌ Cannot submit: ${missingComments} application(s) are missing mandatory catchment manager comments. Please complete all reviews before submitting.`,
      )
      return
    }

    const confirmMessage = `🚀 SUBMIT ALL APPLICATIONS TO CATCHMENT CHAIRPERSON

✅ ALL ${reviewedApps.length} application(s) have been reviewed with catchment manager comments.

Applications to be submitted:
${reviewedApps.map((app) => `• ${app.applicationId} - ${app.applicantName}`).join("\n")}

All applications will be sent to the Catchment Chairperson dashboard for final approval/rejection decisions.

Proceed with submission?`

    if (!confirm(confirmMessage)) return

    setIsSubmittingBulk(true)

    try {
      for (const app of reviewedApps) {
        await db.updateApplication(app.id, {
          currentStage: 4, // Move to Catchment Chairperson
          status: "under_review",
        })

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Submitted to Catchment Chairperson",
          details: `Application ${app.applicationId} submitted to Catchment Chairperson dashboard with catchment manager comments for final review`,
          applicationId: app.id,
        })
      }

      alert(
        `✅ SUCCESS: ALL ${reviewedApps.length} application(s) submitted to Catchment Chairperson dashboard for final review`,
      )
      loadDashboardData()
    } catch (error) {
      console.error("Failed to submit applications:", error)
      alert("❌ Failed to submit applications. Please try again.")
    } finally {
      setIsSubmittingBulk(false)
    }
  }

  const getApplicationStatus = (application: PermitApplication) => {
    if (application.currentStage === 3 && reviewedApplications.has(application.id)) {
      return { text: "Reviewed", color: "bg-green-100 text-green-800" }
    }
    if (application.currentStage === 3 && application.status === "under_review") {
      return { text: "Pending Review", color: "bg-yellow-100 text-yellow-800" }
    }
    if (application.status === "approved") {
      return { text: "Approved", color: "bg-green-100 text-green-800" }
    }
    if (application.status === "rejected") {
      return { text: "Rejected", color: "bg-red-100 text-red-800" }
    }
    return { text: application.status.toUpperCase(), color: "bg-gray-100 text-gray-800" }
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

  const applicationsRequiringReview = getAllApplicationsRequiringReview()
  const reviewedAppsAtStage3 = getReviewedApplicationsAtStage3()
  const pendingAppsAtStage3 = getPendingApplicationsAtStage3()
  const allReviewed = areAllApplicationsReviewed()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catchment Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Manyame Catchment Council - Technical Review Stage</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Droplets className="h-4 w-4 mr-1" />
          Manager Access
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
            <StatCard
              title="Water Allocated (ML)"
              value={stats.totalWaterAllocation.toLocaleString()}
              icon={Droplets}
              color="purple"
            />
          </div>

          {/* Review Progress Alert */}
          {applicationsRequiringReview.length > 0 && !allReviewed && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Review Progress:</strong> {reviewedAppsAtStage3.length} of {applicationsRequiringReview.length}{" "}
                applications reviewed. <strong>{pendingAppsAtStage3.length} applications still pending review.</strong>
                <br />
                All applications must be reviewed before submission to Catchment Chairperson.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit All Button - Only when ALL are reviewed */}
          {allReviewed && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  All Applications Reviewed - Ready for Submission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-green-800 font-medium">
                      ✅ ALL {reviewedAppsAtStage3.length} application(s) have been reviewed with catchment manager
                      comments
                    </p>
                    <p className="text-green-600 text-sm">
                      All applications are ready for submission to Catchment Chairperson for final approval/rejection
                      decisions.
                    </p>
                  </div>
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={isSubmittingBulk}
                    className="ml-4 bg-green-600 hover:bg-green-700 px-6 py-3"
                    size="lg"
                  >
                    {isSubmittingBulk ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit All Reviewed Applications
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications Requiring Review */}
          <Card>
            <CardHeader>
              <CardTitle>Applications Requiring Technical Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applicationsRequiringReview.slice(0, 10).map((application) => {
                  const status = getApplicationStatus(application)
                  const isReviewed = reviewedApplications.has(application.id)
                  return (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{application.applicationId}</p>
                          <p className="text-sm text-gray-600">{application.applicantName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={status.color}>{status.text}</Badge>
                          <Badge variant="outline">{application.permitType.replace("_", " ").toUpperCase()}</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          {isReviewed ? "View Review" : "Review Application"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {applicationsRequiringReview.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No applications pending review</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review Modal/Overlay */}
          {selectedApplication && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Technical Review</h2>
                    <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                      ✕ Close
                    </Button>
                  </div>
                  <CatchmentManagerReviewWorkflow
                    user={user}
                    application={selectedApplication}
                    onUpdate={handleApplicationUpdate}
                  />
                </div>
              </div>
            </div>
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
