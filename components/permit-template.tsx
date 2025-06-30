"use client"

import type { PermitData } from "@/types"

interface PermitTemplateProps {
  permitData: PermitData
  id?: string
}

export function PermitTemplate({ permitData, id = "permit-template" }: PermitTemplateProps) {
  return (
    <div
      id={id}
      className="bg-white text-black w-full max-w-none print:shadow-none"
      style={{
        fontFamily: "Times New Roman, serif",
        fontSize: "10pt",
        lineHeight: "1.4",
        minHeight: "297mm", // A4 height
        width: "210mm", // A4 width
        margin: "0 auto",
        padding: "20mm",
        boxSizing: "border-box",
      }}
    >
      {/* Form Header */}
      <div className="text-right mb-2">
        <h4 className="text-sm font-normal">Form GW7B</h4>
      </div>

      {/* Title Section */}
      <div className="text-center mb-4">
        <h2 className="text-sm font-bold mb-2">
          TEMPORARY/PROVISIONAL<sup>*</sup> SPECIFIC GROUNDWATER ABSTRACTION PERMIT
        </h2>
        <p className="text-xs italic">(Section 15 (3) (a) of Water (Permits) Regulations, 2001)</p>
      </div>

      {/* Official Stamp Area */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-32 h-16 border border-gray-400 flex items-center justify-center text-xs">OFFICIAL STAMP</div>
        <div className="w-20 h-16 border border-gray-400 flex items-center justify-center text-xs">LOGO</div>
      </div>

      {/* Grant Statement */}
      <div className="mb-4">
        <p className="text-justify mb-2">
          The <strong>MANYAME</strong> Catchment Council hereby grants a <sup>*</sup>Temporary/Provisional General
        </p>
        <p className="text-justify mb-4">Abstraction Permit to:</p>

        <div className="mb-4">
          <p className="text-justify">
            Catchment: <strong>MANYAME</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Sub-Catchment: <strong>UPPER MANYAME</strong>
          </p>
        </div>
      </div>

      {/* Applicant Details */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-justify">
            1. Name of Applicant: <strong>{permitData.applicantName}</strong>
          </p>
        </div>

        <div className="flex justify-between">
          <div className="flex-1">
            <p className="text-justify">
              2. Physical address: <strong>{permitData.physicalAddress}</strong>
            </p>
          </div>
          <div className="flex-1 ml-8">
            <p className="text-justify">3. Postal address: {permitData.postalAddress || "N/A"}</p>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex-1">
            <p className="text-justify">
              4. Number of drilled boreholes: <strong>{permitData.numberOfBoreholes}</strong>
            </p>
          </div>
          <div className="flex-1 ml-8">
            <p className="text-justify">
              5. Size of land or property: <strong>{permitData.landSize}</strong> (ha)
            </p>
          </div>
        </div>

        <div>
          <p className="text-justify">
            Total allocated abstraction (m<sup>3</sup>/annum):{" "}
            <strong>{permitData.totalAllocatedAbstraction.toLocaleString()}</strong>
          </p>
        </div>
      </div>

      {/* Borehole Details Table */}
      <div className="mb-4">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <td rowSpan={2} className="border-2 border-black p-1 text-center font-bold w-6">
                &nbsp;
              </td>
              <td rowSpan={2} className="border-2 border-black p-1 text-center font-bold" style={{ width: "54pt" }}>
                Borehole (BH)-No.
              </td>
              <td rowSpan={2} className="border-2 border-black p-1 text-center font-bold" style={{ width: "54pt" }}>
                BH-No. Allocated
              </td>
              <td rowSpan={2} className="border-2 border-black p-1 text-center font-bold" style={{ width: "54pt" }}>
                Grid Reference
              </td>
              <td colSpan={2} className="border-2 border-black p-1 text-center font-bold" style={{ width: "94.5pt" }}>
                GPS reading
              </td>
              <td rowSpan={2} className="border-2 border-black p-1 text-center font-bold" style={{ width: "76.5pt" }}>
                Intended use<sup>a</sup>
              </td>
              <td rowSpan={2} className="border-2 border-black p-1 text-center font-bold" style={{ width: "63pt" }}>
                Maximum abstraction rate (m<sup>3</sup>/annum)
              </td>
              <td rowSpan={2} className="border-2 border-black p-1 text-center font-bold" style={{ width: "72.45pt" }}>
                Water sample analysis every _____________ months/years
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1 text-center font-bold">X</td>
              <td className="border border-black p-1 text-center font-bold">Y</td>
            </tr>
          </thead>
          <tbody>
            {permitData.boreholeDetails.map((borehole, index) => (
              <tr key={index}>
                <td className="border border-black p-1 text-center font-bold">{index + 1}</td>
                <td className="border border-black p-1 text-center">{borehole.boreholeNumber}</td>
                <td className="border border-black p-1 text-center">{borehole.allocatedAmount.toLocaleString()}</td>
                <td className="border border-black p-1 text-center">-</td>
                <td className="border border-black p-1 text-center">{borehole.gpsX}</td>
                <td className="border border-black p-1 text-center">{borehole.gpsY}</td>
                <td className="border border-black p-1 text-center">{borehole.intendedUse}</td>
                <td className="border border-black p-1 text-center">
                  {borehole.maxAbstractionRate?.toLocaleString() || borehole.allocatedAmount.toLocaleString()}
                </td>
                <td className="border border-black p-1 text-center">{borehole.waterSampleFrequency || "3 months"}</td>
              </tr>
            ))}
            {/* Fill empty rows if less than 5 boreholes */}
            {Array.from({ length: Math.max(0, 5 - permitData.boreholeDetails.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-black p-1 text-center font-bold">
                  {permitData.boreholeDetails.length + index + 1}
                </td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs mt-1">
          <sup>a</sup> Intended use: irrigation, livestock farming, industrial, mining, urban, national parks, other
          (specify): <strong>{permitData.intendedUse.toUpperCase()}</strong>
        </p>
      </div>

      {/* Permit Registration */}
      <div className="mb-4">
        <p className="text-justify mb-2">
          This Temporary/Provisional<sup>*</sup> Specific Abstraction Permit has been recorded in the register as:
        </p>
        <p className="text-justify">
          Permit No: <strong>{permitData.permitNumber}</strong>{" "}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Valid until:{" "}
          <strong>{permitData.validUntil}</strong>
        </p>
      </div>

      {/* CONDITIONS */}
      <div className="mb-4">
        <h5 className="text-center font-bold mb-2">CONDITIONS</h5>

        <div className="space-y-2 text-xs text-justify">
          <p>
            It is illegal to abstract groundwater for any other purpose other than primary purposes without an
            abstraction permit. The owner of the property who wishes to abstract water in terms of this permit must
            observe his obligations under the technical specifications contained in the "Operational Guidelines for
            Boreholes, Groundwater Monitoring and Groundwater Use".
          </p>

          <p>
            All forms on which to record information as required by the permit are provided by the relevant Catchment
            Council. The owner of the property shall submit the borehole monitoring data recorded every{" "}
            <strong>month</strong>, or as specified by the Catchment Council, on Form GW 8 to the relevant Catchment
            Council (Catchment Manager's office) every <strong>three</strong> months or as specified by the Catchment
            Council.
          </p>

          <p>
            The Catchment Council reserves the right to review the conditions of this permit in accordance with the
            Water Act, [<em>Chapter 20:24</em>].
          </p>

          <p>
            In the event that the Minister declares part of or the whole Catchment area a groundwater development
            restriction area, the Catchment Council has the right in terms of the Water Act, [<em>Chapter 20:24</em>],
            to suspend or amend any permit, restrict the abstractions, limit the validity period of the permit and
            determine the priority use of the water by re-issuing the permit.
          </p>
        </div>
      </div>

      {/* ADDITIONAL CONDITIONS */}
      <div className="mb-6">
        <h5 className="text-center font-bold mb-2">ADDITIONAL CONDITIONS</h5>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>To install flow meters on all boreholes and keep records of water used</li>
          <li>Water Quality Analysis is to be carried out at most after every 3 months</li>
          <li>To submit abstraction and water quality records to catchment offices every six (6) months</li>
          <li>To allow unlimited access to ZINWA and SUB-CATCHMENT COUNCIL staff</li>
          <li>No cost shall be demanded from the Catchment Council in the event of permit cancellation</li>
        </ol>
      </div>

      {/* Signature Section */}
      <div className="mt-8">
        <div className="flex justify-between text-xs">
          <div className="text-center" style={{ width: "33%" }}>
            <div className="border-b border-black mb-1 h-8 flex items-end">
              <span className="text-xs">ENDY MHLANGA</span>
            </div>
            <p>
              Name (<em>print</em>)
            </p>
          </div>
          <div className="text-center" style={{ width: "33%" }}>
            <div className="border-b border-black mb-1 h-8"></div>
            <p>Signature</p>
          </div>
          <div className="text-center" style={{ width: "33%" }}>
            <div className="border-b border-black mb-1 h-8"></div>
            <p>Official Date Stamp</p>
          </div>
        </div>
        <p className="text-center text-xs mt-2">(Catchment Council Chairperson)</p>
      </div>
    </div>
  )
}
