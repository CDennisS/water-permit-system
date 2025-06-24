"use client"

import type { PermitApplication } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PermitPreviewProps {
  application: PermitApplication
}

export function PermitPreview({ application }: PermitPreviewProps) {
  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">WATER USE PERMIT</h1>
        <p className="text-lg text-gray-600 mt-2">Upper Manyame Sub-Catchment Council</p>
        <div className="mt-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Permit No: {application.applicationId}
          </Badge>
        </div>
      </div>

      {/* Permit Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applicant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-semibold">Name:</span> {application.applicantName}
            </div>
            <div>
              <span className="font-semibold">Physical Address:</span> {application.physicalAddress}
            </div>
            <div>
              <span className="font-semibold">Postal Address:</span> {application.postalAddress}
            </div>
            <div>
              <span className="font-semibold">Customer Account:</span> {application.customerAccountNumber}
            </div>
            <div>
              <span className="font-semibold">Contact Number:</span> {application.cellularNumber}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-semibold">Land Size:</span> {application.landSize} hectares
            </div>
            <div>
              <span className="font-semibold">GPS Coordinates:</span>
              <br />
              Lat: {application.gpsLatitude}, Long: {application.gpsLongitude}
            </div>
            <div>
              <span className="font-semibold">Number of Boreholes:</span> {application.numberOfBoreholes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Water Use Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Water Use Authorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Water Source:</span> {application.waterSource}
            </div>
            <div>
              <span className="font-semibold">Permit Type:</span> {application.permitType}
            </div>
            <div>
              <span className="font-semibold">Intended Use:</span> {application.intendedUse}
            </div>
            <div>
              <span className="font-semibold">Water Allocation:</span> {application.waterAllocation} liters/day
            </div>
          </div>

          {application.waterSourceDetails && (
            <div>
              <span className="font-semibold">Water Source Details:</span>
              <p className="mt-1 text-gray-700">{application.waterSourceDetails}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permit Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permit Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="font-semibold">Validity Period:</span> {application.validityPeriod} years
          </div>
          <div>
            <span className="font-semibold">Issue Date:</span>{" "}
            {application.approvedAt ? new Date(application.approvedAt).toLocaleDateString() : "N/A"}
          </div>
          <div>
            <span className="font-semibold">Expiry Date:</span>{" "}
            {application.approvedAt
              ? new Date(
                  new Date(application.approvedAt).getTime() + application.validityPeriod * 365 * 24 * 60 * 60 * 1000,
                ).toLocaleDateString()
              : "N/A"}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. This permit is valid for the specified period and water allocation only.</p>
            <p>2. The permit holder must comply with all applicable water use regulations.</p>
            <p>3. Water use must not exceed the allocated amount without prior authorization.</p>
            <p>4. The permit holder must maintain accurate records of water usage.</p>
            <p>5. This permit is non-transferable without written consent from UMSCC.</p>
            <p>6. The permit may be revoked if conditions are not met or regulations are violated.</p>
            <p>7. Regular inspections may be conducted to ensure compliance.</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pt-6 border-t">
        <p className="text-sm text-gray-600">
          This permit is issued under the authority of the Upper Manyame Sub-Catchment Council
        </p>
        <p className="text-sm text-gray-600 mt-2">For inquiries, contact: info@umscc.co.zw | +263-4-123456</p>
      </div>
    </div>
  )
}
