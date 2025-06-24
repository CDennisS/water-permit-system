"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import type { PermitApplication, User as PermitUser } from "@/types"
import { PermitPrinter } from "./permit-printer"

interface ApplicationDetailsProps {
  user: PermitUser
  application: PermitApplication
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ user, application }) => {
  const formatDate = (date: Date) => new Intl.DateTimeFormat("en-ZA").format(date)
  const canPrint = application.status === "approved" && user.userType === "permitting_officer"

  const StatusIcon = () => {
    switch (application.status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const Field = ({ label, value, span = false }: { label: string; value: string | number; span?: boolean }) => (
    <div className={`${span ? "col-span-2" : ""} border-b border-gray-200 pb-1 mb-2`}>
      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-900 font-medium">{value}</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Official Header */}
      <div className="bg-blue-900 text-white p-4 text-center border-b-4 border-yellow-400">
        <h1 className="text-lg font-bold">REPUBLIC OF SOUTH AFRICA</h1>
        <p className="text-sm">DEPARTMENT OF WATER AND SANITATION</p>
        <p className="text-xs opacity-90">Upper Molopo Sub-Catchment Committee</p>
      </div>

      {/* Document Title & Reference */}
      <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-gray-900">WATER USE PERMIT APPLICATION</h2>
          <p className="text-xs text-gray-600">Form GW7B - Water Use License Application</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">APPLICATION REF</div>
          <div className="text-lg font-bold text-blue-900">{application.applicationId}</div>
          <div className="flex items-center space-x-1 mt-1">
            <StatusIcon />
            <Badge
              className={`text-xs px-2 py-0.5 ${
                application.status === "approved"
                  ? "bg-green-600"
                  : application.status === "rejected"
                    ? "bg-red-600"
                    : "bg-blue-600"
              } text-white`}
            >
              {application.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Print Section */}
      {canPrint && (
        <div className="bg-green-50 border-l-4 border-green-600 p-2 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">APPROVED - READY FOR PRINTING</span>
          </div>
          <PermitPrinter application={application} />
        </div>
      )}

      {/* Main Form Content */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
            {/* Row 1 */}
            <Field label="Applicant Name" value={application.applicantName} span />
            <Field label="Account No." value={application.customerAccountNumber} />
            <Field label="Contact" value={application.cellularNumber} />

            {/* Row 2 */}
            <Field label="Physical Address" value={application.physicalAddress} span />
            <Field label="Permit Type" value={application.permitType} span />

            {/* Row 3 */}
            <Field label="Postal Address" value={application.postalAddress} span />
            <Field label="Intended Use" value={application.intendedUse} span />

            {/* Row 4 */}
            <Field label="Water Allocation" value={`${application.waterAllocation} m³/day`} />
            <Field label="Validity Period" value={`${application.validityPeriod} years`} />
            <Field label="Land Size" value={`${application.landSize} ha`} />
            <Field label="Boreholes" value={application.numberOfBoreholes} />

            {/* Row 5 */}
            <Field label="GPS Latitude" value={`${application.gpsLatitude}°`} />
            <Field label="GPS Longitude" value={`${application.gpsLongitude}°`} />
            <Field label="Water Source" value={application.waterSource} span />

            {/* Row 6 - Dates */}
            <Field label="Date Created" value={formatDate(application.createdAt)} />
            <Field
              label="Date Submitted"
              value={application.submittedAt ? formatDate(application.submittedAt) : "N/A"}
            />
            <Field label="Last Updated" value={formatDate(application.updatedAt)} />
            <Field
              label={
                application.status === "approved"
                  ? "Date Approved"
                  : application.status === "rejected"
                    ? "Date Rejected"
                    : "Current Stage"
              }
              value={
                application.status === "approved" && application.approvedAt
                  ? formatDate(application.approvedAt)
                  : application.status === "rejected" && application.rejectedAt
                    ? formatDate(application.rejectedAt)
                    : `Stage ${application.currentStage}`
              }
            />

            {/* Comments if present */}
            {application.comments && (
              <div className="col-span-4 border-t border-gray-300 pt-2 mt-2">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Additional Comments
                </div>
                <div className="text-sm text-gray-900">{application.comments}</div>
              </div>
            )}

            {/* Water Source Details if present */}
            {application.waterSourceDetails && (
              <div className="col-span-4 border-t border-gray-300 pt-2 mt-2">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Water Source Details
                </div>
                <div className="text-sm text-gray-900">{application.waterSourceDetails}</div>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div
            className={`mt-4 p-2 rounded border-l-4 text-sm ${
              application.status === "approved"
                ? "bg-green-50 border-green-600 text-green-800"
                : application.status === "rejected"
                  ? "bg-red-50 border-red-600 text-red-800"
                  : "bg-blue-50 border-blue-600 text-blue-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusIcon />
                <span className="font-medium">
                  {application.status === "approved" && "Application Approved - Permit Ready for Issuance"}
                  {application.status === "rejected" && "Application Rejected - See Comments for Details"}
                  {application.status === "under_review" &&
                    `Under Review - Currently at Stage ${application.currentStage}`}
                  {application.status === "submitted" && "Application Submitted - Awaiting Initial Review"}
                </span>
              </div>
              {user.userType === "permitting_officer" && application.status === "approved" && (
                <span className="text-xs font-medium">OFFICIAL PRINTING AVAILABLE</span>
              )}
            </div>
          </div>

          {/* ICT Debug Info */}
          {user.userType === "ict" && (
            <div className="mt-2 p-1 bg-gray-100 border border-dashed border-gray-400 text-xs text-gray-600">
              User: {user.userType} | Status: {application.status} | Print: {canPrint ? "Yes" : "No"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { ApplicationDetails }
export default ApplicationDetails
