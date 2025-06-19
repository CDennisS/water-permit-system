import { put, del, list } from "@vercel/blob"
import { createServerClient } from "./supabase"

export interface FileUploadResult {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export class FileStorageService {
  // Upload file to Vercel Blob
  static async uploadFile(file: File, applicationId: string, documentType: string): Promise<FileUploadResult | null> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const fileName = `${applicationId}/${timestamp}_${sanitizedName}`

      // Upload to Vercel Blob
      const blob = await put(fileName, file, {
        access: "public",
        addRandomSuffix: false,
      })

      // Save to database
      const serverClient = createServerClient()
      const { data: document, error } = await serverClient
        .from("documents")
        .insert({
          application_id: applicationId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          document_type: documentType,
          file_url: blob.url,
        })
        .select()
        .single()

      if (error || !document) {
        // Clean up blob if database insert fails
        await this.deleteFile(blob.url)
        throw new Error("Failed to save document record")
      }

      return {
        id: document.id,
        fileName: document.file_name,
        fileUrl: document.file_url,
        fileSize: document.file_size,
        fileType: document.file_type,
      }
    } catch (error) {
      console.error("File upload error:", error)
      return null
    }
  }

  // Delete file
  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      await del(fileUrl)
      return true
    } catch (error) {
      console.error("File deletion error:", error)
      return false
    }
  }

  // Get files for application
  static async getApplicationFiles(applicationId: string): Promise<FileUploadResult[]> {
    const serverClient = createServerClient()

    try {
      const { data: documents, error } = await serverClient
        .from("documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        throw error
      }

      return documents.map((doc) => ({
        id: doc.id,
        fileName: doc.file_name,
        fileUrl: doc.file_url,
        fileSize: doc.file_size,
        fileType: doc.file_type,
      }))
    } catch (error) {
      console.error("Get files error:", error)
      return []
    }
  }

  // Validate file
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { isValid: false, error: "File size must be less than 10MB" }
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
    ]

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: "File type not supported. Please use PDF, DOC, DOCX, JPG, PNG, or GIF" }
    }

    // Check filename
    if (file.name.length > 255) {
      return { isValid: false, error: "Filename too long" }
    }

    return { isValid: true }
  }

  // Scan file for viruses (placeholder - integrate with actual service)
  static async scanFile(file: File): Promise<{ isClean: boolean; threat?: string }> {
    // In production, integrate with a virus scanning service like ClamAV
    // For now, just check file extensions and basic patterns

    const suspiciousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".com"]
    const fileName = file.name.toLowerCase()

    for (const ext of suspiciousExtensions) {
      if (fileName.endsWith(ext)) {
        return { isClean: false, threat: "Potentially dangerous file type" }
      }
    }

    return { isClean: true }
  }

  // Clean up orphaned files
  static async cleanupOrphanedFiles(): Promise<number> {
    const serverClient = createServerClient()

    try {
      // Get all blob files
      const { blobs } = await list()

      // Get all database file URLs
      const { data: documents } = await serverClient.from("documents").select("file_url")

      const dbUrls = new Set(documents?.map((doc) => doc.file_url) || [])

      let deletedCount = 0
      for (const blob of blobs) {
        if (!dbUrls.has(blob.url)) {
          await this.deleteFile(blob.url)
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      console.error("Cleanup error:", error)
      return 0
    }
  }
}

// Provide the expected named export
export const FileStorage = FileStorageService

// Keep default export for backwards-compatibility
export default FileStorageService
