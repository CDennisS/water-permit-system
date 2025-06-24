"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Comments & Review History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span>Loading comments...</span>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-lg border ${
                        comment.isRejectionReason ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">{getUserTypeLabel(comment.userType)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Stage {comment.stage}
                          </Badge>
                          {comment.isRejectionReason && (
                            <Badge variant="destructive" className="text-xs">
                              REJECTION REASON
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{comment.createdAt.toLocaleString()}</span>
                      </div>
                      <p className="text-gray-800 leading-relaxed">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No comments available for this application</p>
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
              <div className="flex flex-wrap gap-4">
                {canPrintPermit() && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Permit Approved - Ready to Print</p>
                      <PermitPrinter application={application} />
                    </div>
                  </div>
                )}

                {canPrintComments() && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">
                        {application.status === "rejected"
                          ? "Application Rejected - Print Rejection Notice"
                          : "Print Comments Report"}
                      </p>
                      <CommentsPrinter application={application} user={user} />
                    </div>
                  </div>
                )}

                {!canPrintPermit() && !canPrintComments() && (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Eye className="h-5 w-5" />
                    <p>Application is under review - No printing actions available yet</p>
                  </div>
                )}
              </div>

              {application.status === "rejected" && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="font-semibold text-red-800">Application Rejected</p>
                  </div>
                  <p className="text-red-700 text-sm">
                    This application has been rejected during the review process. Use the "Print Comments" button above
                    to generate a rejection notice with all review comments for the applicant.
                  </p>
                </div>
              )}

              {application.status === "approved" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-800">Application Approved</p>
                  </div>
                  <p className="text-green-700 text-sm">
                    This application has been fully approved and is ready for permit printing. Use the "Print Permit"
                    button above to generate the official permit document.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
