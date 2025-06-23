"use client"

import { useState, useRef } from "react"
import { LoginForm } from "@/components/login-form"
import { ApplicationForm } from "@/components/application-form"
import { ApplicationDetails } from "@/components/application-details"
import { DashboardApplications } from "@/components/dashboard-applications"
import { DebugDashboard } from "@/components/debug-dashboard"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { CatchmentChairpersonDashboard } from "@/components/catchment-chairperson-dashboard"
import { PermitSupervisorDashboard } from "@/components/permit-supervisor-dashboard"
import { ICTDashboard } from "@/components/ict-dashboard"
import type { User, PermitApplication } from "@/types"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<
    "dashboard" | "new-application" | "edit-application" | "view-application"
  >("dashboard")
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const dashboardRef = useRef<{ refreshApplications: () => void }>(null)

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
    setCurrentView("dashboard")
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentView("dashboard")
    setSelectedApplication(null)
  }

  const handleNewApplication = () => {
    setCurrentView("new-application")
    setSelectedApplication(null)
  }

  const handleEditApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setCurrentView("edit-application")
  }

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setCurrentView("view-application")
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
    setSelectedApplication(null)
    // Refresh the dashboard when returning
    if (dashboardRef.current) {
      dashboardRef.current.refreshApplications()
    }
  }

  const handleApplicationSaved = () => {
    handleBackToDashboard()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoginForm onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UMSCC Permit Management System</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.username} ({user.userType.replace("_", " ").toUpperCase()})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {currentView !== "dashboard" && (
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === "dashboard" && (
            <div className="space-y-6">
              <DebugDashboard user={user} />
              {user.userType === "permitting_officer" && (
                <DashboardApplications
                  ref={dashboardRef}
                  user={user}
                  onNewApplication={handleNewApplication}
                  onEditApplication={handleEditApplication}
                  onViewApplication={handleViewApplication}
                />
              )}
              {user.userType === "chairperson" && (
                <ChairpersonDashboard user={user} onViewApplication={handleViewApplication} />
              )}
              {user.userType === "catchment_manager" && (
                <CatchmentManagerDashboard user={user} onViewApplication={handleViewApplication} />
              )}
              {user.userType === "catchment_chairperson" && (
                <CatchmentChairpersonDashboard user={user} onViewApplication={handleViewApplication} />
              )}
              {user.userType === "permit_supervisor" && (
                <PermitSupervisorDashboard user={user} onViewApplication={handleViewApplication} />
              )}
              {user.userType === "ict" && (
                <ICTDashboard
                  user={user}
                  onViewApplication={handleViewApplication}
                  onEditApplication={handleEditApplication}
                />
              )}
            </div>
          )}

          {currentView === "new-application" && (
            <ApplicationForm user={user} onSave={handleApplicationSaved} onCancel={handleBackToDashboard} />
          )}

          {currentView === "edit-application" && selectedApplication && (
            <ApplicationForm
              user={user}
              application={selectedApplication}
              onSave={handleApplicationSaved}
              onCancel={handleBackToDashboard}
            />
          )}

          {currentView === "view-application" && selectedApplication && (
            <ApplicationDetails
              application={selectedApplication}
              user={user}
              onBack={handleBackToDashboard}
              onEdit={handleEditApplication}
            />
          )}
        </div>
      </main>
    </div>
  )
}
