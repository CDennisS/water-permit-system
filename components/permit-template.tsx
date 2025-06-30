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
      className="bg-white p-8 max-w-4xl mx-auto"
      style={{ fontFamily: '"Times New Roman", serif', fontSize: "10pt", lineHeight: "1.4" }}
    >
      {/* Header */}
      <div className="text-right mb-4">
        <span className="font-normal">Form GW7B</span>
      </div>

      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-lg font-bold underline mb-2">
          TEMPORARY/PROVISIONAL<sup>*</sup> SPECIFIC GROUNDWATER ABSTRACTION PERMIT
        </h1>
        <p className="text-sm italic">(Section 15 (3) (a) of Water (Permits) Regulations, 2001)</p>
      </div>

      {/* Official Stamps Area */}
      <div className="flex justify-between items-start mb-6">
        <div className="border border-black p-2 text-xs">OFFICIAL STAMP</div>
        <div className="border border-black p-4 w-20 h-16 flex items-center justify-center text-xs">LOGO</div>
      </div>

      {/* Grant Statement */}
      <div className="mb-4">
        <p className="text-justify">
          The <strong>MANYAME</strong> Catchment Council hereby grants a <sup>*</sup>Temporary/Provisional General
        </p>
        <p className="text-justify">Abstraction Permit to:</p>
      </div>

      {/* Main Content Table */}
      <div className="border-none mb-4">
        {/* Catchment Info */}
        <div className="mb-4">
          <p className="text-justify">
            Catchment: <strong>MANYAME</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Sub-Catchment: <strong>UPPER MANYAME</strong>
          </p>
        </div>

        {/* Applicant Details */}
        <div className="mb-4">
          <p className="text-justify">
            1. Name of Applicant: <strong>{permitData.applicantName}</strong>
          </p>
        </div>

        <div className="mb-4">
          <p className="text-justify">
            2. Physical address: <strong>{permitData.physicalAddress}</strong>{" "}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3. Postal address:{" "}
            <strong>{permitData.postalAddress || "N/A"}</strong>
          </p>
        </div>

        <div className="mb-4">
          <p className="text-justify">
            4. Number of drilled boreholes: <strong>{permitData.numberOfBoreholes}</strong>{" "}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 5. Size of land or property:{" "}
            <strong>{permitData.landSize} ha</strong>
          </p>
        </div>

        <div className="mb-4">
          <p className="text-justify">
            Total allocated abstraction (m<sup>3</sup>/annum):{" "}
            <strong>{permitData.totalAllocatedAbstraction.toLocaleString()}</strong>
          </p>
        </div>

        {/* Borehole Details Table */}
        <table className="w-full border-collapse border-2 border-black mb-4" style={{ fontSize: "9pt" }}>
          <thead>
            <tr>
              <th rowSpan={2} className="border border-black p-1 text-center font-bold w-8">
                &nbsp;
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center font-bold">
                Borehole (BH)-No.
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center font-bold">
                BH-No. Allocated
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center font-bold">
                Grid Reference
              </th>
              <th colSpan={2} className="border border-black p-1 text-center font-bold">
                GPS reading
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center font-bold">
                Intended use<sup>a</sup>
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center font-bold">
                Maximum abstraction rate (m<sup>3</sup>/annum)
              </th>
              <th rowSpan={2} className="border border-black p-1 text-center font-bold">
                Water sample analysis every
                <br />
                <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>
                <br />
                months/years
              </th>
            </tr>
            <tr>
              <th className="border border-black p-1 text-center font-bold">X</th>
              <th className="border border-black p-1 text-center font-bold">Y</th>
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

        <div className="mb-4 text-xs">
          <p>
            <sup>a</sup> Intended use: irrigation, livestock farming, industrial, mining, urban, national parks, other
            (specify):
          </p>
        </div>

        {/* Permit Registration */}
        <div className="mb-4">
          <p className="text-justify">
            This Temporary/Provisional<sup>*</sup> Specific Abstraction Permit has been recorded in the register as:
          </p>
        </div>

        <div className="mb-6">
          <p className="text-justify">
            Permit No: <strong>{permitData.permitNumber}</strong>{" "}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Valid until:{" "}
            <strong>{permitData.validUntil}</strong>
          </p>
        </div>

        {/* Conditions Section */}
        <div className="mb-4">
          <h3 className="text-center font-bold underline mb-2">CONDITIONS</h3>

          <p className="text-justify mb-2">
            It is illegal to abstract groundwater for any other purpose other than primary purposes without an
            abstraction permit. The owner of the property who wishes to abstract water in terms of this permit must
            observe his obligations under the technical specifications contained in the "Operational Guidelines for
            Boreholes, Groundwater Monitoring and Groundwater Use".
          </p>

          <p className="text-justify mb-2">
            All forms on which to record information as required by the permit are provided by the relevant Catchment
            Council. The owner of the property shall submit the borehole monitoring data recorded every{" "}
            <strong>month</strong>, or as specified by the Catchment Council, on Form GW 8 to the relevant Catchment
            Council (Catchment Manager's office) every <strong>three</strong> months or as specified by the Catchment
            Council.
          </p>

          <p className="text-justify mb-2">
            The Catchment Council reserves the right to review the conditions of this permit in accordance with the
            Water Act, [<em>Chapter 20:24</em>].
          </p>

          <p className="text-justify mb-4">
            In the event that the Minister declares part of or the whole Catchment area a groundwater development
            restriction area, the Catchment Council has the right in terms of the Water Act, [<em>Chapter 20:24</em>],
            to suspend or amend any permit, restrict the abstractions, limit the validity period of the permit and
            determine the priority use of the water by re-issuing the permit.
          </p>

          <h4 className="font-bold text-center mb-2">ADDITIONAL CONDITIONS</h4>
          <ol className="list-decimal list-inside space-y-1 mb-6">
            <li>To install flow meters on all boreholes and keep records of water used</li>
            <li>Water Quality Analysis is to be carried out at most after every 3 months</li>
            <li>To submit abstraction and water quality records to catchment offices every six (6) months</li>
            <li>To allow unlimited access to ZINWA and SUB-CATCHMENT COUNCIL staff</li>
            <li>No cost shall be demanded from the Catchment Council in the event of permit cancellation</li>
          </ol>
        </div>

        {/* Signature Section */}
        <div className="mt-8">
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="border-b border-black w-48 mb-1">ENDY MHLANGA</div>
              <p className="text-xs">
                Name (<em>print</em>)
              </p>
            </div>
            <div className="text-center">
              <div className="border-b border-black w-48 mb-1">&nbsp;</div>
              <p className="text-xs">Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-black w-32 mb-1">&nbsp;</div>
              <p className="text-xs">Official Date Stamp</p>
            </div>
          </div>
          <p className="text-center mt-2">(Catchment Council Chairperson)</p>
        </div>
      </div>
    </div>
  )
}
