"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { LoginForm } from "@/components/login-form"
import { DashboardHeader } from "@/components/dashboard-header"
import { ApplicationForm } from "@/components/application-form"
import { WorkflowManager } from "@/components/workflow-manager"
import { MessagingSystem } from "@/components/messaging-system"
import { EnhancedReportsAnalytics } from "@/components/enhanced-reports-analytics"
import { ActivityLogs } from "@/components/activity-logs"
import { DashboardApplications } from "@/components/dashboard-applications"
import { RecordsSection } from "@/components/records-section"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { PermitSupervisorDashboard } from "@/components/permit-supervisor-dashboard"
import { ICTDashboard } from "@/components/ict-dashboard"
import { ComprehensiveApplicationDetails } from "@/components/comprehensive-application-details"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

export default function Home() {
  const { data: session, status } = useSession()
  const user = session?.user as User
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    const loadUnread = async () => {
      if (user) {
        const publicMsgs = await db.getMessages(user.id, /* public */ true)
        const privateMsgs = await db.getMessages(user.id, /* public */ false)

        const unreadPublic = publicMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length
        const unreadPrivate = privateMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length

        setUnreadMessageCount(unreadPublic + unreadPrivate)
      }
    }

    loadUnread()
    const id = setInterval(loadUnread, 30_000) // refresh every 30 s
    return () => clearInterval(id)
  }, [user])

  const handleLogout = () => {
    // Assuming logout functionality is handled by next-auth
  }

  const handleNewApp = () => {
    setIsEditing(true)
    setSelectedApplication(null)
    setCurrentView("application-form")
  }

  const handleEditApp = (a: PermitApplication) => {
    setIsEditing(true)
    setSelectedApplication(a)
    setCurrentView("application-form")
  }

  const handleViewApp = (a: PermitApplication) => {
    setIsEditing(false)
    setSelectedApplication(a)
    setCurrentView("comprehensive-view")
  }

  const handleSaveApp = () => {
    setIsEditing(false)
    setSelectedApplication(null)
    setCurrentView("dashboard")
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setSelectedApplication(null)
    setCurrentView("dashboard")
  }

  const handleUpdateApp = (a: PermitApplication) => setSelectedApplication(a)

  const handleTabChange = (v: string) => {
    setCurrentView(v)
    if (v === "messages") setUnreadMessageCount(0)
  }

  const handleMessagesClick = () => {
    setCurrentView("messages")
    setUnreadMessageCount(0)
  }

  const handleBackToApplications = () => {
    setSelectedApplication(null)
    setCurrentView("dashboard")
  }

  const baseTabs = [
    { value: "dashboard", label: "Dashboard & Applications" },
    { value: "records", label: "Records" },
    { value: "messages", label: "Messages" },
    { value: "reports", label: "Reports & Analytics" },
    { value: "logs", label: "Activity Logs" },
  ]

  const getUserTabs = () => {
    if (!user) return baseTabs
    return baseTabs.filter(
      (t) => t.value !== "reports" || ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType),
    )
  }

  const userRole = user?.role

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">UMSCC Permit Management System</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userRole === "chairperson") {
    return <ChairpersonDashboard user={user} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onLogout={handleLogout} onMessagesClick={handleMessagesClick} />

      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          {currentView === "application-form" ? (
            <ApplicationForm
              user={user}
              application={selectedApplication}
              onSave={handleSaveApp}
              onCancel={handleCancelEdit}
            />
          ) : currentView === "comprehensive-view" && selectedApplication ? (
            <ComprehensiveApplicationDetails
              application={selectedApplication}
              user={user}
              onBack={handleBackToApplications}
            />
          ) : currentView === "workflow" && selectedApplication ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Application Details – {selectedApplication.applicationId}</h2>
                <button onClick={() => setCurrentView("dashboard")} className="text-blue-600 hover:text-blue-800">
                  ← Back to Dashboard
                </button>
              </div>
              <WorkflowManager user={user} application={selectedApplication} onUpdate={handleUpdateApp} />
            </div>
          ) : (
            <>
              {userRole === "permit_supervisor" ? (
                <PermitSupervisorDashboard
                  user={user}
                  onNewApplication={handleNewApp}
                  onEditApplication={handleEditApp}
                  onViewApplication={handleViewApp}
                />
              ) : userRole === "ict" ? (
                <ICTDashboard
                  user={user}
                  onNewApplication={handleNewApp}
                  onEditApplication={handleEditApp}
                  onViewApplication={handleViewApp}
                />
              ) : (
                <Tabs value={currentView} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    {getUserTabs().map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value} className="relative">
                        {tab.label}
                        {tab.value === "messages" && unreadMessageCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="dashboard" className="space-y-6">
                    <div className="mb-6">
                      <h2 className="mb-2 text-2xl font-bold text-gray-900">Welcome back, {user.name}</h2>
                      <p className="text-gray-600">Manage your permit applications and track progress</p>
                    </div>

                    <DashboardApplications
                      user={user}
                      onNewApplication={handleNewApp}
                      onEditApplication={handleEditApp}
                      onViewApplication={handleViewApp}
                    />
                  </TabsContent>

                  <TabsContent value="records">
                    <RecordsSection user={user} onEditApplication={handleEditApp} onViewApplication={handleViewApp} />
                  </TabsContent>

                  <TabsContent value="messages">
                    <MessagingSystem user={user} />
                  </TabsContent>

                  <TabsContent value="reports">
                    <EnhancedReportsAnalytics />
                  </TabsContent>

                  <TabsContent value="logs">
                    <ActivityLogs user={user} />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
