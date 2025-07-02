"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, MapPin, Droplets, Calendar, User, Phone, Home, Eye, Lock } from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"

interface StrictViewOnlyApplicationDetailsProps {
  user: UserType
  application: PermitApplication
}

export function StrictViewOnlyApplicationDetails({ user, application }: StrictViewOnlyApplicationDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Access Level Warning */}
      <Alert className="border-blue-200 bg-blue-50">
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>VIEW-ONLY ACCESS:</strong> You can view all application details and documents but cannot edit any
          information. The comment section is the only field you can modify.
        </AlertDescription>
      </Alert>

      {/* Application Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2 text-blue-600" />
            Application Details (Read-Only)
            <Badge variant="outline" className="ml-2 text-xs">
              VIEW ONLY
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Application ID:</span>
                <span className="ml-2 font-mono">{application.applicationId}</span>
              </div>

              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Applicant Name:</span>
                <span className="ml-2">{application.applicantName}</span>
              </div>

              <div className="flex items-center text-sm">
                <Home className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Physical Address:</span>
                <span className="ml-2">{application.physicalAddress}</span>
              </div>

              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Contact:</span>
                <span className="ml-2">{application.contactNumber}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Permit Type:</span>
                <span className="ml-2 capitalize">{application.permitType.replace("_", " ")}</span>
              </div>

              <div className="flex items-center text-sm">
                <Droplets className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Water Allocation:</span>
                <span className="ml-2">{application.waterAllocation.toLocaleString()} ML</span>
              </div>

              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Number of Boreholes:</span>
                <span className="ml-2">{application.numberOfBoreholes}</span>
              </div>

              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Submitted:</span>
                <span className="ml-2">{application.submittedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPS Coordinates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            GPS Coordinates (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm">
              <span className="font-medium">Latitude (X):</span>
              <span className="ml-2 font-mono">{application.gpsLatitude}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium">Longitude (Y):</span>
              <span className="ml-2 font-mono">{application.gpsLongitude}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Water Source Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Droplets className="h-5 w-5 mr-2 text-blue-600" />
            Water Source Details (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="font-medium">Water Source:</span>
              <span className="ml-2 capitalize">{application.waterSource.replace("_", " ")}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium">Intended Use:</span>
              <span className="ml-2 capitalize">{application.intendedUse.replace("_", " ")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Comments (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-600" />
            Previous Comments (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {application.comments && application.comments.length > 0 ? (
              application.comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {comment.userType.replace("_", " ").toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">{comment.createdAt.toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No previous comments available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Reminder */}
      <Alert className="border-green-200 bg-green-50">
        <Eye className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Your Role:</strong> As Manyame Catchment Manager, you can view all application details and documents,
          but your only action is to add mandatory comments. You cannot create, edit, or modify any application data.
        </AlertDescription>
      </Alert>
    </div>
  )
}
