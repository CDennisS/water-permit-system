/**
 * ensure-env.ts
 *
 * Ensures NEXTAUTH_URL is always a well-formed absolute URL before any
 * NextAuth code executes, preventing the
 * “Failed to construct 'URL': Invalid URL” crash.
 *
 * Safe to import on both server and client.  MUST be imported first in every
 * server entry point (e.g. app/layout.tsx, API routes).
 */

// ----- guard: run exactly once per process / bundle -----
if (!(globalThis as any).__umsccEnvPatched) {
  ;(globalThis as any).__umsccEnvPatched = true

  const toAbsolute = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`)

  const defaultHost = (): string => {
    if (process.env.VERCEL_URL) return toAbsolute(process.env.VERCEL_URL)
    const port = process.env.PORT ?? "3000"
    return `http://localhost:${port}`
  }

  // Populate / normalise NEXTAUTH_URL
  const raw = (process.env.NEXTAUTH_URL || "").trim()
  process.env.NEXTAUTH_URL = raw ? toAbsolute(raw) : defaultHost()

  // In dev make sure NEXTAUTH_SECRET exists so NextAuth doesn’t warn
  if (typeof window === "undefined" && process.env.NODE_ENV !== "production" && !process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "dev-umscc-permit-secret"
    // eslint-disable-next-line no-console
    console.warn("[ensure-env] NEXTAUTH_SECRET was missing – using dev fallback.")
  }
}

export {}
