"use client"

import type { PermitData } from "@/types"

interface PermitTemplateProps {
  permitData: PermitData
  id?: string
}

export function PermitTemplate({ permitData, id }: PermitTemplateProps) {
  return (
    <div id={id} className="permit-template bg-white p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">PERMIT TO ABSTRACT WATER</h1>
        <h2 className="text-xl font-semibold mb-4">UPPER MANYAME SUB-CATCHMENT COUNCIL</h2>
        <div className="border-b-2 border-black pb-2">
          <p className="text-lg font-bold">PERMIT NUMBER: {permitData.permitNumber}</p>
        </div>
      </div>

      {/* Permit Details Grid */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">APPLICANT DETAILS</h3>
          <div className="space-y-2">
            <div>
              <span className="font-bold">Name:</span> {permitData.applicantName}
            </div>
            <div>
              <span className="font-bold">Physical Address:</span> {permitData.physicalAddress}
            </div>
            {permitData.postalAddress && (
              <div>
                <span className="font-bold">Postal Address:</span> {permitData.postalAddress}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">PERMIT INFORMATION</h3>
          <div className="space-y-2">
            <div>
              <span className="font-bold">Issue Date:</span> {permitData.issueDate}
            </div>
            <div>
              <span className="font-bold">Valid Until:</span> {permitData.validUntil}
            </div>
            <div>
              <span className="font-bold">Permit Type:</span> {permitData.permitType.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">PROPERTY DETAILS</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="font-bold">Land Size:</span> {permitData.landSize} hectares
          </div>
          <div>
            <span className="font-bold">Number of Boreholes:</span> {permitData.numberOfBoreholes}
          </div>
          <div>
            <span className="font-bold">Intended Use:</span> {permitData.intendedUse}
          </div>
        </div>
        <div className="mt-2">
          <span className="font-bold">GPS Coordinates:</span> Lat: {permitData.gpsCoordinates.latitude}, Long:{" "}
          {permitData.gpsCoordinates.longitude}
        </div>
      </div>

      {/* Water Allocation */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">WATER ALLOCATION</h3>
        <div className="text-center p-4 border-2 border-black">
          <p className="text-xl font-bold">
            TOTAL ALLOCATED ABSTRACTION: {permitData.totalAllocatedAbstraction.toLocaleString()} m³/annum
          </p>
        </div>
      </div>

      {/* Borehole Details Table */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">BOREHOLE DETAILS</h3>
        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center font-bold">Borehole Number</th>
              <th className="border border-black p-2 text-center font-bold">Allocated Amount (m³/annum)</th>
              <th className="border border-black p-2 text-center font-bold">GPS Coordinates</th>
              <th className="border border-black p-2 text-center font-bold">Max Abstraction Rate</th>
              <th className="border border-black p-2 text-center font-bold">Water Sample Frequency</th>
            </tr>
          </thead>
          <tbody>
            {permitData.boreholeDetails.map((borehole, index) => (
              <tr key={index}>
                <td className="border border-black p-2 text-center">{borehole.boreholeNumber}</td>
                <td className="border border-black p-2 text-center">{borehole.allocatedAmount.toLocaleString()}</td>
                <td className="border border-black p-2 text-center">
                  {borehole.gpsX}, {borehole.gpsY}
                </td>
                <td className="border border-black p-2 text-center">{borehole.maxAbstractionRate.toLocaleString()}</td>
                <td className="border border-black p-2 text-center">{borehole.waterSampleFrequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">TERMS AND CONDITIONS</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>This permit is valid for the period specified above and must be renewed before expiry.</li>
          <li>Water abstraction must not exceed the allocated amounts specified in this permit.</li>
          <li>The permit holder must maintain accurate records of water abstraction and submit quarterly reports.</li>
          <li>Water quality samples must be taken at the frequency specified and results submitted to the Council.</li>
          <li>Any changes to the abstraction infrastructure must be approved by the Council in advance.</li>
          <li>This permit is non-transferable and is valid only for the specified location and purpose.</li>
          <li>The Council reserves the right to modify or revoke this permit if conditions are not met.</li>
          <li>The permit holder must comply with all relevant environmental and water management regulations.</li>
        </ol>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-12">
        <div className="text-center">
          <div className="border-b border-black h-12 mb-2"></div>
          <p className="text-sm font-bold">Permitting Officer</p>
          <p className="text-xs">Upper Manyame Sub-Catchment Council</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black h-12 mb-2"></div>
          <p className="text-sm font-bold">Catchment Manager</p>
          <p className="text-xs">Upper Manyame Sub-Catchment Council</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black h-12 mb-2"></div>
          <p className="text-sm font-bold">Chairperson</p>
          <p className="text-xs">Upper Manyame Sub-Catchment Council</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-600">
          This permit is issued under the authority of the Water Act and Upper Manyame Sub-Catchment Council
          regulations.
        </p>
        <p className="text-xs text-gray-600 mt-1">
          For inquiries, contact: Upper Manyame Sub-Catchment Council | Email: info@umscc.co.zw | Phone: +263-4-123456
        </p>
      </div>
    </div>
  )
}
