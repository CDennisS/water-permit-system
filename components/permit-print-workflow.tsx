"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, XCircle, Printer, Eye, FileText } from "lucide-react"
import { PermitPreviewDialog } from "./permit-preview-dialog"
import { canPrintPermits } from "@/lib/auth"
import type { PermitApplication, User } from "@/types"

interface PermitPrintWorkflowProps {
  application: PermitApplication
  user: User
}

export function PermitPrintWorkflow({ application, user }: PermitPrintWorkflowProps) {
  const getWorkflowStatus = () => {
    const stages = [
      { name: "Application Created", completed: true, stage: 1 },
      { name: "Submitted for Review", completed: application.currentStage >= 2, stage: 2 },
      { name: "Chairperson Review", completed: application.currentStage >= 3, stage: 3 },
      { name: "Catchment Manager Review", completed: application.currentStage >= 4, stage: 4 },
      { name: "Final Approval", completed: application.status === "approved", stage: 5 },
      { name: "Permit Ready", completed: application.status === "approved", stage: 6 },
    ]
    return stages
  }

  const canPrintPermit = () => {
    return application.status === "approved" && canPrintPermits(user)
  }

  const canPreviewPermit = () => {
    return (
      application.status === "approved" &&
      ["permitting_officer", "permit_supervisor", "catchment_manager", "catchment_chairperson", "ict"].includes(
        user.userType,
      )
    )
  }

  console.log("Print Workflow - User:", user)
  console.log("Print Workflow - Can print:", canPrintPermit())
  console.log("Print Workflow - Can preview:", canPreviewPermit())
  console.log("Print Workflow - Application status:", application.status)

  const stages = getWorkflowStatus()

  const handleDirectPrint = () => {
    console.log("Direct print initiated for application:", application.applicationId)
    // This would trigger the print functionality directly
    alert(`Printing permit for application ${application.applicationId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Printer className="h-5 w-5" />
          <span>Permit Printing Workflow</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workflow Progress */}
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={index} className="flex items-center space-x-3">
              {stage.completed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : application.status === "rejected" ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
              <span className={`text-sm ${stage.completed ? "text-green-700 font-medium" : "text-gray-500"}`}>
                {stage.name}
              </span>
              {stage.stage === application.currentStage && application.status !== "approved" && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Current Stage
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Available Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm text-gray-700 mb-3">Available Actions</h4>

          {application.status === "approved" ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 font-medium">Permit Approved - Ready for Actions!</span>
              </div>

              {/* Permit Actions */}
              <div className="bg-green-50 p-4 rounded-md">
                <h5 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Permit Actions
                </h5>
                <div className="flex flex-wrap gap-2">
                  {/* Preview Permit Button - This is the one that wasn't working */}
                  {canPreviewPermit() && (
                    <PermitPreviewDialog
                      application={application}
                      currentUser={user}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-white hover:bg-gray-50 border-green-300 text-green-700 hover:text-green-800"
                        >
                          <Eye className="h-4 w-4" />
                          Preview Permit
                        </Button>
                      }
                    />
                  )}

                  {/* Direct Print Button */}
                  {canPrintPermit() && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleDirectPrint}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Printer className="h-4 w-4" />
                      Print Permit
                    </Button>
                  )}
                </div>

                {/* Permission Info */}
                <div className="mt-3 text-xs text-green-700">
                  <p>
                    <strong>Your Role:</strong> {user.userType.replace("_", " ").toUpperCase()}
                  </p>
                  <p>
                    {canPreviewPermit()
                      ? "✅ You can preview and print approved permits"
                      : "❌ You do not have permission to preview permits"}
                  </p>
                </div>
              </div>
            </div>
          ) : application.status === "rejected" ? (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">Application Rejected - Cannot Print Permit</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">Permit actions will be available once approved</span>
            </div>
          )}
        </div>

        {/* User Role Information */}
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Your Role:</strong> {user.userType.replace("_", " ").toUpperCase()}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {canPrintPermits(user)
              ? "✅ You have permission to print approved permits"
              : "❌ You do not have permission to print permits"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
