"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, Printer } from "lucide-react"
import { PermitPrinter } from "./permit-printer"
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
    return (
      application.status === "approved" && ["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
    )
  }

  const stages = getWorkflowStatus()

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

        {/* Print Status */}
        <div className="border-t pt-4">
          {application.status === "approved" ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 font-medium">Permit Approved - Ready to Print!</span>
              </div>

              {canPrintPermit() ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    As a {user.userType.replace("_", " ")}, you can now print this approved permit.
                  </p>
                  <PermitPrinter application={application} />
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Only Permitting Officers, Permit Supervisors, and ICT can print permits.
                  </p>
                </div>
              )}
            </div>
          ) : application.status === "rejected" ? (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">Application Rejected - Cannot Print Permit</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">Permit will be available for printing once approved</span>
            </div>
          )}
        </div>

        {/* User Role Information */}
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Your Role:</strong> {user.userType.replace("_", " ").toUpperCase()}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)
              ? "✅ You have permission to print approved permits"
              : "❌ You do not have permission to print permits"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
