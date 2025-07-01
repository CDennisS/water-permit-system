"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { FileText, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { PermitApplication, User } from "@/types"

// Mock current user
const mockCurrentUser: User = {
  id: "1",
  name: "John Doe",
  email: "john@umscc.co.zw",
  userType: "catchment_manager",
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock applications data
const mockApplications: PermitApplication[] = [
  {
    id: "1",
    applicantName: "Sarah Johnson",
    applicantEmail: "sarah@example.com",
    physicalAddress: "123 Farm Road, Harare",
    postalAddress: "P.O. Box 456, Harare",
    landSize: 50,
    numberOfBoreholes: 2,
    waterAllocation: 5.5,
    intendedUse: "irrigation",
    gpsLatitude: -17.8252,
    gpsLongitude: 31.0335,
    status: "approved",
    permitNumber: "UMSCC-2024-01-0001",
    submittedAt: new Date("2024-01-15"),
    approvedAt: new Date("2024-01-25"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-25"),
    documents: [],
    comments: [],
  },
  {
    id: "2",
    applicantName: "Michael Smith",
    applicantEmail: "michael@example.com",
    physicalAddress: "456 Agricultural Avenue, Chitungwiza",
    postalAddress: "P.O. Box 789, Chitungwiza",
    landSize: 75,
    numberOfBoreholes: 3,
    waterAllocation: 8.2,
    intendedUse: "livestock farming",
    gpsLatitude: -18.0145,
    gpsLongitude: 31.0789,
    status: "approved",
    permitNumber: "UMSCC-2024-01-0002",
    submittedAt: new Date("2024-01-20"),
    approvedAt: new Date("2024-01-30"),
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-30"),
    documents: [],
    comments: [],
  },
  {
    id: "3",
    applicantName: "Grace Mukamuri",
    applicantEmail: "grace@example.com",
    physicalAddress: "789 Industrial Park, Norton",
    landSize: 25,
    numberOfBoreholes: 1,
    waterAllocation: 3.0,
    intendedUse: "industrial",
    gpsLatitude: -17.8833,
    gpsLongitude: 30.7,
    status: "under_review",
    submittedAt: new Date("2024-02-01"),
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    documents: [],
    comments: [],
  },
  {
    id: "4",
    applicantName: "David Chikwanha",
    applicantEmail: "david@example.com",
    physicalAddress: "321 Mining Road, Kadoma",
    landSize: 100,
    numberOfBoreholes: 4,
    waterAllocation: 12.5,
    intendedUse: "mining",
    gpsLatitude: -18.3333,
    gpsLongitude: 29.9167,
    status: "rejected",
    submittedAt: new Date("2024-01-10"),
    rejectedAt: new Date("2024-01-18"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    documents: [],
    comments: [],
  },
]

export default function HomePage() {
  const [applications] = useState<PermitApplication[]>(mockApplications)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "under_review":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const stats = {
    total: applications.length,
    approved: applications.filter((app) => app.status === "approved").length,
    pending: applications.filter((app) => app.status === "under_review" || app.status === "submitted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">UMSCC Permit Management System</h1>
                <p className="text-sm text-gray-600">Upper Manyame Sub-Catchment Council</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                {mockCurrentUser.userType.replace("_", " ").toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-700">{mockCurrentUser.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to the Permit Management System</h2>
          <p className="text-lg text-gray-600 mb-6">
            Manage water permit applications for the Upper Manyame Sub-Catchment Council. Review applications, generate
            permits, and track the approval process.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Permits issued</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Applications declined</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Overview of all permit applications in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Applicant</th>
                    <th className="text-left py-3 px-4 font-medium">Location</th>
                    <th className="text-left py-3 px-4 font-medium">Land Size</th>
                    <th className="text-left py-3 px-4 font-medium">Boreholes</th>
                    <th className="text-left py-3 px-4 font-medium">Water Allocation</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{application.applicantName}</div>
                          <div className="text-sm text-gray-500">{application.applicantEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{application.physicalAddress}</div>
                      </td>
                      <td className="py-3 px-4">{application.landSize} ha</td>
                      <td className="py-3 px-4">{application.numberOfBoreholes}</td>
                      <td className="py-3 px-4">{application.waterAllocation} ML</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(application.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {application.status.replace("_", " ")}
                          </div>
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {(application.status === "approved" || application.status === "permit_issued") && (
                            <PermitPreviewDialog
                              application={application}
                              currentUser={mockCurrentUser}
                              onPrint={() => console.log("Print permit for", application.id)}
                              onDownload={() => console.log("Download permit for", application.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and system functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>New Application</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                >
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 bg-transparent"
                >
                  <AlertCircle className="h-6 w-6" />
                  <span>System Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
