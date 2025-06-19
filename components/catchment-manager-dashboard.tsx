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
  FolderOpen,
  MessageSquare,
  Save,
  BarChart3,
  Database,
  AlertCircle,
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
  [applicationId: string]: boolean
}

interface CommentState {
  [applicationId: string]: string
}

interface SavedCommentState {
  [applicationId: string]: boolean
}

export function CatchmentManagerDashboard({ user }: CatchmentManagerDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [reviewedApplications, setReviewedApplications] = useState<ReviewState>({})
  const [applicationComments, setApplicationComments] = useState<CommentState>({})
  const [savedComments, setSavedComments] = useState<SavedCommentState>({})
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingComment, setIsSavingComment] = useState<string | null>(null)
  const [approvedApplications, setApprovedApplications] = useState<PermitApplication[]>([])

  useEffect(() => {
    loadApplications()
    loadApprovedApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const apps = await db.getApplications()
      // Filter for applications at stage 3 (from Chairperson)
      const managerApps = apps.filter((app) => app.currentStage === 3)
      setApplications(managerApps)

      // Load existing comments
      for (const app of managerApps) {
        const comments = await db.getCommentsByApplication(app.id)
        const managerComment = comments.find((c) => c.userType === "catchment_manager")
        if (managerComment) {
          setApplicationComments((prev) => ({
            ...prev,
            [app.id]: managerComment.comment,
          }))
          setSavedComments((prev) => ({
            ...prev,
            [app.id]: true,
          }))
        }
      }
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadApprovedApplications = async () => {
    try {
      const apps = await db.getApplications()
      const approved = apps.filter((app) => app.status === "approved")
      setApprovedApplications(approved)
    } catch (error) {
      console.error("Failed to load approved applications:", error)
    }
  }

  const handleReviewToggle = async (applicationId: string, reviewed: boolean) => {
    setReviewedApplications((prev) => ({
      ...prev,
      [applicationId]: reviewed,
    }))

    // Auto-save review status
    await db.addLog({
      userId: user.id,
      userType: user.userType,
      action: reviewed ? "Marked as Reviewed" : "Unmarked Review",
      details: `${reviewed ? "Marked" : "Unmarked"} application ${applicationId} as reviewed`,
      applicationId: applicationId,
    })
  }

  const handleCommentChange = (applicationId: string, comment: string) => {
    setApplicationComments((prev) => ({
      ...prev,
      [applicationId]: comment,
    }))

    // Mark as unsaved when comment changes
    setSavedComments((prev) => ({
      ...prev,
      [applicationId]: false,
    }))
  }

  const handleSaveComment = async (applicationId: string) => {
    const comment = applicationComments[applicationId]
    if (!comment?.trim()) {
      alert("Please enter a comment before saving.")
      return
    }

    // NEW: Prevent editing comments after submission
    const application = applications.find((app) => app.id === applicationId)
    if (application && application.currentStage > 3) {
      alert("Cannot edit comments after application has been submitted to the next stage.")
      return
    }

    setIsSavingComment(applicationId)
    try {
      // Check if comment already exists
      const existingComments = await db.getCommentsByApplication(applicationId)
      const existingManagerComment = existingComments.find((c) => c.userType === "catchment_manager")

      if (existingManagerComment) {
        // Update existing comment (in a real system, you'd have an update method)
        // For now, we'll add a new comment with updated content
        await db.addComment({
          applicationId,
          userId: user.id,
          userType: user.userType,
          comment: `[UPDATED] ${comment}`,
          stage: 3,
        })
      } else {
        await db.addComment({
          applicationId,
          userId: user.id,
          userType: user.userType,
          comment,
          stage: 3,
        })
      }

      setSavedComments((prev) => ({
        ...prev,
        [applicationId]: true,
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
    } finally {
      setIsSavingComment(null)
    }
  }

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setIsDetailViewOpen(true)
  }

  const handleBatchSubmit = async () => {
    const validApps = applications.filter((app) => reviewedApplications[app.id] && savedComments[app.id])

    setIsSubmitting(true)
    try {
      for (const app of validApps) {
        await db.updateApplication(app.id, {
          currentStage: 4,
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

      setApplications((prev) => prev.filter((app) => !(reviewedApplications[app.id] && savedComments[app.id])))
      setReviewedApplications({})
      setApplicationComments({})
      setSavedComments({})
      setShowBatchConfirmation(false)

      alert(`Successfully submitted ${validApps.length} applications to the Manyame Catchment Chairperson.`)
    } catch (error) {
      console.error("Failed to submit applications:", error)
      alert("Failed to submit applications. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReviewProgress = () => {
    const totalApps = applications.length
    const reviewedCount = Object.values(reviewedApplications).filter(Boolean).length
    const commentedCount = Object.values(savedComments).filter(Boolean).length
    const readyCount = applications.filter((app) => reviewedApplications[app.id] && savedComments[app.id]).length

    return {
      total: totalApps,
      reviewed: reviewedCount,
      commented: commentedCount,
      ready: readyCount,
      percentage: totalApps > 0 ? Math.round((readyCount / totalApps) * 100) : 0,
    }
  }

  const canSubmitBatch = () => {
    if (applications.length === 0) return false
    return applications.every((app) => reviewedApplications[app.id] && savedComments[app.id])
  }

  const progress = getReviewProgress()

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications for review...</div>
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Manyame Catchment Manager</h1>
        <p className="text-green-100 mb-4">
          Second Review Stage - Applications from Upper Manyame Sub Catchment Council Chairperson
        </p>

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
                Reviewed: {progress.reviewed}/{progress.total}
              </span>
              <span>
                Commented: {progress.commented}/{progress.total}
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
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
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
                <p className="text-xs text-muted-foreground">Applications awaiting review</p>
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
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{progress.commented}</div>
                <p className="text-xs text-muted-foreground">Comments saved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready to Submit</CardTitle>
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
              className={`border-2 ${canSubmitBatch() ? "border-green-300 bg-green-50" : "border-orange-300 bg-orange-50"}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {canSubmitBatch() ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      )}
                      <span className={`font-medium ${canSubmitBatch() ? "text-green-800" : "text-orange-800"}`}>
                        {canSubmitBatch()
                          ? `All ${progress.total} applications reviewed and commented - Ready for batch submission`
                          : `${progress.ready} of ${progress.total} applications ready (need both review ✓ and comment ✓)`}
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
                      Submit All {progress.total} Applications
                    </Button>
                  </div>
                </div>

                {!canSubmitBatch() && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      All applications must be both reviewed (✓) and have saved comments before batch submission is
                      allowed.
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
                const isReviewed = reviewedApplications[application.id]
                const hasComment = applicationComments[application.id]?.trim()
                const isCommentSaved = savedComments[application.id]
                const isComplete = isReviewed && isCommentSaved

                return (
                  <Card
                    key={application.id}
                    className={`transition-all duration-200 hover:shadow-lg ${
                      isComplete
                        ? "border-green-300 bg-green-50"
                        : isReviewed || isCommentSaved
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-blue-900">{application.applicationId}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{application.applicantName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`review-${application.id}`}
                            checked={isReviewed || false}
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

                        <div className="flex items-center text-sm">
                          <FolderOpen className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-medium">Documents:</span>
                          <span className="ml-2">{application.documents.length} uploaded</span>
                        </div>
                      </div>

                      {/* Mandatory Comment Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Manager Review Comment <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center space-x-2">
                            {isCommentSaved ? (
                              <Badge className="bg-green-100 text-green-800">Saved</Badge>
                            ) : hasComment ? (
                              <Badge className="bg-yellow-100 text-yellow-800">Unsaved</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Required</Badge>
                            )}
                          </div>
                        </div>

                        <Textarea
                          value={applicationComments[application.id] || ""}
                          onChange={(e) => handleCommentChange(application.id, e.target.value)}
                          placeholder="Enter your mandatory review comments for this application..."
                          rows={3}
                          className="mb-2"
                          disabled={application.currentStage > 3} // NEW: Disable if already submitted
                        />

                        <Button
                          size="sm"
                          onClick={() => handleSaveComment(application.id)}
                          disabled={!hasComment || isSavingComment === application.id || application.currentStage > 3} // NEW: Disable if submitted
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {application.currentStage > 3
                            ? "Comment Locked"
                            : isSavingComment === application.id
                              ? "Saving..."
                              : "Save Comment"}
                        </Button>
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

                      {/* Status Indicators */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center ${isReviewed ? "text-green-600" : "text-gray-400"}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reviewed
                          </div>
                          <div className={`flex items-center ${isCommentSaved ? "text-green-600" : "text-gray-400"}`}>
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Commented
                          </div>
                        </div>
                        {isComplete && <Badge className="bg-green-600 text-white text-xs">Ready to Submit</Badge>}
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
                Record of Submitted Permits ({approvedApplications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedApplications.length > 0 ? (
                  <div className="grid gap-4">
                    {approvedApplications.map((permit) => (
                      <div key={permit.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{permit.applicationId}</h4>
                            <p className="text-sm text-gray-600">{permit.applicantName}</p>
                            <p className="text-xs text-gray-500">Approved: {permit.approvedAt?.toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                            <p className="text-sm text-gray-600 mt-1">{permit.waterAllocation.toLocaleString()} ML</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No approved permits found.</div>
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

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportsAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Detail Modal */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Review - {selectedApplication?.applicationId}</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <ApplicationDetails user={user} application={selectedApplication} />
              <EnhancedDocumentViewer user={user} application={selectedApplication} isReadOnly={true} />
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
                You are about to submit all {progress.total} reviewed and commented applications to the Manyame
                Catchment Chairperson for final approval.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Applications to be submitted:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {applications
                  .filter((app) => reviewedApplications[app.id] && savedComments[app.id])
                  .map((app) => (
                    <div key={app.id} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span>
                        {app.applicationId} - {app.applicantName}
                      </span>
                      <div className="ml-auto flex space-x-1">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Reviewed</Badge>
                        <Badge className="bg-purple-100 text-purple-800 text-xs">Commented</Badge>
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
                {isSubmitting ? "Submitting..." : `Submit All ${progress.total} Applications`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
