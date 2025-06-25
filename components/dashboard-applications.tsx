"use client"

import { forwardRef, useImperativeHandle, useState, useEffect, type ForwardedRef } from "react"
import { db } from "@/lib/database"
import type { User, PermitApplication } from "@/types"
import { Button } from "@/components/ui/button"
import { Download, Plus, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Edit, Calendar } from "lucide-react"

interface DashboardApplicationsProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (a: PermitApplication) => void
  onViewApplication: (a: PermitApplication) => void
}

export interface DashboardApplicationsHandle {
  refreshApplications: () => void
}

function DashboardApplicationsInner(
  { user, onNewApplication, onEditApplication, onViewApplication }: DashboardApplicationsProps,
  ref: ForwardedRef<DashboardApplicationsHandle>,
) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  const loadApplications = async () => {
    const apps = await db.getApplications()
    setApplications(apps)
    setFilteredApplications(apps) // Initially, filtered applications are all applications
  }

  const exportFilteredData = () => {
    // TODO: Implement export functionality
    alert("Exporting data is not yet implemented.")
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useImperativeHandle(ref, () => ({
    refreshApplications: loadApplications,
  }))

  return (
    <div>
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications Dashboard</h2>
          <p className="text-gray-600">
            Showing {filteredApplications.length} of {applications.length} applications
            {activeFiltersCount > 0 && ` (${activeFiltersCount} filters active)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportFilteredData}
            className="flex items-center gap-2"
            disabled={filteredApplications.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={loadApplications} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={onNewApplication}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>
      {/* Applications Table */}
      <div className="mt-6">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600 mb-4">
                  {applications.length === 0
                    ? "Get started by creating your first permit application."
                    : "Try adjusting your filters to see more results."}
                </p>
                {applications.length === 0 && (
                  <Button onClick={onNewApplication} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Application
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permit Type</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.applicationId}</TableCell>
                      <TableCell>{app.applicantName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            app.status === "approved"
                              ? "default"
                              : app.status === "rejected"
                                ? "destructive"
                                : app.status === "under_review"
                                  ? "secondary"
                                  : app.status === "submitted"
                                    ? "outline"
                                    : "secondary"
                          }
                        >
                          {app.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.permitType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {app.createdAt.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewApplication(app)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          {(app.status === "unsubmitted" || user.userType === "ict") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditApplication(app)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
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
        )}
      </div>
    </div>
  )
}

export const DashboardApplications = forwardRef(DashboardApplicationsInner)
