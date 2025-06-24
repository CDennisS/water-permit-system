"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  FileText,
  CheckCircle,
  User,
  Save,
  MapPin,
  Phone,
  Home,
  Droplets,
  Calendar,
  MessageSquare,
  AlertTriangle,
} from "lucide-react"
import type { PermitApplication, User as UserType, Document } from "@/types"
import { db } from "@/lib/database"
import { EnhancedDocumentViewer } from "./enhanced-document-viewer"

interface CatchmentManagerReviewWorkflowProps {
  user: UserType
  application: PermitApplication
  onUpdate: () => void
}

export function CatchmentManagerReviewWorkflow({ user, application, onUpdate }: CatchmentManagerReviewWorkflowProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isReviewed, setIsReviewed] = useState(false)
  const [reviewComment, setReviewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => {
    loadApplicationData()
  }, [application.id])

  const loadApplicationData = async () => {
    // Load documents
    const appDocuments = await db.getDocumentsByApplication(application.id)
    setDocuments(appDocuments)

    // Check if already reviewed by catchment manager
    const comments = await db.getCommentsByApplication(application.id)
    const managerReview = comments.find((c) => c.userType === "catchment_manager" && c.action === "review")
    setAlreadyReviewed(!!managerReview)
    setIsReviewed(!!managerReview)

    // Load existing review comment if available
    if (managerReview) {
      setReviewComment(managerReview.comment.replace("TECHNICAL ASSESSMENT: ", ""))
    }
  }

  const canReview = () => {
    return (
      user.userType === "catchment_manager" && application.currentStage === 3 && application.status === "under_review"
    )
  }

  const handleSaveReview = async () => {
    if (!isReviewed) {
      alert("Please confirm you have reviewed the application")
      return
    }

    if (!reviewComment.trim()) {
      alert(
        "❌ MANDATORY: Technical assessment comment is required for Catchment Manager review. Please provide your detailed technical evaluation.",
      )
      return
    }

    if (reviewComment.trim().length < 20) {
      alert(
        "❌ Technical assessment comment must be at least 20 characters. Please provide a more detailed evaluation.",
      )
      return
    }

    setIsLoading(true)

    try {
      // Add review comment with the mandatory comment
      await db.addComment({
        applicationId: application.id,
        userId: user.id,
        userType: user.userType,
        stage: 3,
        comment: `TECHNICAL ASSESSMENT: ${reviewComment.trim()}`,
        action: "review",
      })

      // Log the review action
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Technical Review Completed",
        details: `Completed technical assessment for application ${application.applicationId} with mandatory comments`,
        applicationId: application.id,
      })

      alert("✅ Technical review saved successfully with mandatory assessment comments")
      setAlreadyReviewed(true)
      onUpdate() // This will refresh the parent and go back to overview
    } catch (error) {
      console.error("Failed to save review:", error)
      alert("❌ Failed to save technical review. Please try again.")
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
          <strong>Manyame Catchment Manager:</strong> Conduct technical review of application details and documents.
          <strong> Technical assessment comment is mandatory</strong> for all reviews before submission to Catchment
          Chairperson.
        </AlertDescription>
      </Alert>

      {/* Complete Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Application Details
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
            <Badge variant="secondary">Stage 3 - Catchment Manager Review</Badge>
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

      {/* Technical Review Section */}
      {canReview() && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Technical Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alreadyReviewed ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Review Complete:</strong> You have already reviewed this application with technical
                  assessment. It will be included when you submit all reviewed applications to the Catchment
                  Chairperson.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Enhanced Mandatory Comment Section */}
                <Alert className="border-orange-200 bg-orange-50">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>🔒 MANDATORY TECHNICAL ASSESSMENT:</strong> Every application requires a detailed technical
                    evaluation comment before submission to Catchment Chairperson.
                    <br />
                    <strong>Required elements:</strong> Water allocation analysis, environmental impact, technical
                    feasibility, compliance assessment, and recommendations.
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center">
                    Technical Assessment Comment
                    <span className="text-red-500 ml-1">* MANDATORY</span>
                    <Badge variant="destructive" className="ml-2 text-xs">
                      REQUIRED
                    </Badge>
                  </label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="🔍 MANDATORY TECHNICAL ASSESSMENT:

1. WATER ALLOCATION ANALYSIS: Evaluate requested allocation against catchment capacity...
2. ENVIRONMENTAL IMPACT: Assess potential environmental effects...
3. TECHNICAL FEASIBILITY: Review borehole specifications and water source sustainability...
4. REGULATORY COMPLIANCE: Verify compliance with water management regulations...
5. RECOMMENDATIONS: Provide clear recommendation (approve/reject/modify) with justification...

Minimum 20 characters required. Be thorough - this assessment guides the Chairperson's final decision."
                    rows={8}
                    className={`min-h-[200px] ${!reviewComment.trim() ? "border-red-300 focus:border-red-500" : "border-green-300"}`}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      This technical assessment will be reviewed by the Catchment Chairperson for final decision.
                    </p>
                    <span className={`text-xs ${reviewComment.length < 20 ? "text-red-500" : "text-green-600"}`}>
                      {reviewComment.length}/20 minimum characters
                    </span>
                  </div>
                </div>

                {/* Review Confirmation */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reviewed"
                    checked={isReviewed}
                    onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                  />
                  <label htmlFor="reviewed" className="text-sm font-medium">
                    I have conducted a thorough technical review of all application details, documents, and provided my
                    technical assessment
                  </label>
                </div>

                {/* Save Review Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveReview}
                    disabled={!isReviewed || !reviewComment.trim() || isLoading}
                    className="flex items-center"
                  >
                    {isLoading ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Technical Review
                      </>
                    )}
                  </Button>
                </div>

                {/* Validation Messages */}
                {!reviewComment.trim() && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Technical assessment comment is mandatory before you can save this review.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
