"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { PermittingOfficerApplicationsTable } from "@/components/permitting-officer-applications-table"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { CatchmentChairpersonDashboard } from "@/components/catchment-chairperson-dashboard"
import { PermitSupervisorDashboard } from "@/components/permit-supervisor-dashboard"
import { ICTDashboard } from "@/components/ict-dashboard"
import { ThemeProvider } from "@/components/theme-provider"
import type { User } from "@/types"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("currentUser")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    localStorage.setItem("currentUser", JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
  }

  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ThemeProvider>
    )
  }

  if (!currentUser) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <LoginForm onLogin={handleLogin} />
      </ThemeProvider>
    )
  }

  const renderDashboard = () => {
    switch (currentUser.userType) {
      case "permitting_officer":
        return <PermittingOfficerApplicationsTable currentUser={currentUser} />
      case "chairperson":
        return <ChairpersonDashboard currentUser={currentUser} />
      case "catchment_manager":
        return <CatchmentManagerDashboard currentUser={currentUser} />
      case "catchment_chairperson":
        return <CatchmentChairpersonDashboard currentUser={currentUser} />
      case "permit_supervisor":
        return <PermitSupervisorDashboard currentUser={currentUser} />
      case "ict":
        return <ICTDashboard currentUser={currentUser} />
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
              <p className="text-gray-600 mt-2">Invalid user type: {currentUser.userType}</p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">UMSCC Permit Management System</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {currentUser.username} ({currentUser.userType.replace("_", " ").toUpperCase()})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{renderDashboard()}</main>
      </div>
    </ThemeProvider>
  )
}
