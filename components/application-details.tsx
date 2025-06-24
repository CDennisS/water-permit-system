"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, FileText, MapPin, Calendar, Building, User } from "lucide-react"
import type { PermitApplication, User as PermitUser } from "@/types"
import { PermitPrinter } from "./permit-printer"

interface ApplicationDetailsProps {
  user: PermitUser
  application: PermitApplication
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ user, application }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-600 text-white"
      case "rejected":
        return "bg-red-600 text-white"
      case "under_review":
        return "bg-blue-600 text-white"
      case "submitted":
        return "bg-gray-600 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const canPrintPermit = () => {
    return application.status === "approved" && user.userType === "permitting_officer"
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Official Header */}
      <Card className="border-t-4 border-t-blue-600">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">WATER USE PERMIT APPLICATION</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Upper Molopo Sub-Catchment Committee | Reference: {application.applicationId}
              </p>
            </div>
            <div className="text-right">
              <Badge className={`${getStatusColor(application.status)} text-sm font-medium px-3 py-1`}>
                {application.status.replace("_", " ").toUpperCase()}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Stage {application.currentStage}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Print Section for Approved Applications */}
      {canPrintPermit() && (
        <Card className="border-l-4 border-l-green-600 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Permit Approved - Ready for Printing</h3>
                  <p className="text-sm text-green-700">Official permit document available for generation</p>
                </div>
              </div>
              <PermitPrinter application={application} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Applicant & Contact */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                <p className="font-semibold text-gray-900">{application.applicantName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Number</label>
                <p className="font-mono text-gray-900">{application.customerAccountNumber}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Number</label>
                <p className="text-gray-900">{application.cellularNumber}</p>
              </div>
              <Separator />
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Physical Address</label>
                <p className="text-gray-900">{application.physicalAddress}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Postal Address</label>
                <p className="text-gray-900">{application.postalAddress}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-mono text-gray-900">{formatDate(application.createdAt)}</span>
              </div>
              {application.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-mono text-gray-900">{formatDate(application.submittedAt)}</span>
                </div>
              )}
              {application.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-mono text-green-700 font-semibold">{formatDate(application.approvedAt)}</span>
                </div>
              )}
              {application.rejectedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Rejected:</span>
                  <span className="font-mono text-red-700 font-semibold">{formatDate(application.rejectedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-mono text-gray-900">{formatDate(application.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Permit Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Permit Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                  <p className="font-semibold text-gray-900">{application.permitType}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Intended Use</label>
                  <p className="text-gray-900">{application.intendedUse}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Water Allocation</label>
                  <p className="font-semibold text-blue-700">{application.waterAllocation} m³/day</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Validity Period</label>
                  <p className="text-gray-900">{application.validityPeriod} years</p>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Water Source</label>
                <p className="text-gray-900">{application.waterSource}</p>
              </div>
              {application.waterSourceDetails && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source Details</label>
                  <p className="text-gray-900 text-xs">{application.waterSourceDetails}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          {application.comments && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800">Additional Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{application.comments}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Property Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Land Size</label>
                  <p className="font-semibold text-gray-900">{application.landSize} ha</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Boreholes</label>
                  <p className="text-gray-900">{application.numberOfBoreholes}</p>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">GPS Coordinates</label>
                <div className="font-mono text-xs text-gray-900 space-y-1">
                  <p>Latitude: {application.gpsLatitude}°</p>
                  <p>Longitude: {application.gpsLongitude}°</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card
            className={`border-l-4 ${
              application.status === "approved"
                ? "border-l-green-600 bg-green-50"
                : application.status === "rejected"
                  ? "border-l-red-600 bg-red-50"
                  : "border-l-blue-600 bg-blue-50"
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {application.status === "approved" && (
                <div className="space-y-2">
                  <p className="text-green-800 font-semibold">Application Approved</p>
                  <p className="text-green-700 text-xs">
                    Permit has been approved through all required workflow stages and is ready for issuance.
                  </p>
                  {user.userType === "permitting_officer" && (
                    <p className="text-green-700 text-xs font-medium">
                      Official permit document available for printing.
                    </p>
                  )}
                </div>
              )}
              {application.status === "rejected" && (
                <div className="space-y-2">
                  <p className="text-red-800 font-semibold">Application Rejected</p>
                  <p className="text-red-700 text-xs">
                    Application has been rejected during the review process. Review comments for details.
                  </p>
                </div>
              )}
              {application.status === "under_review" && (
                <div className="space-y-2">
                  <p className="text-blue-800 font-semibold">Under Review - Stage {application.currentStage}</p>
                  <p className="text-blue-700 text-xs">
                    Application is currently being reviewed by the appropriate authority.
                  </p>
                </div>
              )}
              {application.status === "submitted" && (
                <div className="space-y-2">
                  <p className="text-gray-800 font-semibold">Submitted - Awaiting Review</p>
                  <p className="text-gray-700 text-xs">
                    Application has been submitted and is awaiting initial review.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information (ICT Only) */}
          {user.userType === "ict" && (
            <Card className="border-dashed border-gray-300 bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">System Information</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-1">
                <p>User Type: {user.userType}</p>
                <p>Application Status: {application.status}</p>
                <p>Print Permission: {canPrintPermit() ? "Granted" : "Denied"}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/* Named export for existing imports */
export { ApplicationDetails }

/* Optional: keep default export for flexibility */
export default ApplicationDetails
