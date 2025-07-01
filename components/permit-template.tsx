"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PermitTemplateProps {
  permitData: any
  id?: string
}

export function PermitTemplate({ permitData, id = "permit-template" }: PermitTemplateProps) {
  const currentDate = new Date().toLocaleDateString("en-GB")
  const permitNumber = `WP-${new Date().getFullYear()}-${permitData.applicationId.split("-")[2]}`
  const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")

  return (
    <div id={id} className="max-w-4xl mx-auto bg-white p-8 print:p-6 print:shadow-none">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
        <div className="flex items-center justify-center mb-4">
          <img src="/placeholder-logo.svg" alt="UMSCC Logo" className="h-16 w-16 mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-blue-900">UPPER MANYAME SUB CATCHMENT COUNCIL</h1>
            <p className="text-lg text-gray-700 font-semibold">WATER ABSTRACTION PERMIT</p>
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xl font-bold text-blue-900">PERMIT NO: {permitNumber}</p>
        </div>
      </div>

      {/* Permit Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Permit Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Issue Date:</span>
                <span>{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Valid Until:</span>
                <span>{expiryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Permit Type:</span>
                <Badge variant="outline" className="capitalize">
                  {permitData.permitType.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Applicant Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <span className="font-medium">Name:</span>
                <p className="text-gray-700">{permitData.applicantName}</p>
              </div>
              <div>
                <span className="font-medium">Physical Address:</span>
                <p className="text-gray-700">{permitData.physicalAddress}</p>
              </div>
              <div>
                <span className="font-medium">Contact:</span>
                <p className="text-gray-700">{permitData.cellularNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property and Water Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property & Water Allocation Details</h3>
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{permitData.waterAllocation} m³/month</div>
              <p className="text-sm text-gray-600">Total Water Allocation</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{permitData.landSize} hectares</div>
              <p className="text-sm text-gray-600">Land Size</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{permitData.boreholes?.length || 1}</div>
              <p className="text-sm text-gray-600">Boreholes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Borehole Details */}
      {permitData.boreholes && permitData.boreholes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Borehole Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Borehole ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Depth (m)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Diameter (inches)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Yield (l/s)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {permitData.boreholes.map((borehole: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{borehole.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{borehole.depth}</td>
                    <td className="border border-gray-300 px-4 py-2">{borehole.diameter}</td>
                    <td className="border border-gray-300 px-4 py-2">{borehole.yieldRate}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {borehole.coordinates.latitude.toFixed(4)}, {borehole.coordinates.longitude.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GPS Coordinates */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Coordinates</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Latitude:</span>
              <span className="ml-2">{permitData.gpsLatitude}°</span>
            </div>
            <div>
              <span className="font-medium">Longitude:</span>
              <span className="ml-2">{permitData.gpsLongitude}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>This permit is valid for water abstraction only for the purposes stated in the application.</li>
            <li>
              The permit holder must not exceed the allocated water abstraction limit of {permitData.waterAllocation}{" "}
              m³/month.
            </li>
            <li>Water abstraction must be conducted in accordance with environmental regulations.</li>
            <li>The permit holder must maintain accurate records of water abstraction volumes.</li>
            <li>This permit is non-transferable and must be renewed annually.</li>
            <li>Any changes to the abstraction system must be reported to UMSCC within 30 days.</li>
            <li>The permit holder must allow authorized UMSCC officials to inspect the abstraction site.</li>
            <li>Failure to comply with these conditions may result in permit suspension or revocation.</li>
          </ol>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="text-center">
          <div className="border-t-2 border-gray-400 pt-2 mt-16">
            <p className="font-semibold">Permit Holder</p>
            <p className="text-sm text-gray-600">Signature & Date</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-400 pt-2 mt-16">
            <p className="font-semibold">UMSCC Authorized Officer</p>
            <p className="text-sm text-gray-600">Signature & Date</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 border-t pt-4">
        <p>Upper Manyame Sub Catchment Council</p>
        <p>Contact: +263-4-123456 | Email: info@umscc.co.zw</p>
        <p>This permit is issued under the authority of the Water Act [Chapter 20:24]</p>
      </div>
    </div>
  )
}
