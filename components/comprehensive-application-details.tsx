"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, ExternalLink, FileText, MessageSquare, User, MapPin, Droplets } from "lucide-react"
import type { PermitApplication, User as UserType, WorkflowComment, Document } from "@/types"
import { db } from "@/lib/database"
import { cn } from "@/lib/utils"

interface ComprehensiveApplicationDetailsProps {
  application: PermitApplication
  user: UserType
  onBack: () => void
}

const statusColor: Record<string, string> = {
  unsubmitted: "bg-orange-600",
  draft: "bg-orange-600",
  submitted: "bg-blue-600",
  pending: "bg-blue-600",
  under_review: "bg-yellow-500",
  approved: "bg-green-600",
  rejected: "bg-red-600",
}

export function ComprehensiveApplicationDetails({ application, user, onBack }: ComprehensiveApplicationDetailsProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplicationData()
  }, [application.id])

  const loadApplicationData = async () => {
    try {
      setLoading(true)
      const [commentsData, documentsData] = await Promise.all([
        db.getCommentsByApplication(application.id),
        db.getDocumentsByApplication(application.id),
      ])
      setComments(commentsData)
      setDocuments(documentsData)
    } catch (error) {
      console.error("Error loading application data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDocumentView = (doc: Document) => {
    // Create a mock document URL for demonstration
    const documentUrl = `/documents/${doc.fileName}`

    // Open in new window
    const newWindow = window.open("", "_blank", "width=800,height=600,scrollbars=yes,resizable=yes")

    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${doc.fileName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .document-viewer { max-width: 100%; height: 80vh; border: 1px solid #ccc; }
              .error { color: #666; margin-top: 50px; }
            </style>
          </head>
          <body>
            <h2>${doc.fileName}</h2>
            <p>File Type: ${doc.fileType} | Size: ${formatFileSize(doc.fileSize)}</p>
            <div class="error">
              <p>Document viewer would display the actual document content here.</p>
              <p>In a real implementation, this would show the PDF, image, or other document content.</p>
            </div>
          </body>
        </html>
      `)
      newWindow.document.close()
    } else {
      alert("Please allow popups to view documents in a new window.")
    }
  }

  const handleDocumentDownload = (doc: Document) => {
    const blob = new Blob([`Mock content for ${doc.fileName}`], { type: doc.fileType })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement("a")
    link.href = url
    link.download = doc.fileName
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const permittingOfficerComments = comments.filter((comment) => comment.userType === "permitting_officer")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{application.applicationId}</h1>
            <p className="text-gray-600">Comprehensive Application Details</p>
          </div>
        </div>
        <Badge className={cn(statusColor[application.status], "text-white capitalize")}>
          {application.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="applicant" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="applicant">Applicant Details</TabsTrigger>
          <TabsTrigger value="technical">Technical Information</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="workflow">Workflow & Actions</TabsTrigger>
        </TabsList>

        {/* Applicant Details Tab */}
        <TabsContent value="applicant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Applicant Name</label>
                  <p className="text-lg font-semibold">{application.applicantName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Account Number</label>
                  <p className="font-mono">{application.customerAccountNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cellular Number</label>
                  <p>{application.cellularNumber}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Physical Address</label>
                  <p>{application.physicalAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Postal Address</label>
                  <p>{application.postalAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Information Tab */}
        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Size of Property</label>
                  <p className="text-lg font-semibold">{application.landSize} hectares</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Number of Drilled Holes</label>
                  <p className="text-lg font-semibold">{application.numberOfBoreholes}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">GPS Coordinates</label>
                  <p>Latitude: {application.gpsLatitude}</p>
                  <p>Longitude: {application.gpsLongitude}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="h-5 w-5 mr-2" />
                  Water Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Water Source</label>
                  <p className="text-lg font-semibold">{application.waterSource}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Permit Type</label>
                  <p className="capitalize">{application.permitType.replace("_", " ")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Intended Use</label>
                  <p>{application.intendedUse}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Water Allocation</label>
                  <p className="text-lg font-semibold">{application.waterAllocation} ML/year</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Uploaded Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.fileName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.fileType}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                        <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleDocumentView(doc)}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleDocumentDownload(doc)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents uploaded for this application.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Permitting Officer Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Permitting Officer Comments ({permittingOfficerComments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {permittingOfficerComments.length > 0 ? (
                  <div className="space-y-4">
                    {permittingOfficerComments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Stage {comment.stage}
                          </Badge>
                          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No permitting officer comments yet.</p>
                )}
              </CardContent>
            </Card>

            {/* All Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  All Workflow Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comments.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{comment.userType.replace("_", " ")}</Badge>
                            <Badge variant="secondary">Stage {comment.stage}</Badge>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No workflow comments yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflow & Actions Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={cn(statusColor[application.status], "text-white capitalize")}>
                      {application.status.replace("_", " ")}
                    </Badge>
                    <span className="text-sm text-gray-500">Stage {application.currentStage}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p>{formatDate(application.createdAt)}</p>
                </div>
                {application.submittedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                    <p>{formatDate(application.submittedAt)}</p>
                  </div>
                )}
                {application.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved Date</label>
                    <p>{formatDate(application.approvedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.status === "approved" && (
                  <Button className="w-full" variant="default">
                    <FileText className="h-4 w-4 mr-2" />
                    Print Permit
                  </Button>
                )}
                {application.status === "rejected" && (
                  <Button className="w-full bg-transparent" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Print Rejection Notice
                  </Button>
                )}
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Application Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
