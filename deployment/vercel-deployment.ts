// Vercel deployment configuration and validation
export class VercelDeployment {
  static async validateDeployment() {
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "JWT_SECRET",
      "BLOB_READ_WRITE_TOKEN",
      "NEXT_PUBLIC_APP_URL",
      "LOG_LEVEL",
      "ENABLE_MONITORING",
      "RATE_LIMIT_WINDOW_MS",
      "RATE_LIMIT_MAX_REQUESTS",
    ]

    const missing = requiredEnvVars.filter((env) => !process.env[env])

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(", ")}`)
    }

    return {
      status: "ready",
      message: "All environment variables configured",
      timestamp: new Date().toISOString(),
    }
  }

  static async postDeploymentTest() {
    const tests = [
      { name: "Database Connection", endpoint: "/api/health" },
      { name: "Authentication", endpoint: "/api/auth/login" },
      { name: "File Upload", endpoint: "/api/upload" },
      { name: "Application Creation", endpoint: "/api/applications" },
    ]

    const results = []

    for (const test of tests) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${test.endpoint}`)
        results.push({
          test: test.name,
          status: response.ok ? "PASS" : "FAIL",
          statusCode: response.status,
        })
      } catch (error) {
        results.push({
          test: test.name,
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return results
  }
}
