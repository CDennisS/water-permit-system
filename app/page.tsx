"use client"

import { useState, useRef } from "react"
import Dashboard from "@/components/Dashboard"
import Form from "@/components/Form"
import type { PermitApplication } from "@/types"

type View = "dashboard" | "form"

export default function Page() {
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const dashboardRef = useRef<Dashboard>(null)

  const handleViewChange = (view: View) => {
    setCurrentView(view)
  }

  const handleApplicationSelect = (application: PermitApplication) => {
    setSelectedApplication(application)
    setCurrentView("form")
  }

  const handleSaveApplication = (application: PermitApplication) => {
    setCurrentView("dashboard")
    setSelectedApplication(null)
    // Add this line to refresh the applications list
    if (dashboardRef.current) {
      dashboardRef.current.refreshApplications()
    }
  }

  const handleNewApplication = () => {
    setSelectedApplication(null) // Clear any selected application
    setCurrentView("form")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {currentView === "dashboard" ? (
        <Dashboard
          onViewChange={handleViewChange}
          onApplicationSelect={handleApplicationSelect}
          onNewApplication={handleNewApplication}
          ref={dashboardRef}
        />
      ) : (
        <Form
          onViewChange={handleViewChange}
          selectedApplication={selectedApplication}
          onSaveApplication={handleSaveApplication}
        />
      )}
    </main>
  )
}
