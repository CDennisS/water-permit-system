"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Eye, Upload, Trash2 } from "lucide-react"
import type { Document, User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface DocumentViewerProps {
  user: User
  application: PermitApplication
  canUpload?: boolean
  canDelete?: boolean
  isOwner?: boolean // Add this new prop
}

export function DocumentViewer({
  user,
  application,
  canUpload = false,
  canDelete = false,
  isOwner = false, // Add this parameter
}: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    for (const file of files) {
      try {
        await db.uploadDocument({
          applicationId: application.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          documentType: "other", // Default type, can be changed later
        })

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Uploaded Document",
          details: `Uploaded document ${file.name} to application ${application.applicationId}`,
          applicationId: application.id,
        })
      } catch (error) {
        console.error("Failed to upload document:", error)
      }
    }

    loadDocuments()
    setUploadDialogOpen(false)
  }

  const handleDeleteDocument = async (documentId: string, fileName: string) => {
    const confirmMessage = `Are you sure you want to delete "${fileName}"?\n\nThis action cannot be undone.`
    if (!confirm(confirmMessage)) return

    try {
      await db.deleteDocument(documentId)
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Deleted Document",
        details: `Deleted document ${fileName} from application ${application.applicationId}`,
        applicationId: application.id,
      })
      loadDocuments()

      // Show success message (you could use a toast notification here)
      alert(`Document "${fileName}" has been successfully deleted.`)
    } catch (error) {
      console.error("Failed to delete document:", error)
      alert("Failed to delete document. Please try again.")
    }
  }

  const handleDownloadDocument = (document: Document) => {
    // In a real implementation, this would download the actual file
    // For now, we'll simulate the download
    const blob = new Blob(
      [
        `Document: ${document.fileName}\nApplication: ${application.applicationId}\nUploaded: ${document.uploadedAt.toLocaleString()}`,
      ],
      {
        type: "text/plain",
      },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = document.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      application_form: "Application Form",
      proof_of_residence: "Proof of Residence",
      receipt: "Payment Receipt",
      capacity_test: "Capacity Test",
      water_quality_test: "Water Quality Test",
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

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading documents...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Documents ({documents.length})
          </CardTitle>
          {canUpload && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="document-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Drop files here or click to browse
                          </span>
                          <input
                            id="document-upload"
                            name="document-upload"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                            className="sr-only"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
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
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">{document.fileName}</span>
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
                        onClick={() => handleDownloadDocument(document)}
                        title="Download document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Preview document">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(canDelete || (isOwner && user.userType === "permitting_officer")) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(document.id, document.fileName)}
                          title="Delete document"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No documents uploaded yet</p>
            {canUpload && <p className="text-sm mt-2">Click "Upload Documents" to add files to this application</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
