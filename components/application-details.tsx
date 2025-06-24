"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react"
import type { PermitApplication, User as PermitUser } from "@/types"
import { PermitPrinter } from "./permit-printer"

interface ApplicationDetailsProps {
  user: PermitUser
  application: PermitApplication
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ user, application }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "under_review":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-600 text-white"
      case "rejected":
        return "bg-red-600 text-white"
      case "under_review":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  const canPrintPermit = () => {
    return application.status === "approved" && user.userType === "permitting_officer"
  }

  const InfoRow = ({ label, value, className = "" }: { label: string; value: string | number; className?: string }) => (
    <tr className="border-b border-gray-100">
      <td className="py-2 px-3 text-xs font-medium text-gray-600 bg-gray-50 w-1/3">{label}</td>
      <td className={`py-2 px-3 text-sm text-gray-900 ${className}`}>{value}</td>
    </tr>
  )

  return (
    <div className="max-w-5xl mx-auto">
      {/* Official Government Header */}
      <Card className="mb-4 border-t-4 border-t-blue-800">
        <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 text-white py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">REPUBLIC OF SOUTH AFRICA</CardTitle>
              <p className="text-sm opacity-90">Department of Water and Sanitation</p>
              <p className="text-xs opacity-80">Upper Molopo Sub-Catchment Committee</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">APPLICATION REFERENCE</p>
              <p className="text-xl font-bold">{application.applicationId}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">WATER USE PERMIT APPLICATION DETAILS</h2>
            <div className="flex items-center space-x-2">
              {getStatusIcon(application.status)}
              <Badge className={`${getStatusColor(application.status)} text-xs px-2 py-1`}>
                {application.status.replace("_", " ").toUpperCase()}
              </Badge>
              <span className="text-xs text-gray-500">STAGE {application.currentStage}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Section - Compact */}
      {canPrintPermit() && (
        <Card className="mb-4 border-l-4 border-l-green-600">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">PERMIT APPROVED - READY FOR OFFICIAL PRINTING</span>
              </div>
              <PermitPrinter application={application} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Applicant Information */}
          <Card>
            <CardHeader className="py-2 bg-gray-100 border-b">
              <CardTitle className="text-sm font-semibold text-gray-800">APPLICANT INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  <InfoRow label="FULL NAME" value={application.applicantName} className="font-semibold" />
                  <InfoRow label="ACCOUNT NUMBER" value={application.customerAccountNumber} className="font-mono" />
                  <InfoRow label="CONTACT NUMBER" value={application.cellularNumber} />
                  <InfoRow label="PHYSICAL ADDRESS" value={application.physicalAddress} />
                  <InfoRow label="POSTAL ADDRESS" value={application.postalAddress} />
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader className="py-2 bg-gray-100 border-b">
              <CardTitle className="text-sm font-semibold text-gray-800">PROPERTY DETAILS</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  <InfoRow label="LAND SIZE" value={`${application.landSize} hectares`} />
                  <InfoRow label="NUMBER OF BOREHOLES" value={application.numberOfBoreholes} />
                  <InfoRow label="GPS LATITUDE" value={`${application.gpsLatitude}°`} className="font-mono" />
                  <InfoRow label="GPS LONGITUDE" value={`${application.gpsLongitude}°`} className="font-mono" />
                  <InfoRow label="WATER SOURCE" value={application.waterSource} />
                  {application.waterSourceDetails && (
                    <InfoRow label="SOURCE DETAILS" value={application.waterSourceDetails} />
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Permit Specifications */}
          <Card>
            <CardHeader className="py-2 bg-gray-100 border-b">
              <CardTitle className="text-sm font-semibold text-gray-800">PERMIT SPECIFICATIONS</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  <InfoRow label="PERMIT TYPE" value={application.permitType} className="font-semibold" />
                  <InfoRow label="INTENDED USE" value={application.intendedUse} />
                  <InfoRow
                    label="WATER ALLOCATION"
                    value={`${application.waterAllocation} m³/day`}
                    className="font-semibold text-blue-700"
                  />
                  <InfoRow label="VALIDITY PERIOD" value={`${application.validityPeriod} years`} />
                  <InfoRow
                    label="ANNUAL ALLOCATION"
                    value={`${(application.waterAllocation * 365).toLocaleString()} m³/annum`}
                  />
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card>
            <CardHeader className="py-2 bg-gray-100 border-b">
              <CardTitle className="text-sm font-semibold text-gray-800">APPLICATION TIMELINE</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  <InfoRow label="DATE CREATED" value={formatDate(application.createdAt)} className="font-mono" />
                  {application.submittedAt && (
                    <InfoRow label="DATE SUBMITTED" value={formatDate(application.submittedAt)} className="font-mono" />
                  )}
                  <InfoRow label="LAST UPDATED" value={formatDate(application.updatedAt)} className="font-mono" />
                  {application.approvedAt && (
                    <InfoRow
                      label="DATE APPROVED"
                      value={formatDate(application.approvedAt)}
                      className="font-mono font-semibold text-green-700"
                    />
                  )}
                  {application.rejectedAt && (
                    <InfoRow
                      label="DATE REJECTED"
                      value={formatDate(application.rejectedAt)}
                      className="font-mono font-semibold text-red-700"
                    />
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card
            className={`border-l-4 ${
              application.status === "approved"
                ? "border-l-green-600 bg-green-50"
                : application.status === "rejected"
                  ? "border-l-red-600 bg-red-50"
                  : "border-l-blue-600 bg-blue-50"
            }`}
          >
            <CardContent className="py-3">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(application.status)}
                <span className="font-semibold text-sm">
                  {application.status === "approved" && "APPLICATION APPROVED"}
                  {application.status === "rejected" && "APPLICATION REJECTED"}
                  {application.status === "under_review" && `UNDER REVIEW - STAGE ${application.currentStage}`}
                  {application.status === "submitted" && "SUBMITTED - AWAITING REVIEW"}
                </span>
              </div>
              <p className="text-xs text-gray-700">
                {application.status === "approved" &&
                  "Permit approved through all workflow stages. Ready for issuance."}
                {application.status === "rejected" &&
                  "Application rejected during review process. See comments for details."}
                {application.status === "under_review" &&
                  "Application currently under review by appropriate authority."}
                {application.status === "submitted" && "Application submitted and awaiting initial review."}
              </p>
              {user.userType === "permitting_officer" && application.status === "approved" && (
                <p className="text-xs text-green-700 font-medium mt-1">
                  OFFICIAL PERMIT DOCUMENT AVAILABLE FOR PRINTING
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comments Section */}
      {application.comments && (
        <Card className="mt-4">
          <CardHeader className="py-2 bg-gray-100 border-b">
            <CardTitle className="text-sm font-semibold text-gray-800">ADDITIONAL COMMENTS</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <p className="text-sm text-gray-700">{application.comments}</p>
          </CardContent>
        </Card>
      )}

      {/* System Information (ICT Only) */}
      {user.userType === "ict" && (
        <Card className="mt-4 border-dashed border-gray-400 bg-gray-100">
          <CardContent className="py-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>User: {user.userType.toUpperCase()}</span>
              <span>Status: {application.status.toUpperCase()}</span>
              <span>Print Access: {canPrintPermit() ? "GRANTED" : "DENIED"}</span>
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
