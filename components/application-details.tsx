"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { PermitApplication, User } from "@/types"

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

  return (
    <div className="space-y-6">
      {/* Header with Application ID and Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Application Details – {application.applicationId}</CardTitle>
            <Badge className={`text-sm font-semibold ${getStatusColor(application.status)}`}>
              {application.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

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
                <p className="text-base">{formatDate(application.approvedAt)}</p>
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
