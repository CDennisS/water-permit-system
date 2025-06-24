"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Users, CheckCircle, Clock, AlertTriangle, Eye, ArrowLeft, MapPin, Phone } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { ChairpersonReviewWorkflow } from "./chairperson-review-workflow"
import { ActivityLogs } from "./activity-logs"
import { UnreadMessageNotification } from "./unread-message-notification"
import { Button } from "@/components/ui/button"

interface ChairpersonDashboardProps {
  user: User
}

export function ChairpersonDashboard({ user }: ChairpersonDashboardProps) {
  /* ───────────────────── state ───────────────────── */
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

  /* ────────────────── data loading ────────────────── */
  useEffect(() => {
    loadDashboardData()
    loadUnreadMessages()
    const interval = setInterval(loadUnreadMessages, 30_000)
    return () => clearInterval(interval)
  }, [user.id])

  const loadDashboardData = async () => {
    const all = await db.getApplications()
    const relevant = all.filter((a) => a.currentStage === 2 || (a.currentStage > 2 && a.status !== "unsubmitted"))

    setApplications(relevant)

    // statistics
    const pendingReview = relevant.filter((a) => a.currentStage === 2 && a.status === "submitted").length

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const reviewedThisMonth = relevant.filter((a) => a.updatedAt >= monthStart && a.currentStage > 2).length

    const totalReviewed = relevant.filter((a) => a.currentStage > 2).length
    const approved = relevant.filter((a) => a.status === "approved").length

    setStats({
      totalApplications: relevant.length,
      pendingReview,
      reviewedThisMonth,
      approvalRate: totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : 0,
    })
  }

  const loadUnreadMessages = async () => {
    const pub = await db.getMessages(user.id, true)
    const priv = await db.getMessages(user.id, false)
    setUnreadMessageCount(
      pub.filter((m) => !m.readAt && m.senderId !== user.id).length +
        priv.filter((m) => !m.readAt && m.senderId !== user.id).length,
    )
  }

  /* ───────────────────── helpers ──────────────────── */
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
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      yellow: "bg-yellow-100 text-yellow-600",
      purple: "bg-purple-100 text-purple-600",
    } as const
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${colors[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleBulkSubmit = async () => {
    const pendingApps = applications.filter((a) => a.currentStage === 2 && a.status === "submitted")

    const allReviewed = pendingApps.every(
      (app) => app.workflowComments?.some((c) => c.userType === "chairperson" && c.action === "review") ?? false,
    )

    if (!allReviewed) {
      alert("Please review all applications before submitting to next stage")
      return
    }

    try {
      for (const app of pendingApps) {
        await db.updateApplication(app.id, {
          currentStage: 3,
          status: "under_review",
        })
      }

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Bulk Submit Applications",
        details: `Submitted ${pendingApps.length} applications to Catchment Manager`,
      })

      alert(`Successfully submitted ${pendingApps.length} applications to Catchment Manager`)
      loadDashboardData()
    } catch (error) {
      alert("Failed to submit applications. Please try again.")
    }
  }

  const handleBackToOverview = () => {
    setSelectedApplication(null)
    loadDashboardData() // Refresh data to show updated review status
  }

  /* ───────────────────── render ───────────────────── */
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chairperson Dashboard</h1>
          <p className="text-gray-600 mt-1">Upper Manyame Sub-Catchment Council</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Users className="h-4 w-4 mr-1" />
          Chairperson Access
        </Badge>
      </div>

      {/* unread notification */}
      {unreadMessageCount > 0 && (
        <UnreadMessageNotification
          unreadCount={unreadMessageCount}
          onViewMessages={() => setActiveView("messages")}
          className="mb-6"
        />
      )}

      {/* Show review workflow if application is selected */}
      {selectedApplication ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reviewing Application: {selectedApplication.applicationId}</h2>
            <Button variant="outline" onClick={handleBackToOverview} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          <ChairpersonReviewWorkflow user={user} application={selectedApplication} onUpdate={handleBackToOverview} />
        </div>
      ) : (
        /* main tabs - only show when not reviewing an application */
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">
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

          {/* ─────────── overview tab ─────────── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Applications" value={stats.totalApplications} icon={FileText} color="blue" />
              <StatCard title="Pending Review" value={stats.pendingReview} icon={Clock} color="yellow" />
              <StatCard title="Reviewed This Month" value={stats.reviewedThisMonth} icon={CheckCircle} color="green" />
              <StatCard title="Approval Rate" value={`${stats.approvalRate}%`} icon={AlertTriangle} color="purple" />
            </div>

            {/* Applications requiring review */}
            <Card>
              <CardHeader>
                <CardTitle>Applications Requiring Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications
                    .filter((a) => a.currentStage === 2 && a.status === "submitted")
                    .map((app) => {
                      const isReviewed =
                        app.workflowComments?.some((c) => c.userType === "chairperson" && c.action === "review") ??
                        false
                      return (
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
                                <Badge
                                  variant={isReviewed ? "default" : "secondary"}
                                  className={
                                    isReviewed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {isReviewed ? "Reviewed" : "Pending Review"}
                                </Badge>
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

                              {/* GPS Coordinates */}
                              {(app.gpsLatitude || app.gpsLongitude) && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-600">GPS Coordinates:</span>
                                  <p>
                                    Lat: {app.gpsLatitude?.toFixed(6) || "N/A"}, Lng:{" "}
                                    {app.gpsLongitude?.toFixed(6) || "N/A"}
                                  </p>
                                </div>
                              )}
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
                      )
                    })}

                  {applications.filter((a) => a.currentStage === 2 && a.status === "submitted").length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No applications pending review</p>
                      <p className="text-gray-400 text-sm">All submitted applications have been reviewed</p>
                    </div>
                  )}
                </div>

                {/* Bulk Submit Button */}
                {applications.filter((a) => a.currentStage === 2 && a.status === "submitted").length > 0 && (
                  <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button onClick={handleBulkSubmit} className="flex items-center" size="lg">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit All Reviewed Applications to Next Stage
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── messages tab ───────── */}
          <TabsContent value="messages">
            <p className="text-center text-gray-500 py-8">Messaging interface is disabled for Chairperson role.</p>
          </TabsContent>

          {/* ───────── activity tab ───────── */}
          <TabsContent value="activity">
            <ActivityLogs user={user} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
