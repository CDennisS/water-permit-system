"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { DashboardApplications } from "@/components/dashboard-applications"
import { ApplicationForm } from "@/components/application-form"
import { ApplicationDetails } from "@/components/application-details"
import { ReportsAnalytics } from "@/components/reports-analytics"
import { MessagingSystem } from "@/components/messaging-system"
import type { PermitApplication, User } from "@/types"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<
    "dashboard" | "new-application" | "view-application" | "edit-application" | "reports" | "messages"
  >("dashboard")
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)

  // Handle login
  const handleLogin = (userData: User) => {
    setUser(userData)
    setCurrentView("dashboard")
  }

  // Handle logout
  const handleLogout = () => {
    setUser(null)
    setCurrentView("dashboard")
    setSelectedApplication(null)
  }

  // Navigation handlers
  const handleNewApplication = () => {
    setSelectedApplication(null)
    setCurrentView("new-application")
  }

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setCurrentView("view-application")
  }

  const handleEditApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setCurrentView("edit-application")
  }

  const handleBackToDashboard = () => {
    setSelectedApplication(null)
    setCurrentView("dashboard")
  }

  // If not logged in, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">UMSCC Permit Management</h1>
            <p className="text-gray-600 mt-2">Upper Manyame Sub Catchment Council</p>
          </div>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  // Main application layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">UMSCC Permit Management System</h1>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "dashboard" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("reports")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "reports" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setCurrentView("messages")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "messages" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Messages
              </button>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.name} ({user.userType.replace("_", " ").toUpperCase()})
              </span>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" && (
          <DashboardApplications
            user={user}
            onNewApplication={handleNewApplication}
            onViewApplication={handleViewApplication}
            onEditApplication={handleEditApplication}
          />
        )}

        {currentView === "new-application" && (
          <div>
            <div className="mb-6">
              <button onClick={handleBackToDashboard} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to Dashboard
              </button>
            </div>
            <ApplicationForm onSave={handleBackToDashboard} onCancel={handleBackToDashboard} />
          </div>
        )}

        {currentView === "view-application" && selectedApplication && (
          <div>
            <div className="mb-6">
              <button onClick={handleBackToDashboard} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to Dashboard
              </button>
            </div>
            <ApplicationDetails
              application={selectedApplication}
              user={user}
              onEdit={() => handleEditApplication(selectedApplication)}
            />
          </div>
        )}

        {currentView === "edit-application" && selectedApplication && (
          <div>
            <div className="mb-6">
              <button onClick={handleBackToDashboard} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to Dashboard
              </button>
            </div>
            <ApplicationForm
              application={selectedApplication}
              onSave={handleBackToDashboard}
              onCancel={handleBackToDashboard}
            />
          </div>
        )}

        {currentView === "reports" && <ReportsAnalytics user={user} />}

        {currentView === "messages" && <MessagingSystem user={user} />}
      </main>
    </div>
  )
}
