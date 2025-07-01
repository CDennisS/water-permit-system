"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, FileText, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import type { Application } from "@/types"

// Mock data for testing
const mockApplications: Application[] = [
  {
    id: "1",
    applicationId: "APP-2024-001",
    applicantName: "John Doe",
    physicalAddress: "123 Main Street, Harare",
    customerAccountNumber: "ACC-001",
    cellularNumber: "+263771234567",
    permitType: "urban",
    waterSource: "ground_water",
    waterAllocation: 100,
    landSize: 50,
    gpsLatitude: -17.8216,
    gpsLongitude: 31.0492,
    status: "approved",
    currentStage: 4,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    submittedAt: new Date("2024-01-15"),
    approvedAt: new Date("2024-01-20"),
    documents: [],
    comments: [],
    intendedUse: "Domestic water supply for residential use",
  },
  {
    id: "2",
    applicationId: "APP-2024-002",
    applicantName: "Sarah Johnson",
    physicalAddress: "456 Oak Avenue, Chitungwiza",
    customerAccountNumber: "ACC-002",
    cellularNumber: "+263771234568",
    permitType: "irrigation",
    waterSource: "surface_water",
    waterAllocation: 200,
    landSize: 100,
    gpsLatitude: -18.0178,
    gpsLongitude: 31.0747,
    status: "approved",
    currentStage: 4,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-05"),
    submittedAt: new Date("2024-02-01"),
    approvedAt: new Date("2024-02-05"),
    documents: [],
    comments: [],
    intendedUse: "Agricultural irrigation for crop production",
  },
  {
    id: "3",
    applicationId: "APP-2024-003",
    applicantName: "Michael Smith",
    physicalAddress: "789 Pine Street, Epworth",
    customerAccountNumber: "ACC-003",
    cellularNumber: "+263771234569",
    permitType: "industrial",
    waterSource: "ground_water",
    waterAllocation: 500,
    landSize: 200,
    gpsLatitude: -17.89,
    gpsLongitude: 31.1473,
    status: "approved",
    currentStage: 4,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
    submittedAt: new Date("2024-01-10"),
    approvedAt: new Date("2024-01-25"),
    documents: [],
    comments: [],
    intendedUse: "Industrial manufacturing process water",
  },
  {
    id: "4",
    applicationId: "APP-2024-004",
    applicantName: "Emily Davis",
    physicalAddress: "321 Cedar Road, Mbare",
    customerAccountNumber: "ACC-004",
    cellularNumber: "+263771234570",
    permitType: "urban",
    waterSource: "surface_water",
    waterAllocation: 75,
    landSize: 30,
    gpsLatitude: -17.8634,
    gpsLongitude: 31.0297,
    status: "submitted",
    currentStage: 2,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
    submittedAt: new Date("2024-02-10"),
    approvedAt: null,
    documents: [],
    comments: [],
    intendedUse: "Domestic water supply",
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "submitted":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
    case "submitted":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Submitted</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
    default:
      return <Badge variant="secondary">Draft</Badge>
  }
}

export default function HomePage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setApplications(mockApplications)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handlePreviewPermit = (application: Application) => {
    setSelectedApplication(application)
    setShowPreview(true)
  }

  const approvedCount = applications.filter((app) => app.status === "approved").length
  const submittedCount = applications.filter((app) => app.status === "submitted").length
  const totalCount = applications.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading UMSCC Permit Management System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">UMSCC Permit Management System</h1>
              <p className="mt-1 text-sm text-gray-500">
                Upper Manyame Sub Catchment Council - Water Permit Applications
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                System Status: Online
              </Badge>
              <Badge variant="outline" className="text-sm">
                Version 2.1.0
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">All permit applications in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Permits</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Ready for permit printing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{submittedCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval workflow</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Overview of water permit applications and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Permit Type</TableHead>
                  <TableHead>Water Allocation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.applicationId}</TableCell>
                    <TableCell>{application.applicantName}</TableCell>
                    <TableCell className="capitalize">{application.permitType.replace("_", " ")}</TableCell>
                    <TableCell>{application.waterAllocation} m³/month</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(application.status)}
                        {getStatusBadge(application.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("Viewing application:", application.applicationId)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {application.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewPermit(application)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Preview Permit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current system status and deployment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Deployment Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <Badge variant="outline">Production Ready</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Features Available</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Application Management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Document Upload & Viewing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Workflow Management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Permit Printing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Reports & Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permit Preview Dialog */}
      {selectedApplication && (
        <PermitPreviewDialog application={selectedApplication} open={showPreview} onOpenChange={setShowPreview} />
      )}
    </div>
  )
}
