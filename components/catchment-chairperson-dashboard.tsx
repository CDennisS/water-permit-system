"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Droplets,
  Send,
  Eye,
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { ApplicationDetails } from "./application-details"

interface CatchmentChairpersonDashboardProps {
  user: UserType
}

interface ReviewState {
  [applicationId: string]: {
    reviewed: boolean
    decision: "approved" | "rejected" | null
    comment: string
    commentSaved: boolean
  }
}

export function CatchmentChairpersonDashboard({ user }: CatchmentChairpersonDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [reviewStates, setReviewStates] = useState<ReviewState>({})
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const apps = await db.getApplications()
      // Filter for applications at stage 4 (from Catchment Manager)
      const chairpersonApps = apps.filter((app) => app.currentStage === 4)
      setApplications(chairpersonApps)

      // Initialize review states
      const initialStates: ReviewState = {}
      chairpersonApps.forEach((app) => {
        initialStates[app.id] = {
          reviewed: false,
          decision: null,
          comment: "",
          commentSaved: false,
        }
      })
      setReviewStates(initialStates)
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewToggle = async (applicationId: string, reviewed: boolean) => {
    setReviewStates((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        reviewed,
      },
    }))

    await db.addLog({
      userId: user.id,
      userType: user.userType,
      action: reviewed ? "Marked as Reviewed" : "Unmarked Review",
      details: `${reviewed ? "Marked" : "Unmarked"} application ${applicationId} as reviewed`,
      applicationId: applicationId,
    })
  }

  const handleDecisionChange = (applicationId: string, decision: "approved" | "rejected") => {
    setReviewStates((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        decision,
      },
    }))
  }

  const handleCommentChange = (applicationId: string, comment: string) => {
    setReviewStates((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        comment,
        commentSaved: false,
      },
    }))
  }

  const handleSaveComment = async (applicationId: string) => {
    const reviewState = reviewStates[applicationId]
    if (!reviewState.comment.trim()) {
      alert("Please enter a comment before saving.")
      return
    }

    try {
      await db.addWorkflowComment(applicationId, {
        userId: user.id,
        userType: user.userType,
        userName: user.name,
        comment: reviewState.comment,
        stage: 4,
        decision: reviewState.decision,
        timestamp: new Date(),
      })

      setReviewStates((prev) => ({
        ...prev,
        [applicationId]: {
          ...prev[applicationId],
          commentSaved: true,
        },
      }))

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Saved Comment",
        details: `Saved review comment for application ${applicationId}`,
        applicationId: applicationId,
      })

      alert("Comment saved successfully!")
    } catch (error) {
      console.error("Failed to save comment:", error)
      alert("Failed to save comment. Please try again.")
    }
  }

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setIsDetailViewOpen(true)
  }

  const handleBatchSubmit = async () => {
    const readyApps = applications.filter((app) => {
      const state = reviewStates[app.id]
      return state.reviewed && state.commentSaved && state.decision
    })

    setIsSubmitting(true)
    try {
      for (const app of readyApps) {
        const reviewState = reviewStates[app.id]
        const newStatus = reviewState.decision === "approved" ? "approved" : "rejected"

        await db.updateApplication(app.id, {
          currentStage: 1, // Return to Permitting Officer
          status: newStatus,
          approvedAt: reviewState.decision === "approved" ? new Date() : undefined,
          rejectedAt: reviewState.decision === "rejected" ? new Date() : undefined,
        })

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: `${reviewState.decision === "approved" ? "Approved" : "Rejected"} Application`,
          details: `Final decision: ${reviewState.decision} for application ${app.applicationId}`,
          applicationId: app.id,
        })
      }

      setApplications((prev) => prev.filter((app) => !readyApps.some((ready) => ready.id === app.id)))
      setReviewStates({})
      setShowBatchConfirmation(false)

      alert(`Successfully processed ${readyApps.length} applications.`)
    } catch (error) {
      console.error("Failed to submit applications:", error)
      alert("Failed to submit applications. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReviewProgress = () => {
    const totalApps = applications.length
    const reviewedCount = Object.values(reviewStates).filter((state) => state.reviewed).length
    const commentedCount = Object.values(reviewStates).filter((state) => state.commentSaved).length
    const decidedCount = Object.values(reviewStates).filter((state) => state.decision).length
    const readyCount = Object.values(reviewStates).filter(
      (state) => state.reviewed && state.commentSaved && state.decision,
    ).length

    return {
      total: totalApps,
      reviewed: reviewedCount,
      commented: commentedCount,
      decided: decidedCount,
      ready: readyCount,
      percentage: totalApps > 0 ? Math.round((readyCount / totalApps) * 100) : 0,
    }
  }

  const progress = getReviewProgress()
  const allReady = progress.ready === progress.total && progress.total > 0

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications for final review...</div>
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Manyame Catchment Chairperson</h1>
        <p className="text-purple-100 mb-4">Final Review Stage - Make approval/rejection decisions</p>

        {applications.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Final Review Progress</span>
              <span className="text-sm">
                {progress.ready} of {progress.total} ready for decision
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2 bg-white/20" />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{applications.length}</div>
            <p className="text-xs text-muted-foreground">Applications for final decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{progress.reviewed}</div>
            <p className="text-xs text-muted-foreground">Applications reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commented</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{progress.commented}</div>
            <p className="text-xs text-muted-foreground">Comments saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <CheckSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{progress.ready}</div>
            <p className="text-xs text-muted-foreground">Ready for submission</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions */}
      {applications.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800">
                    {progress.ready} of {progress.total} applications ready for final decision
                  </span>
                </div>
                {allReady && (
                  <Badge className="bg-purple-600 text-white">All applications ready for batch submission</Badge>
                )}
              </div>

              <div className="flex space-x-2">
                {progress.ready > 0 && (
                  <Button
                    onClick={() => setShowBatchConfirmation(true)}
                    disabled={!allReady || isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Final Decisions ({progress.ready})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Grid */}
      {applications.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {applications.map((application) => {
            const reviewState = reviewStates[application.id] || {
              reviewed: false,
              decision: null,
              comment: "",
              commentSaved: false,
            }
            const isComplete = reviewState.reviewed && reviewState.commentSaved && reviewState.decision

            return (
              <Card
                key={application.id}
                className={`transition-all duration-200 hover:shadow-lg ${
                  isComplete ? "border-purple-300 bg-purple-50" : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-purple-900">{application.applicationId}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{application.applicantName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`review-${application.id}`}
                        checked={reviewState.reviewed}
                        onCheckedChange={(checked) => handleReviewToggle(application.id, checked as boolean)}
                        className="h-5 w-5"
                      />
                      <label htmlFor={`review-${application.id}`} className="text-sm font-medium cursor-pointer">
                        Reviewed
                      </label>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Application Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">Permit Type:</span>
                      <span className="ml-2 capitalize">{application.permitType.replace("_", " ")}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Droplets className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium">Water Allocation:</span>
                      <span className="ml-2">{application.waterAllocation.toLocaleString()} ML</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">Boreholes:</span>
                      <span className="ml-2">{application.numberOfBoreholes}</span>
                    </div>
                  </div>

                  {/* Decision Buttons */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Final Decision:</label>
                    <div className="flex space-x-2">
                      <Button
                        variant={reviewState.decision === "approved" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDecisionChange(application.id, "approved")}
                        className={
                          reviewState.decision === "approved"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "border-green-300 text-green-700 hover:bg-green-50"
                        }
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant={reviewState.decision === "rejected" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDecisionChange(application.id, "rejected")}
                        className={
                          reviewState.decision === "rejected"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "border-red-300 text-red-700 hover:bg-red-50"
                        }
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Final Review Comment:</label>
                    <Textarea
                      placeholder="Enter your final review comment (required)..."
                      value={reviewState.comment}
                      onChange={(e) => handleCommentChange(application.id, e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveComment(application.id)}
                        disabled={!reviewState.comment.trim()}
                      >
                        Save Comment
                      </Button>
                      <Badge
                        variant={reviewState.commentSaved ? "default" : "secondary"}
                        className={
                          reviewState.commentSaved
                            ? "bg-green-100 text-green-800"
                            : reviewState.comment && !reviewState.commentSaved
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {reviewState.commentSaved
                          ? "Comment Saved"
                          : reviewState.comment && !reviewState.commentSaved
                            ? "Unsaved Changes"
                            : "Comment Required"}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewApplication(application)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Details & Comments
                    </Button>
                  </div>

                  {/* Completion Status */}
                  {isComplete && (
                    <div className="flex items-center justify-center py-2 bg-purple-100 rounded-md">
                      <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800">
                        Ready for Final Submission - {reviewState.decision?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Pending Final Review</h3>
            <p className="text-gray-600">
              All applications have been processed. New applications will appear here when submitted by the Catchment
              Manager.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Detail Modal with All Comments */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Final Review - {selectedApplication?.applicationId}</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`modal-review-${selectedApplication?.id}`}
                    checked={selectedApplication ? reviewStates[selectedApplication.id]?.reviewed || false : false}
                    onCheckedChange={(checked) =>
                      selectedApplication && handleReviewToggle(selectedApplication.id, checked as boolean)
                    }
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor={`modal-review-${selectedApplication?.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    Mark as Reviewed
                  </label>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* All Previous Comments Section */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Review History - All Comments from Previous Stages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedApplication.workflowComments.length > 0 ? (
                    selectedApplication.workflowComments.map((comment, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">
                              {comment.userName} ({comment.userType.replace("_", " ").toUpperCase()})
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Stage {comment.stage}
                            </Badge>
                            {comment.decision && (
                              <Badge
                                className={
                                  comment.decision === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {comment.decision.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {comment.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                          {comment.comment}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-blue-600 text-sm italic">No previous comments available.</p>
                  )}

                  {/* Original Application Comments */}
                  {selectedApplication.comments && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Original Application Comments</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          Initial Submission
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                        {selectedApplication.comments}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Details (Read-Only) */}
              <ApplicationDetails user={user} application={selectedApplication} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Confirmation Modal */}
      <Dialog open={showBatchConfirmation} onOpenChange={setShowBatchConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Final Batch Submission</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to submit final decisions for {progress.ready} applications. This will complete the review
                process and return applications to Permitting Officers with your final approval/rejection decisions.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Applications with final decisions:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {applications
                  .filter((app) => {
                    const state = reviewStates[app.id]
                    return state?.reviewed && state?.commentSaved && state?.decision
                  })
                  .map((app) => {
                    const state = reviewStates[app.id]
                    return (
                      <div key={app.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span>
                            {app.applicationId} - {app.applicantName}
                          </span>
                        </div>
                        <Badge
                          className={
                            state.decision === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {state.decision?.toUpperCase()}
                        </Badge>
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBatchConfirmation(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBatchSubmit}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? "Processing..." : `Submit Final Decisions (${progress.ready})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
