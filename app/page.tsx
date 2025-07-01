"use client"

import { useState, useEffect, useCallback } from "react"
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
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { CatchmentChairpersonDashboard } from "@/components/catchment-chairperson-dashboard"
import { ComprehensiveApplicationDetails } from "@/components/comprehensive-application-details"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

/**
 * Main Application Component
 *
 * This is the root component that handles:
 * - User authentication and session management
 * - Application state management
 * - Navigation between different views
 * - Real-time message polling
 * - Error handling for all async operations
 *
 * The component uses role-based rendering to show different dashboards
 * based on the user's type (permitting_officer, chairperson, etc.)
 */
export default function Home() {
  /* ========================== STATE MANAGEMENT ========================== */

  // Authentication state
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Navigation and view state
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Message and notification state
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Error handling state
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Toast notifications
  const { toast } = useToast()

  /* ======================= MESSAGE POLLING SYSTEM ======================= */

  /**
   * Loads unread message count for the current user
   * Handles both public and private messages
   * Includes comprehensive error handling
   */
  const loadUnreadMessages = useCallback(async () => {
    if (!user) return

    try {
      setIsLoadingMessages(true)
      setError(null)

      // Fetch both public and private messages concurrently
      const [publicMsgs, privateMsgs] = await Promise.all([
        db.getMessages(user.id, true), // public messages
        db.getMessages(user.id, false), // private messages
      ])

      // Calculate unread counts
      const unreadPublic = publicMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length
      const unreadPrivate = privateMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length

      const totalUnread = unreadPublic + unreadPrivate
      setUnreadMessageCount(totalUnread)

      // Log message polling activity (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log(`Message poll: ${totalUnread} unread messages for user ${user.username}`)
      }
    } catch (error) {
      console.error("Failed to load unread messages:", error)

      // Don't show toast for message polling errors to avoid spam
      // Just log the error and continue
      setError("Failed to load messages")

      // Reset unread count on error to prevent stale data
      setUnreadMessageCount(0)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [user])

  /**
   * Set up message polling interval
   * Polls every 30 seconds when user is authenticated
   * Includes cleanup on component unmount
   */
  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0)
      return
    }

    // Initial load
    loadUnreadMessages()

    // Set up polling interval
    const pollInterval = setInterval(loadUnreadMessages, 30_000) // 30 seconds

    // Cleanup interval on unmount or user change
    return () => {
      clearInterval(pollInterval)
    }
  }, [user, loadUnreadMessages])

  /* ======================= AUTHENTICATION HANDLERS ======================= */

  /**
   * Handles user login
   * Sets user state and initializes application
   */
  const handleLogin = useCallback(
    async (newUser: User) => {
      try {
        setIsAuthenticating(true)
        setError(null)

        // Validate user object
        if (!newUser || !newUser.id || !newUser.userType) {
          throw new Error("Invalid user data received")
        }

        setUser(newUser)
        setCurrentView("dashboard")

        toast({
          title: "Login Successful",
          description: `Welcome back, ${newUser.username}!`,
        })

        // Log successful login (only in development)
        if (process.env.NODE_ENV === "development") {
          console.log(`User logged in: ${newUser.username} (${newUser.userType})`)
        }
      } catch (error) {
        console.error("Login error:", error)
        setError(error instanceof Error ? error.message : "Login failed")

        toast({
          title: "Login Failed",
          description: "An error occurred during login. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsAuthenticating(false)
      }
    },
    [toast],
  )

  /**
   * Handles user logout
   * Clears all user-related state and returns to login
   */
  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true)

      // Clear all user-related state
      setUser(null)
      setCurrentView("dashboard")
      setSelectedApplication(null)
      setIsEditing(false)
      setUnreadMessageCount(0)
      setError(null)

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })

      // Log logout (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("User logged out")
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Even if logout fails, clear the state
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  /* ===================== APPLICATION MANAGEMENT HANDLERS ===================== */

  /**
   * Handles creating a new application
   * Switches to application form in create mode
   */
  const handleNewApplication = useCallback(() => {
    try {
      setIsEditing(true)
      setSelectedApplication(null)
      setCurrentView("application-form")
      setError(null)

      // Log new application creation (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("Starting new application creation")
      }
    } catch (error) {
      console.error("Error starting new application:", error)
      toast({
        title: "Error",
        description: "Failed to start new application. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

  /**
   * Handles editing an existing application
   * Switches to application form in edit mode
   */
  const handleEditApplication = useCallback(
    async (application: PermitApplication) => {
      try {
        setIsLoading(true)
        setError(null)

        // Validate application object
        if (!application || !application.id) {
          throw new Error("Invalid application data")
        }

        // Check if application can be edited
        if (application.status !== "unsubmitted" && application.status !== "draft") {
          toast({
            title: "Cannot Edit Application",
            description: "Only unsubmitted or draft applications can be edited.",
            variant: "destructive",
          })
          return
        }

        setIsEditing(true)
        setSelectedApplication(application)
        setCurrentView("application-form")

        // Log application edit (only in development)
        if (process.env.NODE_ENV === "development") {
          console.log(`Editing application: ${application.applicationId}`)
        }
      } catch (error) {
        console.error("Error editing application:", error)
        setError(error instanceof Error ? error.message : "Failed to edit application")

        toast({
          title: "Edit Error",
          description: "Failed to open application for editing. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  /**
   * Handles viewing an application
   * Switches to comprehensive view mode
   */
  const handleViewApplication = useCallback(
    async (application: PermitApplication) => {
      try {
        setIsLoading(true)
        setError(null)

        // Validate application object
        if (!application || !application.id) {
          throw new Error("Invalid application data")
        }

        setIsEditing(false)
        setSelectedApplication(application)
        setCurrentView("comprehensive-view")

        // Log application view (only in development)
        if (process.env.NODE_ENV === "development") {
          console.log(`Viewing application: ${application.applicationId}`)
        }
      } catch (error) {
        console.error("Error viewing application:", error)
        setError(error instanceof Error ? error.message : "Failed to view application")

        toast({
          title: "View Error",
          description: "Failed to open application for viewing. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  /**
   * Handles saving an application
   * Returns to dashboard after successful save
   */
  const handleSaveApplication = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Reset form state
      setIsEditing(false)
      setSelectedApplication(null)
      setCurrentView("dashboard")

      toast({
        title: "Application Saved",
        description: "Application has been saved successfully.",
      })

      // Log application save (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("Application saved successfully")
      }
    } catch (error) {
      console.error("Error saving application:", error)
      setError(error instanceof Error ? error.message : "Failed to save application")

      toast({
        title: "Save Error",
        description: "Failed to save application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  /**
   * Handles canceling application edit
   * Returns to dashboard without saving
   */
  const handleCancelEdit = useCallback(() => {
    try {
      setIsEditing(false)
      setSelectedApplication(null)
      setCurrentView("dashboard")
      setError(null)

      // Log edit cancellation (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("Application edit cancelled")
      }
    } catch (error) {
      console.error("Error canceling edit:", error)
      // Even if there's an error, still cancel the edit
      setIsEditing(false)
      setSelectedApplication(null)
      setCurrentView("dashboard")
    }
  }, [])

  /**
   * Handles updating an application
   * Updates the selected application state
   */
  const handleUpdateApplication = useCallback(
    async (updatedApplication: PermitApplication) => {
      try {
        setError(null)

        // Validate updated application
        if (!updatedApplication || !updatedApplication.id) {
          throw new Error("Invalid application update data")
        }

        setSelectedApplication(updatedApplication)

        // Log application update (only in development)
        if (process.env.NODE_ENV === "development") {
          console.log(`Application updated: ${updatedApplication.applicationId}`)
        }
      } catch (error) {
        console.error("Error updating application:", error)
        setError(error instanceof Error ? error.message : "Failed to update application")

        toast({
          title: "Update Error",
          description: "Failed to update application. Please refresh and try again.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  /* ======================= NAVIGATION HANDLERS ======================= */

  /**
   * Handles tab changes in the main navigation
   * Includes special handling for messages tab
   */
  const handleTabChange = useCallback(async (newView: string) => {
    try {
      setError(null)
      setCurrentView(newView)

      // Clear unread count when switching to messages
      if (newView === "messages") {
        setUnreadMessageCount(0)
      }

      // Log tab change (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log(`Tab changed to: ${newView}`)
      }
    } catch (error) {
      console.error("Error changing tab:", error)
      setError(error instanceof Error ? error.message : "Failed to change view")
    }
  }, [])

  /**
   * Handles direct navigation to messages
   * Used by header message button
   */
  const handleMessagesClick = useCallback(async () => {
    try {
      setError(null)
      setCurrentView("messages")
      setUnreadMessageCount(0)

      // Log messages navigation (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("Navigated to messages")
      }
    } catch (error) {
      console.error("Error navigating to messages:", error)
      setError(error instanceof Error ? error.message : "Failed to open messages")
    }
  }, [])

  /**
   * Handles returning to applications list
   * Used by back buttons in detail views
   */
  const handleBackToApplications = useCallback(() => {
    try {
      setSelectedApplication(null)
      setCurrentView("dashboard")
      setError(null)

      // Log navigation back (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("Navigated back to applications")
      }
    } catch (error) {
      console.error("Error navigating back:", error)
      // Even if there's an error, still navigate back
      setSelectedApplication(null)
      setCurrentView("dashboard")
    }
  }, [])

  /* ======================= TAB CONFIGURATION ======================= */

  /**
   * Base tab configuration for all users
   * Some tabs are filtered based on user permissions
   */
  const baseTabs = [
    { value: "dashboard", label: "Dashboard & Applications" },
    { value: "records", label: "Records" },
    { value: "messages", label: "Messages" },
    { value: "reports", label: "Reports & Analytics" },
    { value: "logs", label: "Activity Logs" },
  ]

  /**
   * Gets tabs available to the current user
   * Filters out reports tab for users without permission
   */
  const getUserTabs = useCallback(() => {
    if (!user) return baseTabs

    // Only certain user types can access reports
    const canAccessReports = ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)

    return baseTabs.filter((tab) => tab.value !== "reports" || canAccessReports)
  }, [user])

  /* ======================= ERROR HANDLING COMPONENT ======================= */

  /**
   * Renders error alert when there are system errors
   */
  const renderErrorAlert = () => {
    if (!error) return null

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
            Dismiss
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  /* ======================= LOADING STATES ======================= */

  /**
   * Show loading spinner during authentication
   */
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  /**
   * Show login form if user is not authenticated
   */
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderErrorAlert()}
        <LoginForm onLogin={handleLogin} />
      </div>
    )
  }

  /* ======================= MAIN APPLICATION RENDER ======================= */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global error display */}
      {renderErrorAlert()}

      {/* Main header with user info and navigation */}
      <DashboardHeader
        user={user}
        onLogout={handleLogout}
        onMessagesClick={handleMessagesClick}
        unreadCount={unreadMessageCount}
        isLoadingMessages={isLoadingMessages}
      />

      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Loading overlay for async operations */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading...</p>
              </div>
            </div>
          )}

          {/* Application Form View */}
          {currentView === "application-form" ? (
            <ApplicationForm
              user={user}
              application={selectedApplication}
              onSave={handleSaveApplication}
              onCancel={handleCancelEdit}
            />
          ) : /* Comprehensive Application Details View */
          currentView === "comprehensive-view" && selectedApplication ? (
            <ComprehensiveApplicationDetails
              application={selectedApplication}
              user={user}
              onBack={handleBackToApplications}
            />
          ) : /* Workflow Management View */
          currentView === "workflow" && selectedApplication ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Application Details – {selectedApplication.applicationId}</h2>
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <WorkflowManager user={user} application={selectedApplication} onUpdate={handleUpdateApplication} />
            </div>
          ) : (
            <>
              {/* Role-Based Dashboard Rendering */}
              {user.userType === "chairperson" ? (
                <ChairpersonDashboard user={user} />
              ) : user.userType === "catchment_manager" ? (
                <CatchmentManagerDashboard user={user} />
              ) : user.userType === "catchment_chairperson" ? (
                <CatchmentChairpersonDashboard user={user} />
              ) : user.userType === "permit_supervisor" ? (
                <PermitSupervisorDashboard
                  user={user}
                  onNewApplication={handleNewApplication}
                  onEditApplication={handleEditApplication}
                  onViewApplication={handleViewApplication}
                />
              ) : user.userType === "ict" ? (
                <ICTDashboard
                  user={user}
                  onNewApplication={handleNewApplication}
                  onEditApplication={handleEditApplication}
                  onViewApplication={handleViewApplication}
                />
              ) : (
                /* Standard Tabbed Dashboard for Permitting Officers and other users */
                <Tabs value={currentView} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    {getUserTabs().map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value} className="relative">
                        {tab.label}
                        {/* Unread message badge */}
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

                  {/* Dashboard Tab Content */}
                  <TabsContent value="dashboard" className="space-y-6">
                    <div className="mb-6">
                      <h2 className="mb-2 text-2xl font-bold text-gray-900">Welcome back, {user.username}</h2>
                      <p className="text-gray-600">Manage your permit applications and track progress</p>
                    </div>

                    <DashboardApplications
                      user={user}
                      onNewApplication={handleNewApplication}
                      onEditApplication={handleEditApplication}
                      onViewApplication={handleViewApplication}
                    />
                  </TabsContent>

                  {/* Records Tab Content */}
                  <TabsContent value="records">
                    <RecordsSection
                      user={user}
                      onEditApplication={handleEditApplication}
                      onViewApplication={handleViewApplication}
                    />
                  </TabsContent>

                  {/* Messages Tab Content */}
                  <TabsContent value="messages">
                    <MessagingSystem user={user} />
                  </TabsContent>

                  {/* Reports Tab Content */}
                  <TabsContent value="reports">
                    <EnhancedReportsAnalytics />
                  </TabsContent>

                  {/* Activity Logs Tab Content */}
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
