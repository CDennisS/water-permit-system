"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Eye, Upload, Trash2, AlertTriangle } from "lucide-react"
import type { Document, User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface PermittingOfficerDocumentManagerProps {
  user: User
  application: PermitApplication
  onDocumentsChange?: () => void
}

export function PermittingOfficerDocumentManager({
  user,
  application,
  onDocumentsChange,
}: PermittingOfficerDocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    document: Document | null
    isOpen: boolean
  }>({ document: null, isOpen: false })

  useEffect(() => {
    loadDocuments()
  }, [application.id])

  const loadDocuments = async () => {
    try {
      const docs = await db.getDocumentsByApplication(application.id)
      setDocuments(docs)
      onDocumentsChange?.()
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

  const handleDeleteDocument = async (document: Document) => {
    try {
      await db.deleteDocument(document.id)
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Deleted Document",
        details: `Deleted document ${document.fileName} from application ${application.applicationId}`,
        applicationId: application.id,
      })

      loadDocuments()
      setDeleteConfirmation({ document: null, isOpen: false })
    } catch (error) {
      console.error("Failed to delete document:", error)
      alert("Failed to delete document. Please try again.")
    }
  }

  const handleDownloadDocument = (document: Document) => {
    // Simulate document download
    const blob = new Blob(
      [
        `Document: ${document.fileName}\nApplication: ${application.applicationId}\nUploaded: ${document.uploadedAt.toLocaleString()}`,
      ],
      { type: "text/plain" },
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

  const canDeleteDocuments = application.status === "unsubmitted" || application.status === "submitted"

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading documents...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Application Documents ({documents.length})
            </CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          {!canDeleteDocuments && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Documents cannot be deleted once the application has been approved or rejected. Contact your supervisor
                if changes are needed.
              </AlertDescription>
            </Alert>
          )}

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
                        {canDeleteDocuments && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmation({ document, isOpen: true })}
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
              <p className="text-sm mt-2">Click "Upload Documents" to add files to this application</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => setDeleteConfirmation({ document: null, isOpen: open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Document Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this document?</p>
            {deleteConfirmation.document && (
              <div className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">{deleteConfirmation.document.fileName}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Type: {getDocumentTypeLabel(deleteConfirmation.document.documentType)}
                </p>
              </div>
            )}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The document will be permanently deleted.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteConfirmation({ document: null, isOpen: false })}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmation.document && handleDeleteDocument(deleteConfirmation.document)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
