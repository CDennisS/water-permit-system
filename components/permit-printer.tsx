"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Eye, CheckCircle } from "lucide-react"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/permit-generator"
import type { PermitApplication } from "@/types"
import { useSession } from "next-auth/react"

interface PermitPrinterProps {
  application: PermitApplication
  disabled?: boolean
}

export function PermitPrinter({ application, disabled = false }: PermitPrinterProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user

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

  const printStatus = getPrintStatus(application, user?.userType || "")

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

  if (disabled || !printStatus.canPrint) {
    return (
      <div className="space-y-2">
        <Button disabled variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Permit
        </Button>
        {!printStatus.canPrint && <p className="text-sm text-gray-500">{printStatus.reason}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Approved Status Indicator */}
      <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="font-semibold text-green-800">Permit Ready for Printing</p>
          <p className="text-sm text-green-600">Application has been fully approved through all stages</p>
        </div>
        <Badge className="bg-green-100 text-green-800 ml-auto">APPROVED</Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Eye className="h-4 w-4 mr-2" />
              Preview Permit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Permit Preview - {permitData.permitNumber}</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  APPROVED
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Preview Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800">Permit Print Preview</p>
                    <p className="text-sm text-blue-600">
                      Review the permit details below before printing. This is exactly how the permit will appear when
                      printed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Permit Template */}
              <div id="permit-template" className="border rounded-lg bg-white">
                <PermitTemplate permitData={permitData} />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6 no-print border-t pt-4">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Permit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={handlePrint} size="sm" className="bg-green-600 hover:bg-green-700">
          <Printer className="h-4 w-4 mr-2" />
          Print Now
        </Button>

        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Permit Information Summary */}
      <div className="bg-gray-50 border rounded-lg p-3">
        <h4 className="font-semibold text-gray-800 mb-2">Permit Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Permit Number:</span>
            <span className="font-semibold ml-2">{permitData.permitNumber}</span>
          </div>
          <div>
            <span className="text-gray-600">Valid Until:</span>
            <span className="font-semibold ml-2">{permitData.validUntil}</span>
          </div>
          <div>
            <span className="text-gray-600">Applicant:</span>
            <span className="font-semibold ml-2">{permitData.applicantName}</span>
          </div>
          <div>
            <span className="text-gray-600">Water Allocation:</span>
            <span className="font-semibold ml-2">{permitData.totalAllocatedAbstraction.toLocaleString()} m³/annum</span>
          </div>
        </div>
      </div>
    </div>
  )
}
