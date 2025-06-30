"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PermitPreviewDialog } from "./permit-preview-dialog"
import { PermitPrintWorkflow } from "./permit-print-workflow"
import { db } from "@/lib/database"
import {
  User,
  MapPin,
  Droplets,
  Calendar,
  FileText,
  MessageSquare,
  Activity,
  Eye,
  Printer,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import type { PermitApplication, User as UserType, WorkflowComment, ActivityLog } from "@/types"

interface ApplicationDetailsProps {
  application: PermitApplication
  currentUser: UserType
  onClose: () => void
}

export function ApplicationDetails({ application, currentUser, onClose }: ApplicationDetailsProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadApplicationData()
  }, [application.id])

  const loadApplicationData = async () => {
    try {
      setIsLoading(true)
      const [commentsData, logsData] = await Promise.all([
        db.getCommentsByApplication(application.id),
        db.getLogs({ applicationId: application.id }),
      ])
      setComments(commentsData)
      setLogs(logsData)
    } catch (error) {
      console.error("Error loading application data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, icon: FileText, label: "Draft", color: "bg-gray-500" },
      pending: { variant: "default" as const, icon: Clock, label: "Pending", color: "bg-blue-500" },
      under_review: { variant: "default" as const, icon: Eye, label: "Under Review", color: "bg-yellow-500" },
      technical_review: {
        variant: "default" as const,
        icon: AlertCircle,
        label: "Technical Review",
        color: "bg-orange-500",
      },
      approved: { variant: "default" as const, icon: CheckCircle, label: "Approved", color: "bg-green-500" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected", color: "bg-red-500" },
      permit_issued: { variant: "default" as const, icon: CheckCircle, label: "Permit Issued", color: "bg-green-600" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`gap-1 text-white ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const canPreviewPermit = () => {
    return (
      application.status === "approved" &&
      ["permitting_officer", "permit_supervisor", "catchment_manager", "catchment_chairperson", "ict"].includes(
        currentUser.userType,
      )
    )
  }

  const canPrintPermit = () => {
    return (
      application.status === "approved" &&
      ["permitting_officer", "permit_supervisor", "ict"].includes(currentUser.userType)
    )
  }

  console.log("ApplicationDetails - Can preview permit:", canPreviewPermit())
  console.log("ApplicationDetails - Application status:", application.status)
  console.log("ApplicationDetails - User type:", currentUser.userType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Application Details</h2>
          <p className="text-muted-foreground">Comprehensive view of permit application</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Application Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {application.applicationId}
              </CardTitle>
              <CardDescription>{application.applicantName}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(application.status)}
              <Badge variant="outline">Stage {application.currentStage}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Application Details</TabsTrigger>
          <TabsTrigger value="workflow">Workflow & Actions</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="font-medium">{application.applicantName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Account Number</label>
                  <p className="font-medium">{application.customerAccountNumber || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="font-medium">{application.cellularNumber || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Physical Address</label>
                  <p className="font-medium">{application.physicalAddress}</p>
                </div>
                <div>
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
              </CardContent>
            </Card>

            {/* Water Extraction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Water Extraction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Water Source</label>
                  <p className="font-medium capitalize">{application.waterSource?.replace("_", " ") || "N/A"}</p>
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
                  <p className="font-medium">{application.waterAllocation?.toLocaleString()} m³/annum</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="font-medium">{new Date(application.updatedAt).toLocaleDateString()}</p>
                </div>
                {application.submittedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted</label>
                    <p className="font-medium">{new Date(application.submittedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {application.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Approved</label>
                    <p className="font-medium">{new Date(application.approvedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow">
          <div className="space-y-6">
            {/* Workflow Status */}
            <PermitPrintWorkflow application={application} user={currentUser} />

            {/* Available Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Available Actions</CardTitle>
                <CardDescription>Actions you can perform on this application</CardDescription>
              </CardHeader>
              <CardContent>
                {application.status === "approved" ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">Application Approved - Actions Available</span>
                    </div>

                    {/* Permit Actions */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Permit Actions
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {/* Preview Permit Button - This is the main issue */}
                        {canPreviewPermit() && (
                          <PermitPreviewDialog
                            application={application}
                            currentUser={currentUser}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-white hover:bg-gray-50 border-green-300 text-green-700 hover:text-green-800"
                                onClick={() => {
                                  console.log("Preview Permit button clicked in ApplicationDetails")
                                  console.log("Application:", application.applicationId)
                                  console.log("User:", currentUser.username)
                                  console.log("Status:", application.status)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                Preview Permit
                              </Button>
                            }
                          />
                        )}

                        {/* Direct Print Button */}
                        {canPrintPermit() && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              console.log("Direct print clicked")
                              alert(`Printing permit for application ${application.applicationId}`)
                            }}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Printer className="h-4 w-4" />
                            Print Permit
                          </Button>
                        )}

                        {/* Download Button */}
                        {canPreviewPermit() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log("Download clicked")
                              alert(`Downloading permit for application ${application.applicationId}`)
                            }}
                            className="gap-2 bg-white hover:bg-gray-50 border-green-300 text-green-700 hover:text-green-800"
                          >
                            <Download className="h-4 w-4" />
                            Download Permit
                          </Button>
                        )}
                      </div>

                      {/* Permission Info */}
                      <div className="mt-4 p-3 bg-green-100 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Your Role:</strong> {currentUser.userType.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {canPreviewPermit()
                            ? "✅ You can preview and manage approved permits"
                            : "❌ You do not have permission to preview permits"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : application.status === "rejected" ? (
                  <div className="flex items-center space-x-2 p-4 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 font-medium">Application Rejected - No Actions Available</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">Actions will be available once application is approved</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Workflow Comments
              </CardTitle>
              <CardDescription>Comments and feedback from reviewers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : comments.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-lg border ${
                          comment.isRejectionReason ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Stage {comment.stage}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {comment.userType.replace("_", " ").toUpperCase()}
                            </Badge>
                            {comment.isRejectionReason && (
                              <Badge variant="destructive" className="text-xs">
                                REJECTION REASON
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-gray-500 py-8">No comments available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>Detailed history of all actions performed</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : logs.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{log.action}</p>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-gray-500 py-8">No activity logs available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
