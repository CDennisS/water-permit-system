"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PermitTemplate } from "./permit-template"
import { FileText, Printer, Download, Monitor, Smartphone, Tablet } from "lucide-react"
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
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")

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

  const getViewModeStyles = () => {
    switch (viewMode) {
      case "mobile":
        return "max-w-sm mx-auto"
      case "tablet":
        return "max-w-2xl mx-auto"
      case "desktop":
      default:
        return "max-w-full"
    }
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
            Generate and preview a sample permit to verify template formatting and data display across different screen
            sizes
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

          {/* Responsive View Mode Selector */}
          {showPreview && (
            <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mr-2">View Mode:</p>
              <Button
                size="sm"
                variant={viewMode === "desktop" ? "default" : "outline"}
                onClick={() => setViewMode("desktop")}
                className="gap-1"
              >
                <Monitor className="h-3 w-3" />
                Desktop
              </Button>
              <Button
                size="sm"
                variant={viewMode === "tablet" ? "default" : "outline"}
                onClick={() => setViewMode("tablet")}
                className="gap-1"
              >
                <Tablet className="h-3 w-3" />
                Tablet
              </Button>
              <Button
                size="sm"
                variant={viewMode === "mobile" ? "default" : "outline"}
                onClick={() => setViewMode("mobile")}
                className="gap-1"
              >
                <Smartphone className="h-3 w-3" />
                Mobile
              </Button>
            </div>
          )}

          {/* Sample Data Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
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
            <CardTitle>Permit Preview - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View</CardTitle>
            <CardDescription>
              This is how the permit will appear when printed. Verify all data displays correctly across different
              screen sizes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`border rounded-lg overflow-hidden ${getViewModeStyles()}`}>
              <PermitTemplate permitData={samplePermitData} id="sample-permit-template" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsive Design Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Design Verification</CardTitle>
          <CardDescription>
            Use this checklist to verify the permit template works across different screen sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="desktop-check" className="rounded" />
              <label htmlFor="desktop-check" className="text-sm">
                <strong>Desktop (1024px+):</strong> Full layout with side-by-side elements displays correctly
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="tablet-check" className="rounded" />
              <label htmlFor="tablet-check" className="text-sm">
                <strong>Tablet (768px-1023px):</strong> Elements stack appropriately, table remains readable
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="mobile-check" className="rounded" />
              <label htmlFor="mobile-check" className="text-sm">
                <strong>Mobile (320px-767px):</strong> All content is accessible with horizontal scroll for table
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="table-responsive" className="rounded" />
              <label htmlFor="table-responsive" className="text-sm">
                Borehole table scrolls horizontally on small screens without breaking layout
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="signature-responsive" className="rounded" />
              <label htmlFor="signature-responsive" className="text-sm">
                Signature section adapts from horizontal to vertical layout on mobile
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="print-optimized" className="rounded" />
              <label htmlFor="print-optimized" className="text-sm">
                Print styles maintain A4 formatting regardless of screen size
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Optimization Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Print Optimization Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>✅ Responsive Features Added:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Flexible layouts that adapt to screen width</li>
            <li>Horizontal scroll for table on mobile devices</li>
            <li>Stacked signature fields on small screens</li>
            <li>Mobile viewing notice for user guidance</li>
            <li>Print preview notice for desktop users</li>
          </ul>
          <p className="mt-4">
            <strong>📱 Mobile Considerations:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Table maintains minimum column widths for readability</li>
            <li>Text remains legible at small sizes</li>
            <li>Print functionality works from any device</li>
            <li>Landscape orientation recommended for mobile viewing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
