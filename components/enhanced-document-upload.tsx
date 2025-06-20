"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, FileText, File, ImageIcon, AlertCircle, CheckCircle, FolderOpen } from "lucide-react"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface EnhancedDocumentUploadProps {
  user: User
  application: PermitApplication
  onDocumentsChange?: () => void
  maxFileSize?: number // in MB
  allowedTypes?: string[]
  maxFiles?: number
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "completed" | "error"
  documentType: string
  error?: string
}

export function EnhancedDocumentUpload({
  user,
  application,
  onDocumentsChange,
  maxFileSize = 10,
  allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt"],
  maxFiles = 20,
}: EnhancedDocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} not allowed. Allowed types: ${allowedTypes.join(", ")}`
    }

    return null
  }

  const handleFileSelect = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)

      // Check total file limit
      if (uploadFiles.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed. You can upload ${maxFiles - uploadFiles.length} more files.`)
        return
      }

      const newFiles: UploadFile[] = []

      fileArray.forEach((file) => {
        const error = validateFile(file)
        newFiles.push({
          file,
          id: generateFileId(),
          progress: 0,
          status: error ? "error" : "pending",
          documentType: "other",
          error,
        })
      })

      setUploadFiles((prev) => [...prev, ...newFiles])
    },
    [uploadFiles.length, maxFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files)
      }
    },
    [handleFileSelect],
  )

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ""
  }

  const removeFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const updateFileDocumentType = (fileId: string, documentType: string) => {
    setUploadFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, documentType } : f)))
  }

  const simulateUpload = async (uploadFile: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // Simulate occasional upload failure
          if (Math.random() < 0.1) {
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id ? { ...f, status: "error", error: "Upload failed. Please try again." } : f,
              ),
            )
            reject(new Error("Upload failed"))
          } else {
            setUploadFiles((prev) =>
              prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "completed", progress: 100 } : f)),
            )
            resolve()
          }
        } else {
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading", progress } : f)),
          )
        }
      }, 200)
    })
  }

  const uploadAllFiles = async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const uploadFile of pendingFiles) {
        try {
          await simulateUpload(uploadFile)

          // Save to database
          await db.uploadDocument({
            applicationId: application.id,
            fileName: uploadFile.file.name,
            fileType: uploadFile.file.type,
            fileSize: uploadFile.file.size,
            documentType: uploadFile.documentType,
          })

          await db.addLog({
            userId: user.id,
            userType: user.userType,
            action: "Uploaded Document",
            details: `Uploaded document ${uploadFile.file.name} (${uploadFile.documentType}) to application ${application.applicationId}`,
            applicationId: application.id,
          })
        } catch (error) {
          console.error(`Failed to upload ${uploadFile.file.name}:`, error)
        }
      }

      onDocumentsChange?.()
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "uploading":
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const completedFiles = uploadFiles.filter((f) => f.status === "completed").length
  const totalFiles = uploadFiles.length
  const hasErrors = uploadFiles.some((f) => f.status === "error")
  const hasPendingFiles = uploadFiles.some((f) => f.status === "pending")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Document Upload
            {totalFiles > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedFiles}/{totalFiles} uploaded
              </Badge>
            )}
          </div>
          {hasPendingFiles && (
            <Button onClick={uploadAllFiles} disabled={isUploading} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload All"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500">
              Supports: {allowedTypes.join(", ")} • Max {maxFileSize}MB per file • Max {maxFiles} files
            </p>
            <Button variant="outline" onClick={handleBrowseClick} className="mt-4">
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selected Files ({uploadFiles.length})</h4>
              {hasErrors && (
                <Badge variant="destructive" className="text-xs">
                  Some uploads failed
                </Badge>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className={`border rounded-lg p-3 ${
                    uploadFile.status === "error" ? "border-red-200 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(uploadFile.file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {uploadFile.status === "pending" && (
                        <Select
                          value={uploadFile.documentType}
                          onValueChange={(value) => updateFileDocumentType(uploadFile.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="application_form">Application Form</SelectItem>
                            <SelectItem value="proof_of_residence">Proof of Residence</SelectItem>
                            <SelectItem value="receipt">Payment Receipt</SelectItem>
                            <SelectItem value="capacity_test">Capacity Test</SelectItem>
                            <SelectItem value="water_quality_test">Water Quality Test</SelectItem>
                            <SelectItem value="environmental_clearance">Environmental Clearance</SelectItem>
                            <SelectItem value="site_plan">Site Plan</SelectItem>
                            <SelectItem value="other">Other Document</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {getStatusIcon(uploadFile.status)}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {uploadFile.status === "uploading" && (
                    <div className="mt-2">
                      <Progress value={uploadFile.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">Uploading... {Math.round(uploadFile.progress)}%</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadFile.status === "error" && uploadFile.error && (
                    <div className="mt-2 text-xs text-red-600">{uploadFile.error}</div>
                  )}

                  {/* Success Message */}
                  {uploadFile.status === "completed" && (
                    <div className="mt-2 text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Upload completed successfully
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Summary */}
        {totalFiles > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {completedFiles} of {totalFiles} files uploaded
              </span>
              {completedFiles === totalFiles && totalFiles > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All files uploaded
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
