"use client"

import type React from "react"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, FileText, MessageSquare, Save, LogOut, User } from "lucide-react"

// Mock data for demonstration
const mockApplications = [
  {
    id: "APP-001",
    applicantName: "John Doe",
    permitType: "Water Extraction",
    dateSubmitted: "2024-01-15",
    status: "Pending Review",
    documents: [
      { name: "Application Form.pdf", url: "/placeholder.svg?height=400&width=600&text=Application+Form" },
      { name: "Site Plan.jpg", url: "/placeholder.svg?height=400&width=600&text=Site+Plan" },
    ],
    officerComments: "Initial review completed. Awaiting environmental impact assessment.",
    location: "Harare North",
    contactNumber: "+263 77 123 4567",
  },
  {
    id: "APP-002",
    applicantName: "Jane Smith",
    permitType: "Borehole Drilling",
    dateSubmitted: "2024-01-18",
    status: "Pending Review",
    documents: [
      { name: "Drilling Permit.pdf", url: "/placeholder.svg?height=400&width=600&text=Drilling+Permit" },
      { name: "Geological Survey.pdf", url: "/placeholder.svg?height=400&width=600&text=Geological+Survey" },
    ],
    officerComments: "Documentation complete. Ready for chairperson review.",
    location: "Chitungwiza",
    contactNumber: "+263 77 987 6543",
  },
]

function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - in real app this would validate credentials
    if (username === "chairperson" && password === "password") {
      await signIn("credentials", { username, password, redirect: false })
    } else {
      alert("Invalid credentials. Use: chairperson/password")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>UMSCC Permit System</CardTitle>
          <CardDescription>Sign in to access the chairperson dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>
              Username: <strong>chairperson</strong>
            </p>
            <p>
              Password: <strong>password</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ChairpersonDashboard() {
  const { data: session, status } = useSession()
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(new Set())

  const handleMarkReviewed = (applicationId: string) => {
    setReviewedApplications((prev) => new Set([...prev, applicationId]))
    // In real app, this would make an API call to save the review status
    console.log(`Application ${applicationId} marked as reviewed`)
  }

  const openDocument = (url: string, name: string) => {
    // In real app, this would open the actual document
    window.open(url, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chairperson Dashboard</h1>
              <p className="text-sm text-gray-600">Upper Manyame Subcatchment Council</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{session?.user?.name || "Chairperson"}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockApplications.length}</div>
              <p className="text-xs text-muted-foreground">Applications awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewedApplications.size}</div>
              <p className="text-xs text-muted-foreground">Applications reviewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications Requiring Review</CardTitle>
            <CardDescription>Applications submitted by permitting officers for your review</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Permit Type</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.id}</TableCell>
                    <TableCell>{application.applicantName}</TableCell>
                    <TableCell>{application.permitType}</TableCell>
                    <TableCell>{application.dateSubmitted}</TableCell>
                    <TableCell>
                      <Badge variant={reviewedApplications.has(application.id) ? "default" : "secondary"}>
                        {reviewedApplications.has(application.id) ? "Reviewed" : application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[600px] sm:w-[800px]">
                          <SheetHeader>
                            <SheetTitle>Application Details - {selectedApplication?.id}</SheetTitle>
                            <SheetDescription>
                              Review application details and mark as reviewed when complete
                            </SheetDescription>
                          </SheetHeader>

                          {selectedApplication && (
                            <div className="mt-6 space-y-6">
                              {/* Application Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Applicant Name</Label>
                                  <p className="text-sm text-gray-900">{selectedApplication.applicantName}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Permit Type</Label>
                                  <p className="text-sm text-gray-900">{selectedApplication.permitType}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Location</Label>
                                  <p className="text-sm text-gray-900">{selectedApplication.location}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Contact Number</Label>
                                  <p className="text-sm text-gray-900">{selectedApplication.contactNumber}</p>
                                </div>
                              </div>

                              {/* Documents Section */}
                              <div>
                                <Label className="text-sm font-medium mb-3 block">Uploaded Documents</Label>
                                <div className="space-y-2">
                                  {selectedApplication.documents.map((doc: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm">{doc.name}</span>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openDocument(doc.url, doc.name)}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Officer Comments */}
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Permitting Officer Comments</Label>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                                    <p className="text-sm text-gray-700">{selectedApplication.officerComments}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Review Section */}
                              <div className="border-t pt-4">
                                <div className="flex items-center space-x-2 mb-4">
                                  <Checkbox
                                    id={`review-${selectedApplication.id}`}
                                    checked={reviewedApplications.has(selectedApplication.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleMarkReviewed(selectedApplication.id)
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`review-${selectedApplication.id}`} className="text-sm font-medium">
                                    Application reviewed and approved
                                  </Label>
                                </div>

                                <Button className="w-full" disabled={!reviewedApplications.has(selectedApplication.id)}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Review Status
                                </Button>
                              </div>
                            </div>
                          )}
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginForm />
  }

  return <ChairpersonDashboard />
}
