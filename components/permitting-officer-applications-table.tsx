"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PermitPreviewDialog } from "./permit-preview-dialog"
import { db } from "@/lib/database"
import {
  Filter,
  Eye,
  FileText,
  Calendar,
  User,
  MapPin,
  Droplets,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"

interface PermittingOfficerApplicationsTableProps {
  currentUser: UserType
}

export function PermittingOfficerApplicationsTable({ currentUser }: PermittingOfficerApplicationsTableProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const data = await db.getApplications()
      console.log("Loaded applications:", data)
      setApplications(data)
    } catch (error) {
      console.error("Error loading applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.physicalAddress.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, icon: FileText, label: "Draft" },
      pending: { variant: "default" as const, icon: Clock, label: "Pending" },
      under_review: { variant: "default" as const, icon: Eye, label: "Under Review" },
      technical_review: { variant: "default" as const, icon: AlertCircle, label: "Technical Review" },
      approved: { variant: "default" as const, icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected" },
      permit_issued: { variant: "default" as const, icon: CheckCircle, label: "Permit Issued" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getApplicationsByStatus = (status: string) => {
    return filteredApplications.filter((app) => app.status === status)
  }

  const ApplicationDetailsDialog = ({ application }: { application: PermitApplication }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application Details - {application.applicationId}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Applicant Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="font-medium">{application.applicantName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Account</label>
                  <p className="font-medium">{application.customerAccountNumber || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="font-medium">{application.cellularNumber || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(application.status)}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Property Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Physical Address</label>
                  <p className="font-medium">{application.physicalAddress}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Postal Address</label>
                  <p className="font-medium">{application.postalAddress || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Land Size</label>
                  <p className="font-medium">{application.landSize} hectares</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">GPS Coordinates</label>
                  <p className="font-medium">
                    {application.gpsLatitude}, {application.gpsLongitude}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Water Extraction Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Water Extraction Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Water Source</label>
                  <p className="font-medium capitalize">{application.waterSource.replace("_", " ")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Intended Use</label>
                  <p className="font-medium">{application.intendedUse}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Number of Boreholes</label>
                  <p className="font-medium">{application.numberOfBoreholes}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Water Allocation</label>
                  <p className="font-medium">{application.waterAllocation.toLocaleString()} m³/annum</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="font-medium">{application.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="font-medium">{application.updatedAt.toLocaleDateString()}</p>
                </div>
                {application.submittedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted</label>
                    <p className="font-medium">{application.submittedAt.toLocaleDateString()}</p>
                  </div>
                )}
                {application.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Approved</label>
                    <p className="font-medium">{application.approvedAt.toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )

  const ApplicationRow = ({ application }: { application: PermitApplication }) => (
    <TableRow key={application.id}>
      <TableCell className="font-medium">{application.applicationId}</TableCell>
      <TableCell>{application.applicantName}</TableCell>
      <TableCell>{application.intendedUse}</TableCell>
      <TableCell>{application.waterAllocation.toLocaleString()} m³</TableCell>
      <TableCell>{getStatusBadge(application.status)}</TableCell>
      <TableCell>{application.updatedAt.toLocaleDateString()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ApplicationDetailsDialog application={application} />
          {(application.status === "approved" || application.status === "permit_issued") && (
            <PermitPreviewDialog
              application={application}
              currentUser={currentUser}
              onPrint={() => console.log("Print permit for", application.applicationId)}
              onDownload={() => console.log("Download permit for", application.applicationId)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Applications...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Permit Applications</h2>
        <p className="text-muted-foreground">Manage and review water permit applications</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by applicant name, application ID, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="technical_review">Technical Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="permit_issued">Permit Issued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Applications ({filteredApplications.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({getApplicationsByStatus("draft").length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({getApplicationsByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({getApplicationsByStatus("approved").length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({getApplicationsByStatus("rejected").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>Complete list of all permit applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Intended Use</TableHead>
                    <TableHead>Water Allocation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((application) => (
                      <ApplicationRow key={application.id} application={application} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardHeader>
              <CardTitle>Draft Applications</CardTitle>
              <CardDescription>Applications that have not been submitted yet</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Intended Use</TableHead>
                    <TableHead>Water Allocation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getApplicationsByStatus("draft").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No draft applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getApplicationsByStatus("draft").map((application) => (
                      <ApplicationRow key={application.id} application={application} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>Applications awaiting review and approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Intended Use</TableHead>
                    <TableHead>Water Allocation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getApplicationsByStatus("pending").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No pending applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getApplicationsByStatus("pending").map((application) => (
                      <ApplicationRow key={application.id} application={application} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Applications</CardTitle>
              <CardDescription>Applications that have been approved and are ready for permit issuance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Intended Use</TableHead>
                    <TableHead>Water Allocation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getApplicationsByStatus("approved").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No approved applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getApplicationsByStatus("approved").map((application) => (
                      <ApplicationRow key={application.id} application={application} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications</CardTitle>
              <CardDescription>Applications that have been rejected with reasons</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Intended Use</TableHead>
                    <TableHead>Water Allocation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getApplicationsByStatus("rejected").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No rejected applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getApplicationsByStatus("rejected").map((application) => (
                      <ApplicationRow key={application.id} application={application} />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
