/**
 * ────────────────────────────────────────────────────────────────────────────────
 * ensure-env.ts
 * ────────────────────────────────────────────────────────────────────────────────
 * Guarantees `process.env.NEXTAUTH_URL` is ALWAYS a valid absolute URL before
 * any code from `next-auth` executes (server or edge).  Import this module FIRST
 * in every entry file that touches `next-auth` (route-handlers, lib/auth, etc.).
 */

declare global {
  // Ensure the patch runs only once
  // eslint-disable-next-line no-var
  var __nextAuthPatched: boolean | undefined
}

if (!globalThis.__nextAuthPatched) {
  globalThis.__nextAuthPatched = true

  const key = "NEXTAUTH_URL"

  // Helper – choose a sensible fallback host
  const fallbackHost = () => {
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    const port = process.env.PORT ?? "3000"
    return `http://localhost:${port}`
  }

  const raw = process.env[key]

  if (!raw || raw.trim() === "") {
    process.env[key] = fallbackHost()
  } else {
    try {
      // Validate the provided value
      new URL(raw)
    } catch {
      // Try to fix bare hosts (no scheme) that users sometimes set
      try {
        new URL(`https://${raw}`)
        process.env[key] = `https://${raw}`
      } catch {
        // Final fallback
        process.env[key] = fallbackHost()
      }
    }
  }
}

export {} // keep file a module
