"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Printer, Download, Eye } from "lucide-react"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { User, PermitApplication, PermitData } from "@/types"
import { canPrintPermits } from "@/lib/auth"

interface PermitPrinterProps {
  application: PermitApplication
  user?: User | null
  disabled?: boolean
}

interface PermissionStatus {
  canPrint: boolean
  reason: string
}

// Extract print styles to a separate function for better readability
const generatePrintStyles = (): string => `
  @page {
    size: A4;
    margin: 15mm;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body { 
    font-family: 'Times New Roman', serif; 
    line-height: 1.4;
    color: #000;
    font-size: 12pt;
    background: white;
  }
  
  @media print {
    body { 
      margin: 0; 
      padding: 0; 
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
  
  /* Typography */
  h1 { 
    font-size: 18pt; 
    font-weight: bold; 
    margin: 0 0 8px 0; 
    text-align: center;
  }
  h2 { 
    font-size: 16pt; 
    font-weight: bold; 
    margin: 0 0 16px 0; 
    text-align: center;
  }
  h3 { 
    font-size: 14pt; 
    font-weight: bold; 
    margin: 0 0 12px 0; 
  }
  p { 
    margin: 0 0 8px 0; 
    font-size: 12pt; 
  }
  
  /* Layout utilities */
  .text-center { text-align: center; }
  .text-sm { font-size: 11pt; }
  .text-xs { font-size: 10pt; }
  .font-bold { font-weight: bold; }
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .mb-8 { margin-bottom: 32px; }
  .mt-4 { margin-top: 16px; }
  .mt-12 { margin-top: 48px; }
  .p-2 { padding: 8px; }
  
  /* Grid layouts */
  .grid-cols-2 { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 16px; 
    margin-bottom: 16px;
  }
  .grid-cols-3 { 
    display: grid; 
    grid-template-columns: 1fr 1fr 1fr; 
    gap: 32px; 
  }
  
  /* Table styles */
  table { 
    border-collapse: collapse; 
    width: 100%; 
    margin: 16px 0;
    border: 2px solid #000;
  }
  th, td { 
    border: 1px solid #000; 
    padding: 6px 8px; 
    text-align: left; 
    font-size: 11pt;
    vertical-align: top;
  }
  th { 
    font-weight: bold; 
    background-color: #f0f0f0;
    text-align: center;
  }
  .text-center td, 
  .text-center th { 
    text-align: center; 
  }
  
  /* Signature section */
  .signature-section {
    margin-top: 48px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 32px;
    text-align: center;
  }
  .signature-line {
    border-bottom: 1px solid #000;
    height: 48px;
    margin-bottom: 8px;
  }
  
  /* Lists */
  ol { 
    padding-left: 20px; 
    margin: 16px 0;
  }
  li { 
    margin-bottom: 4px; 
    font-size: 11pt;
  }
  
  /* Spacing */
  .space-y-2 > * + * { margin-top: 8px; }
  .space-y-4 > * + * { margin-top: 16px; }
  
  /* Container */
  .permit-container {
    max-width: 100%;
    margin: 0 auto;
    padding: 20px;
    background: white;
  }
`

// Generate print HTML template
const generatePrintHTML = (permitContent: string, permitNumber: string): string => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Permit ${permitNumber}</title>
      <style>
        ${generatePrintStyles()}
      </style>
    </head>
    <body>
      <div class="permit-container">
        ${permitContent}
      </div>
    </body>
  </html>
`

export function PermitPrinter({ application, user, disabled = false }: PermitPrinterProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const { toast } = useToast()

  // Memoize permit data to avoid recalculation on every render
  const permitData: PermitData = useMemo(() => {
    return preparePermitData(application)
  }, [application])

  // Memoize permission status calculation
  const permissionStatus: PermissionStatus = useMemo(() => {
    if (!user) {
      return { canPrint: false, reason: "User not authenticated" }
    }

    if (application.status !== "approved") {
      return { canPrint: false, reason: "Application must be approved first" }
    }

    if (!canPrintPermits(user)) {
      return {
        canPrint: false,
        reason: `User type '${user.userType}' cannot print permits. Only Permitting Officers, Permit Supervisors, and ICT can print permits.`,
      }
    }

    return { canPrint: true, reason: "Ready to print" }
  }, [user, application.status])

  // Debug logging only in development
  if (process.env.NODE_ENV === "development") {
    console.log("PermitPrinter - User:", user)
    console.log("PermitPrinter - User type:", user?.userType)
    console.log("PermitPrinter - Application status:", application.status)
    console.log("PermitPrinter - Can print permits:", user ? canPrintPermits(user) : false)
  }

  // Handle print functionality with better error handling
  const handlePrint = useCallback(async (): Promise<void> => {
    setIsPrinting(true)

    try {
      // First, ensure the preview is rendered by opening it if not already open
      if (!isPreviewOpen) {
        setIsPreviewOpen(true)
        // Wait a moment for the DOM to update
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const permitElement = document.getElementById("permit-template-preview")

      if (!permitElement) {
        toast({
          title: "Print Error",
          description: "Permit template not found. Please open the preview first.",
          variant: "destructive",
        })
        return
      }

      const printWindow = window.open("", "_blank", "width=800,height=600")

      if (!printWindow) {
        toast({
          title: "Print Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive",
        })
        return
      }

      const printContent = generatePrintHTML(permitElement.innerHTML, permitData.permitNumber)

      printWindow.document.write(printContent)
      printWindow.document.close()

      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()

        // Close window after printing (optional)
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 1000)

      toast({
        title: "Print Initiated",
        description: "Permit has been sent to printer.",
      })
    } catch (error) {
      console.error("Print error:", error)
      toast({
        title: "Print Error",
        description: "An error occurred while printing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPrinting(false)
    }
  }, [isPreviewOpen, permitData.permitNumber, toast])

  // Handle download functionality with better error handling
  const handleDownload = useCallback((): void => {
    try {
      const permitContent = `
PERMIT DOCUMENT
===============

Permit Number: ${permitData.permitNumber}
Applicant Name: ${permitData.applicantName}
Physical Address: ${permitData.physicalAddress}
Postal Address: ${permitData.postalAddress || "N/A"}

Property Details:
- Land Size: ${permitData.landSize} hectares
- Number of Boreholes: ${permitData.numberOfBoreholes}
- Total Allocated Abstraction: ${permitData.totalAllocatedAbstraction.toLocaleString()} m³/annum

Valid Until: ${permitData.validUntil}

Generated on: ${new Date().toLocaleString()}
      `

      const blob = new Blob([permitContent], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Permit_${permitData.permitNumber}_${new Date().toISOString().split("T")[0]}.txt`
      link.setAttribute("aria-label", `Download permit ${permitData.permitNumber}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Download Complete",
        description: "Permit document has been downloaded.",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Error",
        description: "An error occurred while downloading. Please try again.",
        variant: "destructive",
      })
    }
  }, [permitData, toast])

  // Handle preview dialog state
  const handlePreviewOpen = useCallback((open: boolean): void => {
    setIsPreviewOpen(open)
  }, [])

  // Show permission error if user cannot print
  if (!permissionStatus.canPrint) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertTitle>Cannot Print Permit</AlertTitle>
          <AlertDescription>{permissionStatus.reason}</AlertDescription>
        </Alert>
        {user && process.env.NODE_ENV === "development" && (
          <div className="text-sm text-gray-600">
            Current user: {user.userType} | Application status: {application.status}
          </div>
        )}
      </div>
    )
  }

  if (disabled) {
    return (
      <Button disabled variant="outline" size="sm" aria-label="Print permit (disabled)">
        <Printer className="h-4 w-4 mr-2" />
        Print Permit
      </Button>
    )
  }

  return (
    <div className="flex space-x-2">
      <Dialog open={isPreviewOpen} onOpenChange={handlePreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" aria-label={`Preview permit ${permitData.permitNumber}`}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Permit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="permit-preview-description">
          <DialogHeader>
            <DialogTitle>Permit Preview - {permitData.permitNumber}</DialogTitle>
            <div id="permit-preview-description" className="sr-only">
              Preview of permit document for {permitData.applicantName}
            </div>
          </DialogHeader>
          <div className="bg-white p-4 rounded-lg">
            <PermitTemplate permitData={permitData} id="permit-template-preview" />
          </div>
          <div className="flex justify-end space-x-2 mt-4 no-print border-t pt-4">
            <Button
              onClick={handleDownload}
              variant="outline"
              disabled={isPrinting}
              aria-label={`Download permit ${permitData.permitNumber}`}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting} aria-label={`Print permit ${permitData.permitNumber}`}>
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? "Printing..." : "Print"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        onClick={handlePrint}
        size="sm"
        disabled={isPrinting}
        aria-label={`Print permit ${permitData.permitNumber}`}
      >
        <Printer className="h-4 w-4 mr-2" />
        {isPrinting ? "Printing..." : "Print Permit"}
      </Button>
    </div>
  )
}

export default PermitPrinter
