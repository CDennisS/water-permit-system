/**
 * ensure-env.ts
 *
 * Guarantees `process.env.NEXTAUTH_URL` is set to a valid, absolute URL
 * on the server side only. Client-side NextAuth will use window.location.origin.
 */

const isServer = typeof window === "undefined"

if (isServer) {
  function makeAbsolute(url: string): string {
    return /^https?:\/\//i.test(url) ? url : `https://${url}`
  }

  function deriveDefaultUrl(): string {
    if (process.env.VERCEL_URL) return makeAbsolute(process.env.VERCEL_URL)
    const port = process.env.PORT ?? "3000"
    return `http://localhost:${port}`
  }

  // Only run on server
  const finalUrl = (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.trim()) || deriveDefaultUrl()

  // Validate
  try {
    new URL(finalUrl)
    process.env.NEXTAUTH_URL = finalUrl
  } catch {
    // Fallback to localhost if all else fails
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  }
}

export {}
