"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Printer, Download, Eye } from "lucide-react"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/permit-generator"
import type { PermitApplication } from "@/types"

interface PermitPrinterProps {
  application: PermitApplication
  disabled?: boolean
}

export function PermitPrinter({ application, disabled = false }: PermitPrinterProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const permitData = preparePermitData(application)

  // Add a helper function to show why printing might be disabled
  const getPrintStatus = (application: PermitApplication, userType: string) => {
    if (application.status !== "approved") {
      return { canPrint: false, reason: "Application must be approved first" }
    }

    if (!["permitting_officer", "permit_supervisor", "ict"].includes(userType)) {
      return { canPrint: false, reason: "Insufficient permissions" }
    }

    return { canPrint: true, reason: "Ready to print" }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const permitElement = document.getElementById("permit-template")
      if (permitElement) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Permit ${permitData.permitNumber}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; }
                @media print {
                  body { margin: 0; padding: 0; }
                  .no-print { display: none; }
                }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .text-sm { font-size: 14px; }
                .text-xs { font-size: 12px; }
                .mb-2 { margin-bottom: 8px; }
                .mb-4 { margin-bottom: 16px; }
                .mb-6 { margin-bottom: 24px; }
                .mb-8 { margin-bottom: 32px; }
                .mt-4 { margin-top: 16px; }
                .mt-12 { margin-top: 48px; }
                .p-2 { padding: 8px; }
                .space-y-2 > * + * { margin-top: 8px; }
                .space-y-4 > * + * { margin-top: 16px; }
                .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .grid-cols-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; }
                .border-b { border-bottom: 1px solid black; }
                .h-12 { height: 48px; }
                .list-decimal { list-style-type: decimal; }
                .list-inside { list-style-position: inside; }
              </style>
            </head>
            <body>
              ${permitElement.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownload = () => {
    // In a real application, you would generate a PDF here
    // For now, we'll simulate the download
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

  const handleAutoprint = () => {
    // Automatically print upon approval
    setTimeout(() => {
      handlePrint()
    }, 500) // Small delay to ensure dialog is ready
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
            Preview
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permit Preview - {permitData.permitNumber}</DialogTitle>
          </DialogHeader>
          <div id="permit-template">
            <PermitTemplate permitData={permitData} />
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
            <Button onClick={handleAutoprint} variant="default">
              <Printer className="h-4 w-4 mr-2" />
              Auto Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button onClick={handlePrint} size="sm">
        <Printer className="h-4 w-4 mr-2" />
        Print Permit
      </Button>

      <Button onClick={handleAutoprint} size="sm" variant="default">
        <Printer className="h-4 w-4 mr-2" />
        Auto Print
      </Button>
    </div>
  )
}
