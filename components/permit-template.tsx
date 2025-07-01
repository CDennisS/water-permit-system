"use client"

import type { PermitData } from "@/types"

interface PermitTemplateProps {
  permitData: PermitData
  id?: string
}

export function PermitTemplate({ permitData, id }: PermitTemplateProps) {
  return (
    <div id={id} className="permit-template bg-white p-8 max-w-4xl mx-auto text-black">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs">COAT OF ARMS</span>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold mb-2">REPUBLIC OF ZIMBABWE</h1>
            <h2 className="text-lg font-bold mb-2">
              MINISTRY OF LANDS, AGRICULTURE, FISHERIES, WATER AND RURAL DEVELOPMENT
            </h2>
            <h3 className="text-base font-bold mb-4">UPPER MANYAME SUB CATCHMENT COUNCIL</h3>
          </div>
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs">UMSCC LOGO</span>
          </div>
        </div>

        <div className="border-2 border-black p-4 mb-6">
          <h1 className="text-xl font-bold mb-2">GROUNDWATER ABSTRACTION PERMIT</h1>
          <h2 className="text-lg font-bold mb-4">
            {permitData.permitType?.toUpperCase() || "TEMPORARY"} SPECIFIC GROUNDWATER ABSTRACTION PERMIT
          </h2>
          <p className="text-sm mb-4">(Water Act [Chapter 20:24] and Water Regulations)</p>
        </div>
      </div>

      {/* Permit Number */}
      <div className="text-center mb-6">
        <div className="inline-block border-2 border-black p-3">
          <p className="text-lg font-bold">PERMIT NUMBER: {permitData.permitNumber}</p>
        </div>
      </div>

      {/* Grant Statement */}
      <div className="mb-6">
        <p className="mb-4">
          The <strong>{permitData.catchment || "MANYAME"}</strong> Catchment Council hereby grants a
          {" " + permitData.permitType} Groundwater Abstraction Permit to:
        </p>
        <p className="mb-4">
          <strong>Catchment: {permitData.catchment || "MANYAME"}</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>Sub-Catchment: {permitData.subCatchment || "UPPER MANYAME"}</strong>
        </p>
      </div>

      {/* Applicant Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">APPLICANT DETAILS</h3>
          <div className="space-y-2">
            <div>
              <span className="font-bold">1. Name of Applicant:</span> {permitData.applicantName}
            </div>
            <div>
              <span className="font-bold">2. Physical Address:</span> {permitData.physicalAddress}
            </div>
            {permitData.postalAddress && (
              <div>
                <span className="font-bold">3. Postal Address:</span> {permitData.postalAddress}
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
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <span className="font-bold">4. Number of drilled boreholes:</span> {permitData.numberOfBoreholes}
          </div>
          <div>
            <span className="font-bold">5. Size of land or property:</span> {permitData.landSize} (ha)
          </div>
          <div>
            <span className="font-bold">6. Intended Use:</span> {permitData.intendedUse}
          </div>
        </div>
        <div className="mb-4">
          <span className="font-bold">GPS Coordinates:</span> Lat: {permitData.gpsCoordinates.latitude.toFixed(6)},
          Long: {permitData.gpsCoordinates.longitude.toFixed(6)}
        </div>
      </div>

      {/* Water Allocation */}
      <div className="mb-6">
        <div className="text-center p-4 border-2 border-black">
          <p className="text-xl font-bold">
            TOTAL ALLOCATED ABSTRACTION: {permitData.totalAllocatedAbstraction.toLocaleString()} m³/annum
          </p>
        </div>
      </div>

      {/* Borehole Details Table */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-1">BOREHOLE DETAILS</h3>
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center font-bold">Borehole (BH)-No.</th>
              <th className="border border-black p-2 text-center font-bold">Allocated Amount (m³/annum)</th>
              <th className="border border-black p-2 text-center font-bold" colSpan={2}>
                Grid Reference
              </th>
              <th className="border border-black p-2 text-center font-bold">GPS Reading</th>
              <th className="border border-black p-2 text-center font-bold">Intended Use</th>
              <th className="border border-black p-2 text-center font-bold">Max Abstraction Rate (m³/annum)</th>
              <th className="border border-black p-2 text-center font-bold">Water Sample Analysis</th>
            </tr>
            <tr>
              <th className="border border-black p-1 text-center"></th>
              <th className="border border-black p-1 text-center"></th>
              <th className="border border-black p-1 text-center">X</th>
              <th className="border border-black p-1 text-center">Y</th>
              <th className="border border-black p-1 text-center"></th>
              <th className="border border-black p-1 text-center"></th>
              <th className="border border-black p-1 text-center"></th>
              <th className="border border-black p-1 text-center">Frequency</th>
            </tr>
          </thead>
          <tbody>
            {permitData.boreholeDetails.map((borehole, index) => (
              <tr key={index}>
                <td className="border border-black p-2 text-center">{borehole.boreholeNumber}</td>
                <td className="border border-black p-2 text-center">{borehole.allocatedAmount.toLocaleString()}</td>
                <td className="border border-black p-2 text-center">{borehole.gpsX}</td>
                <td className="border border-black p-2 text-center">{borehole.gpsY}</td>
                <td className="border border-black p-2 text-center">
                  {permitData.gpsCoordinates.latitude.toFixed(6)}, {permitData.gpsCoordinates.longitude.toFixed(6)}
                </td>
                <td className="border border-black p-2">{borehole.intendedUse}</td>
                <td className="border border-black p-2 text-center">{borehole.maxAbstractionRate.toLocaleString()}</td>
                <td className="border border-black p-2 text-center">{borehole.waterSampleFrequency}</td>
              </tr>
            ))}
            {/* Fill empty rows if less than 5 boreholes */}
            {Array.from({ length: Math.max(0, 5 - permitData.boreholeDetails.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs mt-2">
          <sup>*</sup> Intended use: irrigation, livestock farming, industrial, mining, urban, national parks, other
          (specify): <strong>{permitData.intendedUse.toUpperCase()}</strong>
        </p>
      </div>

      {/* CONDITIONS */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">CONDITIONS</h3>
        <div className="space-y-4 text-sm">
          <p>
            It is illegal to abstract groundwater for any other purpose other than primary purposes without an
            abstraction permit. The owner of the property who wishes to abstract water in terms of this permit must
            observe his obligations under the technical specifications contained in the "Operational Guidelines for
            Boreholes, Groundwater Monitoring and Groundwater Use".
          </p>
          <p>
            All forms on which to record information as required by the permit are provided by the relevant Catchment
            Council. The owner of the property shall submit the borehole monitoring data recorded every month, or as
            specified by the Catchment Council, on Form GW 8 to the relevant Catchment Council (Catchment Manager's
            office) every three months or as specified by the Catchment Council.
          </p>
          <p>
            The Catchment Council reserves the right to review the conditions of this permit in accordance with the
            Water Act, [Chapter 20:24].
          </p>
        </div>
      </div>

      {/* ADDITIONAL CONDITIONS */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">ADDITIONAL CONDITIONS</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>To install flow meters on all boreholes and keep records of water used</li>
          <li>Water Quality Analysis is to be carried out at most after every 3 months</li>
          <li>To submit abstraction and water quality records to catchment offices every six (6) months</li>
          <li>To allow unlimited access to ZINWA and SUB-CATCHMENT COUNCIL staff</li>
          <li>No cost shall be demanded from the Catchment Council in the event of permit cancellation</li>
          <li>This permit is non-transferable and is valid only for the specified property</li>
          <li>Any changes to the abstraction details must be reported to the Catchment Council immediately</li>
          <li>The permit holder must comply with all environmental regulations and guidelines</li>
        </ol>
      </div>

      {/* Signature Section */}
      <div className="mt-12">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm font-bold">Permitting Officer</p>
            <p className="text-xs">Name (print)</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm font-bold">Catchment Manager</p>
            <p className="text-xs">Signature</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm font-bold">Chairperson</p>
            <p className="text-xs">Official Date Stamp</p>
          </div>
        </div>
        <p className="text-center text-sm mt-4">(Upper Manyame Sub-Catchment Council)</p>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            This permit is issued under the authority of the Upper Manyame Sub Catchment Council
            <br />
            in accordance with the Water Act [Chapter 20:24] and Water (Permits) Regulations, 2001
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>
          Upper Manyame Sub Catchment Council | P.O. Box 1378, Harare | Tel: +263-4-123456 | Email: info@umscc.co.zw
        </p>
        <p>
          Generated on:{" "}
          {new Date().toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}
