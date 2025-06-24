"use client"

import { useState, useEffect, useRef } from "react"
import { LoginForm } from "@/components/login-form"
import { DashboardHeader } from "@/components/dashboard-header"
import { ApplicationForm } from "@/components/application-form"
import { WorkflowManager } from "@/components/workflow-manager"
import { MessagingSystem } from "@/components/messaging-system"
import { ReportsAnalytics } from "@/components/reports-analytics"
import { ActivityLogs } from "@/components/activity-logs"
import { EnhancedDashboardApplications } from "@/components/enhanced-dashboard-applications"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { PermitSupervisorDashboard } from "@/components/permit-supervisor-dashboard"
import { ICTDashboard } from "@/components/ict-dashboard"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { CatchmentChairpersonDashboard } from "@/components/catchment-chairperson-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"
import { PermittingOfficerAdvancedAnalytics } from "@/components/permitting-officer-advanced-analytics"

export default function Home() {
  /* ------------------------------ state ------------------------------ */
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const dashboardRef = useRef<{ refreshApplications: () => void } | null>(null)

  /* ------------------------- message polling ------------------------- */
  useEffect(() => {
    if (!user) return

    const loadUnread = async () => {
      const publicMsgs = await db.getMessages(user.id, /* public */ true)
      const privateMsgs = await db.getMessages(user.id, /* public */ false)

      const unreadPublic = publicMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length
      const unreadPrivate = privateMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length

      setUnreadMessageCount(unreadPublic + unreadPrivate)
    }

    loadUnread()
    const id = setInterval(loadUnread, 30_000) // refresh every 30 s
    return () => clearInterval(id)
  }, [user])

  /* --------------------------- callbacks ----------------------------- */
  const handleLogin = (u: User) => setUser(u)

  const handleLogout = () => {
    setUser(null)
    setCurrentView("dashboard")
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
    setCurrentView("workflow")
  }

  const handleSaveApp = async () => {
    console.log("handleSaveApp called") // Add debugging
    setIsEditing(false)
    setSelectedApplication(null)
    setCurrentView("dashboard")

    // Add a small delay to ensure database operations are complete
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Force refresh the applications list
    if (dashboardRef.current?.refreshApplications) {
      console.log("Refreshing applications...") // Add debugging
      dashboardRef.current.refreshApplications()
    } else {
      console.warn("Dashboard ref not available for refresh") // Add debugging
    }
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

  /* ------------------------ tab configuration ------------------------ */
  const baseTabs = [
    { value: "dashboard", label: "Dashboard & Applications" },
    { value: "messages", label: "Messages" },
    { value: "reports", label: "Reports" },
    { value: "logs", label: "Activity Logs" },
  ]

  const getUserTabs = () => {
    if (!user) return baseTabs

    const tabs = [
      { value: "dashboard", label: "Dashboard & Applications" },
      { value: "messages", label: "Messages" },
    ]

    // Add analytics tab for permitting officers
    if (user.userType === "permitting_officer") {
      tabs.push({ value: "analytics", label: "Analytics" })
    }

    // Add reports tab for specific roles
    if (["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)) {
      tabs.push({ value: "reports", label: "Reports" })
    }

    tabs.push({ value: "logs", label: "Activity Logs" })

    return tabs
  }

  /* ------------------------------ UI -------------------------------- */
  if (!user) return <LoginForm onLogin={handleLogin} />

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
              {/* Role-specific dashboards */}
              {user.userType === "chairperson" ? (
                <ChairpersonDashboard user={user} />
              ) : user.userType === "catchment_manager" ? (
                <CatchmentManagerDashboard user={user} />
              ) : user.userType === "catchment_chairperson" ? (
                <CatchmentChairpersonDashboard user={user} />
              ) : user.userType === "permit_supervisor" ? (
                <PermitSupervisorDashboard
                  user={user}
                  onNewApplication={handleNewApp}
                  onEditApplication={handleEditApp}
                  onViewApplication={handleViewApp}
                />
              ) : user.userType === "ict" ? (
                <ICTDashboard
                  user={user}
                  onNewApplication={handleNewApp}
                  onEditApplication={handleEditApp}
                  onViewApplication={handleViewApp}
                />
              ) : (
                /* Default dashboard + tabs for permitting officers etc. */
                <Tabs value={currentView} onValueChange={handleTabChange} className="w-full">
                  <TabsList className={`grid w-full grid-cols-${getUserTabs().length}`}>
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
                      <h2 className="mb-2 text-2xl font-bold text-gray-900">Welcome back, {user.username}</h2>
                      <p className="text-gray-600">Manage your permit applications and track progress</p>
                    </div>

                    <EnhancedDashboardApplications
                      ref={dashboardRef}
                      user={user}
                      onNewApplication={handleNewApp}
                      onEditApplication={handleEditApp}
                      onViewApplication={handleViewApp}
                    />
                  </TabsContent>

                  <TabsContent value="analytics">
                    <PermittingOfficerAdvancedAnalytics user={user} />
                  </TabsContent>

                  <TabsContent value="messages">
                    <MessagingSystem user={user} />
                  </TabsContent>

                  <TabsContent value="reports">
                    <ReportsAnalytics />
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
