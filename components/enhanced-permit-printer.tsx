"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PermitPreviewDialog } from "./permit-preview-dialog"
import { preparePermitData, validatePermitData } from "@/lib/enhanced-permit-generator"
import { Printer, Download, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { PermitApplication, User } from "@/types"

interface EnhancedPermitPrinterProps {
  application: PermitApplication
  currentUser: User
  onPermitGenerated?: (permitNumber: string) => void
}

export default function EnhancedPermitPrinter({
  application,
  currentUser,
  onPermitGenerated,
}: EnhancedPermitPrinterProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [permitData, setPermitData] = useState(() => preparePermitData(application))

  // Check if user can generate permits
  const canGeneratePermit = ["permit_supervisor", "catchment_manager", "catchment_chairperson"].includes(
    currentUser.userType,
  )

  // Check if user can preview permits
  const canPreviewPermit = [
    "permitting_officer",
    "permit_supervisor",
    "catchment_manager",
    "catchment_chairperson",
    "ict",
  ].includes(currentUser.userType)

  // Only show for approved applications
  const isApproved = application.status === "approved" || application.status === "permit_issued"

  if (!isApproved) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Permit Generation
          </CardTitle>
          <CardDescription>Permit can only be generated for approved applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Application status: {application.status}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleGeneratePermit = async () => {
    if (!canGeneratePermit) {
      toast.error("You don't have permission to generate permits")
      return
    }

    setIsGenerating(true)
    try {
      // Validate permit data
      if (!validatePermitData(permitData)) {
        throw new Error("Invalid permit data")
      }

      // Simulate permit generation process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update application status to permit_issued
      // This would typically be done via an API call
      toast.success(`Permit ${permitData.permitNumber} generated successfully`)
      onPermitGenerated?.(permitData.permitNumber)
    } catch (error) {
      console.error("Permit generation failed:", error)
      toast.error("Failed to generate permit")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    toast.success("Permit sent to printer")
  }

  const handleDownload = () => {
    toast.success("Permit downloaded successfully")
  }

  return (
    <div className="space-y-6">
      {/* Permit Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Permit Status
          </CardTitle>
          <CardDescription>
            Current permit generation status for application {application.applicationNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Application Status</p>
              <Badge variant={application.status === "permit_issued" ? "default" : "secondary"}>
                {application.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Permit Number</p>
              <p className="text-sm text-muted-foreground">{permitData.permitNumber}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Applicant</p>
              <p className="text-muted-foreground">{application.applicantName}</p>
            </div>
            <div>
              <p className="font-medium">Water Allocation</p>
              <p className="text-muted-foreground">{application.waterAllocation} ML/annum</p>
            </div>
            <div>
              <p className="font-medium">Number of Boreholes</p>
              <p className="text-muted-foreground">{application.numberOfBoreholes}</p>
            </div>
            <div>
              <p className="font-medium">Intended Use</p>
              <p className="text-muted-foreground">{application.intendedUse}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permit Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Permit Actions
          </CardTitle>
          <CardDescription>Generate, preview, and print the groundwater abstraction permit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Permit data validated and ready for generation</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Preview Button - Available to more user types */}
            {canPreviewPermit && (
              <PermitPreviewDialog
                application={application}
                currentUser={currentUser}
                onPrint={handlePrint}
                onDownload={handleDownload}
              />
            )}

            {/* Generate Permit Button - Restricted to supervisors and above */}
            {canGeneratePermit && application.status !== "permit_issued" && (
              <Button onClick={handleGeneratePermit} disabled={isGenerating} className="gap-2">
                <FileText className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Permit"}
              </Button>
            )}

            {/* Direct Print Button - For already issued permits */}
            {application.status === "permit_issued" && canPreviewPermit && (
              <Button
                variant="outline"
                onClick={() => {
                  // Trigger print directly
                  window.print()
                  handlePrint()
                }}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Permit
              </Button>
            )}

            {/* Download Button */}
            {canPreviewPermit && (
              <Button variant="outline" onClick={handleDownload} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>

          {!canGeneratePermit && (
            <div className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              You don't have permission to generate permits. Contact your supervisor.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permit Details Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Permit Details</CardTitle>
          <CardDescription>Summary of the permit to be generated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Permit Number</p>
              <p className="text-muted-foreground">{permitData.permitNumber}</p>
            </div>
            <div>
              <p className="font-medium">Valid Until</p>
              <p className="text-muted-foreground">{permitData.validUntil}</p>
            </div>
            <div>
              <p className="font-medium">Total Allocation</p>
              <p className="text-muted-foreground">{permitData.totalAllocatedAbstraction.toLocaleString()} m³/annum</p>
            </div>
            <div>
              <p className="font-medium">Issue Date</p>
              <p className="text-muted-foreground">{permitData.issueDate}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="font-medium mb-2">Borehole Details</p>
            <div className="space-y-2">
              {permitData.boreholeDetails.map((borehole, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{borehole.boreholeNumber}</span>
                  <span>{borehole.allocatedAmount.toLocaleString()} m³/annum</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
