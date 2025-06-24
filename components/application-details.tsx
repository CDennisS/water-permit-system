"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Printer, Eye, AlertCircle } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { PermitPrinter } from "./permit-printer"

interface ApplicationDetailsProps {
  user: User
  application: PermitApplication
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ user, application }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "under_review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const canPrintPermit = () => {
    return application.status === "approved" && user.userType === "permitting_officer"
  }

  const isPermittingOfficer = () => {
    return user.userType === "permitting_officer"
  }

  return (
    <div className="space-y-6">
      {/* Header with Application ID and Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Application Details – {application.applicationId}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={`text-sm font-semibold ${getStatusColor(application.status)}`}>
                {application.status.replace("_", " ").toUpperCase()}
              </Badge>
              {isPermittingOfficer() && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  PERMITTING OFFICER
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Print Permit Section for Approved Applications - Permitting Officer Only */}
      {canPrintPermit() && (
        <Card className="border-4 border-green-400 bg-gradient-to-r from-green-50 to-green-100 shadow-lg">
          <CardHeader className="bg-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-xl">
              <CheckCircle className="h-7 w-7 mr-3" />🎉 PERMIT APPROVED - READY FOR PRINTING
            </CardTitle>
            <p className="text-green-100 mt-2">
              This application has been fully approved through all workflow stages. You can now print the official
              permit.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-white border-2 border-green-300 rounded-lg p-6 shadow-inner">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Printer className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-800">🖨️ Permit Printing Center</h3>
                    <p className="text-green-700 text-lg">Official permit document ready for generation and printing</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                    <Eye className="h-4 w-4 mr-1" />
                    READY TO PRINT
                  </Badge>
                  <p className="text-sm text-green-600 mt-1">Permitting Officer Access</p>
                </div>
              </div>

              {/* Enhanced Print Options */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />📋 Printing Instructions for Permitting Officers
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    • <strong>Print Preview:</strong> Review the complete permit before printing
                  </li>
                  <li>
                    • <strong>Direct Print:</strong> Print immediately to your default printer
                  </li>
                  <li>
                    • <strong>Download PDF:</strong> Save a digital copy for your records
                  </li>
                  <li>
                    • <strong>A4 Format:</strong> All documents are formatted for standard A4 paper
                  </li>
                </ul>
              </div>

              <PermitPrinter application={application} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message for Permitting Officers viewing non-approved applications */}
      {isPermittingOfficer() && !canPrintPermit() && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              ℹ️ Permitting Officer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {application.status === "under_review" && (
                <p className="text-blue-700">
                  🔄 <strong>Status:</strong> This application is currently under review at Stage{" "}
                  {application.currentStage}. Permit printing will be available once the application is fully approved.
                </p>
              )}
              {application.status === "rejected" && (
                <p className="text-blue-700">
                  ❌ <strong>Status:</strong> This application has been rejected. Permit printing is not available for
                  rejected applications.
                </p>
              )}
              {application.status === "submitted" && (
                <p className="text-blue-700">
                  📋 <strong>Status:</strong> This application has been submitted and is awaiting initial review. Permit
                  printing will be available after approval.
                </p>
              )}
              <p className="text-blue-600 text-sm">
                💡 <strong>Tip:</strong> Only approved applications can be printed by Permitting Officers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applicant Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-700">👤 Applicant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Applicant Name</label>
              <p className="text-lg font-semibold">{application.applicantName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Customer Account Number</label>
              <p className="text-lg font-semibold">{application.customerAccountNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Cellular Number</label>
              <p className="text-lg">{application.cellularNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Application Date</label>
              <p className="text-lg">{formatDate(application.createdAt)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Physical Address</label>
              <p className="text-base">{application.physicalAddress}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Postal Address</label>
              <p className="text-base">{application.postalAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permit Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-green-700">📋 Permit Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Permit Type</label>
              <p className="text-lg font-semibold">{application.permitType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Intended Use</label>
              <p className="text-lg">{application.intendedUse}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Water Allocation</label>
              <p className="text-lg">{application.waterAllocation} m³/day</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Validity Period</label>
              <p className="text-lg">{application.validityPeriod} years</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property & Location Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-purple-700">📍 Property & Location Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Land Size</label>
              <p className="text-lg">{application.landSize} hectares</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Number of Boreholes</label>
              <p className="text-lg">{application.numberOfBoreholes}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">GPS Coordinates</label>
              <p className="text-lg">
                Lat: {application.gpsLatitude}°, Long: {application.gpsLongitude}°
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Water Source</label>
              <p className="text-lg">{application.waterSource}</p>
            </div>
          </div>

          {application.waterSourceDetails && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-600">Water Source Details</label>
                <p className="text-base mt-1">{application.waterSourceDetails}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Application Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-700">⏰ Application Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Created Date</label>
              <p className="text-base">{formatDate(application.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Last Updated</label>
              <p className="text-base">{formatDate(application.updatedAt)}</p>
            </div>
            {application.submittedAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                <p className="text-base">{formatDate(application.submittedAt)}</p>
              </div>
            )}
            {application.approvedAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">Approved Date</label>
                <p className="text-base text-green-600 font-semibold">{formatDate(application.approvedAt)}</p>
              </div>
            )}
            {application.rejectedAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">Rejected Date</label>
                <p className="text-base text-red-600 font-semibold">{formatDate(application.rejectedAt)}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-gray-600">Current Stage</label>
            <p className="text-lg font-semibold">Stage {application.currentStage}</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Comments */}
      {application.comments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">💬 Additional Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">{application.comments}</p>
          </CardContent>
        </Card>
      )}

      {/* Status-Specific Information */}
      {application.status === "approved" && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-800 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />✅ Application Status: APPROVED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-green-700">
                🎉 <strong>Congratulations!</strong> This application has been fully approved through all workflow
                stages.
              </p>
              <p className="text-green-700">
                📅 <strong>Approved on:</strong> {application.approvedAt ? formatDate(application.approvedAt) : "N/A"}
              </p>
              {isPermittingOfficer() && (
                <p className="text-green-700">
                  🖨️ <strong>Action Available:</strong> The permit is ready for printing. Use the printing options above
                  to generate the official permit document.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {application.status === "rejected" && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-800">❌ Application Status: REJECTED</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-red-700">⚠️ This application has been rejected during the review process.</p>
              <p className="text-red-700">
                📅 <strong>Rejected on:</strong> {application.rejectedAt ? formatDate(application.rejectedAt) : "N/A"}
              </p>
              <p className="text-red-700">📄 Review the comments section for detailed rejection reasons.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {application.status === "under_review" && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-yellow-800">⏳ Application Status: UNDER REVIEW</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-yellow-700">
                🔄 This application is currently being reviewed at Stage {application.currentStage}.
              </p>
              <p className="text-yellow-700">
                📅 <strong>Last Updated:</strong> {formatDate(application.updatedAt)}
              </p>
              <p className="text-yellow-700">
                ⏰ Please wait for the review process to complete before printing options become available.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Permissions (for debugging/admin purposes) */}
      {user.userType === "ict" && (
        <Card className="border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">🔧 System Information (ICT Only)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <p>User Type: {user.userType}</p>
              <p>Can Upload: {user.userType === "permitting_officer" ? "Yes" : "No"}</p>
              <p>Can Delete: {user.userType === "permitting_officer" ? "Yes" : "No"}</p>
              <p>Is Owner: Yes</p>
              <p>Can Print Permit: {canPrintPermit() ? "Yes" : "No"}</p>
              <p>Application Status: {application.status}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* Named export for existing imports */
export { ApplicationDetails }

/* Optional: keep default export for flexibility */
export default ApplicationDetails
