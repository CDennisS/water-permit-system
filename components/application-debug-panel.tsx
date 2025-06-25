"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Bug } from "lucide-react"
import { db } from "@/lib/database"
import type { User } from "@/types"

interface ApplicationDebugPanelProps {
  user: User
  onRefresh?: () => void
}

export function ApplicationDebugPanel({ user, onRefresh }: ApplicationDebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const apps = await db.getApplications()
      const myApps = apps.filter((app) => app.createdBy === user.id)

      const info = {
        totalApplications: apps.length,
        myApplications: myApps.length,
        applicationsByStatus: {
          unsubmitted: apps.filter((app) => app.status === "unsubmitted").length,
          submitted: apps.filter((app) => app.status === "submitted").length,
          under_review: apps.filter((app) => app.status === "under_review").length,
          approved: apps.filter((app) => app.status === "approved").length,
          rejected: apps.filter((app) => app.status === "rejected").length,
        },
        recentApplications: apps.slice(0, 5).map((app) => ({
          id: app.applicationId,
          applicant: app.applicantName,
          status: app.status,
          createdBy: app.createdBy,
          createdAt: app.createdAt.toISOString(),
        })),
        userInfo: {
          id: user.id,
          username: user.username,
          userType: user.userType,
        },
      }

      setDebugInfo(info)
      console.log("Debug info:", info)
    } catch (error) {
      console.error("Debug diagnostics failed:", error)
      setDebugInfo({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }

  const createTestApplication = async () => {
    setIsLoading(true)
    try {
      const testApp = await db.createApplication({
        applicantName: `Test Applicant ${Date.now()}`,
        physicalAddress: "123 Test Street, Test City",
        postalAddress: "PO Box 123, Test City",
        customerAccountNumber: `TEST${Date.now()}`,
        cellularNumber: "0123456789",
        numberOfBoreholes: 1,
        landSize: 10,
        gpsLatitude: -25.7479,
        gpsLongitude: 28.2293,
        waterSource: "borehole",
        waterSourceDetails: "Test borehole details",
        permitType: "urban",
        intendedUse: "domestic",
        waterAllocation: 50,
        validityPeriod: 5,
        comments: "Test application created for debugging",
        status: "unsubmitted",
        currentStage: 0,
        documents: [],
        workflowComments: [],
        createdBy: user.id,
      })

      console.log("Created test application:", testApp)

      // Refresh diagnostics
      await runDiagnostics()

      // Trigger parent refresh
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Failed to create test application:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Bug className="h-5 w-5 mr-2" />
          Application Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={isLoading} variant="outline" size="sm">
            <Database className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
          <Button onClick={createTestApplication} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Create Test App
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-2 text-sm">
            {debugInfo.error ? (
              <div className="text-red-600">Error: {debugInfo.error}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Total Applications:</strong> {debugInfo.totalApplications}
                  </div>
                  <div>
                    <strong>My Applications:</strong> {debugInfo.myApplications}
                  </div>
                </div>

                <div>
                  <strong>By Status:</strong>
                  <div className="flex gap-2 mt-1">
                    {Object.entries(debugInfo.applicationsByStatus).map(([status, count]) => (
                      <Badge key={status} variant="outline">
                        {status}: {count as number}
                      </Badge>
                    ))}
                  </div>
                </div>

                {debugInfo.recentApplications.length > 0 && (
                  <div>
                    <strong>Recent Applications:</strong>
                    <div className="mt-1 space-y-1">
                      {debugInfo.recentApplications.map((app: any) => (
                        <div key={app.id} className="text-xs bg-white p-2 rounded border">
                          <strong>{app.id}</strong> - {app.applicant}
                          <Badge variant="outline" className="ml-2">
                            {app.status}
                          </Badge>
                          {app.createdBy === user.id && (
                            <Badge variant="secondary" className="ml-1">
                              Mine
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
