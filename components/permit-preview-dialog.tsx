"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PermitTemplate } from "./permit-template"
import { Download, Printer } from "lucide-react"

interface PermitPreviewDialogProps {
  application: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PermitPreviewDialog({ application, open, onOpenChange }: PermitPreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePrint = () => {
    const printContent = document.getElementById("permit-preview-template")
    if (printContent) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Water Permit - ${application.applicationId}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                @media print {
                  body { margin: 0; padding: 0; }
                  .no-print { display: none !important; }
                }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .text-blue-900 { color: #1e3a8a; }
                .bg-blue-50 { background-color: #eff6ff; }
                .bg-gray-50 { background-color: #f9fafb; }
                .bg-yellow-50 { background-color: #fefce8; }
                .border-yellow-400 { border-left: 4px solid #facc15; }
                .rounded-lg { border-radius: 8px; }
                .p-4 { padding: 16px; }
                .p-6 { padding: 24px; }
                .mb-4 { margin-bottom: 16px; }
                .mb-8 { margin-bottom: 32px; }
                .space-y-2 > * + * { margin-top: 8px; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                .gap-4 { gap: 16px; }
                .gap-6 { gap: 24px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // In a real application, you would generate a PDF here
      // For now, we'll simulate the download
      const permitContent = document.getElementById("permit-preview-template")?.innerHTML || ""
      const blob = new Blob(
        [
          `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Water Permit - ${application.applicationId}</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            ${permitContent}
          </body>
        </html>
      `,
        ],
        { type: "text/html" },
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Water_Permit_${application.applicationId}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (!application) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Water Permit Preview - {application.applicationId}</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-transparent"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center space-x-2 bg-transparent"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <PermitTemplate permitData={application} id="permit-preview-template" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
