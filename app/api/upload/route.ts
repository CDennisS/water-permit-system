import { type NextRequest, NextResponse } from "next/server"
import { FileStorageService } from "@/lib/file-storage"
import { SecurityUtils } from "@/lib/security"
import { MonitoringService } from "@/lib/monitoring"
import { AuthService } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Rate limiting for uploads
    const clientIP = SecurityUtils.getClientIP(request)
    // Implement upload-specific rate limiting here

    const formData = await request.formData()
    const file = formData.get("file") as File
    const applicationId = formData.get("applicationId") as string
    const documentType = formData.get("documentType") as string

    if (!file || !applicationId || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file
    const validation = FileStorageService.validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Scan file for viruses
    const scanResult = await FileStorageService.scanFile(file)
    if (!scanResult.isClean) {
      await SecurityUtils.logSecurityEvent(
        "Malicious File Upload Attempt",
        `File ${file.name} failed virus scan: ${scanResult.threat}`,
        "high",
        request,
      )
      return NextResponse.json({ error: "File failed security scan" }, { status: 400 })
    }

    // Upload file
    const result = await FileStorageService.uploadFile(file, applicationId, documentType)

    if (!result) {
      return NextResponse.json({ error: "File upload failed" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    MonitoringService.recordError(error as Error, "file-upload")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
