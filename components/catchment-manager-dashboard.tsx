"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Droplets,
  Send,
  Eye,
  ArrowRight,
  AlertTriangle,
  CheckSquare,
  FolderOpen,
  MessageSquare,
  Save,
  Lock,
} from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { ApplicationDetails } from "./application-details"
import { EnhancedDocumentViewer } from "./enhanced-document-viewer"

interface CatchmentManagerDashboardProps {
  user: UserType
}

interface CommentState {
  [applicationId: string]: string
}

interface SavedCommentState {
  [applicationId: string]: boolean
}

export function CatchmentManagerDashboard({ user }: CatchmentManagerDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [applicationComments, setApplicationComments] = useState<CommentState>({})
  const [savedComments, setSavedComments] = useState<SavedCommentState>({})
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingComment, setIsSavingComment] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
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
      alert("Comment is mandatory and cannot be empty. Please enter a detailed review comment.")
      return
    }

    // Prevent editing comments after submission
    const application = applications.find((app) => app.id === applicationId)
    if (application && application.currentStage > 3) {
      alert("Comments are locked after submission to maintain audit integrity.")
      return
    }

    setIsSavingComment(applicationId)
    try {
      await db.addComment({
        applicationId,
        userId: user.id,
        userType: user.userType,
        comment,
        stage: 3,
      })

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

  const handleSubmitSingleApplication = async (application: PermitApplication) => {
    if (!savedComments[application.id]) {
      alert("Please add and save a comment for this application before submitting.")
      return
    }

    setIsSubmitting(true)
    try {
      await db.updateApplication(application.id, {
        currentStage: 4,
        status: "under_review",
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Advanced Application",
        details: `Advanced application ${application.applicationId} to Manyame Catchment Chairperson`,
        applicationId: application.id,
      })

      // Remove from current list
      setApplications((prev) => prev.filter((app) => app.id !== application.id))

      // Navigate to next uncommented application
      const remainingApps = applications.filter((app) => app.id !== application.id)
      const nextUncommented = remainingApps.find((app) => !savedComments[app.id])

      if (nextUncommented) {
        setSelectedApplication(nextUncommented)
      } else {
        setIsDetailViewOpen(false)
        setSelectedApplication(null)
      }

      alert(`Application ${application.applicationId} has been submitted to the Manyame Catchment Chairperson.`)
    } catch (error) {
      console.error("Failed to submit application:", error)
      alert("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBatchSubmit = async () => {
    const commentedApps = applications.filter((app) => savedComments[app.id])

    setIsSubmitting(true)
    try {
      for (const app of commentedApps) {
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

      setApplications((prev) => prev.filter((app) => !savedComments[app.id]))
      setApplicationComments({})
      setSavedComments({})
      setShowBatchConfirmation(false)

      alert(`Successfully submitted ${commentedApps.length} applications to the Manyame Catchment Chairperson.`)
    } catch (error) {
      console.error("Failed to submit applications:", error)
      alert("Failed to submit applications. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReviewProgress = () => {
    const totalApps = applications.length
    const commentedCount = Object.values(savedComments).filter(Boolean).length
    return {
      total: totalApps,
      commented: commentedCount,
      percentage: totalApps > 0 ? Math.round((commentedCount / totalApps) * 100) : 0,
    }
  }

  const progress = getReviewProgress()
  const allCommented = progress.commented === progress.total && progress.total > 0

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
              <span className="text-sm font-medium">Comment Progress</span>
              <span className="text-sm">
                {progress.commented} of {progress.total} commented
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2 bg-white/20" />
          </div>
        )}
        {applications.length > 0 && (
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Comment Completion Status:</span>
              <span className="font-medium">
                {allCommented
                  ? "✅ All Applications Commented - Ready for Batch Submission"
                  : `📝 ${progress.total - progress.commented} applications need comments`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{applications.length}</div>
            <p className="text-xs text-muted-foreground">Applications awaiting your comments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commented</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{progress.commented}</div>
            <p className="text-xs text-muted-foreground">Ready for batch submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{progress.percentage}%</div>
            <p className="text-xs text-muted-foreground">Comment progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions */}
      {applications.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {progress.commented} of {progress.total} applications commented
                  </span>
                </div>
                {allCommented && (
                  <Badge className="bg-green-600 text-white">
                    All applications commented - Ready for batch submission
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2">
                {progress.commented > 0 && (
                  <Button
                    onClick={() => setShowBatchConfirmation(true)}
                    disabled={!allCommented || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit All {progress.commented} Applications as Batch
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Grid */}
      {applications.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {applications.map((application) => (
            <Card
              key={application.id}
              className={`transition-all duration-200 hover:shadow-lg cursor-pointer transform hover:scale-[1.02] ${
                savedComments[application.id]
                  ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100 shadow-md"
                  : "border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-blue-900">{application.applicationId}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{application.applicantName}</p>
                  </div>
                  <div className="text-right">
                    {savedComments[application.id] ? (
                      <Badge className="bg-green-100 text-green-800">Comment Added ✓</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Comment Required</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
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
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Manager Review Comment <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {savedComments[application.id] ? (
                        <Badge className="bg-green-100 text-green-800">Saved</Badge>
                      ) : applicationComments[application.id]?.trim() ? (
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
                    disabled={application.currentStage > 3}
                  />

                  {application.currentStage > 3 && (
                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Comments are locked after submission to maintain audit integrity
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleSaveComment(application.id)}
                    disabled={
                      !applicationComments[application.id]?.trim() ||
                      isSavingComment === application.id ||
                      application.currentStage > 3
                    }
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
                    Review & View Documents
                  </Button>

                  {savedComments[application.id] && (
                    <Button
                      size="sm"
                      onClick={() => handleSubmitSingleApplication(application)}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </Button>
                  )}
                </div>

                {/* Comment Status Indicator */}
                {savedComments[application.id] && (
                  <div className="flex items-center justify-center py-2 bg-green-100 rounded-md">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">Commented - Ready to Submit</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Pending Review</h3>
            <p className="text-gray-600">
              All submitted applications have been processed. New applications will appear here when submitted by the
              Chairperson.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Detail Modal */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Application Review - {selectedApplication?.applicationId}</span>
              <div className="flex items-center space-x-4">
                {selectedApplication && savedComments[selectedApplication.id] && (
                  <Button
                    onClick={() => selectedApplication && handleSubmitSingleApplication(selectedApplication)}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Manyame Catchment Manager Comments Section */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Manyame Catchment Manager Comments
                  </CardTitle>
                  <p className="text-sm text-green-600">Add your mandatory review comments for this application</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Textarea
                      value={applicationComments[selectedApplication.id] || ""}
                      onChange={(e) => handleCommentChange(selectedApplication.id, e.target.value)}
                      placeholder="Enter your mandatory review comments for this application..."
                      rows={4}
                      disabled={selectedApplication.currentStage > 3}
                    />
                    <Button
                      onClick={() => handleSaveComment(selectedApplication.id)}
                      disabled={
                        !applicationComments[selectedApplication.id]?.trim() ||
                        isSavingComment === selectedApplication.id ||
                        selectedApplication.currentStage > 3
                      }
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {selectedApplication.currentStage > 3
                        ? "Comment Locked"
                        : isSavingComment === selectedApplication.id
                          ? "Saving..."
                          : "Save Comment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Application Details (Read-Only) */}
              <ApplicationDetails user={user} application={selectedApplication} />

              {/* Enhanced Document Viewer */}
              <EnhancedDocumentViewer user={user} application={selectedApplication} isReadOnly={true} />

              {/* Navigation to Next Application */}
              {(() => {
                const currentIndex = applications.findIndex((app) => app.id === selectedApplication.id)
                const nextUncommented = applications.slice(currentIndex + 1).find((app) => !savedComments[app.id])

                return (
                  nextUncommented && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Next Uncommented Application</p>
                            <p className="text-sm text-orange-600">
                              {nextUncommented.applicationId} - {nextUncommented.applicantName}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(nextUncommented)
                            }}
                            className="border-orange-300 text-orange-700 hover:bg-orange-100"
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Next Application
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )
              })()}
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
                You are about to submit {progress.commented} commented applications as a single batch to the Manyame
                Catchment Chairperson for the next stage of processing.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Applications to be submitted in this batch:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {applications
                  .filter((app) => savedComments[app.id])
                  .map((app) => (
                    <div key={app.id} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span>
                        {app.applicationId} - {app.applicantName}
                      </span>
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
                {isSubmitting ? "Submitting..." : `Submit Batch of ${progress.commented} Applications`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
