"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface DebugDashboardProps {
  user: User
}

export function DebugDashboard({ user }: DebugDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const apps = await db.getApplications()
      setApplications(apps)
      console.log("=== DEBUG DASHBOARD ===")
      console.log("Current user:", user)
      console.log("Total applications in database:", apps.length)
      console.log(
        "Applications:",
        apps.map((app) => ({
          id: app.applicationId,
          status: app.status,
          stage: app.currentStage,
          createdBy: app.createdBy,
          applicant: app.applicantName,
        })),
      )
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTestApplication = async () => {
    try {
      const testApp = await db.createApplication({
        applicantName: "Test Applicant",
        customerAccountNumber: "TEST123",
        physicalAddress: "123 Test Street",
        cellularNumber: "1234567890",
        emailAddress: "test@example.com",
        permitType: "urban",
        waterSource: "ground_water",
        intendedUse: "domestic use",
        landSize: "10",
        waterAllocation: "5",
        numberOfBoreholes: "1",
        gpsLatitude: "-15.123",
        gpsLongitude: "28.456",
        status: "unsubmitted",
        currentStage: 1,
        createdBy: user.id,
        documents: [],
        comments: [],
      })
      console.log("Created test application:", testApp)
      await loadApplications()
    } catch (error) {
      console.error("Failed to create test application:", error)
    }
  }

  if (isLoading) {
    return <div>Loading debug info...</div>
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Debug Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Current User:</strong> {user.username} ({user.userType})
        </div>
        <div>
          <strong>Total Applications in Database:</strong> {applications.length}
        </div>
        <div>
          <strong>Applications by Status:</strong>
          <ul className="ml-4">
            <li>Unsubmitted: {applications.filter((app) => app.status === "unsubmitted").length}</li>
            <li>Submitted: {applications.filter((app) => app.status === "submitted").length}</li>
            <li>Under Review: {applications.filter((app) => app.status === "under_review").length}</li>
            <li>Approved: {applications.filter((app) => app.status === "approved").length}</li>
            <li>Rejected: {applications.filter((app) => app.status === "rejected").length}</li>
          </ul>
        </div>
        <div>
          <strong>Applications for Permitting Officer (unsubmitted):</strong>
          <ul className="ml-4">
            {applications
              .filter((app) => app.status === "unsubmitted")
              .map((app) => (
                <li key={app.id}>
                  {app.applicationId} - {app.applicantName} (Created by: {app.createdBy})
                </li>
              ))}
          </ul>
        </div>
        <Button onClick={createTestApplication}>Create Test Application</Button>
        <Button onClick={loadApplications} variant="outline">
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  )
}
