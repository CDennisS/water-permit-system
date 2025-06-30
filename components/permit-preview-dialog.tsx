"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PermitTemplate } from "./permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import { Eye, Download, Printer, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const [error, setError] = useState<string | null>(null)

  console.log("PermitPreviewDialog rendered", {
    application: application.applicationId,
    status: application.status,
    userType: currentUser.userType,
  })

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

  console.log("Preview permissions", { canPreview, canShowPreview })

  if (!canPreview || !canShowPreview) {
    console.log("Preview not allowed", { canPreview, canShowPreview, status: application.status })
    return null
  }

  // Prepare permit data with error handling
  let permitData
  try {
    permitData = preparePermitData(application)
    console.log("Permit data prepared", permitData)
  } catch (err) {
    console.error("Error preparing permit data:", err)
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error preparing permit data. Please check the application details.</AlertDescription>
      </Alert>
    )
  }

  const handlePrint = async () => {
    console.log("Print button clicked")
    setIsLoading(true)
    setError(null)

    try {
      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const printContent = document.getElementById("permit-preview-template")
      console.log("Print content element:", printContent)

      if (!printContent) {
        throw new Error("Print content not found")
      }

      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        throw new Error("Could not open print window. Please check popup blockers.")
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Permit ${permitData.permitNumber}</title>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: 'Times New Roman', serif;
                font-size: 10pt;
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
                margin-bottom: 16px;
              }
              th, td {
                border: 1px solid black;
                padding: 4px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-justify { text-align: justify; }
              .font-bold { font-weight: bold; }
              .text-xs { font-size: 8pt; }
              .text-sm { font-size: 9pt; }
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-4 { margin-bottom: 16px; }
              .mb-6 { margin-bottom: 24px; }
              .mb-8 { margin-bottom: 32px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .mt-4 { margin-top: 16px; }
              .mt-8 { margin-top: 32px; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .space-y-3 > * + * { margin-top: 12px; }
              .space-y-4 > * + * { margin-top: 16px; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .items-start { align-items: flex-start; }
              .items-end { align-items: flex-end; }
              .border { border: 1px solid black; }
              .border-2 { border: 2px solid black; }
              .border-b { border-bottom: 1px solid black; }
              .border-gray-400 { border-color: #9ca3af; }
              .w-full { width: 100%; }
              .h-8 { height: 32px; }
              .h-16 { height: 64px; }
              .w-32 { width: 128px; }
              .w-20 { width: 80px; }
              .p-1 { padding: 4px; }
              .p-4 { padding: 16px; }
              .list-decimal { list-style-type: decimal; }
              .list-inside { list-style-position: inside; }
              sup { vertical-align: super; font-size: smaller; }
              em { font-style: italic; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)

      onPrint?.()
      console.log("Print completed successfully")
    } catch (error) {
      console.error("Print failed:", error)
      setError(error instanceof Error ? error.message : "Print failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    console.log("Download button clicked")
    setIsLoading(true)
    setError(null)

    try {
      const printContent = document.getElementById("permit-preview-template")
      if (!printContent) {
        throw new Error("Content not found for download")
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Permit ${permitData.permitNumber}</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                font-size: 12pt; 
                line-height: 1.4; 
                max-width: 210mm;
                margin: 0 auto;
                padding: 20mm;
              }
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin-bottom: 16px;
              }
              th, td { 
                border: 1px solid black; 
                padding: 8px; 
                vertical-align: top;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-justify { text-align: justify; }
              .font-bold { font-weight: bold; }
              sup { vertical-align: super; font-size: smaller; }
              em { font-style: italic; }
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

      onDownload?.()
      console.log("Download completed successfully")
    } catch (error) {
      console.error("Download failed:", error)
      setError(error instanceof Error ? error.message : "Download failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogOpen = (open: boolean) => {
    console.log("Dialog open state changed:", open)
    setIsOpen(open)
    if (open) {
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent hover:bg-gray-50"
          type="button"
          onClick={() => {
            console.log("Preview button clicked", { application: application.applicationId, permitData })
          }}
        >
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
                Permit Preview - {application.applicationId}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{permitData.permitNumber}</Badge>
                <Badge variant="outline">{application.status}</Badge>
                <Badge variant="outline">{application.applicantName}</Badge>
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
                {isLoading ? "Downloading..." : "Download"}
              </Button>
              <Button variant="default" size="sm" onClick={handlePrint} disabled={isLoading} className="gap-2">
                <Printer className="h-4 w-4" />
                {isLoading ? "Printing..." : "Print"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {error && (
          <div className="p-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <ScrollArea className="flex-1 p-6">
          <div className="bg-white border rounded-lg p-4">
            <PermitTemplate permitData={permitData} id="permit-preview-template" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
