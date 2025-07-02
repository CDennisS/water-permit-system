/**
 * Environment variable safety guard for next-auth
 * This MUST be imported before any next-auth modules to prevent "Invalid URL" errors
 * Only runs on server-side to avoid client-side environment variable access
 */

declare global {
  // eslint-disable-next-line no-var
  var __nextAuthUrlPatched: boolean | undefined
}

// Only run on server-side where process.env is available
if (typeof window === "undefined" && !globalThis.__nextAuthUrlPatched) {
  globalThis.__nextAuthUrlPatched = true

  // Ensure NEXTAUTH_URL is always defined with a valid absolute URL
  if (!process.env.NEXTAUTH_URL) {
    // Use Vercel URL in production/preview, localhost in development
    if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
    } else {
      const port = process.env.PORT || "3000"
      process.env.NEXTAUTH_URL = `http://localhost:${port}`
    }
  }

  // Ensure NEXTAUTH_SECRET is defined (required for JWT signing)
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "umscc-permit-management-dev-secret-key-2025"
  }
}

// Export for verification purposes (server-side only)
export const getNextAuthUrl = () => {
  if (typeof window !== "undefined") return null
  return process.env.NEXTAUTH_URL
}

export const hasNextAuthSecret = () => {
  if (typeof window !== "undefined") return false
  return !!process.env.NEXTAUTH_SECRET
}
