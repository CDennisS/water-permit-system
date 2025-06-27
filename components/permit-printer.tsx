"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Printer, Download, Eye } from "lucide-react"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { User, PermitApplication } from "@/types"
import { canPrintPermits } from "@/lib/auth"

interface PermitPrinterProps {
  application: PermitApplication
  user?: User | null
  disabled?: boolean
}

export function PermitPrinter({ application, user, disabled = false }: PermitPrinterProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Debug logging to help troubleshoot
  console.log("PermitPrinter - User:", user)
  console.log("PermitPrinter - User type:", user?.userType)
  console.log("PermitPrinter - Application status:", application.status)
  console.log("PermitPrinter - Can print permits:", user ? canPrintPermits(user) : false)

  const permitData = preparePermitData(application)

  // Check permissions and application status
  const getPermissionStatus = () => {
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
  }

  const permissionStatus = getPermissionStatus()

  const handlePrint = () => {
    // Get the permit template element
    const permitElement = document.getElementById("permit-template-preview")

    if (!permitElement) {
      alert("Error: Permit template not found. Please try opening the preview first.")
      return
    }

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Permit ${permitData.permitNumber}</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4;
                margin: 15mm;
              }
              
              body { 
                margin: 0; 
                padding: 0; 
                font-family: 'Times New Roman', serif; 
                line-height: 1.4;
                color: #000;
                font-size: 12pt;
              }
              
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
                .page-break { page-break-before: always; }
              }
              
              /* Reset and base styles */
              * { box-sizing: border-box; }
              
              /* Typography */
              h1 { font-size: 18pt; font-weight: bold; margin: 0 0 8px 0; }
              h2 { font-size: 16pt; font-weight: bold; margin: 0 0 16px 0; }
              h3 { font-size: 14pt; font-weight: bold; margin: 0 0 12px 0; }
              p { margin: 0 0 8px 0; font-size: 12pt; }
              
              /* Layout */
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
              .space-y-2 > * + * { margin-top: 8px; }
              .space-y-4 > * + * { margin-top: 16px; }
              
              /* Grid layouts */
              .grid-cols-2 { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 16px; 
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
                background-color: #f5f5f5;
              }
              .text-center td, .text-center th { text-align: center; }
              
              /* Signature section */
              .border-b { border-bottom: 1px solid #000; }
              .h-12 { height: 48px; }
              
              /* Lists */
              .list-decimal { list-style-type: decimal; }
              .list-inside { list-style-position: inside; }
              ol { padding-left: 20px; }
              li { margin-bottom: 4px; }
              
              /* Spacing utilities */
              .max-w-4xl { max-width: 100%; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .w-full { width: 100%; }
            </style>
          </head>
          <body>
            ${permitElement.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()

      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print()
      }, 500)
    } else {
      alert("Unable to open print window. Please check your browser's popup settings.")
    }
  }

  const handleDownload = () => {
    const blob = new Blob([`Permit ${permitData.permitNumber} - ${permitData.applicantName}`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Permit_${permitData.permitNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Show permission error if user cannot print
  if (!permissionStatus.canPrint) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertTitle>Cannot Print Permit</AlertTitle>
          <AlertDescription>{permissionStatus.reason}</AlertDescription>
        </Alert>
        {user && (
          <div className="text-sm text-gray-600">
            Current user: {user.userType} | Application status: {application.status}
          </div>
        )}
      </div>
    )
  }

  if (disabled) {
    return (
      <Button disabled variant="outline" size="sm">
        <Printer className="h-4 w-4 mr-2" />
        Print Permit
      </Button>
    )
  }

  return (
    <div className="flex space-x-2">
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview Permit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permit Preview - {permitData.permitNumber}</DialogTitle>
          </DialogHeader>
          <div className="bg-white">
            <PermitTemplate permitData={permitData} id="permit-template-preview" />
          </div>
          <div className="flex justify-end space-x-2 mt-4 no-print">
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button onClick={handlePrint} size="sm">
        <Printer className="h-4 w-4 mr-2" />
        Print Permit
      </Button>
    </div>
  )
}

export default PermitPrinter
