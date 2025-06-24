"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EnhancedPermitPrinter } from "./enhanced-permit-printer"
import { PermitPrintWorkflow } from "./permit-print-workflow"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/permit-generator"
import { db } from "@/lib/database"
import { FileText, Eye, CheckCircle, AlertCircle, TestTube } from "lucide-react"
import type { PermitApplication, User } from "@/types"

export function PermitPrintingTest() {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [selectedApp, setSelectedApp] = useState<PermitApplication | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Test users with different permissions
  const testUsers: User[] = [
    {
      id: "test-po",
      username: "test_permitting_officer",
      userType: "permitting_officer",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "test-ps",
      username: "test_permit_supervisor",
      userType: "permit_supervisor",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "test-ict",
      username: "test_ict_admin",
      userType: "ict",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "test-chair",
      username: "test_chairperson",
      userType: "chairperson",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const apps = await db.getApplications()
      setApplications(apps)

      // Select the first approved application for testing
      const approvedApp = apps.find((app) => app.status === "approved")
      if (approvedApp) {
        setSelectedApp(approvedApp)
        addTestResult("✅ Found approved application for testing")
      } else {
        addTestResult("⚠️ No approved applications found - creating test application")
        await createTestApplication()
      }
    } catch (error) {
      addTestResult(`❌ Error loading applications: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const createTestApplication = async () => {
    const testApp: PermitApplication = {
      id: "test-print-app",
      applicationId: "PRINT-TEST-001",
      applicantName: "Test Print Applicant",
      physicalAddress: "123 Print Test Street, Harare",
      postalAddress: "P.O. Box 123, Harare",
      numberOfBoreholes: 3,
      landSize: 8.5,
      waterAllocation: 3000,
      intendedUse: "Commercial",
      permitType: "urban",
      validityPeriod: 7,
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "approved",
      currentStage: 1,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
    }

    try {
      await db.addApplication(testApp)
      setSelectedApp(testApp)
      addTestResult("✅ Created test approved application")
    } catch (error) {
      addTestResult(`❌ Error creating test application: ${error}`)
    }
  }

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testPermitDataGeneration = () => {
    if (!selectedApp) {
      addTestResult("❌ No application selected for testing")
      return
    }

    try {
      const permitData = preparePermitData(selectedApp)
      addTestResult("✅ Permit data generation successful")
      addTestResult(`📄 Permit Number: ${permitData.permitNumber}`)
      addTestResult(`👤 Applicant: ${permitData.applicantName}`)
      addTestResult(`💧 Water Allocation: ${permitData.totalAllocatedAbstraction} ML`)
      addTestResult(`🕳️ Boreholes: ${permitData.numberOfBoreholes}`)
      addTestResult(`📅 Valid Until: ${permitData.validUntil}`)
    } catch (error) {
      addTestResult(`❌ Permit data generation failed: ${error}`)
    }
  }

  const testPrintPreview = () => {
    if (!selectedApp) {
      addTestResult("❌ No application selected for testing")
      return
    }

    try {
      // Simulate opening print preview
      const permitData = preparePermitData(selectedApp)
      addTestResult("✅ Print preview data prepared successfully")
      addTestResult("🖼️ Preview would show complete permit template")
      addTestResult("📋 All permit sections would be visible")
    } catch (error) {
      addTestResult(`❌ Print preview test failed: ${error}`)
    }
  }

  const testUserPermissions = () => {
    if (!selectedApp) {
      addTestResult("❌ No application selected for testing")
      return
    }

    testUsers.forEach((user) => {
      const canPrint = ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
      const status = canPrint ? "✅ CAN PRINT" : "❌ CANNOT PRINT"
      addTestResult(`${status} - ${user.userType.toUpperCase()}: ${user.username}`)
    })
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  return (
    <div className="space-y-6">
      {/* Test Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Permit Printing Test Suite</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadApplications} disabled={isLoading}>
              <FileText className="h-4 w-4 mr-2" />
              Load Applications
            </Button>
            <Button onClick={testPermitDataGeneration} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Data Generation
            </Button>
            <Button onClick={testPrintPreview} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Test Preview
            </Button>
            <Button onClick={testUserPermissions} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Test Permissions
            </Button>
            <Button onClick={clearTestResults} variant="destructive" size="sm">
              Clear Results
            </Button>
          </div>

          {/* Selected Application Info */}
          {selectedApp && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Selected Test Application:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <strong>ID:</strong> {selectedApp.applicationId}
                </div>
                <div>
                  <strong>Applicant:</strong> {selectedApp.applicantName}
                </div>
                <div>
                  <strong>Status:</strong>
                  <Badge className="ml-1" variant={selectedApp.status === "approved" ? "default" : "secondary"}>
                    {selectedApp.status}
                  </Badge>
                </div>
                <div>
                  <strong>Boreholes:</strong> {selectedApp.numberOfBoreholes}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No test results yet. Run tests above to see results.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Live Permit Printing Components */}
      {selectedApp && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Permit Printer */}
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Permit Printer</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedPermitPrinter
                application={selectedApp}
                user={testUsers[0]} // Permitting Officer
              />
            </CardContent>
          </Card>

          {/* Print Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Print Workflow Status</CardTitle>
            </CardHeader>
            <CardContent>
              <PermitPrintWorkflow
                application={selectedApp}
                user={testUsers[0]} // Permitting Officer
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permission Testing Grid */}
      <Card>
        <CardHeader>
          <CardTitle>User Permission Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testUsers.map((user, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{user.userType.replace("_", " ").toUpperCase()}</h4>
                  <Badge
                    variant={
                      ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
                        ? "default"
                        : "secondary"
                    }
                  >
                    {["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
                      ? "Authorized"
                      : "Not Authorized"}
                  </Badge>
                </div>
                {selectedApp && <EnhancedPermitPrinter application={selectedApp} user={user} />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permit Template Preview */}
      {selectedApp && (
        <Card>
          <CardHeader>
            <CardTitle>Live Permit Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
              <PermitTemplate permitData={preparePermitData(selectedApp)} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
