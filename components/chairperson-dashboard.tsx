"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import type { User, PermitApplication } from "@/types"
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

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications Requiring Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applications
                  .filter((app) => app.currentStage === 2 && app.status === "submitted")
                  .slice(0, 5)
                  .map((application) => (
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
                        <Badge variant="outline" className="mb-1">
                          {application.permitType.replace("_", " ").toUpperCase()}
                        </Badge>
                        <p className="text-xs text-gray-500">{application.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                {applications.filter((app) => app.currentStage === 2 && app.status === "submitted").length === 0 && (
                  <p className="text-center text-gray-500 py-8">No applications pending review</p>
                )}
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
              <CardContent>
                <div className="space-y-3">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
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
                          <Badge
                            className={
                              application.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : application.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : application.status === "submitted"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            }
                          >
                            {application.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">Stage {application.currentStage}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">{application.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
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
