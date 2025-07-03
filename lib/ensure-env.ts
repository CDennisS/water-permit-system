/**
 * ensure-env.ts
 *
 * Makes sure NEXTAUTH_URL (and, in dev, NEXTAUTH_SECRET) are present **and**
 * absolute, preventing the “Failed to construct 'URL'” runtime error thrown
 * by next-auth when it encounters an invalid URL.
 *
 * Import this module FIRST in every server entry point (e.g. app/layout.tsx or
 * an API route) – it is safe to import on the client too.
 */
declare global {
  // Prevent re-running in the same process / bundle.
  // eslint-disable-next-line no-var\
  var __ensuredEnv
  ?: boolean
}

if (!globalThis.__ensuredEnv) {
  globalThis.__ensuredEnv = true

  const isServer = typeof window === "undefined"

  /**
   * Derive a sensible host:
   *  • VERCEL_URL → https://<vercel-domain>
   *  • Otherwise → http://localhost:<port>
   */
  const deriveDefaultHost = () => {
    if (process.env.VERCEL_URL) {
      return process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`
    }
    const port = process.env.PORT || "3000"
    return `http://localhost:${port}`
  }

  // Fix / populate NEXTAUTH_URL
  const rawUrl = process.env.NEXTAUTH_URL?.trim()
  if (!rawUrl) {
    process.env.NEXTAUTH_URL = deriveDefaultHost()
  } else if (!/^https?:\/\//i.test(rawUrl)) {
    // Make absolute if user accidentally supplied just the host
    process.env.NEXTAUTH_URL = `https://${rawUrl}`
  }

  // During local development we also ensure NEXTAUTH_SECRET exists
  if (isServer && process.env.NODE_ENV !== "production" && !process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "dev-umscc-permit-secret"
    console.warn("[ensure-env] Created fallback NEXTAUTH_SECRET for dev.")
  }
}

export {}
