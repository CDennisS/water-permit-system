"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, FileText, CheckCircle, User, Save, MapPin, Phone, Home, Droplets, Calendar } from "lucide-react"
import type { PermitApplication, User as UserType, WorkflowComment, Document } from "@/types"
import { db } from "@/lib/database"
import { EnhancedDocumentViewer } from "./enhanced-document-viewer"

interface ChairpersonReviewWorkflowProps {
  user: UserType
  application: PermitApplication
  onUpdate: () => void
}

export function ChairpersonReviewWorkflow({ user, application, onUpdate }: ChairpersonReviewWorkflowProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isReviewed, setIsReviewed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

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

    // Check if already reviewed by chairperson
    const chairpersonReview = appComments.find((c) => c.userType === "chairperson" && c.action === "review")
    setAlreadyReviewed(!!chairpersonReview)
    setIsReviewed(!!chairpersonReview)
  }

  const canReview = () => {
    return user.userType === "chairperson" && application.currentStage === 2 && application.status === "submitted"
  }

  const handleSaveReview = async () => {
    if (!isReviewed) {
      alert("Please confirm you have reviewed the application")
      return
    }

    setIsLoading(true)

    try {
      // Add review comment to track that chairperson has reviewed
      await db.addComment({
        applicationId: application.id,
        userId: user.id,
        userType: user.userType,
        stage: 2,
        comment: "Application reviewed by chairperson",
        action: "review",
      })

      // Log the review action
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Reviewed Application",
        details: `Reviewed application ${application.applicationId}`,
        applicationId: application.id,
      })

      alert("Review saved successfully")
      setAlreadyReviewed(true)
      onUpdate() // This will refresh the parent and go back to overview
    } catch (error) {
      console.error("Failed to save review:", error)
      alert("Failed to save review. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentTypeLabel = (docType: string) => {
    const labels = {
      application_form: "Application Form (GW7B)",
      proof_of_residence: "Proof of Residence",
      land_ownership: "Land Ownership Certificate",
      site_plan: "Site Plan",
      environmental_clearance: "Environmental Clearance",
      water_source_assessment: "Water Source Assessment",
      borehole_completion: "Borehole Completion Certificate",
      other: "Other Supporting Document",
    }
    return labels[docType as keyof typeof labels] || docType
  }

  return (
    <div className="space-y-6">
      {/* Role Information */}
      <Alert className="border-blue-200 bg-blue-50">
        <Eye className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Upper Manyame Sub Catchment Council Chairperson:</strong> Review all application details, documents,
          and comments from the permitting officer. Mark as reviewed and save.
        </AlertDescription>
      </Alert>

      {/* Complete Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Complete Application Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Application Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-semibold">{application.applicationId}</h3>
              <Badge variant="outline" className="mt-1">
                {application.permitType.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <Badge variant="secondary">Stage 2 - Chairperson Review</Badge>
          </div>

          {/* Applicant Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Applicant Information
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Full Name:</span>
                  <p className="text-gray-900">{application.applicantName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Customer Account Number:</span>
                  <p className="text-gray-900">{application.customerAccountNumber}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-600">Contact Number:</span>
                  <p className="text-gray-900">{application.cellularNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Address Information
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Physical Address:</span>
                  <p className="text-gray-900">{application.physicalAddress}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Postal Address:</span>
                  <p className="text-gray-900">{application.postalAddress}</p>
                </div>
                {(application.gpsLatitude || application.gpsLongitude) && (
                  <div>
                    <span className="font-medium text-gray-600">GPS Coordinates:</span>
                    <p className="text-gray-900">
                      Lat: {application.gpsLatitude?.toFixed(6) || "N/A"}, Lng:{" "}
                      {application.gpsLongitude?.toFixed(6) || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property & Water Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Property Details
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Land Size:</span>
                  <p className="text-gray-900">{application.landSize} hectares</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Number of Boreholes:</span>
                  <p className="text-gray-900">{application.numberOfBoreholes}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Intended Use:</span>
                  <p className="text-gray-900">{application.intendedUse}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Droplets className="h-4 w-4 mr-2" />
                Water Information
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <span className="font-medium text-gray-600">Water Source:</span>
                  <p className="text-gray-900">{application.waterSource}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Water Source Details:</span>
                  <p className="text-gray-900">{application.waterSourceDetails}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Water Allocation:</span>
                  <p className="text-gray-900">{application.waterAllocation} ML</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Validity Period:</span>
                  <p className="text-gray-900">{application.validityPeriod} years</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Dates */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Application Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
              <div>
                <span className="font-medium text-gray-600">Created:</span>
                <p className="text-gray-900">{application.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Last Updated:</span>
                <p className="text-gray-900">{application.updatedAt.toLocaleDateString()}</p>
              </div>
              {application.submittedAt && (
                <div>
                  <span className="font-medium text-gray-600">Submitted:</span>
                  <p className="text-gray-900">{application.submittedAt.toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          {application.comments && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Additional Comments:</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{application.comments}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments from Permitting Officer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-600" />
            Comments from Permitting Officer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {comments.length > 0 ? (
              comments
                .filter((comment) => comment.userType === "permitting_officer")
                .map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <Badge variant="outline" className="text-xs">
                          PERMITTING OFFICER
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {comment.action.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{comment.createdAt.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-900">{comment.comment}</p>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-center py-4">No comments from permitting officer</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Checklist & Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-green-600" />
            Submitted Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {/* Document Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, index) => (
                  <div key={doc.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-sm">SUBMITTED</span>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">{getDocumentTypeLabel(doc.documentType)}</p>
                      <p className="text-sm text-gray-600">{doc.fileName}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{doc.fileType?.toUpperCase()}</span>
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>{doc.uploadedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Document Viewer */}
              <div className="mt-6">
                <h5 className="font-medium mb-3">Document Viewer</h5>
                <EnhancedDocumentViewer user={user} application={application} canUpload={false} canDelete={false} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents have been uploaded for this application</p>
            </div>
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
            {alreadyReviewed ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Review Complete:</strong> You have already reviewed this application. It will be included when
                  you submit all reviewed applications to the next stage.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Review Confirmation */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reviewed"
                    checked={isReviewed}
                    onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                  />
                  <label htmlFor="reviewed" className="text-sm font-medium">
                    I have reviewed all application details, documents, and comments from the permitting officer
                  </label>
                </div>

                {/* Save Review Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSaveReview} disabled={!isReviewed || isLoading} className="flex items-center">
                    {isLoading ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Review
                      </>
                    )}
                  </Button>
                </div>

                {/* Instructions */}
                <Alert>
                  <AlertDescription>
                    <strong>Instructions:</strong> Review all the application details above, check each submitted
                    document, and read any comments from the permitting officer. Once you have completed your review,
                    check the box above and save your review.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
