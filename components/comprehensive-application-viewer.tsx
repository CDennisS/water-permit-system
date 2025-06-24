"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Droplets,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Eye,
} from "lucide-react"
import type { User as UserType, PermitApplication, WorkflowComment } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"
import { CommentsPrinter } from "./comments-printer"
import { PermitPrinter } from "./permit-printer"

interface ComprehensiveApplicationViewerProps {
  user: UserType
  application: PermitApplication
  isOpen: boolean
  onClose: () => void
}

export function ComprehensiveApplicationViewer({
  user,
  application,
  isOpen,
  onClose,
}: ComprehensiveApplicationViewerProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [loading, setLoading] = useState(false)
  const [showCommentsPreview, setShowCommentsPreview] = useState(false)

  useEffect(() => {
    if (isOpen && application) {
      loadComments()
    }
  }, [isOpen, application])

  const loadComments = async () => {
    setLoading(true)
    try {
      const appComments = await db.getCommentsByApplication(application.id)
      // Sort comments by creation date (oldest first)
      appComments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      setComments(appComments)
    } catch (error) {
      console.error("Failed to load comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (application.status === "approved") {
      return (
        <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
          <CheckCircle className="h-5 w-5 mr-2" />
          APPROVED
        </Badge>
      )
    }
    if (application.status === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">
          <XCircle className="h-5 w-5 mr-2" />
          REJECTED
        </Badge>
      )
    }
    if (application.status === "under_review") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2">
          <Clock className="h-5 w-5 mr-2" />
          UNDER REVIEW
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="text-lg px-4 py-2">
        {application.status.toUpperCase()}
      </Badge>
    )
  }

  const getStageLabel = (stage: number) => {
    const stages = {
      1: "Permitting Officer",
      2: "Upper Manyame Sub Catchment Council Chairperson",
      3: "Manyame Catchment Manager",
      4: "Manyame Catchment Chairperson",
    }
    return stages[stage as keyof typeof stages] || `Stage ${stage}`
  }

  const canPrintPermit = () => {
    return application.status === "approved" && user.userType === "permitting_officer"
  }

  const canPrintComments = () => {
    return (application.status === "rejected" || comments.length > 0) && user.userType === "permitting_officer"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <span>Application Details: {application.applicationId}</span>
            </div>
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Status and Stage */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Current Stage</p>
                  <p className="text-lg font-bold text-blue-900">
                    Stage {application.currentStage}: {getStageLabel(application.currentStage)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-800">Application Status</p>
                  <p className="text-lg font-bold text-blue-900">{application.status.toUpperCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Full Name</p>
                      <p className="font-semibold">{application.applicantName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cellular Number</p>
                      <p className="font-semibold">{application.cellularNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer Account</p>
                      <p className="font-semibold">{application.customerAccountNumber || "N/A"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Physical Address</p>
                      <p className="font-semibold">{application.physicalAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Postal Address</p>
                      <p className="font-semibold">{application.postalAddress || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permit Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Droplets className="h-5 w-5 mr-2" />
                Permit Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Permit Type</p>
                  <Badge variant="outline" className="mt-1">
                    {application.permitType.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Water Source</p>
                  <p className="font-semibold capitalize">{application.waterSource}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Intended Use</p>
                  <p className="font-semibold">{application.intendedUse}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Number of Boreholes</p>
                  <p className="font-semibold">{application.numberOfBoreholes}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Land Size</p>
                  <p className="font-semibold">{application.landSize} hectares</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Water Allocation</p>
                  <p className="font-semibold text-blue-600">{application.waterAllocation.toLocaleString()} ML/annum</p>
                </div>
              </div>

              {(application.gpsLatitude || application.gpsLongitude) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">GPS Coordinates</p>
                  <p className="font-semibold">
                    Latitude: {application.gpsLatitude?.toFixed(6) || "N/A"}, Longitude:{" "}
                    {application.gpsLongitude?.toFixed(6) || "N/A"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Created Date</p>
                  <p className="font-semibold">{application.createdAt.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="font-semibold">{application.updatedAt.toLocaleString()}</p>
                </div>
                {application.approvedAt && (
                  <div>
                    <p className="text-sm font-medium text-green-600">Approved Date</p>
                    <p className="font-semibold text-green-800">{application.approvedAt.toLocaleString()}</p>
                  </div>
                )}
                {application.rejectedAt && (
                  <div>
                    <p className="text-sm font-medium text-red-600">Rejected Date</p>
                    <p className="font-semibold text-red-800">{application.rejectedAt.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments and Review History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Comments & Review History
                </div>
                {application.status === "rejected" && comments.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowCommentsPreview(true)} className="ml-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Comments Report
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span>Loading comments...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Workflow Progress Indicator */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold mb-3 text-gray-800">Workflow Progress</h4>
                    <div className="space-y-3">
                      {[
                        { stage: 1, title: "Permitting Officer Review", userType: "permitting_officer" },
                        { stage: 2, title: "Chairperson Review", userType: "chairperson" },
                        { stage: 3, title: "Catchment Manager Review", userType: "catchment_manager" },
                        { stage: 4, title: "Catchment Chairperson Review", userType: "catchment_chairperson" },
                      ].map((step) => {
                        const stageComments = comments.filter((c) => c.stage === step.stage)
                        const hasComments = stageComments.length > 0
                        const isRejected = stageComments.some((c) => c.isRejectionReason)

                        return (
                          <div key={step.stage} className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                isRejected
                                  ? "bg-red-100 text-red-800 border-2 border-red-300"
                                  : hasComments
                                    ? "bg-green-100 text-green-800 border-2 border-green-300"
                                    : application.currentStage >= step.stage
                                      ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                                      : "bg-gray-100 text-gray-500 border-2 border-gray-300"
                              }`}
                            >
                              {step.stage}
                            </div>
                            <div className="flex-1">
                              <p
                                className={`font-medium ${
                                  isRejected ? "text-red-800" : hasComments ? "text-green-800" : "text-gray-600"
                                }`}
                              >
                                {step.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {isRejected
                                  ? "Rejected with comments"
                                  : hasComments
                                    ? "Completed with comments"
                                    : application.currentStage >= step.stage
                                      ? "In progress"
                                      : "Pending"}
                              </p>
                            </div>
                            {isRejected && <XCircle className="h-5 w-5 text-red-600" />}
                            {hasComments && !isRejected && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {!hasComments && application.currentStage >= step.stage && (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Detailed Comments */}
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Detailed Comments</h4>
                      {comments.map((comment, index) => (
                        <div
                          key={comment.id}
                          className={`p-4 rounded-lg border-l-4 ${
                            comment.isRejectionReason
                              ? "bg-red-50 border-red-400 border border-red-200"
                              : "bg-blue-50 border-blue-400 border border-blue-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    comment.isRejectionReason ? "bg-red-200 text-red-800" : "bg-blue-200 text-blue-800"
                                  }`}
                                >
                                  {comment.stage}
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {getUserTypeLabel(comment.userType)}
                                </span>
                              </div>
                              {comment.isRejectionReason && (
                                <Badge variant="destructive" className="text-xs">
                                  REJECTION REASON
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{comment.createdAt.toLocaleString()}</span>
                          </div>
                          <div
                            className={`p-3 rounded ${comment.isRejectionReason ? "bg-white border border-red-100" : "bg-white border border-blue-100"}`}
                          >
                            <p className="text-gray-800 leading-relaxed">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No comments available for this application</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Comments will appear here as the application progresses through the workflow
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2" />
                Available Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {canPrintPermit() && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-xl font-bold text-green-800">✅ Permit Approved & Ready for Printing</h3>
                        <p className="text-green-700 text-lg">
                          This application has been fully approved through all workflow stages and is ready for official
                          permit printing.
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white text-lg px-4 py-2 ml-auto">APPROVED</Badge>
                    </div>

                    {/* Prominent Print Buttons */}
                    <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-4 text-lg">🖨️ Permit Printing Options</h4>
                      <PermitPrinter application={application} />
                    </div>
                  </div>
                )}

                {canPrintComments() && !canPrintPermit() && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800">
                          {application.status === "rejected"
                            ? "Application Rejected - Print Rejection Notice"
                            : "Print Comments Report"}
                        </h3>
                        <p className="text-blue-700">
                          {application.status === "rejected"
                            ? "Generate a professional rejection notice with all review comments for the applicant."
                            : "Print a comprehensive report of all comments and review history."}
                        </p>
                      </div>
                    </div>
                    <CommentsPrinter application={application} user={user} />
                  </div>
                )}

                {!canPrintPermit() && !canPrintComments() && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <Eye className="h-6 w-6 text-gray-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">Application Under Review</h3>
                        <p className="text-gray-600">
                          This application is currently being reviewed. Printing actions will become available once the
                          review process is complete.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Information Cards */}
              <div className="mt-6 space-y-4">
                {application.status === "approved" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="font-semibold text-green-800">Application Approved</p>
                    </div>
                    <p className="text-green-700 text-sm">
                      This application has been fully approved and is ready for permit printing. The permit can be
                      printed immediately using the buttons above.
                    </p>
                    {application.approvedAt && (
                      <p className="text-green-600 text-xs mt-2">
                        Approved on: {application.approvedAt.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {application.status === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <p className="font-semibold text-red-800">Application Rejected</p>
                    </div>
                    <p className="text-red-700 text-sm">
                      This application has been rejected during the review process. Use the "Print Comments" button
                      above to generate a rejection notice with all review comments for the applicant.
                    </p>
                    {application.rejectedAt && (
                      <p className="text-red-600 text-xs mt-2">
                        Rejected on: {application.rejectedAt.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {application.status === "under_review" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <p className="font-semibold text-yellow-800">Application Under Review</p>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      This application is currently at Stage {application.currentStage} of the review process. Printing
                      actions will become available once the review is complete.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Print Preview Dialog */}
        <Dialog open={showCommentsPreview} onOpenChange={setShowCommentsPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comments Report Preview - {application.applicationId}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-end space-x-2 no-print">
                <Button
                  onClick={() => {
                    const printWindow = window.open("", "_blank")
                    if (printWindow) {
                      const previewElement = document.getElementById("comments-print-preview")
                      if (previewElement) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>Comments Report - ${application.applicationId}</title>
                              <style>
                                body { 
                                  margin: 0; 
                                  padding: 20px; 
                                  font-family: 'Times New Roman', serif; 
                                  line-height: 1.6;
                                  color: #000;
                                  font-size: 12px;
                                }
                                @media print {
                                  body { margin: 0; padding: 15px; }
                                  .no-print { display: none; }
                                  .page-break { page-break-before: always; }
                                }
                                .header { 
                                  text-align: center; 
                                  margin-bottom: 30px; 
                                  border-bottom: 3px solid #000;
                                  padding-bottom: 20px;
                                }
                                .header h1 { 
                                  margin: 0; 
                                  font-size: 20px; 
                                  font-weight: bold;
                                  text-transform: uppercase;
                                }
                                .header h2 { 
                                  margin: 10px 0 0 0; 
                                  font-size: 16px; 
                                  font-weight: normal;
                                }
                                .rejection-notice {
                                  background-color: #fef2f2;
                                  border: 3px solid #dc2626;
                                  padding: 20px;
                                  margin: 20px 0;
                                  text-align: center;
                                  border-radius: 8px;
                                }
                                .rejection-notice h3 {
                                  color: #dc2626;
                                  font-size: 18px;
                                  font-weight: bold;
                                  margin: 0 0 10px 0;
                                }
                                .application-info {
                                  margin-bottom: 25px;
                                  padding: 15px;
                                  border: 2px solid #000;
                                  background-color: #f9f9f9;
                                }
                                .application-info h3 {
                                  margin-top: 0;
                                  font-size: 14px;
                                  font-weight: bold;
                                  text-transform: uppercase;
                                  border-bottom: 1px solid #000;
                                  padding-bottom: 5px;
                                }
                                .info-grid {
                                  display: grid;
                                  grid-template-columns: 1fr 1fr;
                                  gap: 10px;
                                  margin-top: 10px;
                                }
                                .info-item {
                                  margin-bottom: 8px;
                                }
                                .info-label {
                                  font-weight: bold;
                                  margin-bottom: 3px;
                                  font-size: 11px;
                                }
                                .info-value {
                                  font-size: 12px;
                                }
                                .workflow-section {
                                  margin: 25px 0;
                                }
                                .workflow-section h3 {
                                  font-size: 16px;
                                  font-weight: bold;
                                  margin-bottom: 15px;
                                  border-bottom: 2px solid #000;
                                  padding-bottom: 8px;
                                  text-transform: uppercase;
                                }
                                .workflow-step {
                                  margin-bottom: 20px;
                                  padding: 15px;
                                  border: 1px solid #ccc;
                                  background-color: #f9f9f9;
                                }
                                .workflow-step.rejected {
                                  border-color: #dc2626;
                                  background-color: #fef2f2;
                                }
                                .step-header {
                                  display: flex;
                                  justify-content: space-between;
                                  align-items: center;
                                  margin-bottom: 10px;
                                  font-weight: bold;
                                  border-bottom: 1px solid #ddd;
                                  padding-bottom: 5px;
                                }
                                .step-title {
                                  font-size: 13px;
                                  font-weight: bold;
                                }
                                .step-date {
                                  font-size: 10px;
                                  color: #666;
                                }
                                .step-comment {
                                  font-size: 12px;
                                  line-height: 1.5;
                                  margin-top: 8px;
                                  padding: 8px;
                                  background-color: white;
                                  border-left: 4px solid #3b82f6;
                                }
                                .step-comment.rejection {
                                  border-left-color: #dc2626;
                                }
                                .rejection-badge {
                                  background-color: #dc2626;
                                  color: white;
                                  padding: 2px 6px;
                                  border-radius: 3px;
                                  font-size: 9px;
                                  font-weight: bold;
                                }
                                .footer {
                                  margin-top: 40px;
                                  text-align: center;
                                  font-size: 10px;
                                  color: #666;
                                  border-top: 2px solid #000;
                                  padding-top: 15px;
                                }
                              </style>
                            </head>
                            <body>
                              ${previewElement.innerHTML}
                            </body>
                          </html>
                        `)
                        printWindow.document.close()
                        printWindow.print()
                      }
                    }
                  }}
                  variant="outline"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>

              <div id="comments-print-preview" className="bg-white p-6 border rounded-lg">
                <div className="header">
                  <h1>Application Review Comments Report</h1>
                  <h2>Upper Manyame Sub Catchment Council</h2>
                  <h2>Water Permit Management System</h2>
                </div>

                {application.status === "rejected" && (
                  <div className="rejection-notice">
                    <h3>⚠️ APPLICATION REJECTED ⚠️</h3>
                    <p>This application has been rejected during the review process</p>
                    <p>
                      <strong>Application ID:</strong> {application.applicationId}
                    </p>
                    <p>
                      <strong>Rejection Date:</strong> {application.rejectedAt?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                )}

                <div className="application-info">
                  <h3>Applicant Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Application ID:</div>
                      <div className="info-value">{application.applicationId}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Applicant Name:</div>
                      <div className="info-value">{application.applicantName}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Physical Address:</div>
                      <div className="info-value">{application.physicalAddress}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Cellular Number:</div>
                      <div className="info-value">{application.cellularNumber}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Permit Type:</div>
                      <div className="info-value">{application.permitType.replace("_", " ").toUpperCase()}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Water Source:</div>
                      <div className="info-value">{application.waterSource.toUpperCase()}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Intended Use:</div>
                      <div className="info-value">{application.intendedUse}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Water Allocation:</div>
                      <div className="info-value">{application.waterAllocation.toLocaleString()} ML/annum</div>
                    </div>
                  </div>
                </div>

                <div className="workflow-section">
                  <h3>Review Workflow & Comments</h3>

                  {[
                    { stage: 1, title: "Stage 1: Permitting Officer Review", userType: "permitting_officer" },
                    { stage: 2, title: "Stage 2: Chairperson Review", userType: "chairperson" },
                    { stage: 3, title: "Stage 3: Catchment Manager Review", userType: "catchment_manager" },
                    { stage: 4, title: "Stage 4: Catchment Chairperson Review", userType: "catchment_chairperson" },
                  ].map((step) => {
                    const stageComments = comments.filter((c) => c.stage === step.stage)
                    const hasComments = stageComments.length > 0
                    const isRejected = stageComments.some((c) => c.isRejectionReason)

                    return (
                      <div key={step.stage} className={`workflow-step ${isRejected ? "rejected" : ""}`}>
                        <div className="step-header">
                          <div className="step-title">
                            {step.title}
                            {isRejected && <span className="rejection-badge ml-2">REJECTED</span>}
                          </div>
                          <div className="step-date">
                            {hasComments ? stageComments[0].createdAt.toLocaleString() : "No comments"}
                          </div>
                        </div>

                        {hasComments ? (
                          stageComments.map((comment, idx) => (
                            <div key={idx} className={`step-comment ${comment.isRejectionReason ? "rejection" : ""}`}>
                              <strong>{getUserTypeLabel(comment.userType)}:</strong>
                              <br />
                              {comment.comment}
                              {comment.isRejectionReason && (
                                <div
                                  style={{ marginTop: "5px", fontSize: "10px", color: "#dc2626", fontWeight: "bold" }}
                                >
                                  *** REJECTION REASON ***
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="step-comment" style={{ fontStyle: "italic", color: "#666" }}>
                            No comments provided for this stage
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="footer">
                  <p>
                    <strong>Report Generated:</strong> {new Date().toLocaleString()}
                  </p>
                  <p>Upper Manyame Sub Catchment Council - Water Permit Management System</p>
                  <p>This is an official document containing the complete review history for the above application.</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
