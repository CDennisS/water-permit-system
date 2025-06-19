import { createServerClient } from "@/lib/supabase"
import { EmailService } from "@/lib/email-service"
import { FileStorage } from "@/lib/file-storage"

export interface HealthCheckResult {
  service: string
  status: "healthy" | "unhealthy"
  message: string
  timestamp: string
}

export class HealthCheck {
  static async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const client = createServerClient()
      const { data, error } = await client.from("users").select("count").limit(1)

      if (error) throw error

      return {
        service: "Database",
        status: "healthy",
        message: "Database connection successful",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        service: "Database",
        status: "unhealthy",
        message: `Database error: ${error}`,
        timestamp: new Date().toISOString(),
      }
    }
  }

  static async checkEmail(): Promise<HealthCheckResult> {
    try {
      // Test email configuration (don't actually send)
      const testResult = await EmailService.sendSystemAlert(
        "Health Check Test",
        "This is a health check test - please ignore",
        "info",
      )

      return {
        service: "Email",
        status: testResult ? "healthy" : "unhealthy",
        message: testResult ? "Email service operational" : "Email service failed",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        service: "Email",
        status: "unhealthy",
        message: `Email error: ${error}`,
        timestamp: new Date().toISOString(),
      }
    }
  }

  static async checkFileStorage(): Promise<HealthCheckResult> {
    try {
      // Test file storage connection
      const testFile = new File(["test"], "health-check.txt", { type: "text/plain" })
      const result = await FileStorage.uploadFile(testFile, "health-check")

      if (result.success) {
        // Clean up test file
        await FileStorage.deleteFile(result.url!)
      }

      return {
        service: "File Storage",
        status: result.success ? "healthy" : "unhealthy",
        message: result.success ? "File storage operational" : "File storage failed",
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        service: "File Storage",
        status: "unhealthy",
        message: `File storage error: ${error}`,
        timestamp: new Date().toISOString(),
      }
    }
  }

  static async runFullHealthCheck(): Promise<HealthCheckResult[]> {
    console.log("🔍 Running production health checks...")

    const checks = await Promise.all([this.checkDatabase(), this.checkEmail(), this.checkFileStorage()])

    const unhealthyServices = checks.filter((check) => check.status === "unhealthy")

    if (unhealthyServices.length === 0) {
      console.log("✅ All services healthy - ready for production!")
    } else {
      console.log("❌ Some services are unhealthy:")
      unhealthyServices.forEach((service) => {
        console.log(`  - ${service.service}: ${service.message}`)
      })
    }

    return checks
  }
}
