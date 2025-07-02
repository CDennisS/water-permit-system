"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PermitTemplate } from "./permit-template"
import { FileText, Printer, Download } from "lucide-react"
import { toast } from "sonner"
import type { PermitData } from "@/types"

// Sample permit data for testing
const samplePermitData: PermitData = {
  permitNumber: "UMSCC-2025-01-0001",
  applicantName: "John Mukamuri",
  physicalAddress: "Plot 15, Borrowdale Brook, Harare",
  postalAddress: "P.O. Box 1234, Harare",
  landSize: 2.5,
  numberOfBoreholes: 3,
  totalAllocatedAbstraction: 15000,
  intendedUse: "Irrigation and Livestock",
  validUntil: "31 December 2025",
  issueDate: "02 January 2025",
  boreholeDetails: [
    {
      boreholeNumber: "BH-01",
      allocatedAmount: 6000,
      gpsX: "-17.123456",
      gpsY: "31.234567",
      intendedUse: "Irrigation",
      maxAbstractionRate: 6600,
      waterSampleFrequency: "3 months",
    },
    {
      boreholeNumber: "BH-02",
      allocatedAmount: 5000,
      gpsX: "-17.123789",
      gpsY: "31.234890",
      intendedUse: "Livestock",
      maxAbstractionRate: 5500,
      waterSampleFrequency: "3 months",
    },
    {
      boreholeNumber: "BH-03",
      allocatedAmount: 4000,
      gpsX: "-17.124012",
      gpsY: "31.235123",
      intendedUse: "Irrigation",
      maxAbstractionRate: 4400,
      waterSampleFrequency: "3 months",
    },
  ],
  gpsCoordinates: {
    latitude: -17.123456,
    longitude: 31.234567,
  },
  catchment: "MANYAME",
  subCatchment: "UPPER MANYAME",
  permitType: "temporary",
}

export default function SamplePermitGenerator() {
  const [showPreview, setShowPreview] = useState(false)

  const handlePrint = () => {
    window.print()
    toast.success("Permit sent to printer")
  }

  const handleDownload = () => {
    // Create a new window with just the permit content
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const permitElement = document.getElementById("sample-permit-template")
      if (permitElement) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Sample Permit - ${samplePermitData.permitNumber}</title>
              <style>
                body { margin: 0; padding: 0; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${permitElement.outerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
    toast.success("Permit download prepared")
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sample Permit Generator
          </CardTitle>
          <CardDescription>
            Generate and preview a sample permit to verify template formatting and data display
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant={showPreview ? "secondary" : "default"}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>

            {showPreview && (
              <>
                <Button onClick={handlePrint} variant="outline" className="gap-2 bg-transparent">
                  <Printer className="h-4 w-4" />
                  Print Sample
                </Button>

                <Button onClick={handleDownload} variant="outline" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Download Sample
                </Button>
              </>
            )}
          </div>

          {/* Sample Data Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="font-medium">Permit Number</p>
              <p className="text-muted-foreground">{samplePermitData.permitNumber}</p>
            </div>
            <div>
              <p className="font-medium">Applicant</p>
              <p className="text-muted-foreground">{samplePermitData.applicantName}</p>
            </div>
            <div>
              <p className="font-medium">Boreholes</p>
              <p className="text-muted-foreground">{samplePermitData.numberOfBoreholes}</p>
            </div>
            <div>
              <p className="font-medium">Total Allocation</p>
              <p className="text-muted-foreground">
                {samplePermitData.totalAllocatedAbstraction.toLocaleString()} m³/annum
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permit Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Permit Preview</CardTitle>
            <CardDescription>
              This is how the permit will appear when printed. Verify all data displays correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-lg overflow-hidden">
              <PermitTemplate permitData={samplePermitData} id="sample-permit-template" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Checklist</CardTitle>
          <CardDescription>Use this checklist to verify the permit template is working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="header-check" className="rounded" />
              <label htmlFor="header-check" className="text-sm">
                Header displays "Form GW7B" and permit title correctly
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="applicant-check" className="rounded" />
              <label htmlFor="applicant-check" className="text-sm">
                Applicant details (name, addresses, land size) display correctly
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="borehole-check" className="rounded" />
              <label htmlFor="borehole-check" className="text-sm">
                Borehole table shows all 3 boreholes with correct allocations
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="conditions-check" className="rounded" />
              <label htmlFor="conditions-check" className="text-sm">
                Standard conditions and additional conditions are readable
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="signature-check" className="rounded" />
              <label htmlFor="signature-check" className="text-sm">
                Signature section has proper spacing for manual signatures
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="a4-check" className="rounded" />
              <label htmlFor="a4-check" className="text-sm">
                Entire permit fits on single A4 page when printed
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
