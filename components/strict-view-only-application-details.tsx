"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, MapPin, Droplets, Calendar, User, Phone, Home, Eye, Lock } from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"

interface StrictViewOnlyApplicationDetailsProps {
  user: UserType
  application: PermitApplication
}

/**
 * Read-only view of an application (used by Catchment Manager & similar roles)
 */
export function StrictViewOnlyApplicationDetails({ user, application }: StrictViewOnlyApplicationDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Access-level banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>VIEW-ONLY ACCESS:</strong> You can view all application details and documents but cannot edit any
          information. The comment section is the only field you can modify.
        </AlertDescription>
      </Alert>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5 text-blue-600" />
            Application Details (Read-Only)
            <Badge variant="outline" className="ml-2 text-xs">
              VIEW ONLY
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* LEFT COLUMN */}
            <div className="space-y-3">
              <Detail
                icon={<FileText className="h-4 w-4 text-gray-500" />}
                label="Application ID"
                value={application.applicationId}
                mono
              />
              <Detail
                icon={<User className="h-4 w-4 text-gray-500" />}
                label="Applicant Name"
                value={application.applicantName}
              />
              <Detail
                icon={<Home className="h-4 w-4 text-gray-500" />}
                label="Physical Address"
                value={application.physicalAddress}
              />
              <Detail
                icon={<Phone className="h-4 w-4 text-gray-500" />}
                label="Contact"
                value={application.contactNumber}
              />
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              <Detail
                icon={<FileText className="h-4 w-4 text-gray-500" />}
                label="Permit Type"
                value={application.permitType.replace("_", " ")}
              />
              <Detail
                icon={<Droplets className="h-4 w-4 text-blue-500" />}
                label="Water Allocation"
                value={`${application.waterAllocation.toLocaleString()} ML`}
              />
              <Detail
                icon={<MapPin className="h-4 w-4 text-gray-500" />}
                label="Number of Boreholes"
                value={String(application.numberOfBoreholes)}
              />
              <Detail
                icon={<Calendar className="h-4 w-4 text-gray-500" />}
                label="Submitted"
                value={application.submittedAt.toLocaleDateString()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-green-600" />
            GPS Coordinates (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Detail label="Latitude (X)" value={application.gpsLatitude?.toFixed(6) ?? "—"} mono />
            <Detail label="Longitude (Y)" value={application.gpsLongitude?.toFixed(6) ?? "—"} mono />
          </div>
        </CardContent>
      </Card>

      {/* Water Source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Droplets className="mr-2 h-5 w-5 text-blue-600" />
            Water Source Details (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Detail label="Water Source" value={application.waterSource.replace("_", " ")} />
          <Detail label="Intended Use" value={application.intendedUse.replace("_", " ")} />
        </CardContent>
      </Card>

      {/* Previous Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-600" />
            Previous Comments (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {application.comments?.length ? (
              application.comments.map((c, i) => (
                <div key={i} className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {c.userType.replace("_", " ").toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">{c.createdAt.toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.comment}</p>
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

/* ───────────────────────── helper ───────────────────────── */

interface DetailProps {
  icon?: React.ReactNode
  label: string
  value: string
  mono?: boolean
}

function Detail({ icon, label, value, mono = false }: DetailProps) {
  return (
    <div className="flex items-center text-sm">
      {icon && <span className="mr-2">{icon}</span>}
      <span className="font-medium">{label}:</span>
      <span className={`ml-2 ${mono ? "font-mono" : ""} ${value === "—" ? "text-gray-500" : ""}`}>{value}</span>
    </div>
  )
}
