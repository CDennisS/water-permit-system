/**
 * Environment variable safety guard for next-auth
 * This MUST be imported before any next-auth modules to prevent "Invalid URL" errors
 */

// Ensure NEXTAUTH_URL is always defined with a valid absolute URL
if (!process.env.NEXTAUTH_URL) {
  if (typeof window === "undefined") {
    // Server-side: use localhost for development, or construct from HOST/PORT
    const host = process.env.HOST || "localhost"
    const port = process.env.PORT || "3000"
    process.env.NEXTAUTH_URL = `http://${host}:${port}`
  } else {
    // Client-side: use current origin
    process.env.NEXTAUTH_URL = window.location.origin
  }
}

// Ensure NEXTAUTH_SECRET is defined (required for JWT signing)
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "umscc-permit-management-dev-secret-key-2025"
}

// Export for verification purposes
export const getNextAuthUrl = () => process.env.NEXTAUTH_URL
export const hasNextAuthSecret = () => !!process.env.NEXTAUTH_SECRET
