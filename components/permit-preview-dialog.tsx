"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Printer, Download } from "lucide-react"
import type { PermitApplication, User, PermitData, BoreholeDetail } from "@/types"

interface PermitPreviewDialogProps {
  application: PermitApplication
  user: User
  trigger?: React.ReactNode
}

export function PermitPreviewDialog({ application, user, trigger }: PermitPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Generate permit data from application
  const generatePermitData = (): PermitData => {
    const permitNumber = application.permitNumber || `WP-${application.applicationId}-${new Date().getFullYear()}`
    const issueDate = new Date().toLocaleDateString("en-GB")
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB") // 1 year from now

    // Generate borehole details
    const boreholeDetails: BoreholeDetail[] = []
    for (let i = 1; i <= application.numberOfBoreholes; i++) {
      boreholeDetails.push({
        boreholeNumber: `BH-${i.toString().padStart(3, "0")}`,
        allocatedAmount: Math.round(application.waterAllocation / application.numberOfBoreholes),
        gpsX: application.gpsLatitude.toFixed(6),
        gpsY: application.gpsLongitude.toFixed(6),
        intendedUse: application.intendedUse,
        maxAbstractionRate: Math.round((application.waterAllocation / application.numberOfBoreholes / 365) * 1000), // L/day
        waterSampleFrequency: "Monthly",
      })
    }

    return {
      permitNumber,
      applicantName: application.applicantName,
      physicalAddress: application.physicalAddress,
      postalAddress: application.postalAddress,
      landSize: application.landSize,
      numberOfBoreholes: application.numberOfBoreholes,
      totalAllocatedAbstraction: application.waterAllocation,
      intendedUse: application.intendedUse,
      validUntil,
      issueDate,
      boreholeDetails,
      gpsCoordinates: {
        latitude: application.gpsLatitude.toFixed(6),
        longitude: application.gpsLongitude.toFixed(6),
      },
      catchment: "Upper Manyame",
      subCatchment: "Upper Manyame Sub Catchment",
      permitType: application.permitType === "water_extraction" ? "Water Extraction Permit" : "Water Use Permit",
    }
  }

  const handlePrint = () => {
    setIsLoading(true)
    try {
      const permitData = generatePermitData()
      const printWindow = window.open("", "_blank")

      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Water Permit - ${permitData.permitNumber}</title>
              <style>
                @page {
                  size: A4;
                  margin: 20mm;
                }
                body {
                  font-family: 'Times New Roman', serif;
                  line-height: 1.4;
                  color: #000;
                  margin: 0;
                  padding: 0;
                  font-size: 12pt;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 3px solid #000;
                  padding-bottom: 20px;
                }
                .header h1 {
                  font-size: 20pt;
                  font-weight: bold;
                  margin: 0 0 10px 0;
                  text-transform: uppercase;
                }
                .header h2 {
                  font-size: 16pt;
                  margin: 5px 0;
                  font-weight: normal;
                }
                .permit-number {
                  font-size: 14pt;
                  font-weight: bold;
                  text-align: center;
                  margin: 20px 0;
                  padding: 10px;
                  border: 2px solid #000;
                  background-color: #f0f0f0;
                }
                .section {
                  margin-bottom: 25px;
                }
                .section-title {
                  font-size: 14pt;
                  font-weight: bold;
                  margin-bottom: 15px;
                  border-bottom: 1px solid #000;
                  padding-bottom: 5px;
                }
                .details-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 15px;
                }
                .detail-item {
                  margin-bottom: 10px;
                }
                .detail-label {
                  font-weight: bold;
                  margin-bottom: 3px;
                }
                .detail-value {
                  margin-left: 10px;
                }
                .borehole-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
                }
                .borehole-table th,
                .borehole-table td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
                }
                .borehole-table th {
                  background-color: #f0f0f0;
                  font-weight: bold;
                }
                .conditions {
                  margin-top: 30px;
                  padding: 15px;
                  border: 2px solid #000;
                  background-color: #f9f9f9;
                }
                .conditions h3 {
                  margin-top: 0;
                  font-size: 14pt;
                  font-weight: bold;
                }
                .conditions ol {
                  margin: 10px 0;
                  padding-left: 20px;
                }
                .conditions li {
                  margin-bottom: 8px;
                }
                .footer {
                  margin-top: 40px;
                  text-align: center;
                  font-size: 10pt;
                  border-top: 1px solid #000;
                  padding-top: 15px;
                }
                .signature-section {
                  margin-top: 40px;
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 50px;
                }
                .signature-box {
                  text-align: center;
                  border-top: 1px solid #000;
                  padding-top: 10px;
                  margin-top: 40px;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Republic of Zimbabwe</h1>
                <h2>Upper Manyame Sub Catchment Council</h2>
                <h2>Water Extraction Permit</h2>
              </div>

              <div class="permit-number">
                PERMIT NUMBER: ${permitData.permitNumber}
              </div>

              <div class="section">
                <div class="section-title">Permit Holder Details</div>
                <div class="details-grid">
                  <div class="detail-item">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">${permitData.applicantName}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Issue Date:</div>
                    <div class="detail-value">${permitData.issueDate}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Physical Address:</div>
                    <div class="detail-value">${permitData.physicalAddress}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Valid Until:</div>
                    <div class="detail-value">${permitData.validUntil}</div>
                  </div>
                  ${
                    permitData.postalAddress
                      ? `
                  <div class="detail-item">
                    <div class="detail-label">Postal Address:</div>
                    <div class="detail-value">${permitData.postalAddress}</div>
                  </div>
                  `
                      : ""
                  }
                </div>
              </div>

              <div class="section">
                <div class="section-title">Water Allocation Details</div>
                <div class="details-grid">
                  <div class="detail-item">
                    <div class="detail-label">Total Allocated Abstraction:</div>
                    <div class="detail-value">${permitData.totalAllocatedAbstraction} m³/annum</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Intended Use:</div>
                    <div class="detail-value">${permitData.intendedUse}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Land Size:</div>
                    <div class="detail-value">${permitData.landSize} hectares</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Number of Boreholes:</div>
                    <div class="detail-value">${permitData.numberOfBoreholes}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Borehole Details</div>
                <table class="borehole-table">
                  <thead>
                    <tr>
                      <th>Borehole No.</th>
                      <th>GPS Coordinates</th>
                      <th>Allocated Amount (m³/annum)</th>
                      <th>Max Abstraction Rate (L/day)</th>
                      <th>Intended Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${permitData.boreholeDetails
                      .map(
                        (borehole) => `
                      <tr>
                        <td>${borehole.boreholeNumber}</td>
                        <td>Lat: ${borehole.gpsX}, Long: ${borehole.gpsY}</td>
                        <td>${borehole.allocatedAmount}</td>
                        <td>${borehole.maxAbstractionRate || "N/A"}</td>
                        <td>${borehole.intendedUse}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>

              <div class="conditions">
                <h3>Permit Conditions</h3>
                <ol>
                  <li>This permit is valid for water extraction from the specified boreholes only.</li>
                  <li>The permit holder must not exceed the allocated water abstraction limits.</li>
                  <li>Water quality testing must be conducted ${permitData.boreholeDetails[0]?.waterSampleFrequency?.toLowerCase() || "regularly"} and results submitted to UMSCC.</li>
                  <li>Any changes to the intended use of water must be approved by UMSCC.</li>
                  <li>The permit holder must maintain accurate records of water abstraction.</li>
                  <li>This permit is not transferable without prior written approval from UMSCC.</li>
                  <li>The permit holder must comply with all relevant environmental regulations.</li>
                  <li>UMSCC reserves the right to inspect the water extraction facilities at any time.</li>
                  <li>Failure to comply with these conditions may result in permit suspension or revocation.</li>
                  <li>This permit must be renewed annually before the expiry date.</li>
                </ol>
              </div>

              <div class="signature-section">
                <div class="signature-box">
                  <div>Authorized Officer</div>
                  <div>Upper Manyame Sub Catchment Council</div>
                </div>
                <div class="signature-box">
                  <div>Date of Issue</div>
                  <div>${permitData.issueDate}</div>
                </div>
              </div>

              <div class="footer">
                <p>This permit is issued under the Water Act [Chapter 20:24] and UMSCC regulations.</p>
                <p>Upper Manyame Sub Catchment Council | Contact: info@umscc.co.zw</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      } else {
        alert("Please allow popups to print the permit.")
      }
    } catch (error) {
      console.error("Print error:", error)
      alert("Failed to print permit. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    setIsLoading(true)
    try {
      const permitData = generatePermitData()
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Water Permit - ${permitData.permitNumber}</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; }
              .permit-details { margin-bottom: 20px; }
              .detail-row { margin-bottom: 10px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Upper Manyame Sub Catchment Council</h1>
              <h2>Water Extraction Permit</h2>
              <h3>Permit Number: ${permitData.permitNumber}</h3>
            </div>
            <div class="permit-details">
              <div class="detail-row"><span class="label">Applicant:</span> ${permitData.applicantName}</div>
              <div class="detail-row"><span class="label">Address:</span> ${permitData.physicalAddress}</div>
              <div class="detail-row"><span class="label">Water Allocation:</span> ${permitData.totalAllocatedAbstraction} m³/annum</div>
              <div class="detail-row"><span class="label">Intended Use:</span> ${permitData.intendedUse}</div>
              <div class="detail-row"><span class="label">Valid Until:</span> ${permitData.validUntil}</div>
            </div>
          </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `permit-${permitData.permitNumber}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download permit. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user can preview permits
  const canPreview =
    user.userType === "permitting_officer" || user.userType === "permit_supervisor" || user.userType === "ict"

  if (!canPreview) {
    return null
  }

  // Check if application is approved
  if (application.status !== "approved") {
    return null
  }

  const permitData = generatePermitData()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview Permit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Permit Preview - {permitData.permitNumber}</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {application.status.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={isLoading}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Permit Header */}
          <Card>
            <CardHeader className="text-center bg-blue-50">
              <CardTitle className="text-xl">
                Republic of Zimbabwe
                <br />
                Upper Manyame Sub Catchment Council
                <br />
                Water Extraction Permit
              </CardTitle>
              <div className="text-lg font-bold border-2 border-blue-600 p-2 mt-4">
                PERMIT NUMBER: {permitData.permitNumber}
              </div>
            </CardHeader>
          </Card>

          {/* Permit Holder Details */}
          <Card>
            <CardHeader>
              <CardTitle>Permit Holder Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <strong>Name:</strong> {permitData.applicantName}
              </div>
              <div>
                <strong>Issue Date:</strong> {permitData.issueDate}
              </div>
              <div>
                <strong>Physical Address:</strong> {permitData.physicalAddress}
              </div>
              <div>
                <strong>Valid Until:</strong> {permitData.validUntil}
              </div>
              {permitData.postalAddress && (
                <div className="col-span-2">
                  <strong>Postal Address:</strong> {permitData.postalAddress}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Water Allocation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Water Allocation Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <strong>Total Allocated Abstraction:</strong> {permitData.totalAllocatedAbstraction} m³/annum
              </div>
              <div>
                <strong>Intended Use:</strong> {permitData.intendedUse}
              </div>
              <div>
                <strong>Land Size:</strong> {permitData.landSize} hectares
              </div>
              <div>
                <strong>Number of Boreholes:</strong> {permitData.numberOfBoreholes}
              </div>
            </CardContent>
          </Card>

          {/* Borehole Details */}
          <Card>
            <CardHeader>
              <CardTitle>Borehole Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Borehole No.</th>
                      <th className="border border-gray-300 p-2 text-left">GPS Coordinates</th>
                      <th className="border border-gray-300 p-2 text-left">Allocated Amount (m³/annum)</th>
                      <th className="border border-gray-300 p-2 text-left">Max Abstraction Rate (L/day)</th>
                      <th className="border border-gray-300 p-2 text-left">Intended Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permitData.boreholeDetails.map((borehole, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2">{borehole.boreholeNumber}</td>
                        <td className="border border-gray-300 p-2">
                          Lat: {borehole.gpsX}, Long: {borehole.gpsY}
                        </td>
                        <td className="border border-gray-300 p-2">{borehole.allocatedAmount}</td>
                        <td className="border border-gray-300 p-2">{borehole.maxAbstractionRate || "N/A"}</td>
                        <td className="border border-gray-300 p-2">{borehole.intendedUse}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Permit Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Permit Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>This permit is valid for water extraction from the specified boreholes only.</li>
                <li>The permit holder must not exceed the allocated water abstraction limits.</li>
                <li>Water quality testing must be conducted monthly and results submitted to UMSCC.</li>
                <li>Any changes to the intended use of water must be approved by UMSCC.</li>
                <li>The permit holder must maintain accurate records of water abstraction.</li>
                <li>This permit is not transferable without prior written approval from UMSCC.</li>
                <li>The permit holder must comply with all relevant environmental regulations.</li>
                <li>UMSCC reserves the right to inspect the water extraction facilities at any time.</li>
                <li>Failure to comply with these conditions may result in permit suspension or revocation.</li>
                <li>This permit must be renewed annually before the expiry date.</li>
              </ol>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card className="bg-gray-50">
            <CardContent className="text-center text-sm text-gray-600 py-4">
              <p>This permit is issued under the Water Act [Chapter 20:24] and UMSCC regulations.</p>
              <p>Upper Manyame Sub Catchment Council | Contact: info@umscc.co.zw</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
