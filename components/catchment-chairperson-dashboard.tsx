"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
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
  ThumbsUp,
  ThumbsDown,
  Database,
  BarChart3,
} from "lucide-react"
import type { PermitApplication, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { ReportsAnalytics } from "./reports-analytics"

interface CatchmentChairpersonDashboardProps {
  user: UserType
}

interface DecisionState {
  [applicationId: string]: {
    decision: "approved" | "rejected" | null
    rejectionReason: string
    rejectionReasonSaved: boolean
  }
}

export function CatchmentChairpersonDashboard({ user }: CatchmentChairpersonDashboardProps) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [decisionStates, setDecisionStates] = useState<DecisionState>({})
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submittedPermits, setSubmittedPermits] = useState<PermitApplication[]>([])
  const [submittedToCatchmentManager, setSubmittedToCatchmentManager] = useState<PermitApplication[]>([])

  useEffect(() => {
    loadApplications()
    loadSubmittedPermits()
    loadSubmittedToCatchmentManager()
  }, [])

  const loadApplications = async () => {
    try {
      const apps = await db.getApplications()
      // Filter for applications at stage 4 (from Catchment Manager)
      const chairpersonApps = apps.filter((app) => app.currentStage === 4)
      setApplications(chairpersonApps)

      // Initialize decision states
      const initialStates: DecisionState = {}
      chairpersonApps.forEach((app) => {
        initialStates[app.id] = {
          decision: null,
          rejectionReason: "",
          rejectionReasonSaved: false,
        }
      })
      setDecisionStates(initialStates)
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

  const loadSubmittedToCatchmentManager = async () => {
    try {
      const apps = await db.getApplications()
      // Applications that have been processed by this chairperson (moved from stage 4 back to stage 1)
      const submitted = apps.filter((app) => 
        (app.status === "approved" || app.status === "rejected") && 
        app.currentStage === 1
      )
      setSubmittedToCatchmentManager(submitted)
    } catch (error) {
      console.error("Failed to load submitted to catchment manager:", error)
    }
  }

  const handleDecisionChange = (applicationId: string, decision: "approved" | "rejected") => {
    setDecisionStates((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        decision,
        rejectionReason: decision === "approved" ? "" : prev[applicationId]?.rejectionReason || "",
      },
    }))
  }

  const handleRejectionReasonChange = (applicationId: string, reason: string) => {
    setDecisionStates((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        rejectionReason: reason,
        rejectionReasonSaved: false,
      },
    }))
  }

  const handleSaveRejectionReason = async (applicationId: string) => {
    const decisionState = decisionStates[applicationId]
    if (!decisionState.rejectionReason.trim()) {
      alert("Please enter a rejection reason before saving.")
      return
    }

    try {
      await db.addWorkflowComment(applicationId, {
        userId: user.id,
        userType: user.userType,
        userName: user.name,
        comment: `REJECTION REASON: ${decisionState.rejectionReason}`,
        stage: 4,
        decision: "rejected",
        timestamp: new Date(),
      })

      setDecisionStates((prev) => ({
        ...prev,
        [applicationId]: {
          ...prev[applicationId],
          rejectionReasonSaved: true,
        },
      }))

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Saved Rejection Reason",
        details: `Saved rejection reason for application ${applicationId}`,
        applicationId: applicationId,
      })

      alert("Rejection reason saved successfully!")
    } catch (error) {
      console.error("Failed to save rejection reason:", error)
      alert("Failed to save rejection reason. Please try again.")
    }
  }

  const handleViewApplication = (application: PermitApplication) => {
    setSelectedApplication(application)
    setIsDetailViewOpen(true)
  }

  const handleBatchSubmit = async () => {
    const readyApps = applications.filter((app) => {
      const state = decisionStates[app.id]
      if (!state.decision) return false
      if (state.decision === "rejected" && !state.rejectionReasonSaved) return false
      return true
    })

    setIsSubmitting(true)
    try {
      for (const app of readyApps) {
        const decisionState = decisionStates[app.id]
        const newStatus = decisionState.decision === "approved" ? "approved" : "rejected"

        await db.updateApplication(app.id, {
          currentStage: 1, // Return to Permitting Officer
          status: newStatus,
          approvedAt: decisionState.decision === "approved" ? new Date() : undefined,
          rejectedAt: decisionState.decision === "rejected" ? new Date() : undefined,
        })

        // Add final decision comment
        await db.addWorkflowComment(app.id, {
          userId: user.id,
          userType: user.userType,
          userName: user.name,
          comment: `FINAL DECISION: ${decisionState.decision?.toUpperCase()}`,
          stage: 4,
          decision: decisionState.decision,
          timestamp: new Date(),
        })

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: `${decisionState.decision === "approved" ? "Approved" : "Rejected"} Application`,
          details: `Final decision: ${decisionState.decision} for application ${app.applicationId}`,
          applicationId: app.id,
        })
      }

      setApplications((prev) => prev.filter((app) => !readyApps.some((ready) => ready.id === app.id)))
      setDecisionStates({})
      setShowBatchConfirmation(false)

      alert(`Successfully processed ${readyApps.length} applications and sent them back to Permitting Officer.`)
    } catch (error) {
      console.error("Failed to submit applications:", error)
      alert("Failed to submit applications. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDecisionProgress = () => {
    const totalApps = applications.length
    const decidedCount = Object.values(decisionStates).filter((state) => state.decision).length
    const approvedCount = Object.values(decisionStates).filter((state) => state.decision === "approved").length
    const rejectedCount = Object.values(decisionStates).filter((state) => state.decision === "rejected").length
    const rejectedWithReasonCount = Object.values(decisionStates).filter(
      (state) => state.decision === "rejected" && state.rejectionReasonSaved
    ).length
    const readyCount = Object.values(decisionStates).filter((state) => {
      if (!state.decision) return false
      if (state.decision === "rejected" && !state.rejectionReasonSaved) return false
      return true
    }).length

    return {
      total: totalApps,
      decided: decidedCount,
      approved: approvedCount,
      rejected: rejectedCount,
      rejectedWithReason: rejectedWithReasonCount,
      ready: readyCount,
      percentage: totalApps > 0 ? Math.round((readyCount / totalApps) * 100) : 0,
    }
  }

  const progress = getDecisionProgress()
  const allReady = progress.ready === progress.total && progress.total > 0

  const canSubmitBatch = () => {
    if (applications.length === 0) return false
    // ALL applications must have decisions, and rejected ones must have saved rejection reasons
    return applications.every((app) => {
      const state = decisionStates[app.id]
      if (!state.decision) return false
      if (state.decision === "rejected" && !state.rejectionReasonSaved) return false
      return true
    })
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading applications for final decision...</div>
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Manyame Catchment Chairperson</h1>
        <p className="text-purple-100 mb-4">Final Overview & Decision - Make approval/rejection decisions</p>

        {applications.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Final Decision Progress</span>
              <span className="text-sm">
                {progress.ready} of {progress.total} ready for submission
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2 bg-white/20" />
            <div className="flex justify-between text-xs text-purple-100 mt-2">
              <span>✅ Approved: {progress.approved}</span>
              <span>❌ Rejected: {progress.rejectedWithReason}/{progress.rejected}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="decisions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="decisions">Final Decisions</TabsTrigger>
          <TabsTrigger value="permits">Submitted Permits</TabsTrigger>
          <TabsTrigger value="analytics">Analytical Data</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Decision</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{applications.length}</div>
                <p className="text-xs text-muted-foreground">Applications for final decision</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{progress.approved}</div>
                <p className="text-xs text-muted-foreground">Applications approved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <ThumbsDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{progress.rejectedWithReason}</div>
                <p className="text-xs text-muted-foreground">With rejection reasons</p>
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
            <Card className={`border-2 ${canSubmitBatch() ? "border-purple-300 bg-purple-50" : "border-red-300 bg-red-50"}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {canSubmitBatch() ? (
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${canSubmitBatch() ? "text-purple-800" : "text-red-800"}`}>
                        {canSubmitBatch()
                          ? `All ${progress.total} applications have final decisions - Ready to submit back to Permitting Officer`
                          : `${progress.ready} of ${progress.total} applications ready (rejected applications need mandatory rejection reasons)`}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowBatchConfirmation(true)}
                      disabled={!canSubmitBatch() || isSubmitting}
                      className={canSubmitBatch() ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit All to Permitting Officer ({progress.total})
                    </Button>
                  </div>
                </div>

                {!canSubmitBatch() && applications.length > 0 && (
                  <Alert className="mt-4 border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>SUBMISSION BLOCKED:</strong> All applications must have final decisions (Approved/Rejected). Rejected applications must have mandatory rejection reasons saved. Currently {progress.total - progress.ready} applications are incomplete.
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
                const decisionState = decisionStates[application.id] || {
                  decision: null,
                  rejectionReason: "",
                  rejectionReasonSaved: false,
                }
                const isComplete = decisionState.decision && 
                  (decisionState.decision === "approved" || 
                   (decisionState.decision === "rejected" && decisionState.rejectionReasonSaved))

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
                        <div className="text-right">
                          {isComplete ? (
                            <Badge className={decisionState.decision === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {decisionState.decision?.toUpperCase()} ✓
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Decision Required</Badge>
                          )}
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

                      {/* Decision Buttons */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Final Decision:</label>
                        <div className="flex space-x-2">
                          <Button
                            variant={decisionState.decision === "approved" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDecisionChange(application.id, "approved")}
                            className={
                              decisionState.decision === "approved"
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "border-green-300 text-green-700 hover:bg-green-50"
                            }
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Approved
                          </Button>
                          <Button
                            variant={decisionState.decision === "rejected" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDecisionChange(application.id, "rejected")}
                            className={
                              decisionState.decision === "rejected"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "border-red-300 text-red-700 hover:bg-red-50"
                            }
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Rejected
                          </Button>
                        </div>
                      </div>

                      {/* Rejection Reason Section (only if rejected) */}
                      {decisionState.decision === "rejected" && (
                        <div className="space-y-2 border-t pt-3">
                          <label className="text-sm font-medium text-red-700">Mandatory Rejection Reason:</label>
                          <Textarea
                            placeholder="Enter detailed reasons for rejection (required)..."
                            value={decisionState.rejectionReason}
                            onChange={(e) => handleRejectionReasonChange(application.id, e.target.value)}
                            className="min-h-[80px] border-red-300"
                          />
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveRejectionReason(application.id)}
                              disabled={!decisionState.rejectionReason.trim()}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Save Rejection Reason
                            </Button>
                            <Badge
                              variant={decisionState.rejectionReasonSaved ? "default" : "secondary"}
                              className={
                                decisionState.rejectionReasonSaved
                                  ? "bg-red-100 text-red-800"
                                  : decisionState.rejectionReason && !decisionState.rejectionReasonSaved
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }
                            >
                              {decisionState.rejectionReasonSaved
                                ? "Reason Saved"
                                : decisionState.rejectionReason && !decisionState.rejectionReasonSaved
                                  ? "Unsaved Changes"
                                  : "Reason Required"}
                            </Badge>
                          </div>
                        </div>
                      )}

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
                          <div className={`flex items-center ${decisionState.decision ? "text-green-600" : "text-red-600"}`}>
                            <CheckSquare className="h-3 w-3 mr-1" />
                            {decisionState.decision ? `${decisionState.decision.toUpperCase()} ✓` : "Decision Required"}
                          </div>
                          {decisionState.decision === "rejected" && (
                            <div className={`flex items-center ${decisionState.rejectionReasonSaved ? "text-green-600" : "text-red-600"}`}>
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {decisionState.rejectionReasonSaved ? "Reason Saved ✓" : "Reason Required"}
                            </div>
                          )}
                        </div>
                        {isComplete && <Badge className="bg-purple-600 text-white text-xs">Ready</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-purple-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Pending Final Decision</h3>
                <p className="text-gray-600">
                  All applications have been processed. New applications will appear here when submitted by the Catchment Manager.
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
                              {permit.status === "approved" ? "Approved" : "Rejected"}: {permit.status === "approved" ? permit.approvedAt?.toLocaleDateString() : permit.rejectedAt?.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={permit.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
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
              <CardTitle>Applications Submitted to Catchment Manager</CardTitle>
              <p className="text-sm text-gray-600">Track applications submitted to the Manyame Catchment Manager</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Total applications submitted to Catchment Manager: {submittedToCatchmentManager.length}
                </div>
                {submittedToCatchmentManager.length > 0 ? (
                  <div className="grid gap-4">
                    {submittedToCatchmentManager.map((app) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{app.applicationId}</h4>
                            <p className="text-sm text-gray-600">{app.applicantName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={
                              app.status === "approved" ? "bg-green-100 text-green-800" :
                              app.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            }>
                              {app.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No applications submitted to Catchment Manager yet.</div>
                )}
              </div>
            </CardContent>
          </Card>\
