"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, FileText, CheckCircle, User, Clock } from "lucide-react"
import type { PermitApplication, User as UserType, WorkflowComment } from "@/types"
import { db } from "@/lib/database"
import { ApplicationDetails } from "./application-details"
import { EnhancedDocumentViewer } from "./enhanced-document-viewer"

interface ChairpersonReviewWorkflowProps {
  user: UserType
  application: PermitApplication
  onUpdate: (application: PermitApplication) => void
}

export function ChairpersonReviewWorkflow({ user, application, onUpdate }: ChairpersonReviewWorkflowProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [documents, setDocuments] = useState([])
  const [isReviewed, setIsReviewed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadApplicationData()
  }, [application.id])

  const loadApplicationData = async () => {
    // Load comments from permitting officer
    const appComments = await db.getCommentsByApplication(application.id)
    setComments(appComments)

    // Load documents
    const appDocuments = await db.getDocumentsByApplication(application.id)
    setDocuments(appDocuments)
  }

  const canReview = () => {
    return user.userType === "chairperson" && application.currentStage === 2 && application.status === "submitted"
  }

  const handleSubmitToNextStage = async () => {
    if (!isReviewed) {
      alert("Please review the application before submitting to next stage")
      return
    }

    setIsLoading(true)

    try {
      // Update application to advance to catchment manager (stage 3)
      const updates: Partial<PermitApplication> = {
        currentStage: 3,
        status: "under_review",
      }

      const updatedApp = await db.updateApplication(application.id, updates)
      if (updatedApp) {
        onUpdate(updatedApp)
      }

      // Log the review action
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Reviewed and Forwarded Application",
        details: `Reviewed application ${application.applicationId} and forwarded to Catchment Manager`,
        applicationId: application.id,
      })

      alert("Application successfully reviewed and forwarded to Catchment Manager")
    } catch (error) {
      console.error("Failed to submit:", error)
      alert("Failed to submit application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Role Information */}
      <Alert className="border-blue-200 bg-blue-50">
        <Eye className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Upper Manyame Sub Catchment Council Chairperson:</strong> Your role is to review submitted
          applications, view documents and comments from the permitting officer, then forward to the Catchment Manager.
          You do not add comments to applications.
        </AlertDescription>
      </Alert>

      {/* Application Details */}
      <ApplicationDetails user={user} application={application} />

      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Review Status</span>
            <Badge variant="outline">Stage 2 - Chairperson Review</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { stage: 1, label: "Permitting Officer", status: "completed" },
              { stage: 2, label: "Chairperson Review", status: "current" },
              { stage: 3, label: "Catchment Manager", status: "pending" },
              { stage: 4, label: "Catchment Chairperson", status: "pending" },
            ].map(({ stage, label, status }) => (
              <div
                key={stage}
                className={`p-3 rounded-lg text-center ${
                  status === "current"
                    ? "bg-blue-100 border-2 border-blue-500"
                    : status === "completed"
                      ? "bg-green-100"
                      : "bg-gray-100"
                }`}
              >
                <div className="text-sm font-medium">Stage {stage}</div>
                <div className="text-xs text-gray-600 mt-1">{label}</div>
                {status === "current" && <Clock className="h-4 w-4 mx-auto mt-1 text-blue-600" />}
                {status === "completed" && <CheckCircle className="h-4 w-4 mx-auto mt-1 text-green-600" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments from Permitting Officer (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-600" />
            Comments from Permitting Officer (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {comments.length > 0 ? (
              comments
                .filter((comment) => comment.userType === "permitting_officer")
                .map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <Badge variant="outline" className="text-xs">
                          PERMITTING OFFICER
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{comment.createdAt.toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-center py-4">No comments from permitting officer</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-green-600" />
            Application Documents (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <EnhancedDocumentViewer user={user} application={application} canUpload={false} canDelete={false} />
          ) : (
            <p className="text-gray-500 text-center py-4">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Review Actions */}
      {canReview() && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Review Confirmation */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reviewed"
                checked={isReviewed}
                onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
              />
              <label htmlFor="reviewed" className="text-sm font-medium">
                I have reviewed this application, viewed all documents and comments, and confirm it is ready for the
                next stage
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitToNextStage}
                disabled={!isReviewed || isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit to Catchment Manager
                  </>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertDescription>
                <strong>Instructions:</strong> Review the application details, documents, and any comments from the
                permitting officer. Once you have completed your review, check the box above and submit to forward this
                application to the Catchment Manager for their review and comments.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
