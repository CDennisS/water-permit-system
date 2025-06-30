"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { PermittingOfficerApplicationsTable } from "@/components/permitting-officer-applications-table"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { CatchmentChairpersonDashboard } from "@/components/catchment-chairperson-dashboard"
import { PermitSupervisorDashboard } from "@/components/permit-supervisor-dashboard"
import { ICTDashboard } from "@/components/ict-dashboard"
import { db } from "@/lib/database"
import type { User } from "@/types"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("currentUser")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = async (username: string, password: string) => {
    try {
      const users = await db.getUsers()
      const user = users.find((u) => u.username === username && u.password === password)

      if (user) {
        setCurrentUser(user)
        localStorage.setItem("currentUser", JSON.stringify(user))
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Render appropriate dashboard based on user type
  switch (currentUser.userType) {
    case "permitting_officer":
      return (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">UMSCC Permit Management</h1>
                  <p className="text-sm text-gray-600">Permitting Officer Dashboard</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Welcome, {currentUser.username}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PermittingOfficerApplicationsTable currentUser={currentUser} />
          </main>
        </div>
      )

    case "chairperson":
      return <ChairpersonDashboard currentUser={currentUser} onLogout={handleLogout} />

    case "catchment_manager":
      return <CatchmentManagerDashboard currentUser={currentUser} onLogout={handleLogout} />

    case "catchment_chairperson":
      return <CatchmentChairpersonDashboard currentUser={currentUser} onLogout={handleLogout} />

    case "permit_supervisor":
      return <PermitSupervisorDashboard currentUser={currentUser} onLogout={handleLogout} />

    case "ict":
      return <ICTDashboard currentUser={currentUser} onLogout={handleLogout} />

    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unknown User Type</h1>
            <button onClick={handleLogout} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Logout
            </button>
          </div>
        </div>
      )
  }
}
