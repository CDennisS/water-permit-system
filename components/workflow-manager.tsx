"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, User } from "lucide-react"
import type { PermitApplication, User as UserType, WorkflowComment } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"
import { ApplicationDetails } from "./application-details"
import { CommentsPrinter } from "./comments-printer"

interface WorkflowManagerProps {
  user: UserType
  application: PermitApplication
  onUpdate: (application: PermitApplication) => void
}

export function WorkflowManager({ user, application, onUpdate }: WorkflowManagerProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isReviewed, setIsReviewed] = useState(false)
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadComments()
  }, [application.id])

  const loadComments = async () => {
    const appComments = await db.getCommentsByApplication(application.id)
    setComments(appComments)
  }

  const canReview = () => {
    switch (user.userType) {
      case "chairperson":
        return application.currentStage === 2 && application.status === "submitted"
      case "catchment_manager":
        return application.currentStage === 3
      case "catchment_chairperson":
        return application.currentStage === 4
      default:
        return false
    }
  }

  const requiresComment = () => {
    return user.userType === "catchment_manager"
  }

  const canMakeDecision = () => {
    return user.userType === "catchment_chairperson" && application.currentStage === 4
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    const comment = await db.addComment({
      applicationId: application.id,
      userId: user.id,
      userType: user.userType,
      comment: newComment,
      stage: application.currentStage,
      isRejectionReason: decision === "rejected",
    })

    setComments((prev) => [...prev, comment])
    setNewComment("")

    await db.addLog({
      userId: user.id,
      userType: user.userType,
      action: "Added Comment",
      details: `Added comment to application ${application.applicationId}`,
      applicationId: application.id,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Validate requirements
      if (requiresComment() && !newComment.trim()) {
        alert("Comment is required before submitting")
        return
      }

      if (canMakeDecision() && decision === "rejected" && !rejectionReason.trim()) {
        alert("Rejection reason is required")
        return
      }

      // Add comment if provided
      if (newComment.trim()) {
        await handleAddComment()
      }

      // Add rejection reason if provided
      if (decision === "rejected" && rejectionReason.trim()) {
        await db.addComment({
          applicationId: application.id,
          userId: user.id,
          userType: user.userType,
          comment: rejectionReason,
          stage: application.currentStage,
          isRejectionReason: true,
        })
      }

      // Update application status and stage
      let updates: Partial<PermitApplication> = {}

      if (canMakeDecision()) {
        // Final decision stage
        updates = {
          status: decision || application.status,
          currentStage: 1, // Return to permitting officer
          ...(decision === "approved" && { approvedAt: new Date() }),
          ...(decision === "rejected" && { rejectedAt: new Date() }),
        }
      } else {
        // Advance to next stage
        updates = {
          currentStage: application.currentStage + 1,
          status: "under_review",
        }
      }

      const updatedApp = await db.updateApplication(application.id, updates)
      if (updatedApp) {
        onUpdate(updatedApp)
      }

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: canMakeDecision() ? `${decision?.toUpperCase()} Application` : "Advanced Application",
        details: `Processed application ${application.applicationId}`,
        applicationId: application.id,
      })
    } catch (error) {
      console.error("Failed to submit:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStageLabel = (stage: number) => {
    const stages = {
      1: "Permitting Officer",
      2: "Upper Manyame Sub Catchment Council Chairperson",
      3: "Manyame Catchment Manager",
      4: "Manyame Catchment Chairperson",
    }
    return stages[stage as keyof typeof stages] || `Stage ${stage}`
  }

  return (
    <div className="space-y-6">
      {/* Application Details */}
      <ApplicationDetails user={user} application={application} />

      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Application Workflow</span>
            <Badge variant="outline">{getStageLabel(application.currentStage)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((stage) => (
              <div
                key={stage}
                className={`p-3 rounded-lg text-center ${
                  stage === application.currentStage
                    ? "bg-blue-100 border-2 border-blue-500"
                    : stage < application.currentStage
                      ? "bg-green-100"
                      : "bg-gray-100"
                }`}
              >
                <div className="text-sm font-medium">Stage {stage}</div>
                <div className="text-xs text-gray-600 mt-1">{getStageLabel(stage)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments History */}
      <Card>
        <CardHeader>
          <CardTitle>Comments & History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg ${
                  comment.isRejectionReason ? "bg-red-50 border border-red-200" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{getUserTypeLabel(comment.userType)}</span>
                    {comment.isRejectionReason && (
                      <Badge variant="destructive" className="text-xs">
                        Rejection Reason
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{comment.createdAt.toLocaleString()}</span>
                </div>
                <p className="text-sm">{comment.comment}</p>
              </div>
            ))}

            {comments.length === 0 && <p className="text-gray-500 text-center py-4">No comments yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* Print Comments Section */}
      {(application.status === "rejected" || comments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Print Comments Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Generate a printable report of all comments and review history for this application.
                </p>
                {application.status === "rejected" && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ This application has been rejected. Print comments for applicant notification.
                  </p>
                )}
              </div>
              <CommentsPrinter application={application} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Actions */}
      {canReview() && (
        <Card>
          <CardHeader>
            <CardTitle>Review Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Review Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reviewed"
                checked={isReviewed}
                onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
              />
              <label htmlFor="reviewed" className="text-sm font-medium">
                I have reviewed this application and all supporting documents
              </label>
            </div>

            {/* Comment Section */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {requiresComment() ? "Comment (Required)" : "Add Comment"}
              </label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your comments about this application..."
                rows={3}
              />
            </div>

            {/* Decision Section (Final Stage Only) */}
            {canMakeDecision() && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Decision</label>
                  <div className="flex space-x-4">
                    <Button
                      variant={decision === "approved" ? "default" : "outline"}
                      onClick={() => setDecision("approved")}
                      className="flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant={decision === "rejected" ? "destructive" : "outline"}
                      onClick={() => setDecision("rejected")}
                      className="flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>

                {decision === "rejected" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rejection Reason (Required)</label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide detailed reasons for rejection..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={
                  !isReviewed ||
                  isLoading ||
                  (requiresComment() && !newComment.trim()) ||
                  (decision === "rejected" && !rejectionReason.trim())
                }
              >
                {isLoading ? "Processing..." : "Submit"}
              </Button>
            </div>

            {/* Validation Messages */}
            {requiresComment() && (
              <Alert>
                <AlertDescription>A comment is required before you can submit this application.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
