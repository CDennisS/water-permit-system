import { EmailService } from "./email-service"

export interface SystemMetrics {
  timestamp: Date
  cpuUsage?: number
  memoryUsage?: number
  diskUsage?: number
  activeUsers: number
  totalApplications: number
  pendingApplications: number
  errorCount: number
  responseTime: number
}

export interface HealthCheck {
  service: string
  status: "healthy" | "degraded" | "unhealthy"
  responseTime: number
  error?: string
  timestamp: Date
}

export class MonitoringService {
  private static metrics: SystemMetrics[] = []
  private static healthChecks: HealthCheck[] = []
  private static errorCounts = new Map<string, number>()

  // Record system metrics
  static recordMetrics(metrics: Partial<SystemMetrics>): void {
    const fullMetrics: SystemMetrics = {
      timestamp: new Date(),
      activeUsers: 0,
      totalApplications: 0,
      pendingApplications: 0,
      errorCount: 0,
      responseTime: 0,
      ...metrics,
    }

    this.metrics.push(fullMetrics)

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Check for alerts
    this.checkAlerts(fullMetrics)
  }

  // Record health check
  static async recordHealthCheck(service: string): Promise<HealthCheck> {
    const startTime = Date.now()
    let status: "healthy" | "degraded" | "unhealthy" = "healthy"
    let error: string | undefined

    try {
      // Perform service-specific health checks
      switch (service) {
        case "database":
          await this.checkDatabaseHealth()
          break
        case "storage":
          await this.checkStorageHealth()
          break
        case "email":
          await this.checkEmailHealth()
          break
        default:
          throw new Error(`Unknown service: ${service}`)
      }
    } catch (err) {
      status = "unhealthy"
      error = err instanceof Error ? err.message : "Unknown error"
    }

    const responseTime = Date.now() - startTime

    // Determine status based on response time
    if (status === "healthy" && responseTime > 5000) {
      status = "degraded"
    }

    const healthCheck: HealthCheck = {
      service,
      status,
      responseTime,
      error,
      timestamp: new Date(),
    }

    this.healthChecks.push(healthCheck)

    // Keep only last 100 health checks per service
    this.healthChecks = this.healthChecks
      .filter((hc) => hc.service === service)
      .slice(-100)
      .concat(this.healthChecks.filter((hc) => hc.service !== service))

    return healthCheck
  }

  // Get current system status
  static getSystemStatus(): {
    overall: "healthy" | "degraded" | "unhealthy"
    services: HealthCheck[]
    metrics: SystemMetrics | null
  } {
    const recentHealthChecks = this.healthChecks.filter(
      (hc) => Date.now() - hc.timestamp.getTime() < 5 * 60 * 1000, // Last 5 minutes
    )

    const serviceStatuses = recentHealthChecks.reduce(
      (acc, hc) => {
        if (!acc[hc.service] || hc.timestamp > acc[hc.service].timestamp) {
          acc[hc.service] = hc
        }
        return acc
      },
      {} as Record<string, HealthCheck>,
    )

    const services = Object.values(serviceStatuses)
    const unhealthyCount = services.filter((s) => s.status === "unhealthy").length
    const degradedCount = services.filter((s) => s.status === "degraded").length

    let overall: "healthy" | "degraded" | "unhealthy" = "healthy"
    if (unhealthyCount > 0) {
      overall = "unhealthy"
    } else if (degradedCount > 0) {
      overall = "degraded"
    }

    return {
      overall,
      services,
      metrics: this.metrics[this.metrics.length - 1] || null,
    }
  }

  // Record error
  static recordError(error: Error, context?: string): void {
    const key = `${error.name}:${context || "general"}`
    const count = this.errorCounts.get(key) || 0
    this.errorCounts.set(key, count + 1)

    // Log error
    console.error("[MONITORING]", {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    })

    // Send alert for critical errors
    if (count > 10) {
      this.sendErrorAlert(error, context, count)
    }
  }

  // Performance monitoring
  static async measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await fn()
      const duration = Date.now() - startTime

      // Record performance metric
      console.log(`[PERFORMANCE] ${operation}: ${duration}ms`)

      // Alert on slow operations
      if (duration > 10000) {
        await EmailService.sendSystemAlert(
          "Slow Operation Detected",
          `Operation "${operation}" took ${duration}ms to complete`,
          "warning",
        )
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordError(error as Error, operation)
      throw error
    }
  }

  // Check for system alerts
  private static async checkAlerts(metrics: SystemMetrics): Promise<void> {
    const alerts: string[] = []

    // High error rate
    if (metrics.errorCount > 50) {
      alerts.push(`High error rate: ${metrics.errorCount} errors`)
    }

    // Slow response time
    if (metrics.responseTime > 5000) {
      alerts.push(`Slow response time: ${metrics.responseTime}ms`)
    }

    // High memory usage (if available)
    if (metrics.memoryUsage && metrics.memoryUsage > 90) {
      alerts.push(`High memory usage: ${metrics.memoryUsage}%`)
    }

    // Send alerts
    for (const alert of alerts) {
      await EmailService.sendSystemAlert("System Performance Alert", alert, "warning")
    }
  }

  // Health check implementations
  private static async checkDatabaseHealth(): Promise<void> {
    const { supabase } = await import("./supabase")
    const { data, error } = await supabase.from("users").select("count").limit(1)
    if (error) throw error
  }

  private static async checkStorageHealth(): Promise<void> {
    // Check if Vercel Blob is accessible
    const { list } = await import("@vercel/blob")
    await list({ limit: 1 })
  }

  private static async checkEmailHealth(): Promise<void> {
    // Simple SMTP connection test would go here
    // For now, just check if environment variables are set
    if (!process.env.SMTP_HOST) {
      throw new Error("SMTP not configured")
    }
  }

  // Send error alert
  private static async sendErrorAlert(error: Error, context: string | undefined, count: number): Promise<void> {
    await EmailService.sendSystemAlert(
      "Repeated Error Alert",
      `Error "${error.name}" has occurred ${count} times.\n\nContext: ${context}\nMessage: ${error.message}\n\nStack trace:\n${error.stack}`,
      "error",
    )
  }

  // Get metrics for dashboard
  static getMetrics(hours = 24): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.metrics.filter((m) => m.timestamp >= cutoff)
  }

  // Get error summary
  static getErrorSummary(): Array<{ error: string; count: number }> {
    return Array.from(this.errorCounts.entries()).map(([error, count]) => ({
      error,
      count,
    }))
  }

  // Clear old data
  static cleanup(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days

    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff)
    this.healthChecks = this.healthChecks.filter((hc) => hc.timestamp >= cutoff)

    // Reset error counts periodically
    this.errorCounts.clear()
  }
}

// Auto-cleanup every hour
setInterval(
  () => {
    MonitoringService.cleanup()
  },
  60 * 60 * 1000,
)
