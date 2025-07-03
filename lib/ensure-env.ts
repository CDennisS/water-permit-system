/**
 * ensure-env.ts
 *
 * Guarantees that NEXTAUTH_URL is a valid, absolute URL **before**
 * any NextAuth code executes, eliminating the
 * “Failed to construct 'URL': Invalid URL” crash.
 *
 * Safe to import on both server and client, but MUST be imported
 * first in every server entry point (e.g. app/layout.tsx, API routes).
 */

declare global {
  // We attach a flag to the global object so this logic only runs once,
  // even if the file is imported multiple times or ends up in both the
  // server and client bundles.
  // eslint-disable-next-line no-var
  var __envChecked: boolean | undefined
}

if (!globalThis.__envChecked) {
  globalThis.__envChecked = true

  const makeAbsolute = (value: string) => (/^https?:\/\//i.test(value) ? value : `https://${value}`)

  const deriveDefaultHost = () => {
    if (process.env.VERCEL_URL) {
      return makeAbsolute(process.env.VERCEL_URL)
    }
    const port = process.env.PORT ?? "3000"
    return `http://localhost:${port}`
  }

  // Populate / fix NEXTAUTH_URL
  const raw = process.env.NEXTAUTH_URL?.trim()
  process.env.NEXTAUTH_URL = raw ? makeAbsolute(raw) : deriveDefaultHost()

  // In development, ensure NEXTAUTH_SECRET exists so NextAuth doesn’t warn
  if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
    if (!process.env.NEXTAUTH_SECRET) {
      process.env.NEXTAUTH_SECRET = "dev-umscc-permit-secret"
      console.warn("[ensure-env] NEXTAUTH_SECRET was missing – using dev fallback.")
    }
  }
}

export {}
