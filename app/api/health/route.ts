import { NextResponse } from "next/server"
import { HealthCheck } from "@/deployment/health-check"
import { validateProductionConfig } from "@/deployment/production-config"

export async function GET() {
  try {
    // Validate configuration first
    validateProductionConfig()

    // Run health checks
    const healthResults = await HealthCheck.runFullHealthCheck()

    const allHealthy = healthResults.every((result) => result.status === "healthy")

    return NextResponse.json(
      {
        status: allHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        services: healthResults,
        version: "1.0.0",
        environment: process.env.NODE_ENV,
      },
      {
        status: allHealthy ? 200 : 503,
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        version: "1.0.0",
        environment: process.env.NODE_ENV,
      },
      {
        status: 503,
      },
    )
  }
}
