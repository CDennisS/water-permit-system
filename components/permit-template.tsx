"use client"

import { Badge } from "@/components/ui/badge"
import type { Application } from "@/types"

interface PermitTemplateProps {
  application: Application
}

export function PermitTemplate({ application }: PermitTemplateProps) {
  const currentDate = new Date().toLocaleDateString("en-GB")
  const permitNumber = `WP-${new Date().getFullYear()}-${application.applicationId.split("-")[2]}`

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-blue-600 pb-6 mb-8">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">REPUBLIC OF ZIMBABWE</h1>
        <h2 className="text-xl font-semibold text-blue-700 mb-2">UPPER MANYAME SUB CATCHMENT COUNCIL</h2>
        <h3 className="text-lg font-medium text-gray-700">WATER PERMIT</h3>
        <div className="mt-4">
          <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">Permit No: {permitNumber}</Badge>
        </div>
      </div>

      {/* Permit Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">APPLICANT DETAILS</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Name:</span> {application.applicantName}
            </div>
            <div>
              <span className="font-medium">Address:</span> {application.physicalAddress}
            </div>
            <div>
              <span className="font-medium">Contact:</span> {application.cellularNumber}
            </div>
            <div>
              <span className="font-medium">Account No:</span> {application.customerAccountNumber}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">PERMIT DETAILS</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Application ID:</span> {application.applicationId}
            </div>
            <div>
              <span className="font-medium">Permit Type:</span> {application.permitType.replace("_", " ").toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Issue Date:</span> {currentDate}
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <Badge className="ml-2 bg-green-100 text-green-800">APPROVED</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Water Source Information */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">WATER SOURCE INFORMATION</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Water Source:</span>{" "}
              {application.waterSource.replace("_", " ").toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Intended Use:</span> {application.intendedUse}
            </div>
            <div>
              <span className="font-medium">Land Size:</span> {application.landSize} hectares
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Water Allocation:</span> {application.waterAllocation} m³/month
            </div>
            <div>
              <span className="font-medium">GPS Coordinates:</span>
              <br />
              Latitude: {application.gpsLatitude}°
              <br />
              Longitude: {application.gpsLongitude}°
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">TERMS AND CONDITIONS</h4>
        <div className="text-sm space-y-2">
          <p>1. This permit is valid for a period of five (5) years from the date of issue.</p>
          <p>2. The permit holder must comply with all applicable water management regulations.</p>
          <p>3. Water abstraction must not exceed the allocated volume of {application.waterAllocation} m³/month.</p>
          <p>4. The permit holder must maintain accurate records of water usage.</p>
          <p>5. This permit is non-transferable and specific to the named applicant and location.</p>
          <p>6. Any changes to the water use must be reported to the Upper Manyame Sub Catchment Council.</p>
          <p>7. The permit may be revoked if terms and conditions are not adhered to.</p>
          <p>8. Regular inspections may be conducted to ensure compliance.</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="font-medium">Permit Holder</p>
            <p className="text-sm text-gray-600">{application.applicantName}</p>
            <p className="text-sm text-gray-500">Date: _______________</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="font-medium">Authorized Officer</p>
            <p className="text-sm text-gray-600">Upper Manyame Sub Catchment Council</p>
            <p className="text-sm text-gray-500">Date: {currentDate}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          This permit is issued under the authority of the Water Act and regulations of Zimbabwe.
          <br />
          For inquiries, contact: Upper Manyame Sub Catchment Council
        </p>
      </div>
    </div>
  )
}
