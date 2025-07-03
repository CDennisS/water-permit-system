/**
 * ensure-env.ts
 *
 * Guarantees `process.env.NEXTAUTH_URL` is ALWAYS a valid, absolute URL
 * before any NextAuth code executes – on both the server and the browser.
 */

const isServer = typeof window === "undefined"

function makeAbsolute(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function deriveDefaultUrl(): string {
  if (process.env.VERCEL_URL) return makeAbsolute(process.env.VERCEL_URL)
  const port = process.env.PORT ?? "3000"
  return `http://localhost:${port}`
}

function ensureNextAuthUrl(): void {
  // 1️⃣  Pick the best candidate
  const finalUrl = (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.trim()) || deriveDefaultUrl()

  // 2️⃣  Validate – throws if malformed
  try {
    new URL(finalUrl)
  } catch {
    throw new Error(`ensure-env ▶ NEXTAUTH_URL could not be normalised. Got "${finalUrl}".`)
  }

  // 3️⃣  Persist to env
  process.env.NEXTAUTH_URL = finalUrl

  // 4️⃣  Patch client bundle so NextAuth sees it at runtime
  if (!isServer) {
    if (!("process" in globalThis)) {
      // @ts-ignore create a minimal polyfill
      globalThis.process = { env: {} }
    }
    // @ts-ignore
    globalThis.process.env.NEXTAUTH_URL = finalUrl
  }
}

// Run immediately on import
ensureNextAuthUrl()
export {}
