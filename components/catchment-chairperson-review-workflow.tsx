"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, FileText, CheckCircle, XCircle, User, MapPin, Phone, Home, Droplets } from "lucide-react"
import type { PermitApplication, User as UserType, WorkflowComment, Document } from "@/types"
import { db } from "@/lib/database"
import { EnhancedDocumentViewer } from "./enhanced-document-viewer"
import { PermitPrinter } from "./permit-printer"
import { CommentsPrinter } from "./comments-printer"

interface CatchmentChairpersonReviewWorkflowProps {
  user: UserType
  application: PermitApplication
  onUpdate: () => void
}

export function CatchmentChairpersonReviewWorkflow({
  user,
  application,
  onUpdate,
}: CatchmentChairpersonReviewWorkflowProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [rejectionComment, setRejectionComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectionForm, setShowRejectionForm] = useState(false)

  useEffect(() => {
    loadApplicationData()
  }, [application.id])

  const loadApplicationData = async () => {
    // Load all comments from previous stages
    const appComments = await db.getCommentsByApplication(application.id)
    setComments(appComments)

    // Load documents
    const appDocuments = await db.getDocumentsByApplication(application.id)
    setDocuments(appDocuments)
  }

  const canMakeDecision = () => {
    return (
      user.userType === "catchment_chairperson" &&
      application.currentStage === 4 &&
      application.status === "under_review"
    )
  }

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this application?")) {
      return
    }

    setIsLoading(true)

    try {
      // Update application status to approved
      await db.updateApplication(application.id, {
        status: "approved",
        currentStage: 5, // Final stage
        approvedAt: new Date(),
      })

      // Add approval comment
      await db.addComment({
        applicationId: application.id,
        userId: user.id,
        userType: user.userType,
        stage: 4,
        comment: "Application approved by Manyame Catchment Chairperson",
        action: "approve",
      })

      // Log the approval action
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Approved Application",
        details: `Approved application ${application.applicationId}`,
        applicationId: application.id,
      })

      alert("Application approved successfully! Permit is now ready for printing.")
      onUpdate()
    } catch (error) {
      console.error("Failed to approve application:", error)
      alert("Failed to approve application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionComment.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    if (!confirm("Are you sure you want to reject this application?")) {
      return
    }

    setIsLoading(true)

    try {
      // Update application status to rejected
      await db.updateApplication(application.id, {
        status: "rejected",
        currentStage: 5, // Final stage
      })

      // Add rejection comment
      await db.addComment({
        applicationId: application.id,
        userId: user.id,
        userType: user.userType,
        stage: 4,
        comment: rejectionComment,
        action: "reject",
        isRejectionReason: true,
      })

      // Log the rejection action
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Rejected Application",
        details: `Rejected application ${application.applicationId}: ${rejectionComment}`,
        applicationId: application.id,
      })

      alert("Application rejected successfully! Rejection notice is now ready for printing.")
      onUpdate()
    } catch (error) {
      console.error("Failed to reject application:", error)
      alert("Failed to reject application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCommentsByStage = (stage: number, userType: string) => {
    return comments.filter((c) => c.stage === stage && c.userType === userType)
  }

  return (
    <div className="space-y-6">
      {/* Role Information */}
      <Alert className="border-purple-200 bg-purple-50">
        <Eye className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Manyame Catchment Chairperson:</strong> Final review and decision authority. Review all details and
          comments from previous stages, then approve or reject the application.
        </AlertDescription>
      </Alert>

      {/* Application Status */}
      {(application.status === "approved" || application.status === "rejected") && (
        <Alert
          className={application.status === "approved" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}
        >
          {application.status === "approved" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={application.status === "approved" ? "text-green-800" : "text-red-800"}>
            <strong>Decision Made:</strong> This application has been {application.status}.
            {application.status === "approved"
              ? " Permit is ready for printing."
              : " Rejection notice is ready for printing."}
          </AlertDescription>
        </Alert>
      )}

      {/* Complete Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Complete Application Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Application Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-semibold">{application.applicationId}</h3>
              <Badge variant="outline" className="mt-1">
                {application.permitType.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <Badge variant="secondary">Stage 4 - Final Decision</Badge>
          </div>

          {/* Applicant Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Applicant Information
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Full Name:</span>
                  <p className="text-gray-900">{application.applicantName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Customer Account Number:</span>
                  <p className="text-gray-900">{application.customerAccountNumber}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-600">Contact Number:</span>
                  <p className="text-gray-900">{application.cellularNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Address Information
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Physical Address:</span>
                  <p className="text-gray-900">{application.physicalAddress}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Postal Address:</span>
                  <p className="text-gray-900">{application.postalAddress}</p>
                </div>
                {(application.gpsLatitude || application.gpsLongitude) && (
                  <div>
                    <span className="font-medium text-gray-600">GPS Coordinates:</span>
                    <p className="text-gray-900">
                      Lat: {application.gpsLatitude?.toFixed(6) || "N/A"}, Lng:{" "}
                      {application.gpsLongitude?.toFixed(6) || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property & Water Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Property Details
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Land Size:</span>
                  <p className="text-gray-900">{application.landSize} hectares</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Number of Boreholes:</span>
                  <p className="text-gray-900">{application.numberOfBoreholes}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Intended Use:</span>
                  <p className="text-gray-900">{application.intendedUse}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Droplets className="h-4 w-4 mr-2" />
                Water Information
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Water Source:</span>
                  <p className="text-gray-900">{application.waterSource}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Water Source Details:</span>
                  <p className="text-gray-900">{application.waterSourceDetails}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Water Allocation:</span>
                  <p className="text-gray-900">{application.waterAllocation} ML</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Validity Period:</span>
                  <p className="text-gray-900">{application.validityPeriod} years</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments from Previous Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-600" />
            Comments from Previous Stages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permitting Officer Comments */}
          <div>
            <h5 className="font-medium mb-3 text-blue-600">Permitting Officer Comments (Stage 1)</h5>
            <div className="space-y-2">
              {getCommentsByStage(1, "permitting_officer").length > 0 ? (
                getCommentsByStage(1, "permitting_officer").map((comment) => (
                  <div key={comment.id} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        PERMITTING OFFICER
                      </Badge>
                      <span className="text-xs text-gray-500">{comment.createdAt.toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No comments from permitting officer</p>
              )}
            </div>
          </div>

          {/* Catchment Manager Comments */}
          <div>
            <h5 className="font-medium mb-3 text-green-600">Catchment Manager Comments (Stage 3)</h5>
            <div className="space-y-2">
              {getCommentsByStage(3, "catchment_manager").length > 0 ? (
                getCommentsByStage(3, "catchment_manager").map((comment) => (
                  <div key={comment.id} className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        CATCHMENT MANAGER
                      </Badge>
                      <span className="text-xs text-gray-500">{comment.createdAt.toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No comments from catchment manager</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-green-600" />
            Submitted Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <EnhancedDocumentViewer user={user} application={application} canUpload={false} canDelete={false} />
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents have been uploaded for this application</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Actions */}
      {canMakeDecision() && (
        <Card>
          <CardHeader>
            <CardTitle>Final Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Application
              </Button>

              <Button
                onClick={() => setShowRejectionForm(!showRejectionForm)}
                variant="destructive"
                className="flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Application
              </Button>
            </div>

            {/* Rejection Form */}
            {showRejectionForm && (
              <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50">
                <h5 className="font-medium text-red-800">Reason for Rejection *</h5>
                <Textarea
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this application..."
                  rows={4}
                  className="border-red-300 focus:border-red-500"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleReject}
                    disabled={isLoading || !rejectionComment.trim()}
                    variant="destructive"
                    size="sm"
                  >
                    {isLoading ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectionForm(false)
                      setRejectionComment("")
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Print Actions for Completed Applications */}
      {(application.status === "approved" || application.status === "rejected") && (
        <Card>
          <CardHeader>
            <CardTitle>Print Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.status === "approved" && (
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h5 className="font-medium text-green-600">Permit Ready for Printing</h5>
                  <p className="text-sm text-gray-600">
                    Application has been approved. Permit is now available for the Permitting Officer to print.
                  </p>
                </div>
                <PermitPrinter application={application} />
              </div>
            )}

            {application.status === "rejected" && (
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h5 className="font-medium text-red-600">Rejection Notice Ready for Printing</h5>
                  <p className="text-sm text-gray-600">
                    Application has been rejected. Rejection notice with all comments is available for printing.
                  </p>
                </div>
                <CommentsPrinter application={application} user={user} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
