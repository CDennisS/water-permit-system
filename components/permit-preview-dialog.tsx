"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { PermitTemplate } from "@/components/permit-template"
import type { Application } from "@/types"

interface PermitPreviewDialogProps {
  application: Application
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PermitPreviewDialog({ application, open, onOpenChange }: PermitPreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    try {
      window.print()
    } catch (error) {
      console.error("Print failed:", error)
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownload = () => {
    setIsDownloading(true)
    try {
      // Create a blob with the permit content
      const permitContent = document.getElementById("permit-content")?.innerHTML || ""
      const blob = new Blob(
        [
          `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Water Permit - ${application.applicationId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .permit-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .signature-section { margin-top: 40px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="permit-container">
            ${permitContent}
          </div>
        </body>
        </html>
      `,
        ],
        { type: "text/html" },
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `permit-${application.applicationId}.html`
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Water Permit Preview - {application.applicationId}</DialogTitle>
          <div className="flex space-x-2 no-print">
            <Button onClick={handlePrint} disabled={isPrinting} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? "Printing..." : "Print"}
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </DialogHeader>

        <div id="permit-content">
          <PermitTemplate application={application} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
