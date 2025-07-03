// Ensure critical environment variables are set at runtime
// This must be imported first in server-side entry points

if (typeof window === "undefined") {
  // Server-side only
  if (!process.env.NEXTAUTH_URL) {
    if (process.env.VERCEL_URL) {
      // Production/Preview on Vercel
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
    } else {
      // Local development
      process.env.NEXTAUTH_URL = "http://localhost:3000"
    }
  }

  // Ensure NEXTAUTH_SECRET exists
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "fallback-secret-for-development-only"
  }
}

export {}
