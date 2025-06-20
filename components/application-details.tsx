"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, Droplets } from "lucide-react"
import { DocumentViewer } from "./document-viewer"
import type { PermitApplication, User } from "@/types"

interface ApplicationDetailsProps {
  user: User
  application: PermitApplication
}

export function ApplicationDetails({ user, application }: ApplicationDetailsProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      unsubmitted: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[status as keyof typeof colors]}>{status.replace("_", " ").toUpperCase()}</Badge>
  }

  const canUploadDocuments = () => {
    return user.userType === "permitting_officer" && application.status === "unsubmitted"
  }

  const canDeleteDocuments = () => {
    return user.userType === "permitting_officer" && application.status === "unsubmitted"
  }

  return (
    <div className="space-y-6">
      {/* Application Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{application.applicationId}</CardTitle>
              <p className="text-gray-600 mt-1">{application.applicantName}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(application.status)}
              <p className="text-sm text-gray-500 mt-1">Created: {application.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applicant Information */}
        <Card>
          <CardHeader>
            <CardTitle>Applicant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="font-medium">{application.applicantName}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Customer Account Number</label>
              <p className="font-medium">{application.customerAccountNumber}</p>
            </div>

            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 mt-1 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-500">Physical Address</label>
                <p className="text-sm">{application.physicalAddress}</p>
              </div>
            </div>

            {application.postalAddress && (
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Postal Address</label>
                  <p className="text-sm">{application.postalAddress}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-500">Cellular Number</label>
                <p className="text-sm">{application.cellularNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permit Details */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Permit Type</label>
              <p className="font-medium capitalize">{application.permitType.replace("_", " ")}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Water Source</label>
              <p className="font-medium capitalize">{application.waterSource.replace("_", " ")}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Intended Use</label>
              <p className="font-medium">{application.intendedUse}</p>
            </div>

            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <label className="text-sm font-medium text-gray-500">Water Allocation</label>
                <p className="font-medium">{application.waterAllocation.toLocaleString()} Megaliters</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Number of Boreholes</label>
              <p className="font-medium">{application.numberOfBoreholes}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Land Size</label>
              <p className="font-medium">{application.landSize} hectares</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GPS Coordinates */}
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">GPS Latitude (X)</label>
              <p className="font-medium">{application.gpsLatitude}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">GPS Longitude (Y)</label>
              <p className="font-medium">{application.gpsLongitude}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      {application.comments && (
        <Card>
          <CardHeader>
            <CardTitle>Application Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{application.comments}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents Section */}
      <DocumentViewer
        user={user}
        application={application}
        canUpload={canUploadDocuments()}
        canDelete={canDeleteDocuments()}
      />

      {/* Application Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Application Created</p>
                <p className="text-xs text-gray-500">{application.createdAt.toLocaleString()}</p>
              </div>
            </div>

            {application.submittedAt && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Application Submitted</p>
                  <p className="text-xs text-gray-500">{application.submittedAt.toLocaleString()}</p>
                </div>
              </div>
            )}

            {application.approvedAt && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Application Approved</p>
                  <p className="text-xs text-gray-500">{application.approvedAt.toLocaleString()}</p>
                </div>
              </div>
            )}

            {application.rejectedAt && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Application Rejected</p>
                  <p className="text-xs text-gray-500">{application.rejectedAt.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
