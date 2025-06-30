"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import { Eye, Download, Printer, FileText } from "lucide-react"
import type { PermitApplication, User } from "@/types"

interface PermitPreviewDialogProps {
  application: PermitApplication
  currentUser: User
  onPrint?: () => void
  onDownload?: () => void
}

export function PermitPreviewDialog({ application, currentUser, onPrint, onDownload }: PermitPreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user can preview permits
  const canPreview = [
    "permitting_officer",
    "permit_supervisor",
    "catchment_manager",
    "catchment_chairperson",
    "ict",
  ].includes(currentUser.userType)

  // Only show for approved applications
  const canShowPreview = application.status === "approved" || application.status === "permit_issued"

  if (!canPreview || !canShowPreview) {
    return null
  }

  const permitData = preparePermitData(application)

  const handlePrint = async () => {
    setIsLoading(true)
    try {
      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 500))

      const printContent = document.getElementById("permit-preview-content")
      if (printContent) {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Permit ${permitData.permitNumber}</title>
                <style>
                  @page {
                    size: A4;
                    margin: 20mm;
                  }
                  body {
                    font-family: 'Times New Roman', serif;
                    font-size: 12pt;
                    line-height: 1.4;
                    margin: 0;
                    padding: 0;
                    color: black;
                    background: white;
                  }
                  .no-print {
                    display: none !important;
                  }
                  table {
                    border-collapse: collapse;
                    width: 100%;
                  }
                  th, td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                  }
                  th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                  }
                  .text-center {
                    text-align: center;
                  }
                  .font-bold {
                    font-weight: bold;
                  }
                  .mb-2 { margin-bottom: 8px; }
                  .mb-4 { margin-bottom: 16px; }
                  .mb-6 { margin-bottom: 24px; }
                  .mb-8 { margin-bottom: 32px; }
                  .mt-4 { margin-top: 16px; }
                  .mt-12 { margin-top: 48px; }
                  .grid { display: grid; }
                  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                  .gap-4 { gap: 16px; }
                  .gap-8 { gap: 32px; }
                  .space-y-2 > * + * { margin-top: 8px; }
                  .space-y-4 > * + * { margin-top: 16px; }
                  .list-decimal { list-style-type: decimal; }
                  .list-inside { list-style-position: inside; }
                  .border-b { border-bottom: 1px solid black; }
                  .h-12 { height: 48px; }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          printWindow.print()
          printWindow.close()
        }
      }
      onPrint?.()
    } catch (error) {
      console.error("Print failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      // Create a blob with the permit content
      const printContent = document.getElementById("permit-preview-content")
      if (printContent) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Permit ${permitData.permitNumber}</title>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid black; padding: 8px; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `

        const blob = new Blob([htmlContent], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `permit-${permitData.permitNumber}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      onDownload?.()
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent hover:bg-gray-50" type="button">
          <Eye className="h-4 w-4" />
          Preview Permit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Permit Preview
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{permitData.permitNumber}</Badge>
                <Badge variant="outline">{application.status}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isLoading}
                className="gap-2 bg-transparent"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="default" size="sm" onClick={handlePrint} disabled={isLoading} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 p-6">
          <div id="permit-preview-content" className="bg-white">
            <PermitTemplate permitData={permitData} id="permit-preview-template" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
