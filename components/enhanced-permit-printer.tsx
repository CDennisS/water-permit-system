"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Eye, FileText, Calendar, Droplets } from "lucide-react"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/permit-generator"
import type { PermitApplication, User } from "@/types"

interface EnhancedPermitPrinterProps {
  application: PermitApplication
  user: User
  disabled?: boolean
}

export function EnhancedPermitPrinter({ application, user, disabled = false }: EnhancedPermitPrinterProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const permitData = preparePermitData(application)

  const getPrintStatus = () => {
    if (application.status !== "approved") {
      return { canPrint: false, reason: "Application must be approved first" }
    }

    if (!["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)) {
      return { canPrint: false, reason: "Insufficient permissions to print permits" }
    }

    return { canPrint: true, reason: "Ready to print" }
  }

  const handlePrint = async () => {
    setIsPrinting(true)

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank", "width=800,height=600")
      if (!printWindow) {
        alert("Please allow popups to print permits")
        return
      }

      const permitElement = document.getElementById("permit-template")
      if (!permitElement) {
        alert("Permit template not found")
        return
      }

      // Enhanced print styles
      const printStyles = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Water Permit ${permitData.permitNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Times New Roman', serif; 
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                background: white;
              }
              .permit-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 20mm;
                background: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
              }
              .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 15px;
                border: 2px solid #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 24px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .subtitle {
                font-size: 14px;
                margin-bottom: 10px;
              }
              .permit-number {
                font-size: 16px;
                font-weight: bold;
                background: #f0f0f0;
                padding: 10px;
                border: 1px solid #000;
                margin: 20px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                margin: 20px 0 10px 0;
                padding: 5px 0;
                border-bottom: 1px solid #000;
              }
              .conditions {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #000;
                background: #f9f9f9;
              }
              .signatures {
                margin-top: 40px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
              }
              .signature-block {
                text-align: center;
                border-top: 1px solid #000;
                padding-top: 10px;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 72px;
                color: rgba(0, 0, 0, 0.1);
                z-index: -1;
                pointer-events: none;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
                .permit-container { 
                  max-width: none; 
                  margin: 0; 
                  padding: 15mm;
                }
                @page {
                  size: A4;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="watermark">UMSCC</div>
            ${permitElement.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            </script>
          </body>
        </html>
      `

      printWindow.document.write(printStyles)
      printWindow.document.close()
    } catch (error) {
      console.error("Print error:", error)
      alert("Failed to print permit. Please try again.")
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPDF = () => {
    // Simulate PDF download - in production, this would generate an actual PDF
    const pdfContent = `
WATER PERMIT - ${permitData.permitNumber}
Upper Manyame Sub Catchment Council

Applicant: ${permitData.applicantName}
Physical Address: ${permitData.physicalAddress}
Postal Address: ${permitData.postalAddress}

Permit Details:
- Number of Boreholes: ${permitData.numberOfBoreholes}
- Land Size: ${permitData.landSize} hectares
- Total Water Allocation: ${permitData.totalAllocatedAbstraction} ML
- Intended Use: ${permitData.intendedUse}
- Valid Until: ${permitData.validUntil}
- Issue Date: ${permitData.issueDate}

Borehole Details:
${permitData.boreholeDetails
  .map(
    (bh, i) => `
Borehole ${i + 1}:
- Allocated Amount: ${bh.allocatedAmount} ML
- GPS Coordinates: ${bh.gpsX}, ${bh.gpsY}
- Max Abstraction Rate: ${bh.maxAbstractionRate} ML
- Water Sample Frequency: ${bh.waterSampleFrequency}
`,
  )
  .join("")}

This permit is issued by the Upper Manyame Sub Catchment Council
and is valid until ${permitData.validUntil}.
    `

    const blob = new Blob([pdfContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Water_Permit_${permitData.permitNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printStatus = getPrintStatus()

  if (disabled || !printStatus.canPrint) {
    return (
      <div className="flex items-center space-x-2">
        <Button disabled variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Permit
        </Button>
        {!printStatus.canPrint && <span className="text-xs text-gray-500">{printStatus.reason}</span>}
      </div>
    )
  }

  return (
    <div className="flex space-x-2">
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Water Permit Preview - {permitData.permitNumber}
            </DialogTitle>
          </DialogHeader>

          {/* Permit Preview Summary */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Permit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Permit Number</p>
                    <p className="text-sm text-gray-600">{permitData.permitNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Valid Until</p>
                    <p className="text-sm text-gray-600">{permitData.validUntil}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Water Allocation</p>
                    <p className="text-sm text-gray-600">{permitData.totalAllocatedAbstraction} ML</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Permit Template */}
          <div id="permit-template" className="border rounded-lg p-6 bg-white">
            <PermitTemplate permitData={permitData} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-4 no-print">
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? "Printing..." : "Print Permit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Print Button */}
      <Button onClick={handlePrint} size="sm" disabled={isPrinting}>
        <Printer className="h-4 w-4 mr-2" />
        {isPrinting ? "Printing..." : "Print"}
      </Button>

      {/* Status Badge */}
      {application.status === "approved" && (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <FileText className="h-3 w-3 mr-1" />
          Ready to Print
        </Badge>
      )}
    </div>
  )
}
