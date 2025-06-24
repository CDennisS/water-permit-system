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
      <div className="flex items-center space-x-2 p-4 bg-green-100 border-2 border-green-300 rounded-lg">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div className="flex-1">
          <p className="font-bold text-green-800 text-lg">🎉 Permit Ready for Printing</p>
          <p className="text-sm text-green-700">Application has been fully approved through all stages</p>
        </div>
        <Badge className="bg-green-600 text-white text-lg px-3 py-1">APPROVED</Badge>
      </div>

      {/* Large Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white h-16 text-lg font-semibold"
            >
              <Eye className="h-6 w-6 mr-3" />🔍 Print Preview
              <div className="text-sm font-normal ml-2">(Review Before Print)</div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="text-xl">🖨️ Permit Print Preview - {permitData.permitNumber}</span>
                <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  APPROVED
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Preview Notice */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Eye className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-800 text-lg">📋 Permit Print Preview</p>
                    <p className="text-blue-700">
                      Review the permit details below before printing. This is exactly how the permit will appear when
                      printed on A4 paper.
                    </p>
                  </div>
                </div>
              </div>

              {/* Permit Template */}
              <div id="permit-template" className="border-2 border-gray-300 rounded-lg bg-white shadow-lg">
                <PermitTemplate permitData={permitData} />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 no-print border-t-2 pt-6">
                <Button onClick={handleDownload} variant="outline" size="lg">
                  <Download className="h-5 w-5 mr-2" />💾 Download PDF
                </Button>
                <Button onClick={handlePrint} size="lg" className="bg-green-600 hover:bg-green-700 text-lg">
                  <Printer className="h-5 w-5 mr-2" />
                  🖨️ Print Permit Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={handlePrint}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white h-16 text-lg font-semibold"
        >
          <Printer className="h-6 w-6 mr-3" />
          🖨️ Print Permit Now
          <div className="text-sm font-normal ml-2">(Direct Print)</div>
        </Button>
      </div>

      {/* Additional Options */}
      <div className="flex justify-center">
        <Button onClick={handleDownload} variant="outline" size="lg" className="w-full md:w-auto">
          <Download className="h-5 w-5 mr-2" />💾 Download Permit (PDF)
        </Button>
      </div>

      {/* Permit Information Summary */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-gray-800 mb-3 text-lg">📄 Permit Information Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Permit Number:</span>
              <span className="font-bold text-blue-600">{permitData.permitNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Applicant:</span>
              <span className="font-semibold">{permitData.applicantName}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Valid Until:</span>
              <span className="font-bold text-green-600">{permitData.validUntil}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Water Allocation:</span>
              <span className="font-bold text-blue-600">
                {permitData.totalAllocatedAbstraction.toLocaleString()} m³/annum
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
