/**
 * Guarantee that NEXTAUTH_URL is always defined with an absolute URL
 * **before** any `next-auth` code is executed.  Import this module first in
 * every file (server or client) that touches `next-auth`.
 *
 * 1. If NEXTAUTH_URL is already set, we keep it.
 * 2. In Vercel (preview/production) we build it from VERCEL_URL.
 * 3. Locally we fall back to "http://localhost:3000".
 */
;(function ensureNextAuthUrl() {
  // Only run in Node-like environments where `process` exists.
  if (typeof process === "undefined" || !process.env) return

  const hasValidUrl = process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith("http")

  if (hasValidUrl) return

  const { VERCEL_URL } = process.env

  if (VERCEL_URL && VERCEL_URL.trim() !== "") {
    // Prefix scheme if missing (Vercel gives bare host names).
    const absolute = VERCEL_URL.startsWith("http") ? VERCEL_URL : `https://${VERCEL_URL}`
    process.env.NEXTAUTH_URL = absolute
  } else {
    // Local fallback.
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  }
})()

export {}
