// Environment variable initialization for NextAuth
// This must run before any NextAuth imports to prevent URL construction errors

if (typeof window === "undefined") {
  // Server-side only
  if (!process.env.NEXTAUTH_URL) {
    if (process.env.VERCEL_URL) {
      // Vercel deployment
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
    } else if (process.env.NODE_ENV === "development") {
      // Local development
      const port = process.env.PORT || "3000"
      process.env.NEXTAUTH_URL = `http://localhost:${port}`
    } else {
      // Production fallback
      process.env.NEXTAUTH_URL = "https://umscc-permits.vercel.app"
    }

    console.log(`[ensure-env] Set NEXTAUTH_URL to: ${process.env.NEXTAUTH_URL}`)
  }

  // Ensure NEXTAUTH_SECRET exists
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "umscc-permit-system-secret-key-2024"
    console.log("[ensure-env] Set default NEXTAUTH_SECRET")
  }
}
