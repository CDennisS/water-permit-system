"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, FileText, CheckCircle, Clock, XCircle } from "lucide-react"
import type { User, PermitApplication } from "@/types"

interface DashboardApplicationsProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (application: PermitApplication) => void
  onViewApplication: (application: PermitApplication) => void
}

// Mock applications data
const mockApplications: PermitApplication[] = [
  {
    id: "1",
    applicationNumber: "APP-2024-001",
    applicantName: "John Doe",
    applicantId: "63-123456-A-01",
    physicalAddress: "123 Main Street, Harare",
    postalAddress: "P.O. Box 123, Harare",
    landSize: 50,
    numberOfBoreholes: 2,
    waterAllocation: 100,
    intendedUse: "Domestic water supply",
    gpsLatitude: -17.8216,
    gpsLongitude: 31.0492,
    status: "approved",
    submittedAt: new Date("2024-01-15"),
    approvedAt: new Date("2024-01-20"),
    documents: [],
    comments: [],
    workflowStage: "permit_issued",
  },
  {
    id: "2",
    applicationNumber: "APP-2024-002",
    applicantName: "Sarah Johnson",
    applicantId: "63-789012-B-02",
    physicalAddress: "456 Oak Avenue, Chitungwiza",
    postalAddress: "P.O. Box 456, Chitungwiza",
    landSize: 100,
    numberOfBoreholes: 1,
    waterAllocation: 200,
    intendedUse: "Agricultural irrigation",
    gpsLatitude: -18.0178,
    gpsLongitude: 31.0747,
    status: "under_review",
    submittedAt: new Date("2024-02-01"),
    documents: [],
    comments: [],
    workflowStage: "technical_review",
  },
  {
    id: "3",
    applicationNumber: "APP-2024-003",
    applicantName: "Michael Smith",
    applicantId: "63-345678-C-03",
    physicalAddress: "789 Pine Street, Epworth",
    postalAddress: "P.O. Box 789, Epworth",
    landSize: 200,
    numberOfBoreholes: 3,
    waterAllocation: 500,
    intendedUse: "Industrial manufacturing",
    gpsLatitude: -17.89,
    gpsLongitude: 31.1473,
    status: "submitted",
    submittedAt: new Date("2024-02-10"),
    documents: [],
    comments: [],
    workflowStage: "application_submitted",
  },
]

export function DashboardApplications({
  user,
  onNewApplication,
  onEditApplication,
  onViewApplication,
}: DashboardApplicationsProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading applications
    const timer = setTimeout(() => {
      setApplications(mockApplications)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "under_review":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "submitted":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "under_review":
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">Draft</Badge>
    }
  }

  const canEdit = (application: PermitApplication) => {
    return application.status === "draft" || application.status === "submitted"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading applications...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {applications.filter((app) => app.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter((app) => app.status === "under_review").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {applications.filter((app) => app.status === "submitted").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Manage your water permit applications</CardDescription>
            </div>
            <Button onClick={onNewApplication}>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application Number</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Intended Use</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.applicationNumber}</TableCell>
                  <TableCell>{application.applicantName}</TableCell>
                  <TableCell>{application.intendedUse}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(application.status)}
                      {getStatusBadge(application.status)}
                    </div>
                  </TableCell>
                  <TableCell>{application.submittedAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewApplication(application)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit(application) && (
                        <Button variant="ghost" size="sm" onClick={() => onEditApplication(application)}>
                          <Edit className="h-4 w-4" />
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
    </div>
  )
}
