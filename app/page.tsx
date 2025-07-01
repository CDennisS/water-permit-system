"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { FileText, Users, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"

// Mock data for testing
const mockApplications = [
  {
    id: "1",
    applicationId: "APP-2024-001",
    applicantName: "John Doe",
    physicalAddress: "123 Main Street, Harare",
    postalAddress: "P.O. Box 123, Harare",
    customerAccountNumber: "ACC-001",
    cellularNumber: "+263771234567",
    permitType: "urban" as const,
    waterSource: "ground_water" as const,
    waterAllocation: 100,
    landSize: 50,
    gpsLatitude: -17.8292,
    gpsLongitude: 31.0522,
    status: "approved" as const,
    currentStage: 4,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    submittedAt: new Date("2024-01-15"),
    approvedAt: new Date("2024-01-20"),
    documents: [],
    comments: [],
    intendedUse: "Domestic water supply",
    boreholes: [
      {
        id: "1",
        name: "BH-001",
        depth: 45,
        diameter: 6,
        yieldRate: 2.5,
        staticWaterLevel: 12,
        pumpingWaterLevel: 18,
        coordinates: { latitude: -17.8292, longitude: 31.0522 },
      },
    ],
  },
  {
    id: "2",
    applicationId: "APP-2024-002",
    applicantName: "Sarah Johnson",
    physicalAddress: "456 Oak Avenue, Bulawayo",
    postalAddress: "P.O. Box 456, Bulawayo",
    customerAccountNumber: "ACC-002",
    cellularNumber: "+263771234568",
    permitType: "irrigation" as const,
    waterSource: "surface_water" as const,
    waterAllocation: 200,
    landSize: 100,
    gpsLatitude: -20.1619,
    gpsLongitude: 28.5906,
    status: "approved" as const,
    currentStage: 4,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-05"),
    submittedAt: new Date("2024-02-01"),
    approvedAt: new Date("2024-02-05"),
    documents: [],
    comments: [],
    intendedUse: "Agricultural irrigation",
    boreholes: [
      {
        id: "2",
        name: "BH-002",
        depth: 60,
        diameter: 8,
        yieldRate: 5.0,
        staticWaterLevel: 15,
        pumpingWaterLevel: 22,
        coordinates: { latitude: -20.1619, longitude: 28.5906 },
      },
    ],
  },
  {
    id: "3",
    applicationId: "APP-2024-003",
    applicantName: "Michael Smith",
    physicalAddress: "789 Pine Street, Mutare",
    postalAddress: "P.O. Box 789, Mutare",
    customerAccountNumber: "ACC-003",
    cellularNumber: "+263771234569",
    permitType: "industrial" as const,
    waterSource: "ground_water" as const,
    waterAllocation: 500,
    landSize: 200,
    gpsLatitude: -18.9707,
    gpsLongitude: 32.6731,
    status: "approved" as const,
    currentStage: 4,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
    submittedAt: new Date("2024-01-10"),
    approvedAt: new Date("2024-01-25"),
    documents: [],
    comments: [],
    intendedUse: "Manufacturing process water",
    boreholes: [
      {
        id: "3",
        name: "BH-003",
        depth: 80,
        diameter: 10,
        yieldRate: 8.0,
        staticWaterLevel: 20,
        pumpingWaterLevel: 28,
        coordinates: { latitude: -18.9707, longitude: 32.6731 },
      },
    ],
  },
  {
    id: "4",
    applicationId: "APP-2024-004",
    applicantName: "Emma Wilson",
    physicalAddress: "321 Cedar Road, Gweru",
    postalAddress: "P.O. Box 321, Gweru",
    customerAccountNumber: "ACC-004",
    cellularNumber: "+263771234570",
    permitType: "urban" as const,
    waterSource: "ground_water" as const,
    waterAllocation: 75,
    landSize: 30,
    gpsLatitude: -19.4543,
    gpsLongitude: 29.8154,
    status: "submitted" as const,
    currentStage: 2,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
    submittedAt: new Date("2024-02-10"),
    approvedAt: null,
    documents: [],
    comments: [],
    intendedUse: "Residential water supply",
    boreholes: [],
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "submitted":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800"
    case "submitted":
      return "bg-blue-100 text-blue-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-yellow-100 text-yellow-800"
  }
}

export default function HomePage() {
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  const handlePreviewPermit = (application: any) => {
    setSelectedApplication(application)
    setPreviewDialogOpen(true)
  }

  const approvedApplications = mockApplications.filter((app) => app.status === "approved")
  const submittedApplications = mockApplications.filter((app) => app.status === "submitted")
  const totalApplications = mockApplications.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img src="/placeholder-logo.svg" alt="UMSCC Logo" className="h-10 w-10 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UMSCC Permit Management System</h1>
                <p className="text-sm text-gray-600">Upper Manyame Sub Catchment Council</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-700 border-green-300">
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Water Permit Management System</h2>
          <p className="text-lg text-gray-600">
            Manage water permit applications, track workflow progress, and generate official permits.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground">All permit applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedApplications.length}</div>
              <p className="text-xs text-muted-foreground">Ready for permit printing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{submittedApplications.length}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((approvedApplications.length / totalApplications) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Application approval rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Overview of all water permit applications in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Applications</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.applicationId}</TableCell>
                        <TableCell>{application.applicantName}</TableCell>
                        <TableCell className="capitalize">{application.permitType.replace("_", " ")}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(application.status)}
                            <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{application.submittedAt?.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {application.status === "approved" && (
                              <Button size="sm" onClick={() => handlePreviewPermit(application)}>
                                Preview Permit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Approved Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.applicationId}</TableCell>
                        <TableCell>{application.applicantName}</TableCell>
                        <TableCell className="capitalize">{application.permitType.replace("_", " ")}</TableCell>
                        <TableCell>{application.approvedAt?.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button size="sm" onClick={() => handlePreviewPermit(application)}>
                              Preview Permit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead>Date Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.applicationId}</TableCell>
                        <TableCell>{application.applicantName}</TableCell>
                        <TableCell className="capitalize">{application.permitType.replace("_", " ")}</TableCell>
                        <TableCell>Stage {application.currentStage}</TableCell>
                        <TableCell>{application.submittedAt?.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Permit Preview Dialog */}
      {selectedApplication && (
        <PermitPreviewDialog
          application={selectedApplication}
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
        />
      )}
    </div>
  )
}
