"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Printer, Download, Eye } from "lucide-react"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/permit-generator"
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
