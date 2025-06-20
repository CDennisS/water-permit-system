"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Eye, ImageIcon, FileIcon } from "lucide-react"
import type { Document, User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface EnhancedDocumentViewerProps {
  user: User
  application: PermitApplication
  isReadOnly?: boolean
}

export function EnhancedDocumentViewer({ user, application, isReadOnly = false }: EnhancedDocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [application.id])

  const loadDocuments = async () => {
    try {
      const docs = await db.getDocumentsByApplication(application.id)
      setDocuments(docs)
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document)
    setIsDocumentViewerOpen(true)

    // Log document viewing activity
    db.addLog({
      userId: user.id,
      userType: user.userType,
      action: "Viewed Document",
      details: `Viewed document ${document.fileName} from application ${application.applicationId}`,
      applicationId: application.id,
    })
  }

  const handleDownloadDocument = (document: Document) => {
    // In a real implementation, this would download the actual file
    // For now, we'll simulate the download with document metadata
    const content = `Document: ${document.fileName}
Application: ${application.applicationId}
Applicant: ${application.applicantName}
Document Type: ${getDocumentTypeLabel(document.documentType)}
Upload Date: ${document.uploadedAt.toLocaleString()}
File Size: ${formatFileSize(document.fileSize)}

This is a simulated document for the UMSCC Permit Management System.
In a production environment, this would be the actual uploaded document.`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = document.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Log download activity
    db.addLog({
      userId: user.id,
      userType: user.userType,
      action: "Downloaded Document",
      details: `Downloaded document ${document.fileName} from application ${application.applicationId}`,
      applicationId: application.id,
    })
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      application_form: "Application Form",
      proof_of_residence: "Proof of Residence",
      receipt: "Payment Receipt",
      capacity_test: "Capacity Test",
      water_quality_test: "Water Quality Test",
      environmental_clearance: "Environmental Clearance",
      other: "Other Document",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getDocumentTypeBadge = (type: string) => {
    const colors = {
      application_form: "bg-blue-100 text-blue-800",
      proof_of_residence: "bg-green-100 text-green-800",
      receipt: "bg-yellow-100 text-yellow-800",
      capacity_test: "bg-purple-100 text-purple-800",
      water_quality_test: "bg-indigo-100 text-indigo-800",
      environmental_clearance: "bg-red-100 text-red-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[type as keyof typeof colors] || colors.other
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "bmp"].includes(extension || "")) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    } else if (["pdf"].includes(extension || "")) {
      return <FileText className="h-4 w-4 text-red-500" />
    } else if (["doc", "docx"].includes(extension || "")) {
      return <FileText className="h-4 w-4 text-blue-600" />
    }

    return <FileIcon className="h-4 w-4 text-gray-500" />
  }

  const renderDocumentPreview = (document: Document) => {
    const extension = document.fileName.split(".").pop()?.toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "bmp"].includes(extension || "")) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Image Preview</p>
            <p className="text-sm text-gray-500">{document.fileName}</p>
            <p className="text-xs text-gray-400 mt-2">
              In a production environment, the actual image would be displayed here
            </p>
          </div>
        </div>
      )
    } else if (extension === "pdf") {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">PDF Document</p>
            <p className="text-sm text-gray-500">{document.fileName}</p>
            <p className="text-xs text-gray-400 mt-2">In a production environment, the PDF would be embedded here</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <FileIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Document Preview</p>
            <p className="text-sm text-gray-500">{document.fileName}</p>
            <p className="text-xs text-gray-400 mt-2">Document type: {getDocumentTypeLabel(document.documentType)}</p>
          </div>
        </div>
      )
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading documents...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Application Documents ({documents.length})
            {isReadOnly && (
              <Badge variant="outline" className="ml-2 text-xs">
                View Only
              </Badge>
            )}
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
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getFileIcon(document.fileName)}
                        <span className="font-medium ml-2">{document.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDocumentTypeBadge(document.documentType)}>
                        {getDocumentTypeLabel(document.documentType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{formatFileSize(document.fileSize)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{document.uploadedAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(document)}
                          title="View document in browser"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(document)}
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No documents uploaded for this application</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Document Viewer - {selectedDocument?.fileName}</span>
              <div className="flex items-center space-x-2">
                <Badge className={selectedDocument ? getDocumentTypeBadge(selectedDocument.documentType) : ""}>
                  {selectedDocument ? getDocumentTypeLabel(selectedDocument.documentType) : ""}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              {/* Document Info */}
              <Card className="bg-gray-50">
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Name:</span>
                      <p className="text-gray-600">{selectedDocument.fileName}</p>
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span>
                      <p className="text-gray-600">{formatFileSize(selectedDocument.fileSize)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Upload Date:</span>
                      <p className="text-gray-600">{selectedDocument.uploadedAt.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Document Type:</span>
                      <p className="text-gray-600">{getDocumentTypeLabel(selectedDocument.documentType)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Preview */}
              <div className="border rounded-lg p-4">{renderDocumentPreview(selectedDocument)}</div>

              {/* Application Context */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Application Context:</span>
                      <span className="ml-2 text-blue-700">
                        {application.applicationId} - {application.applicantName}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      {application.permitType.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
