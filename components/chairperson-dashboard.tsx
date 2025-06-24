"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Users, CheckCircle, Clock, AlertTriangle, Eye, ArrowLeft, MapPin, Phone } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { ChairpersonReviewWorkflow } from "./chairperson-review-workflow"
import { MessagingSystem } from "./messaging-system"
import { ActivityLogs } from "./activity-logs"
import { UnreadMessageNotification } from "./unread-message-notification"
import { ChairpersonApplicationHistory } from "./chairperson-application-history"

interface ChairpersonDashboardProps {
  user: User
}

export function ChairpersonDashboard({ user }: ChairpersonDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
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
        (app) => app.currentStage === 2 && app.status === "under_review",
      ).length

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const reviewedThisMonth = relevantApplications.filter(
        (app) => app.updatedAt >= thisMonth && app.currentStage > 2,
      ).length

      const totalReviewed = relevantApplications.filter((app) => app.currentStage > 2).length
      const approvedApplications = relevantApplications.filter((app) => app.status === "approved").length

      setStats({
        totalApplications: relevantApplications.length,
        pendingReview,
        reviewedThisMonth,
        approvalRate: totalReviewed > 0 ? Math.round((approvedApplications / totalReviewed) * 100) : 0,
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

  const handleBackToOverview = () => {
    setSelectedApplication(null)
    loadDashboardData() // Refresh data to show updated status
  }

  const getStatusBadge = (application: PermitApplication) => {
    if (application.status === "approved") {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    }
    if (application.status === "rejected") {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    }
    if (application.currentStage === 2 && application.status === "under_review") {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
    }
    return <Badge variant="secondary">{application.status}</Badge>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upper Manyame Sub Catchment Chairperson Dashboard</h1>
          <p className="text-gray-600 mt-1">Business Case Review and Assessment Authority</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Users className="h-4 w-4 mr-1" />
          Sub Catchment Chairperson Access
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

      {/* Show review workflow if application is selected */}
      {selectedApplication ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Business Case Review: {selectedApplication.applicationId}</h2>
            <Button variant="outline" onClick={handleBackToOverview} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          <ChairpersonReviewWorkflow user={user} application={selectedApplication} onUpdate={handleBackToOverview} />
        </div>
      ) : (
        /* Navigation Tabs */
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Application History</TabsTrigger>
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
                title="Overall Approval Rate"
                value={`${stats.approvalRate}%`}
                icon={AlertTriangle}
                color="purple"
              />
            </div>

            {/* Applications requiring review */}
            <Card>
              <CardHeader>
                <CardTitle>Applications Requiring Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications
                    .filter((a) => a.currentStage === 2 && a.status === "under_review")
                    .map((app) => (
                      <div
                        key={app.id}
                        className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          {/* Application Details */}
                          <div className="flex-1 space-y-3">
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-semibold text-lg">{app.applicationId}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {app.permitType.replace("_", " ").toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              {getStatusBadge(app)}
                            </div>

                            {/* Applicant Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">Applicant:</span>
                                  <span>{app.applicantName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">Contact:</span>
                                  <span>{app.cellularNumber}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                  <div>
                                    <span className="font-medium">Physical Address:</span>
                                    <p className="text-sm text-gray-600">{app.physicalAddress}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Land Size:</span>
                                <p>{app.landSize} ha</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Water Allocation:</span>
                                <p>{app.waterAllocation} ML</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Boreholes:</span>
                                <p>{app.numberOfBoreholes}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Submitted:</span>
                                <p>{app.createdAt.toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Review Button */}
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedApplication(app)}
                              className="flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review Application
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {applications.filter((a) => a.currentStage === 2 && a.status === "under_review").length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No applications pending review</p>
                      <p className="text-gray-400 text-sm">All submitted applications have been reviewed</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications
                    .filter((a) => a.currentStage > 2)
                    .slice(0, 5)
                    .map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{app.applicationId}</p>
                            <p className="text-sm text-gray-600">{app.applicantName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Stage {app.currentStage}</Badge>
                          <span className="text-xs text-gray-500">{app.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application History Tab */}
          <TabsContent value="history">
            <ChairpersonApplicationHistory user={user} />
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
      )}
    </div>
  )
}
