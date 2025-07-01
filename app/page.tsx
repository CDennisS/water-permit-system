"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { FileText, Users, CheckCircle, Clock, AlertCircle, Plus, Search, Filter, Download } from "lucide-react"
import type { PermitApplication, User } from "@/types"

// Mock data for demonstration
const mockUser: User = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  userType: "permitting_officer",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockApplications: PermitApplication[] = [
  {
    id: "1",
    applicantName: "ABC Farming Ltd",
    applicantEmail: "contact@abcfarming.com",
    physicalAddress: "Plot 123, Harare North",
    postalAddress: "P.O. Box 456, Harare",
    landSize: 50,
    numberOfBoreholes: 3,
    waterAllocation: 15,
    intendedUse: "irrigation",
    gpsLatitude: -17.8252,
    gpsLongitude: 31.0335,
    status: "approved",
    permitNumber: "UMSCC-2024-01-0001",
    submittedAt: new Date("2024-01-15"),
    approvedAt: new Date("2024-01-20"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-20"),
    documents: [],
    comments: [],
  },
  {
    id: "2",
    applicantName: "XYZ Mining Corp",
    applicantEmail: "permits@xyzmining.com",
    physicalAddress: "Mine Site 789, Mazowe",
    landSize: 200,
    numberOfBoreholes: 5,
    waterAllocation: 50,
    intendedUse: "mining",
    gpsLatitude: -17.5087,
    gpsLongitude: 30.9756,
    status: "under_review",
    submittedAt: new Date("2024-01-18"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-18"),
    documents: [],
    comments: [],
  },
  {
    id: "3",
    applicantName: "Green Valley Estates",
    applicantEmail: "info@greenvalley.co.zw",
    physicalAddress: "Subdivision A, Borrowdale",
    landSize: 25,
    numberOfBoreholes: 2,
    waterAllocation: 8,
    intendedUse: "domestic",
    gpsLatitude: -17.7669,
    gpsLongitude: 31.107,
    status: "permit_issued",
    permitNumber: "UMSCC-2024-01-0002",
    submittedAt: new Date("2024-01-12"),
    approvedAt: new Date("2024-01-17"),
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-17"),
    documents: [],
    comments: [],
  },
]

export default function HomePage() {
  const [selectedTab, setSelectedTab] = useState("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "permit_issued":
        return "bg-green-100 text-green-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "permit_issued":
        return <CheckCircle className="h-4 w-4" />
      case "under_review":
        return <Clock className="h-4 w-4" />
      case "rejected":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">UMSCC Permit Management System</h1>
              <p className="text-gray-600 mt-1">Upper Manyame Sub Catchment Council - Water Permit Management</p>
            </div>
            <div className="flex items-center gap-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">Online now</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Recent Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Current status of the permit management system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">System Status</h3>
                      <p className="text-sm text-gray-600">All services operational</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Database</h3>
                      <p className="text-sm text-gray-600">Connected and synchronized</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Backup Status</h3>
                      <p className="text-sm text-gray-600">Last backup: 2 hours ago</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Up to date</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>Latest permit applications in the system</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">{getStatusIcon(application.status)}</div>
                        <div>
                          <h3 className="font-semibold">{application.applicantName}</h3>
                          <p className="text-sm text-gray-600">{application.physicalAddress}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{application.numberOfBoreholes} boreholes</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{application.waterAllocation} ML/year</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace("_", " ")}
                        </Badge>
                        {(application.status === "approved" || application.status === "permit_issued") && (
                          <PermitPreviewDialog application={application} currentUser={mockUser} />
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Trends</CardTitle>
                  <CardDescription>Monthly application submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Chart placeholder - Application trends over time
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Approval Rates</CardTitle>
                  <CardDescription>Success rates by application type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Chart placeholder - Approval rates by category
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
