"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { db } from "@/lib/database"
import type { PermitApplication, User } from "@/types"
import {
  FileText,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Droplets,
  Calendar,
  UserIcon,
  Send,
} from "lucide-react"

interface ChairpersonDashboardProps {
  user: User
}

export default function ChairpersonDashboard({ user }: ChairpersonDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(new Set())
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      // Get applications at stage 2 (chairperson review) with status "submitted"
      const allApplications = await db.getApplications()
      const chairpersonApplications = allApplications.filter(
        (app) => app.currentStage === 2 && app.status === "submitted",
      )
      setApplications(chairpersonApplications)
    } catch (error) {
      console.error("Error loading applications:", error)
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReviewApplication = async (applicationId: string, reviewed: boolean) => {
    try {
      const newReviewedApplications = new Set(reviewedApplications)
      if (reviewed) {
        newReviewedApplications.add(applicationId)

        // Add workflow comment for review
        await db.addComment({
          applicationId,
          userId: user.id,
          userType: user.userType,
          comment: "Application reviewed by chairperson. Technical assessment completed and ready for next stage.",
          stage: 2,
          isRejectionReason: false,
        })

        // Log the review activity
        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Application reviewed",
          applicationId,
          details: "Application marked as reviewed by chairperson",
        })

        toast({
          title: "Success",
          description: "Application marked as reviewed",
        })
      } else {
        newReviewedApplications.delete(applicationId)
      }

      setReviewedApplications(newReviewedApplications)
    } catch (error) {
      console.error("Error updating review status:", error)
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive",
      })
    }
  }

  const handleSelectAll = () => {
    const unsubmittedApplications = applications.filter((app) => !reviewedApplications.has(app.id))
    if (selectedApplications.size === unsubmittedApplications.length) {
      // Deselect all
      setSelectedApplications(new Set())
    } else {
      // Select all unsubmitted
      setSelectedApplications(new Set(unsubmittedApplications.map((app) => app.id)))
    }
  }

  const handleSelectApplication = (applicationId: string) => {
    const newSelected = new Set(selectedApplications)
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId)
    } else {
      newSelected.add(applicationId)
    }
    setSelectedApplications(newSelected)
  }

  const canSubmitBulk = () => {
    const unsubmittedApplications = applications.filter((app) => !reviewedApplications.has(app.id))
    const allSelected =
      unsubmittedApplications.length > 0 && selectedApplications.size === unsubmittedApplications.length
    const allReviewed =
      selectedApplications.size > 0 && Array.from(selectedApplications).every((id) => reviewedApplications.has(id))
    return allSelected && allReviewed
  }

  const handleBulkSubmit = async () => {
    if (!canSubmitBulk()) {
      toast({
        title: "Cannot Submit",
        description: "Please review all selected applications before submitting",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      // Update all selected applications
      for (const applicationId of selectedApplications) {
        await db.updateApplication(applicationId, {
          status: "under_review",
          currentStage: 3,
          updatedAt: new Date(),
        })

        // Add workflow comment for submission
        await db.addComment({
          applicationId,
          userId: user.id,
          userType: user.userType,
          comment:
            "Application reviewed and approved by chairperson. Forwarding to catchment manager for final technical assessment.",
          stage: 2,
          isRejectionReason: false,
        })

        // Log the submission
        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Application forwarded",
          applicationId,
          details: "Application forwarded to catchment manager after chairperson review",
        })
      }

      toast({
        title: "Success",
        description: `${selectedApplications.size} applications submitted to catchment manager`,
      })

      // Reset state and reload
      setSelectedApplications(new Set())
      setReviewedApplications(new Set())
      await loadApplications()
    } catch (error) {
      console.error("Error submitting applications:", error)
      toast({
        title: "Error",
        description: "Failed to submit applications",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getPermitTypeDisplay = (permitType: string) => {
    const types: Record<string, string> = {
      water_abstraction: "Water Abstraction",
      irrigation: "Irrigation",
      domestic_use: "Domestic Use",
      commercial_use: "Commercial Use",
      industrial_use: "Industrial Use",
    }
    return types[permitType] || permitType
  }

  const getWaterSourceDisplay = (waterSource: string) => {
    const sources: Record<string, string> = {
      borehole: "Borehole",
      river: "River",
      dam: "Dam",
      spring: "Spring",
    }
    return sources[waterSource] || waterSource
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  const unsubmittedApplications = applications.filter((app) => !reviewedApplications.has(app.id))
  const allUnsubmittedSelected =
    unsubmittedApplications.length > 0 && selectedApplications.size === unsubmittedApplications.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chairperson Dashboard</h1>
          <p className="text-gray-600">Upper Manyame Sub Catchment Council</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {applications.length} Applications Pending Review
        </Badge>
      </div>

      {/* Board Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Board Overview
          </CardTitle>
          <CardDescription>Applications submitted by permitting officers requiring chairperson review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Applications</p>
                  <p className="text-2xl font-bold text-blue-900">{applications.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {applications.length - reviewedApplications.size}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Reviewed</p>
                  <p className="text-2xl font-bold text-green-900">{reviewedApplications.size}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Selected</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedApplications.size}</p>
                </div>
                <Send className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications Requiring Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Applications Requiring Review
          </CardTitle>
          <CardDescription>Applications submitted by permitting officers awaiting chairperson review</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No applications pending review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Application Info */}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Application ID</p>
                        <p className="font-semibold">{application.applicationId}</p>
                        <p className="text-sm text-gray-600 mt-1">Account: {application.customerAccountNumber}</p>
                      </div>

                      {/* Applicant Info */}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Applicant</p>
                        <p className="font-semibold">{application.applicantName}</p>
                        <p className="text-sm text-gray-600 mt-1">{application.physicalAddress}</p>
                      </div>

                      {/* Permit Details */}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Permit Type</p>
                        <p className="font-semibold">{getPermitTypeDisplay(application.permitType)}</p>
                        <p className="text-sm text-gray-600 mt-1">{getWaterSourceDisplay(application.waterSource)}</p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {reviewedApplications.has(application.id) ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Reviewed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Review
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`select-${application.id}`}
                          checked={selectedApplications.has(application.id)}
                          onCheckedChange={() => handleSelectApplication(application.id)}
                        />
                        <label htmlFor={`select-${application.id}`} className="text-sm">
                          Select
                        </label>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Application Details - {application.applicationId}</DialogTitle>
                            <DialogDescription>Complete permit application information</DialogDescription>
                          </DialogHeader>

                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6 p-4">
                              {/* Applicant Information */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <UserIcon className="h-5 w-5" />
                                  Applicant Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Account Number</p>
                                    <p className="font-semibold">{application.customerAccountNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p className="font-semibold">{application.applicantName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Physical Address</p>
                                    <p>{application.physicalAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Postal Address</p>
                                    <p>{application.postalAddress}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                    <p className="flex items-center gap-1">
                                      <Phone className="h-4 w-4" />
                                      {application.cellularNumber}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                                    <p className="flex items-center gap-1">
                                      <Mail className="h-4 w-4" />
                                      {application.emailAddress}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Permit Details */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <Droplets className="h-5 w-5" />
                                  Permit Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Permit Type</p>
                                    <p className="font-semibold">{getPermitTypeDisplay(application.permitType)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Water Source</p>
                                    <p className="font-semibold">{getWaterSourceDisplay(application.waterSource)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Intended Use</p>
                                    <p>{application.intendedUse}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Number of Boreholes</p>
                                    <p className="font-semibold">{application.numberOfBoreholes}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Land Size</p>
                                    <p className="font-semibold">{application.landSize} hectares</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Water Allocation</p>
                                    <p className="font-semibold">
                                      {application.waterAllocation.toLocaleString()} m³/annum
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Location Information */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <MapPin className="h-5 w-5" />
                                  Location Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg">
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">GPS Latitude</p>
                                    <p className="font-semibold">{application.gpsLatitude}°</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">GPS Longitude</p>
                                    <p className="font-semibold">{application.gpsLongitude}°</p>
                                  </div>
                                </div>
                              </div>

                              {/* Application Timeline */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <Calendar className="h-5 w-5" />
                                  Application Timeline
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">Created:</span>
                                    <span className="text-sm">{application.createdAt.toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">Submitted:</span>
                                    <span className="text-sm">{application.submittedAt?.toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">Last Updated:</span>
                                    <span className="text-sm">{application.updatedAt.toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Workflow Comments */}
                              {application.workflowComments && application.workflowComments.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Workflow Comments</h3>
                                  <div className="space-y-3">
                                    {application.workflowComments.map((comment, index) => (
                                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                          <Badge variant="outline">Stage {comment.stage}</Badge>
                                          <span className="text-xs text-gray-500">
                                            {comment.createdAt.toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-sm">{comment.comment}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          By: {comment.userType.replace("_", " ").toUpperCase()}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Review Section */}
                              <Separator />
                              <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`review-${application.id}`}
                                      checked={reviewedApplications.has(application.id)}
                                      onCheckedChange={(checked) =>
                                        handleReviewApplication(application.id, checked as boolean)
                                      }
                                    />
                                    <label htmlFor={`review-${application.id}`} className="font-medium">
                                      Application Reviewed
                                    </label>
                                  </div>
                                  {reviewedApplications.has(application.id) && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Reviewed
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                  Check this box after reviewing all application details and confirming compliance with
                                  regulations.
                                </p>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Submit Section */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Bulk Submit Section
            </CardTitle>
            <CardDescription>Select and submit reviewed applications to catchment manager</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox id="select-all" checked={allUnsubmittedSelected} onCheckedChange={handleSelectAll} />
                  <label htmlFor="select-all" className="font-medium">
                    Select All Unsubmitted Permits ({unsubmittedApplications.length})
                  </label>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedApplications.size} of {applications.length} selected
                </div>
              </div>

              {selectedApplications.size > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Ready to Submit</p>
                      <p className="text-sm text-gray-600">
                        {Array.from(selectedApplications).filter((id) => reviewedApplications.has(id)).length} of{" "}
                        {selectedApplications.size} applications reviewed
                      </p>
                    </div>
                    <Button
                      onClick={handleBulkSubmit}
                      disabled={!canSubmitBulk() || submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Permits ({selectedApplications.size})
                        </>
                      )}
                    </Button>
                  </div>

                  {!canSubmitBulk() && selectedApplications.size > 0 && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                      ⚠️ All selected applications must be reviewed before submission
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
