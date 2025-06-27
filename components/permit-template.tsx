"use client"

import type { PermitData } from "@/types"

interface PermitTemplateProps {
  permitData: PermitData
}

export function PermitTemplate({ permitData }: PermitTemplateProps) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-black" style={{ fontFamily: "Times New Roman, serif" }}>
      {/* Header - Exact Form GW7B Format */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold mb-2">Form GW7B</h1>
        <h2 className="text-lg font-bold mb-4">TEMPORARY/PROVISIONAL* SPECIFIC GROUNDWATER ABSTRACTION PERMIT</h2>
        <p className="text-sm mb-4">(Section 15 (3) (a) of Water (Permits) Regulations, 2001)</p>
      </div>

      {/* Grant Statement - Exact Wording */}
      <div className="mb-6">
        <p className="mb-4">
          The <strong>MANYAME</strong> Catchment Council hereby grants a *Temporary/Provisional General Abstraction
          Permit to:
        </p>
        <p className="mb-4">
          <strong>Catchment: MANYAME</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>Sub-Catchment: UPPER MANYAME</strong>
        </p>
      </div>

      {/* Applicant Details - Following Form GW7B Layout */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="mb-2">
            <strong>1. Name of Applicant:</strong> {permitData.applicantName}
          </p>
        </div>
        <div>
          <p className="mb-2">
            <strong>3. Postal address:</strong> {permitData.postalAddress || "N/A"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2">
          <strong>2. Physical address:</strong> {permitData.physicalAddress}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="mb-2">
            <strong>4. Number of drilled boreholes:</strong> {permitData.numberOfBoreholes}
          </p>
        </div>
        <div>
          <p className="mb-2">
            <strong>5. Size of land or property:</strong> {permitData.landSize} (ha)
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-4">
          <strong>Total allocated abstraction (m³/annum):</strong>{" "}
          {permitData.totalAllocatedAbstraction.toLocaleString()}
        </p>
      </div>

      {/* Borehole Details Table - Exact Form GW7B Table Structure */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2">Borehole (BH)-No.</th>
              <th className="border border-black p-2">BH-No. Allocated</th>
              <th className="border border-black p-2" colSpan={2}>
                Grid Reference
              </th>
              <th className="border border-black p-2">GPS reading</th>
              <th className="border border-black p-2">Intended use</th>
              <th className="border border-black p-2">Maximum abstraction rate (m³/annum)</th>
              <th className="border border-black p-2">Water sample analysis every . months/years</th>
            </tr>
            <tr>
              <th className="border border-black p-1"></th>
              <th className="border border-black p-1"></th>
              <th className="border border-black p-1">X</th>
              <th className="border border-black p-1">Y</th>
              <th className="border border-black p-1"></th>
              <th className="border border-black p-1"></th>
              <th className="border border-black p-1"></th>
              <th className="border border-black p-1"></th>
            </tr>
          </thead>
          <tbody>
            {permitData.boreholeDetails.map((borehole, index) => (
              <tr key={index}>
                <td className="border border-black p-2 text-center">{borehole.boreholeNumber}</td>
                <td className="border border-black p-2 text-center">{borehole.allocatedAmount.toLocaleString()}</td>
                <td className="border border-black p-2 text-center">{borehole.gpsX}</td>
                <td className="border border-black p-2 text-center">{borehole.gpsY}</td>
                <td className="border border-black p-2 text-center">-</td>
                <td className="border border-black p-2">{borehole.intendedUse}</td>
                <td className="border border-black p-2 text-center">{borehole.maxAbstractionRate.toLocaleString()}</td>
                <td className="border border-black p-2 text-center">{borehole.waterSampleFrequency}</td>
              </tr>
            ))}
            {/* Fill empty rows if less than 5 boreholes - As per Form GW7B */}
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
          <sup>a</sup> Intended use: irrigation, livestock farming, industrial, mining, urban, national parks, other
          (specify): <strong>{permitData.intendedUse.toUpperCase()}</strong>
        </p>
      </div>

      {/* Permit Registration - Exact Form GW7B Format */}
      <div className="mb-6">
        <p className="mb-4">
          This Temporary/Provisional* Specific Abstraction Permit has been recorded in the register as:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <p>
            <strong>Permit No:</strong> {permitData.permitNumber}
          </p>
          <p>
            <strong>Valid until:</strong> {permitData.validUntil}
          </p>
        </div>
      </div>

      {/* CONDITIONS - Exact Form GW7B Text */}
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

          <p>
            In the event that the Minister declares part of or the whole Catchment area a groundwater development
            restriction area, the Catchment Council has the right in terms of the Water Act, [Chapter 20:24], to suspend
            or amend any permit, restrict the abstractions, limit the validity period of the permit and determine the
            priority use of the water by re-issuing the permit.
          </p>
        </div>
      </div>

      {/* ADDITIONAL CONDITIONS - Exact Form GW7B Format */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">ADDITIONAL CONDITIONS</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>To install flow meters on all boreholes and keep records of water used</li>
          <li>Water Quality Analysis is to be carried out at most after every 3 months</li>
          <li>To submit abstraction and water quality records to catchment offices every six (6) months</li>
          <li>To allow unlimited access to ZINWA and SUB-CATCHMENT COUNCIL staff</li>
          <li>No cost shall be demanded from the Catchment Council in the event of permit cancellation</li>
        </ol>
      </div>

      {/* Signature Section - Exact Form GW7B Layout */}
      <div className="mt-12">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm">Name (print)</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm">Signature</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 h-12"></div>
            <p className="text-sm">Official Date Stamp</p>
          </div>
        </div>
        <p className="text-center text-sm mt-4">(Catchment Council Chairperson)</p>
      </div>
    </div>
  )
}
