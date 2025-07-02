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
        lineHeight: "1.2",
        minHeight: "297mm", // A4 height
        width: "210mm", // A4 width
        margin: "0 auto",
        padding: "7.5mm 19mm 10mm 19mm", // Reduced padding for more space
        boxSizing: "border-box",
      }}
    >
      {/* Form Number - Top Right */}
      <div className="text-right mb-2">
        <p className="text-sm font-normal">Form GW7B</p>
      </div>

      {/* Title Section */}
      <div className="text-center mb-4">
        <h1 className="text-sm font-bold mb-2 underline">
          TEMPORARY/PROVISIONAL<sup>*</sup> SPECIFIC GROUNDWATER ABSTRACTION PERMIT
        </h1>
        <p className="text-xs italic mb-4">(Section 15 (3) (a) of Water (Permits) Regulations, 2001)</p>
      </div>

      {/* Official Stamp Area - Simplified */}
      <div className="flex justify-between items-center mb-4">
        <div className="border border-black px-2 py-1 text-xs">OFFICIAL STAMP</div>
        <div className="w-16 h-12 border border-gray-300 flex items-center justify-center text-xs">LOGO</div>
      </div>

      {/* Grant Statement */}
      <div className="mb-3">
        <p className="text-sm mb-2">
          The <strong>MANYAME</strong> Catchment Council hereby grants a <sup>*</sup>Temporary/Provisional General
        </p>
        <p className="text-sm mb-2">Abstraction Permit to:</p>
      </div>

      {/* Catchment Info */}
      <div className="mb-3">
        <p className="text-sm">
          Catchment: <strong>MANYAME</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Sub-Catchment: <strong>UPPER MANYAME</strong>
        </p>
      </div>

      {/* Applicant Details */}
      <div className="space-y-2 mb-3">
        <div>
          <p className="text-sm">
            1. Name of Applicant: <strong>{permitData.applicantName}</strong>
          </p>
        </div>

        <div className="flex justify-between">
          <div className="flex-1">
            <p className="text-sm">
              2. Physical address: <strong>{permitData.physicalAddress}</strong>
            </p>
          </div>
          <div className="flex-1 ml-4">
            <p className="text-sm">
              3. Postal address: <strong>{permitData.postalAddress || "N/A"}</strong>
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex-1">
            <p className="text-sm">
              4. Number of drilled boreholes: <strong>{permitData.numberOfBoreholes}</strong>
            </p>
          </div>
          <div className="flex-1 ml-4">
            <p className="text-sm">
              5. Size of land or property: <strong>{permitData.landSize} (ha)</strong>
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm">
            Total allocated abstraction (m<sup>3</sup>/annum):{" "}
            <strong>{permitData.totalAllocatedAbstraction.toLocaleString()}</strong>
          </p>
        </div>
      </div>

      {/* Borehole Details Table - Compact */}
      <div className="mb-3">
        <table className="w-full border-collapse text-xs" style={{ border: "2px solid black" }}>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="border border-black p-1 text-center w-8"
                style={{ borderLeft: "2px solid black" }}
              >
                <strong>Borehole (BH)-No.</strong>
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center w-16">
                <strong>BH-No. Allocated</strong>
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center w-16">
                <strong>Grid Reference</strong>
              </th>
              <th colSpan={2} className="border border-black p-1 text-center w-20">
                <strong>GPS reading</strong>
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center w-20">
                <strong>
                  Intended use<sup>a</sup>
                </strong>
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center w-16">
                <strong>
                  Maximum abstraction rate (m<sup>3</sup>/annum)
                </strong>
              </th>
              <th
                rowSpan={2}
                className="border border-black p-1 text-center w-16"
                style={{ borderRight: "2px solid black" }}
              >
                <strong>Water sample analysis every _______ months/years</strong>
              </th>
            </tr>
            <tr>
              <th className="border border-black p-1 text-center w-10">
                <strong>X</strong>
              </th>
              <th className="border border-black p-1 text-center w-10">
                <strong>Y</strong>
              </th>
            </tr>
          </thead>
          <tbody>
            {permitData.boreholeDetails.map((borehole, index) => (
              <tr key={index}>
                <td
                  className="border border-black p-1 text-center"
                  style={{ borderLeft: index === 0 ? "2px solid black" : "1px solid black" }}
                >
                  <strong>{index + 1}</strong>
                </td>
                <td className="border border-black p-1 text-center">{borehole.allocatedAmount.toLocaleString()}</td>
                <td className="border border-black p-1 text-center">&nbsp;</td>
                <td className="border border-black p-1 text-center">{borehole.gpsX}</td>
                <td className="border border-black p-1 text-center">{borehole.gpsY}</td>
                <td className="border border-black p-1 text-center">{borehole.intendedUse}</td>
                <td className="border border-black p-1 text-center">{borehole.maxAbstractionRate.toLocaleString()}</td>
                <td className="border border-black p-1 text-center" style={{ borderRight: "2px solid black" }}>
                  {borehole.waterSampleFrequency}
                </td>
              </tr>
            ))}
            {/* Fill remaining rows to make 5 total */}
            {Array.from({ length: Math.max(0, 5 - permitData.boreholeDetails.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-black p-1 text-center" style={{ borderLeft: "2px solid black" }}>
                  <strong>{permitData.boreholeDetails.length + index + 1}</strong>
                </td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1">&nbsp;</td>
                <td className="border border-black p-1" style={{ borderRight: "2px solid black" }}>
                  &nbsp;
                </td>
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
      <div className="mb-3">
        <p className="text-sm mb-2">
          This Temporary/Provisional<sup>*</sup> Specific Abstraction Permit has been recorded in the register as:
        </p>
        <p className="text-sm">
          Permit No: <strong>{permitData.permitNumber}</strong>{" "}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Valid until:{" "}
          <strong>{permitData.validUntil}</strong>
        </p>
      </div>

      {/* CONDITIONS */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-center mb-2">CONDITIONS</h3>

        <div className="space-y-2 text-xs">
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
      <div className="mb-4">
        <h3 className="text-sm font-bold text-center mb-2">ADDITIONAL CONDITIONS</h3>
        <ol className="list-decimal list-inside space-y-1 text-xs ml-4">
          <li>To install flow meters on all boreholes and keep records of water used</li>
          <li>Water Quality Analysis is to be carried out at most after every 3 months</li>
          <li>To submit abstraction and water quality records to catchment offices every six (6) months</li>
          <li>To allow unlimited access to ZINWA and SUB-CATCHMENT COUNCIL staff</li>
          <li>No cost shall be demanded from the Catchment Council in the event of permit cancellation</li>
        </ol>
      </div>

      {/* Signature Section - Compact */}
      <div className="mt-4">
        <div className="flex justify-between items-end text-xs">
          <div className="text-center">
            <div className="border-b border-black w-32 h-8 mb-1"></div>
            <p>
              Name (<em>print</em>)
            </p>
          </div>
          <div className="text-center">
            <div className="border-b border-black w-32 h-8 mb-1"></div>
            <p>Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black w-24 h-8 mb-1"></div>
            <p>Official Date Stamp</p>
          </div>
        </div>
        <p className="text-center text-xs mt-2">(Catchment Council Chairperson)</p>
      </div>

      {/* Footer - Minimal */}
      <div className="mt-2 text-center text-xs text-gray-600">
        <p>Generated: {new Date().toLocaleDateString("en-ZA")} | UMSCC Permit System</p>
      </div>
    </div>
  )
}
