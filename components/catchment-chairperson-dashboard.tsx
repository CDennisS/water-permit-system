"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Users, CheckCircle, Clock, AlertTriangle, Eye, ArrowLeft, MapPin, Phone } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { CatchmentChairpersonReviewWorkflow } from "./catchment-chairperson-review-workflow"
import { ActivityLogs } from "./activity-logs"
import { UnreadMessageNotification } from "./unread-message-notification"
import { Button } from "@/components/ui/button"

interface CatchmentChairpersonDashboardProps {
  user: User
}

export function CatchmentChairpersonDashboard({ user }: CatchmentChairpersonDashboardProps) {
  /* ───────────────────── state ───────────────────── */
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingDecision: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
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
    // Stage 4 applications (submitted by Catchment Manager) and completed applications
    const relevant = all.filter((a) => a.currentStage === 4 || (a.currentStage > 4 && a.status !== "unsubmitted"))

    setApplications(relevant)

    // Calculate statistics
    const pendingDecision = relevant.filter((a) => a.currentStage === 4 && a.status === "under_review").length

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const approvedThisMonth = relevant.filter((a) => a.status === "approved" && a.updatedAt >= monthStart).length

    const rejectedThisMonth = relevant.filter((a) => a.status === "rejected" && a.updatedAt >= monthStart).length

    setStats({
      totalApplications: relevant.length,
      pendingDecision,
      approvedThisMonth,
      rejectedThisMonth,
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
    color?: "blue" | "green" | "yellow" | "red"
  }) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      yellow: "bg-yellow-100 text-yellow-600",
      red: "bg-red-100 text-red-600",
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
    if (application.currentStage === 4 && application.status === "under_review") {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Decision</Badge>
    }
    return <Badge variant="secondary">{application.status}</Badge>
  }

  /* ───────────────────── render ───────────────────── */
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manyame Catchment Chairperson Dashboard</h1>
          <p className="text-gray-600 mt-1">Final Review and Decision Authority</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Users className="h-4 w-4 mr-1" />
          Catchment Chairperson Access
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
            <h2 className="text-xl font-semibold">Final Review: {selectedApplication.applicationId}</h2>
            <Button variant="outline" onClick={handleBackToOverview} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          <CatchmentChairpersonReviewWorkflow
            user={user}
            application={selectedApplication}
            onUpdate={handleBackToOverview}
          />
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
              <StatCard title="Pending Decision" value={stats.pendingDecision} icon={Clock} color="yellow" />
              <StatCard title="Approved This Month" value={stats.approvedThisMonth} icon={CheckCircle} color="green" />
              <StatCard title="Rejected This Month" value={stats.rejectedThisMonth} icon={AlertTriangle} color="red" />
            </div>

            {/* Applications requiring final decision */}
            <Card>
              <CardHeader>
                <CardTitle>Applications Requiring Final Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications
                    .filter((a) => a.currentStage === 4 && a.status === "under_review")
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

                  {applications.filter((a) => a.currentStage === 4 && a.status === "under_review").length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No applications pending final decision</p>
                      <p className="text-gray-400 text-sm">All submitted applications have been processed</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Decisions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications
                    .filter((a) => a.status === "approved" || a.status === "rejected")
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
                          {getStatusBadge(app)}
                          <span className="text-xs text-gray-500">{app.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ───────── messages tab ───────── */}
          <TabsContent value="messages">
            <p className="text-center text-gray-500 py-8">
              Messaging interface is disabled for Catchment Chairperson role.
            </p>
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
