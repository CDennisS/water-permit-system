/**
 * ensure-env.ts
 *
 * Guarantees that required environment variables are present at runtime.
 * Currently it focuses on `NEXTAUTH_URL`, which must be an absolute URL
 * so that next-auth can construct API endpoints without throwing
 * “Failed to construct 'URL': Invalid URL”.
 *
 * • In production on Vercel we derive it from `VERCEL_URL`.
 * • During local dev or the v0 preview we default to http://localhost:3000.
 */
const REQUIRED_ENV = ["NEXTAUTH_URL"] as const

function initEnv() {
  // Only run once.
  if ((globalThis as any).__envChecked) return
  ;(globalThis as any).__envChecked = true

  // Build a sensible default URL.
  const fallbackHost =
    process.env.VERCEL_URL && !process.env.VERCEL_URL.startsWith("http")
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VERCEL_URL || "http://localhost:3000"

  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.trim() === "") {
    process.env.NEXTAUTH_URL = fallbackHost
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[ensure-env] NEXTAUTH_URL was missing – defaulted to "${process.env.NEXTAUTH_URL}".`)
    }
  }

  // Surface any other missing required vars in development.
  if (process.env.NODE_ENV !== "production") {
    REQUIRED_ENV.forEach((name) => {
      if (!process.env[name]) {
        console.warn(`[ensure-env] Environment variable ${name} is not set.`)
      }
    })
  }
}

initEnv()
