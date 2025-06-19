import { NextResponse } from "next/server"
import { VercelDeployment } from "@/deployment/vercel-deployment"

export async function GET() {
  try {
    // Validate environment configuration
    const envValidation = await VercelDeployment.validateDeployment()

    // Run post-deployment tests
    const testResults = await VercelDeployment.postDeploymentTest()

    const allTestsPassed = testResults.every((test) => test.status === "PASS")

    return NextResponse.json({
      deployment: {
        status: allTestsPassed ? "SUCCESS" : "PARTIAL",
        environment: envValidation,
        tests: testResults,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        ready_for_production: allTestsPassed,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        deployment: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          ready_for_production: false,
        },
      },
      { status: 500 },
    )
  }
}
