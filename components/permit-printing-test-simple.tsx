"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EnhancedPermitPrinter } from "./enhanced-permit-printer"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import { db } from "@/lib/database"
import { FileText, Eye, CheckCircle, AlertCircle, TestTube, Printer } from "lucide-react"
import type { PermitApplication, User } from "@/types"

interface PermitPrintingTestSimpleProps {
  user: User
}

export function PermitPrintingTestSimple({ user }: PermitPrintingTestSimpleProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [selectedApp, setSelectedApp] = useState<PermitApplication | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const apps = await db.getApplications()
      setApplications(apps)

      // Find an approved application for testing
      const approvedApp = apps.find((app) => app.status === "approved")
      if (approvedApp) {
        setSelectedApp(approvedApp)
        addTestResult("✅ Found approved application for testing")
      } else {
        addTestResult("⚠️ No approved applications found")
      }
    } catch (error) {
      addTestResult(`❌ Error loading applications: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults((prev) => [`${timestamp}: ${result}`, ...prev.slice(0, 9)]) // Keep last 10 results
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
      setShowPreview(true)
      addTestResult("✅ Print preview opened successfully")
    } catch (error) {
      addTestResult(`❌ Print preview test failed: ${error}`)
    }
  }

  const testUserPermissions = () => {
    const canPrint = ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
    const status = canPrint ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED"
    addTestResult(`${status} - Current user: ${user.userType.toUpperCase()}`)
  }

  const simulatePrint = () => {
    if (!selectedApp) {
      addTestResult("❌ No application selected for printing")
      return
    }

    try {
      // Simulate the print process
      const permitData = preparePermitData(selectedApp)
      addTestResult("🖨️ Print simulation started...")
      addTestResult("📄 Generating permit document...")
      addTestResult("✅ Print simulation completed successfully")

      // In a real scenario, this would open the browser's print dialog
      setTimeout(() => {
        addTestResult("🎯 Print dialog would open in real implementation")
      }, 1000)
    } catch (error) {
      addTestResult(`❌ Print simulation failed: ${error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Permit Printing Test Suite</h2>
          <p className="text-gray-600">Test permit printing and preview functionality</p>
        </div>
        <Badge
          variant={["permitting_officer", "permit_supervisor", "ict"].includes(user.userType) ? "default" : "secondary"}
        >
          {["permitting_officer", "permit_supervisor", "ict"].includes(user.userType) ? "Authorized User" : "View Only"}
        </Badge>
      </div>

      {/* Test Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Test Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadApplications} disabled={isLoading} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Reload Applications ({applications.length})
            </Button>
            <Button onClick={testPermitDataGeneration} disabled={!selectedApp}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Data Generation
            </Button>
            <Button onClick={testPrintPreview} disabled={!selectedApp}>
              <Eye className="h-4 w-4 mr-2" />
              Test Preview
            </Button>
            <Button onClick={testUserPermissions}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Check Permissions
            </Button>
            <Button onClick={simulatePrint} disabled={!selectedApp} variant="default">
              <Printer className="h-4 w-4 mr-2" />
              Simulate Print
            </Button>
          </div>

          {/* Selected Application Info */}
          {selectedApp && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Application:</strong> {selectedApp.applicationId} - {selectedApp.applicantName}
                <Badge className="ml-2" variant={selectedApp.status === "approved" ? "default" : "secondary"}>
                  {selectedApp.status}
                </Badge>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
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

      {/* Live Permit Printing Component */}
      {selectedApp && (
        <Card>
          <CardHeader>
            <CardTitle>Live Permit Printer</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedPermitPrinter application={selectedApp} user={user} />
          </CardContent>
        </Card>
      )}

      {/* Application Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Available Applications for Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedApp?.id === app.id ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
                }`}
                onClick={() => {
                  setSelectedApp(app)
                  addTestResult(`📋 Selected application: ${app.applicationId}`)
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{app.applicationId}</h4>
                  <Badge variant={app.status === "approved" ? "default" : "secondary"} className="text-xs">
                    {app.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{app.applicantName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {app.numberOfBoreholes} boreholes • {app.waterAllocation}ML
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permit Preview Modal */}
      {showPreview && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Permit Preview</h3>
                <Button onClick={() => setShowPreview(false)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
              <div className="border rounded-lg p-4">
                <PermitTemplate permitData={preparePermitData(selectedApp)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
