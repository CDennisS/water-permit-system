"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Printer, Download, Eye, FileText } from "lucide-react"
import type { PermitApplication, WorkflowComment, User } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel, canPrintRejectionComments } from "@/lib/auth"

interface CommentsPrinterProps {
  application: PermitApplication
  user: User
  disabled?: boolean
}

export function CommentsPrinter({ application, user, disabled = false }: CommentsPrinterProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug logging
  console.log("CommentsPrinter - User:", user)
  console.log("CommentsPrinter - Application:", application.applicationId)
  console.log("CommentsPrinter - Application status:", application.status)
  console.log("CommentsPrinter - Workflow comments:", application.workflowComments?.length || 0)

  useEffect(() => {
    if (isPreviewOpen) {
      loadComments()
    }
  }, [isPreviewOpen, application.id])

  const loadComments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Try to get comments from database first
      let appComments: WorkflowComment[] = []
      try {
        appComments = await db.getCommentsByApplication(application.id)
      } catch (dbError) {
        console.warn("Could not load comments from database, using application comments:", dbError)
        // Fallback to comments from application object
        appComments = application.workflowComments || []
      }

      console.log("Loaded comments:", appComments)
      setComments(appComments)
    } catch (error) {
      console.error("Failed to load comments:", error)
      setError("Failed to load comments")
      // Use application comments as fallback
      setComments(application.workflowComments || [])
    } finally {
      setIsLoading(false)
    }
  }

  const canPrintComments = () => {
    if (!user) return false

    // Allow printing comments if there are any comments and user has permission
    const hasComments = (application.workflowComments?.length || 0) > 0 || comments.length > 0
    const hasPermission = canPrintRejectionComments(user)

    console.log("Can print comments check:", {
      hasComments,
      hasPermission,
      userType: user.userType,
      commentsCount: application.workflowComments?.length || 0,
    })

    return hasComments && hasPermission
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const commentsElement = document.getElementById("comments-template")
      if (commentsElement) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Application Comments - ${application.applicationId}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: 'Times New Roman', serif; 
                  line-height: 1.6;
                  color: #000;
                }
                @media print {
                  body { margin: 0; padding: 15px; }
                  .no-print { display: none; }
                  .page-break { page-break-before: always; }
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #000;
                  padding-bottom: 20px;
                }
                .header h1 { 
                  margin: 0; 
                  font-size: 24px; 
                  font-weight: bold;
                }
                .header h2 { 
                  margin: 10px 0 0 0; 
                  font-size: 18px; 
                  font-weight: normal;
                }
                .application-info {
                  margin-bottom: 30px;
                  padding: 15px;
                  border: 1px solid #000;
                }
                .application-info h3 {
                  margin-top: 0;
                  font-size: 16px;
                  font-weight: bold;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-top: 15px;
                }
                .info-item {
                  margin-bottom: 10px;
                }
                .info-label {
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .comments-section {
                  margin-top: 30px;
                }
                .comments-section h3 {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 20px;
                  border-bottom: 1px solid #000;
                  padding-bottom: 10px;
                }
                .comment {
                  margin-bottom: 25px;
                  padding: 15px;
                  border: 1px solid #ccc;
                  background-color: #f9f9f9;
                }
                .comment.rejection {
                  border-color: #dc2626;
                  background-color: #fef2f2;
                }
                .comment-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 10px;
                  font-weight: bold;
                }
                .comment-author {
                  font-size: 14px;
                }
                .comment-date {
                  font-size: 12px;
                  color: #666;
                }
                .comment-content {
                  font-size: 14px;
                  line-height: 1.5;
                }
                .rejection-badge {
                  background-color: #dc2626;
                  color: white;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: bold;
                }
                .stage-badge {
                  background-color: #3b82f6;
                  color: white;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: bold;
                }
                .footer {
                  margin-top: 50px;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                  border-top: 1px solid #ccc;
                  padding-top: 20px;
                }
                .status-rejected {
                  color: #dc2626;
                  font-weight: bold;
                  font-size: 18px;
                }
              </style>
            </head>
            <body>
              ${commentsElement.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownload = () => {
    const commentsToUse = comments.length > 0 ? comments : application.workflowComments || []

    let content = `APPLICATION COMMENTS REPORT\n`
    content += `Upper Manyame Sub Catchment Council\n`
    content += `${"=".repeat(60)}\n\n`

    // Enhanced applicant details
    content += `APPLICANT DETAILS:\n`
    content += `${"-".repeat(30)}\n`
    content += `Application ID: ${application.applicationId}\n`
    content += `Applicant Name: ${application.applicantName}\n`
    content += `Physical Address: ${application.physicalAddress}\n`
    content += `Postal Address: ${application.postalAddress || "N/A"}\n`
    content += `Customer Account: ${application.customerAccountNumber || "N/A"}\n`
    content += `Cellular Number: ${application.cellularNumber || "N/A"}\n`
    content += `Permit Type: ${application.permitType.replace("_", " ").toUpperCase()}\n`
    content += `Water Source: ${application.waterSource.toUpperCase()}\n`
    content += `Intended Use: ${application.intendedUse}\n`
    content += `Number of Boreholes: ${application.numberOfBoreholes}\n`
    content += `Land Size: ${application.landSize} hectares\n`
    content += `Water Allocation: ${application.waterAllocation.toLocaleString()} m³/annum\n`
    content += `GPS Coordinates: Lat ${application.gpsLatitude}, Long ${application.gpsLongitude}\n`
    content += `Status: ${application.status.toUpperCase()}\n`
    content += `Created: ${application.createdAt.toLocaleString()}\n`
    content += `Report Generated: ${new Date().toLocaleString()}\n\n`

    if (application.status === "rejected") {
      content += `*** APPLICATION REJECTED ***\n\n`
    }

    content += `COMMENTS AND REVIEW HISTORY:\n`
    content += `${"-".repeat(40)}\n\n`

    commentsToUse.forEach((comment, index) => {
      content += `${index + 1}. ${getUserTypeLabel(comment.userType)}\n`
      content += `   Date: ${comment.createdAt.toLocaleString()}\n`
      content += `   Stage: ${comment.stage}\n`
      if (comment.isRejectionReason) {
        content += `   Type: REJECTION REASON\n`
      }
      content += `   Comment: ${comment.comment}\n\n`
    })

    content += `\nReport generated by UMSCC Permit Management System\n`
    content += `${new Date().toLocaleString()}`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Comments_${application.applicationId}_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Check if user can print comments
  if (!canPrintComments()) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertTitle>Cannot Print Comments</AlertTitle>
          <AlertDescription>
            {!user
              ? "User not authenticated"
              : !canPrintRejectionComments(user)
                ? `User type '${user.userType}' cannot print comments. Only Permitting Officers, Permit Supervisors, ICT, Chairpersons, and Catchment Managers can print comments.`
                : "No comments available for this application"}
          </AlertDescription>
        </Alert>
        {user && (
          <div className="text-sm text-gray-600">
            Current user: {user.userType} | Comments available:{" "}
            {(application.workflowComments?.length || 0) + comments.length}
          </div>
        )}
      </div>
    )
  }

  if (disabled) {
    return (
      <Button disabled variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Print Comments
      </Button>
    )
  }

  return (
    <div className="flex space-x-2">
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Comments
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments Report - {application.applicationId}</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center p-8">Loading comments...</div>
          ) : (
            <div id="comments-template">
              <div className="header">
                <h1>APPLICATION COMMENTS REPORT</h1>
                <h2>Upper Manyame Sub Catchment Council</h2>
              </div>

              <div className="application-info">
                <h3>Application Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Application ID:</div>
                    <div>{application.applicationId}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">System Generated Number:</div>
                    <div>{application.id}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Applicant Name:</div>
                    <div>{application.applicantName}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Account Number:</div>
                    <div>{application.customerAccountNumber || "Not Assigned"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Physical Address:</div>
                    <div>{application.physicalAddress}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Postal Address:</div>
                    <div>{application.postalAddress || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Permit Type:</div>
                    <div className="capitalize">{application.permitType.replace("_", " ")}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Water Source:</div>
                    <div className="capitalize">{application.waterSource}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Cellular Number:</div>
                    <div>{application.cellularNumber || "N/A"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Intended Use:</div>
                    <div>{application.intendedUse}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Number of Boreholes:</div>
                    <div>{application.numberOfBoreholes}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Land Size:</div>
                    <div>{application.landSize} hectares</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Water Allocation:</div>
                    <div>{application.waterAllocation.toLocaleString()} m³/annum</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">GPS Coordinates:</div>
                    <div>
                      Lat: {application.gpsLatitude}, Long: {application.gpsLongitude}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Status:</div>
                    <div className={application.status === "rejected" ? "status-rejected" : ""}>
                      {application.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Created Date:</div>
                    <div>{application.createdAt.toLocaleDateString()}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Report Generated:</div>
                    <div>{new Date().toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {application.status === "rejected" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "25px",
                    backgroundColor: "#fef2f2",
                    border: "3px solid #dc2626",
                    marginBottom: "30px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#dc2626",
                    borderRadius: "8px",
                  }}
                >
                  ⚠️ APPLICATION REJECTED ⚠️
                  <div style={{ fontSize: "14px", marginTop: "10px", fontWeight: "normal" }}>
                    This application has been rejected during the review process
                  </div>
                </div>
              )}

              <div className="comments-section">
                <h3>Comments and Review History</h3>

                {comments.length > 0 || (application.workflowComments?.length || 0) > 0 ? (
                  (comments.length > 0 ? comments : application.workflowComments || []).map((comment, index) => (
                    <div
                      key={comment.id || index}
                      className={`comment ${comment.isRejectionReason ? "rejection" : ""}`}
                    >
                      <div className="comment-header">
                        <div className="comment-author">
                          {getUserTypeLabel(comment.userType)}
                          {comment.isRejectionReason && (
                            <span className="rejection-badge" style={{ marginLeft: "10px" }}>
                              REJECTION REASON
                            </span>
                          )}
                          <span className="stage-badge" style={{ marginLeft: "10px" }}>
                            Stage {comment.stage}
                          </span>
                        </div>
                        <div className="comment-date">{comment.createdAt.toLocaleString()}</div>
                      </div>
                      <div className="comment-content">{comment.comment}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    No comments available for this application.
                  </div>
                )}
              </div>

              <div className="footer">
                <p>This report was generated by the UMSCC Permit Management System</p>
                <p>Upper Manyame Sub Catchment Council - Water Permit Management</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4 no-print">
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button onClick={handlePrint} size="sm">
        <Printer className="h-4 w-4 mr-2" />
        Print Comments
      </Button>
    </div>
  )
}
