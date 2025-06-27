"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  FileText,
  Download,
  Eye,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  FileCheck,
  ArrowLeft,
  Hash,
  Briefcase,
} from "lucide-react"
import type { PermitApplication, ActivityLog, ApplicationDocument } from "@/types"
import { db } from "@/lib/database"
import { PermitPrinter } from "./permit-printer"

interface ComprehensiveApplicationDetailsProps {
  application: PermitApplication
  user: any
  onBack: () => void
  onStatusUpdate?: () => void
}

const statusColors = {
  unsubmitted: "bg-orange-100 text-orange-800 border-orange-200",
  draft: "bg-orange-100 text-orange-800 border-orange-200",
  submitted: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  under_review: "bg-purple-100 text-purple-800 border-purple-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
}

const statusIcons = {
  unsubmitted: <FileText className="h-4 w-4" />,
  draft: <FileText className="h-4 w-4" />,
  submitted: <Clock className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
  under_review: <Eye className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
}

export function ComprehensiveApplicationDetails({
  application,
  user,
  onBack,
  onStatusUpdate,
}: ComprehensiveApplicationDetailsProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [applicationDocuments, setApplicationDocuments] = useState<ApplicationDocument[]>([])
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplicationData()
  }, [application.id])

  const loadApplicationData = async () => {
    try {
      setLoading(true)
      const [logs, docs] = await Promise.all([
        db.getActivityLogs(application.id),
        db.getApplicationDocuments(application.id),
      ])
      setActivityLogs(logs || [])
      setApplicationDocuments(docs || [])
    } catch (error) {
      console.error("Error loading application data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string, comments: string) => {
    if (!comments.trim()) {
      alert("Please provide comments for this action.")
      return
    }

    setIsSubmitting(true)
    try {
      await db.updateApplication(application.id, {
        status: newStatus,
        currentStage: newStatus === "approved" ? 5 : newStatus === "rejected" ? 6 : application.currentStage + 1,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: `Application ${newStatus}`,
        details: comments,
        applicationId: application.id,
      })

      alert(`Application ${newStatus} successfully!`)
      onStatusUpdate?.()
    } catch (error) {
      console.error("Error updating application:", error)
      alert("Error updating application. Please try again.")
    } finally {
      setIsSubmitting(false)
      setComments("")
    }
  }

  const handleDocumentDownload = async (doc: ApplicationDocument) => {
    try {
      // Create a temporary link and trigger download
      const link = window.document.createElement("a")
      link.href = doc.fileUrl
      link.download = doc.fileName
      link.target = "_blank"
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading document:", error)
      alert("Error downloading document. Please try again.")
    }
  }

  const canApproveReject = () => {
    return (
      (user.userType === "chairman" && application.status === "submitted") ||
      (user.userType === "catchment_manager" && application.status === "pending") ||
      (user.userType === "permit_supervisor" && application.status === "under_review")
    )
  }

  const canPrintPermit = () => {
    return (
      application.status === "approved" &&
      (user.userType === "permitting_officer" || user.userType === "permit_supervisor" || user.userType === "ict")
    )
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj)
  }

  const getWorkflowStage = () => {
    const stages = [
      { stage: 1, title: "Application Created", status: "completed" },
      { stage: 2, title: "Submitted to Chairman", status: application.currentStage >= 2 ? "completed" : "pending" },
      { stage: 3, title: "Chairman Review", status: application.currentStage >= 3 ? "completed" : "pending" },
      { stage: 4, title: "Catchment Manager Review", status: application.currentStage >= 4 ? "completed" : "pending" },
      { stage: 5, title: "Final Approval", status: application.currentStage >= 5 ? "completed" : "pending" },
    ]
    return stages
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading application details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{application.applicationId}</h1>
            <p className="text-gray-600">Application Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={statusColors[application.status]} variant="outline">
            {statusIcons[application.status]}
            <span className="ml-1 capitalize">{application.status.replace("_", " ")}</span>
          </Badge>
          <Badge variant="outline">Stage {application.currentStage}</Badge>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Application Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Application Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-blue-600" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-gray-900 font-medium">{application.applicantName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                    <p className="text-gray-900 font-medium">{application.customerAccountNumber}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Physical Address</Label>
                  <p className="text-gray-900">{application.physicalAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="text-gray-900">{application.cellularNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-gray-900">{application.emailAddress || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permit Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                  Permit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Permit Type</Label>
                    <p className="text-gray-900 font-medium capitalize">{application.permitType.replace("_", " ")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Water Source</Label>
                    <p className="text-gray-900 font-medium capitalize">{application.waterSource.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Water Allocation</Label>
                    <p className="text-gray-900 font-medium">{application.waterAllocation} ML</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Land Size</Label>
                    <p className="text-gray-900 font-medium">{application.landSize} hectares</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Intended Use</Label>
                  <p className="text-gray-900">{application.intendedUse}</p>
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-600" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">GPS Coordinates X</Label>
                    <p className="text-gray-900 font-mono">{application.gpsCoordinatesX}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">GPS Coordinates Y</Label>
                    <p className="text-gray-900 font-mono">{application.gpsCoordinatesY}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nearest Landmark</Label>
                  <p className="text-gray-900">{application.nearestLandmark || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Application Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Application Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p className="text-gray-900">{formatDate(application.createdAt)}</p>
                </div>
                {application.submittedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                    <p className="text-gray-900">{formatDate(application.submittedAt)}</p>
                  </div>
                )}
                {application.approvedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Approved</Label>
                    <p className="text-gray-900">{formatDate(application.approvedAt)}</p>
                  </div>
                )}
                {application.rejectedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Rejected</Label>
                    <p className="text-gray-900">{formatDate(application.rejectedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Application Documents ({applicationDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationDocuments.length > 0 ? (
                <div className="space-y-4">
                  {applicationDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {doc.fileType} • {Math.round(doc.fileSize / 1024)} KB
                          </p>
                          <p className="text-xs text-gray-500">Uploaded: {formatDate(doc.uploadedAt)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(doc.fileUrl, "_blank")}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDocumentDownload(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                  Workflow Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getWorkflowStage().map((stage, index) => (
                    <div key={stage.stage} className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          stage.status === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {stage.status === "completed" ? <CheckCircle className="h-4 w-4" /> : stage.stage}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${stage.status === "completed" ? "text-green-800" : "text-gray-600"}`}
                        >
                          {stage.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                  Available Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canApproveReject() && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="comments" className="text-sm font-medium">
                        Comments *
                      </Label>
                      <Textarea
                        id="comments"
                        placeholder="Enter your comments for this action..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleStatusUpdate("approved", comments)}
                        disabled={isSubmitting || !comments.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Processing..." : "Approve"}
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate("rejected", comments)}
                        disabled={isSubmitting || !comments.trim()}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Processing..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Permit Preview and Print for Approved Applications */}
                {application.status === "approved" && user.userType === "permitting_officer" && (
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Permit Actions</h4>
                    <div className="space-y-2">
                      <PermitPrinter application={application} user={user} />
                    </div>
                  </div>
                )}

                {!canApproveReject() && application.status !== "approved" && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {application.status === "unsubmitted" || application.status === "draft"
                        ? "Application needs to be submitted before it can be reviewed."
                        : `This application is currently at stage ${application.currentStage} and cannot be actioned by your role.`}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-purple-600" />
                Activity Log ({activityLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex space-x-3 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Hash className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{log.action}</p>
                          <p className="text-sm text-gray-500">{formatDate(log.createdAt)}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {log.userType.replace("_", " ").toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No activity recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
