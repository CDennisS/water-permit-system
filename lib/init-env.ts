/**
 * Ensures NEXTAUTH_URL is defined with an absolute URL **before** any
 * `next-auth` code is evaluated. Import this module at the very top of every
 * file that (directly or indirectly) imports `next-auth`.
 *
 * 1. Uses `NEXTAUTH_URL` if already set.
 * 2. Falls back to `VERCEL_URL` when running on Vercel.
 * 3. Defaults to `http://localhost:3000` for local development/preview.
 */
const ensureNextAuthUrl = () => {
  if (typeof process === "undefined") return // In the browser, nothing to do.

  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.trim() === "") {
    const { VERCEL_URL } = process.env

    // Prefer the deployment URL if available (Vercel preview/prod).
    if (VERCEL_URL && VERCEL_URL.trim() !== "") {
      // Ensure it has a scheme.
      const prefixed = VERCEL_URL.startsWith("http") ? VERCEL_URL : `https://${VERCEL_URL}`

      process.env.NEXTAUTH_URL = prefixed
    } else {
      // Local fallback.
      process.env.NEXTAUTH_URL = "http://localhost:3000"
    }
  }

  // At this point NEXTAUTH_URL is guaranteed to be a valid absolute URL.
}

ensureNextAuthUrl()

export {}
