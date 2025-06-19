"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
} from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { ApplicationDetails } from "./application-details"
import { EnhancedDocumentViewer } from "./enhanced-document-viewer"

interface ChairpersonDashboardProps {
  user: UserType
}

interface ReviewState {
  [applicationId: string]: boolean
}

export function ChairpersonDashboard({ user }: ChairpersonDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [reviewedApplications, setReviewedApplications] = useState<ReviewState>({})
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
      // Filter for applications submitted to chairperson (stage 2)
      const chairpersonApps = apps.filter((app) => app.status === "submitted" && app.currentStage === 2)
      setApplications(chairpersonApps)
    } catch (error) {
      console.error("Failed to load applications:", error)
    } finally {
      setIsLoading(false)
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

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setIsDetailViewOpen(true)
  }

  const handleSubmitSingleApplication = async (application: PermitApplication) => {
    if (!reviewedApplications[application.id]) {
      alert("Please mark this application as reviewed before submitting.")
      return
    }

    setIsSubmitting(true)
    try {
      await db.updateApplication(application.id, {
        currentStage: 3,
        status: "under_review",
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Advanced Application",
        details: `Advanced application ${application.applicationId} to Manyame Catchment Manager`,
        applicationId: application.id,
      })

      // Remove from current list
      setApplications((prev) => prev.filter((app) => app.id !== application.id))

      // Navigate to next unreviewed application
      const remainingApps = applications.filter((app) => app.id !== application.id)
      const nextUnreviewed = remainingApps.find((app) => !reviewedApplications[app.id])

      if (nextUnreviewed) {
        setSelectedApplication(nextUnreviewed)
      } else {
        setIsDetailViewOpen(false)
        setSelectedApplication(null)
      }

      alert(`Application ${application.applicationId} has been submitted to the Manyame Catchment Manager.`)
    } catch (error) {
      console.error("Failed to submit application:", error)
      alert("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBatchSubmit = async () => {
    const reviewedApps = applications.filter((app) => reviewedApplications[app.id])

    setIsSubmitting(true)
    try {
      for (const app of reviewedApps) {
        await db.updateApplication(app.id, {
          currentStage: 3,
          status: "under_review",
        })

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Advanced Application",
          details: `Advanced application ${app.applicationId} to Manyame Catchment Manager`,
          applicationId: app.id,
        })
      }

      setApplications((prev) => prev.filter((app) => !reviewedApplications[app.id]))
      setReviewedApplications({})
      setShowBatchConfirmation(false)

      alert(`Successfully submitted ${reviewedApps.length} applications to the Manyame Catchment Manager.`)
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
    return {
      total: totalApps,
      reviewed: reviewedCount,
      percentage: totalApps > 0 ? Math.round((reviewedCount / totalApps) * 100) : 0,
    }
  }

  const progress = getReviewProgress()
  const allReviewed = progress.reviewed === progress.total && progress.total > 0

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications for review...</div>
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Upper Manyame Sub Catchment Council Chairperson</h1>
        <p className="text-blue-100 mb-4">First Review Stage - Applications submitted by Permitting Officers</p>

        {applications.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Review Progress</span>
              <span className="text-sm">
                {progress.reviewed} of {progress.total} reviewed
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2 bg-white/20" />
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
            <p className="text-xs text-muted-foreground">Applications awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{progress.reviewed}</div>
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
            <p className="text-xs text-muted-foreground">Review progress</p>
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
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {progress.reviewed} of {progress.total} applications reviewed
                  </span>
                </div>
                {allReviewed && (
                  <Badge className="bg-green-600 text-white">
                    All applications reviewed - Ready for batch submission
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2">
                {progress.reviewed > 0 && (
                  <Button
                    onClick={() => setShowBatchConfirmation(true)}
                    disabled={!allReviewed || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit All {progress.reviewed} Applications as Batch
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
              className={`transition-all duration-200 hover:shadow-lg ${
                reviewedApplications[application.id]
                  ? "border-green-300 bg-green-50"
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
                      checked={reviewedApplications[application.id] || false}
                      onCheckedChange={(checked) => handleReviewToggle(application.id, checked as boolean)}
                      className="h-5 w-5"
                    />
                    <label htmlFor={`review-${application.id}`} className="text-sm font-medium cursor-pointer">
                      Reviewed
                    </label>
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

                {/* Submission Info */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Submitted:{" "}
                    {application.submittedAt?.toLocaleDateString() || application.createdAt.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">Intended Use: {application.intendedUse}</p>
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

                  {reviewedApplications[application.id] && (
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

                {/* Review Status Indicator */}
                {reviewedApplications[application.id] && (
                  <div className="flex items-center justify-center py-2 bg-green-100 rounded-md">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">Reviewed - Ready to Submit</span>
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
              All submitted applications have been processed. New applications will appear here when submitted by
              Permitting Officers.
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`modal-review-${selectedApplication?.id}`}
                    checked={selectedApplication ? reviewedApplications[selectedApplication.id] || false : false}
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

                {selectedApplication && reviewedApplications[selectedApplication.id] && (
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
              {/* Upper Manyame Sub Catchment Council Comments Section */}
              {selectedApplication.comments && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-800">
                      Upper Manyame Sub Catchment Council Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-700">{selectedApplication.comments}</p>
                  </CardContent>
                </Card>
              )}

              {/* Application Details (Read-Only) */}
              <ApplicationDetails user={user} application={selectedApplication} />

              {/* Enhanced Document Viewer */}
              <EnhancedDocumentViewer user={user} application={selectedApplication} isReadOnly={true} />

              {/* Navigation to Next Application */}
              {(() => {
                const currentIndex = applications.findIndex((app) => app.id === selectedApplication.id)
                const nextUnreviewed = applications.slice(currentIndex + 1).find((app) => !reviewedApplications[app.id])

                return (
                  nextUnreviewed && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Next Unreviewed Application</p>
                            <p className="text-sm text-orange-600">
                              {nextUnreviewed.applicationId} - {nextUnreviewed.applicantName}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(nextUnreviewed)
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
                You are about to submit {progress.reviewed} reviewed applications as a single batch to the Manyame
                Catchment Manager for the next stage of processing.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Applications to be submitted in this batch:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {applications
                  .filter((app) => reviewedApplications[app.id])
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
                {isSubmitting ? "Submitting..." : `Submit Batch of ${progress.reviewed} Applications`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
