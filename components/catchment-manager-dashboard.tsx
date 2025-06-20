"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Save,
  Lock,
  Database,
  BarChart3,
} from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { ApplicationDetails } from "./application-details"
import { EnhancedDocumentViewer } from "./enhanced-document-viewer"
import { ReportsAnalytics } from "./reports-analytics"

interface CatchmentManagerDashboardProps {
  user: UserType
}

interface ReviewState {
  [applicationId: string]: {
    reviewed: boolean
    comment: string
    commentSaved: boolean
  }
}

export function CatchmentManagerDashboard({ user }: CatchmentManagerDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [reviewStates, setReviewStates] = useState<ReviewState>({})
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submittedPermits, setSubmittedPermits] = useState<PermitApplication[]>([])

  useEffect(() => {
    loadApplications()
    loadSubmittedPermits()
  }, [])

  const loadApplications = async () => {
    try {
      const apps = await db.getApplications()
      // Filter for applications at stage 3 (from Chairperson)
      const managerApps = apps.filter((app) => app.currentStage === 3)
      setApplications(managerApps)

      // Initialize review states
      const initialStates: ReviewState = {}
      managerApps.forEach((app) => {
        initialStates[app.id] = {
          reviewed: false,
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

  const loadSubmittedPermits = async () => {
    try {
      const apps = await db.getApplications()
      const submitted = apps.filter((app) => app.status === "approved" || app.status === "rejected")
      setSubmittedPermits(submitted)
    } catch (error) {
      console.error("Failed to load submitted permits:", error)
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
        stage: 3,
        decision: null,
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
      return state.reviewed && state.commentSaved
    })

    setIsSubmitting(true)
    try {
      for (const app of readyApps) {
        await db.updateApplication(app.id, {
          currentStage: 4, // Move to Catchment Chairperson
          status: "under_review",
        })

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Advanced Application",
          details: `Advanced application ${app.applicationId} to Manyame Catchment Chairperson`,
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
    const readyCount = Object.values(reviewStates).filter((state) => state.reviewed && state.commentSaved).length

    return {
      total: totalApps,
      reviewed: reviewedCount,
      commented: commentedCount,
      ready: readyCount,
      percentage: totalApps > 0 ? Math.round((readyCount / totalApps) * 100) : 0,
    }
  }

  const progress = getReviewProgress()
  const allReady = progress.ready === progress.total && progress.total > 0

  const canSubmitBatch = () => {
    if (applications.length === 0) return false
    // ALL applications must have BOTH reviewed checkbox AND saved comment
    return applications.every((app) => {
      const state = reviewStates[app.id]
      return state.reviewed && state.commentSaved
    })
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications for review...</div>
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Manyame Catchment Manager</h1>
        <p className="text-green-100 mb-4">Second Review Stage - Review applications from Chairperson</p>

        {applications.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Review Progress</span>
              <span className="text-sm">
                {progress.ready} of {progress.total} ready for submission
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2 bg-white/20" />
            <div className="flex justify-between text-xs text-green-100 mt-2">
              <span>
                ✓ Reviewed: {progress.reviewed}/{progress.total}
              </span>
              <span>
                💬 Commented: {progress.commented}/{progress.total}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="review">Review Applications</TabsTrigger>
          <TabsTrigger value="permits">Submitted Permits</TabsTrigger>
          <TabsTrigger value="analytics">Analytical Data</TabsTrigger>
          <TabsTrigger value="tracking">Status Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{applications.length}</div>
                <p className="text-xs text-muted-foreground">Applications for review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{progress.reviewed}</div>
                <p className="text-xs text-muted-foreground">Checkboxes ticked</p>
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
                <CheckSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{progress.ready}</div>
                <p className="text-xs text-muted-foreground">Complete applications</p>
              </CardContent>
            </Card>
          </div>

          {/* Batch Actions */}
          {applications.length > 0 && (
            <Card
              className={`border-2 ${canSubmitBatch() ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {canSubmitBatch() ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${canSubmitBatch() ? "text-green-800" : "text-red-800"}`}>
                        {canSubmitBatch()
                          ? `All ${progress.total} applications ready - Both reviewed ✓ and commented ✓`
                          : `${progress.ready} of ${progress.total} applications ready (need both reviewed ✓ and commented ✓)`}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowBatchConfirmation(true)}
                      disabled={!canSubmitBatch() || isSubmitting}
                      className={canSubmitBatch() ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit All Applications ({progress.total})
                    </Button>
                  </div>
                </div>

                {!canSubmitBatch() && applications.length > 0 && (
                  <Alert className="mt-4 border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>SUBMISSION BLOCKED:</strong> All applications must have BOTH the "Reviewed" checkbox
                      ticked (✓) AND mandatory comments saved (✓) before batch submission is allowed. Currently{" "}
                      {progress.total - progress.ready} applications are incomplete.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Applications Grid */}
          {applications.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {applications.map((application) => {
                const reviewState = reviewStates[application.id] || {
                  reviewed: false,
                  comment: "",
                  commentSaved: false,
                }
                const isComplete = reviewState.reviewed && reviewState.commentSaved

                return (
                  <Card
                    key={application.id}
                    className={`transition-all duration-200 hover:shadow-lg ${
                      isComplete ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-green-900">
                            {application.applicationId}
                          </CardTitle>
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
                      {/* Application Details (Read-Only) */}
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

                      {/* Mandatory Comment Section */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mandatory Manager Comment:</label>
                        <Textarea
                          placeholder="Enter your mandatory review comment (required)..."
                          value={reviewState.comment}
                          onChange={(e) => handleCommentChange(application.id, e.target.value)}
                          className="min-h-[80px]"
                          disabled={application.currentStage > 3}
                        />

                        {application.currentStage > 3 && (
                          <div className="text-xs text-gray-500 mb-2 flex items-center">
                            <Lock className="h-3 w-3 mr-1" />
                            Comments cannot be edited after submission
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveComment(application.id)}
                            disabled={!reviewState.comment.trim() || application.currentStage > 3}
                          >
                            <Save className="h-4 w-4 mr-2" />
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
                          View Details & Documents
                        </Button>
                      </div>

                      {/* Completion Status */}
                      <div className="flex items-center justify-between text-xs bg-gray-100 p-2 rounded">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`flex items-center ${reviewState.reviewed ? "text-green-600" : "text-red-600"}`}
                          >
                            <CheckSquare className="h-3 w-3 mr-1" />
                            {reviewState.reviewed ? "Reviewed ✓" : "Review Required"}
                          </div>
                          <div
                            className={`flex items-center ${reviewState.commentSaved ? "text-green-600" : "text-red-600"}`}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {reviewState.commentSaved ? "Commented ✓" : "Comment Required"}
                          </div>
                        </div>
                        {isComplete && <Badge className="bg-green-600 text-white text-xs">Ready</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Pending Review</h3>
                <p className="text-gray-600">
                  All applications have been processed. New applications will appear here when submitted by the
                  Chairperson.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permits">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Record of All Submitted Permits ({submittedPermits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submittedPermits.length > 0 ? (
                  <div className="grid gap-4">
                    {submittedPermits.map((permit) => (
                      <div key={permit.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{permit.applicationId}</h4>
                            <p className="text-sm text-gray-600">{permit.applicantName}</p>
                            <p className="text-xs text-gray-500">
                              {permit.status === "approved" ? "Approved" : "Rejected"}:{" "}
                              {permit.status === "approved"
                                ? permit.approvedAt?.toLocaleDateString()
                                : permit.rejectedAt?.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={
                                permit.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }
                            >
                              {permit.status.toUpperCase()}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">{permit.waterAllocation.toLocaleString()} ML</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No submitted permits found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytical Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Overall Status Tracking</CardTitle>
              <p className="text-sm text-gray-600">Track and view the status of any application at any time</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.concat(submittedPermits).map((app) => (
                  <div key={app.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{app.applicationId}</h4>
                        <p className="text-sm text-gray-600">{app.applicantName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Stage {app.currentStage}</Badge>
                        <Badge
                          className={
                            app.status === "approved"
                              ? "bg-green-100 text-green-800 ml-2"
                              : app.status === "rejected"
                                ? "bg-red-100 text-red-800 ml-2"
                                : app.status === "under_review"
                                  ? "bg-yellow-100 text-yellow-800 ml-2"
                                  : "bg-blue-100 text-blue-800 ml-2"
                          }
                        >
                          {app.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Detail Modal */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manager Review - {selectedApplication?.applicationId}</DialogTitle>
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
                </CardContent>
              </Card>

              {/* Application Details (Read-Only) */}
              <ApplicationDetails user={user} application={selectedApplication} />

              {/* Enhanced Document Viewer (Read-Only) */}
              <EnhancedDocumentViewer
                user={user}
                application={selectedApplication}
                isReadOnly={true}
                canUpload={false}
                canDelete={false}
                canModify={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Confirmation Modal */}
      <Dialog open={showBatchConfirmation} onOpenChange={setShowBatchConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Submission</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to submit ALL {progress.total} applications to the Manyame Catchment Chairperson. All
                applications have been reviewed (✓) and commented (✓). This will advance them to the final stage of the
                review process.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Applications ready for submission:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {applications
                  .filter((app) => {
                    const state = reviewStates[app.id]
                    return state?.reviewed && state?.commentSaved
                  })
                  .map((app) => (
                    <div key={app.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>
                          {app.applicationId} - {app.applicantName}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Reviewed</Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">Commented</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBatchConfirmation(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBatchSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? "Processing..." : `Submit All ${progress.total} Applications`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
