"use client"
import { forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { db } from "@/lib/database"
import type { PermitApplication } from "@/types"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui"
import { Download, Plus, RefreshCw, Eye, Edit, Calendar, Send } from "lucide-react"

interface UserType {
  userType: string
}

interface DashboardApplicationsProps {
  user: UserType
  onNewApplication: () => void
  onEditApplication: (a: PermitApplication) => void
  onViewApplication: (a: PermitApplication) => void
}

export interface DashboardApplicationsHandle {
  refreshApplications: () => void
}

const DashboardApplicationsInner = forwardRef<DashboardApplicationsHandle, DashboardApplicationsProps>(
  ({ user, onNewApplication, onEditApplication, onViewApplication }, ref) => {
    const [applications, setApplications] = useState<PermitApplication[]>([])
    const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
    const [activeFiltersCount] = useState(0) // placeholder until filters are implemented

    /* -------------------- data helpers -------------------- */
    const loadApplications = async () => {
      const apps = await db.getApplications()
      setApplications(apps)
      setFilteredApplications(apps)
    }

    const exportFilteredData = () => {
      /* TODO: implement real export */
      alert("Exporting data is not yet implemented.")
    }

    useEffect(() => {
      loadApplications()
    }, [])

    useImperativeHandle(ref, () => ({
      refreshApplications: loadApplications,
    }))

    /* -------------------- rendering -------------------- */
    return (
      <div className="space-y-6">
        {/* Helpful process card for permitting officers */}
        {user.userType === "permitting_officer" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">📋 Application Submission Process</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
              <li>
                <strong>Draft</strong>: create or edit applications (status&nbsp;“unsubmitted”)
              </li>
              <li>
                <strong>Submit</strong>: use the send icon&nbsp;
                <Send className="inline h-4 w-4" />
                &nbsp;or “Submit&nbsp;All Unsubmitted” to forward applications to Stage&nbsp;2 (Chairperson)
              </li>
              <li>The system has 4 review stages – Chairperson → Catchment Manager → Catchment Chairperson</li>
            </ul>
          </div>
        )}

        {/* Header with global actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Applications Dashboard</h2>
            <p className="text-gray-600">
              Showing {filteredApplications.length} of {applications.length} applications
              {activeFiltersCount > 0 && ` (${activeFiltersCount} filters active)`}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportFilteredData}
              disabled={filteredApplications.length === 0}
              className="flex items-center gap-2"
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
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </div>
        </div>

        {/* Applications table or empty-state card */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">No applications found</h3>
              <p className="text-gray-600">
                {applications.length === 0
                  ? "Get started by creating your first permit application."
                  : "Try adjusting your filters to see more results."}
              </p>
              {applications.length === 0 && (
                <Button onClick={onNewApplication} className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Application
                </Button>
              )}
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
                    <TableHead>Application&nbsp;ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permit&nbsp;Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          {app.status.replaceAll("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.permitType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {app.createdAt.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewApplication(app)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" /> View
                          </Button>

                          {(app.status === "unsubmitted" || user.userType === "ict") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditApplication(app)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" /> Edit
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
    )
  },
)

DashboardApplicationsInner.displayName = "DashboardApplicationsInner"

export const DashboardApplications = forwardRef(DashboardApplicationsInner)
export default DashboardApplications
</merged_code>
