/**
 * Guarantee NEXTAUTH_URL is always set to a valid, absolute URL.
 *
 *  • In production (Vercel) we prefer VERCEL_URL → https://<VERCEL_URL>
 *  • In local dev we fall back to http://localhost:<PORT|3000>
 *
 * NextAuth needs this on both the server and the browser bundle,
 * so we also patch globalThis.process.env in the client.
 */
const isServer = typeof window === "undefined"

function assertValidUrl(url: string): string {
  try {
    // Will throw if invalid
    return new URL(url).toString()
  } catch {
    throw new Error(`NEXTAUTH_URL is invalid (${url}). It must be an absolute URL, e.g. "https://example.com".`)
  }
}

export function ensureNextAuthUrl(): void {
  let { NEXTAUTH_URL, VERCEL_URL, PORT } = process.env

  if (!NEXTAUTH_URL || NEXTAUTH_URL.trim() === "") {
    if (VERCEL_URL && VERCEL_URL.trim() !== "") {
      NEXTAUTH_URL = `https://${VERCEL_URL}`
    } else {
      NEXTAUTH_URL = `http://localhost:${PORT ?? "3000"}`
    }
    process.env.NEXTAUTH_URL = NEXTAUTH_URL
  }

  // Throws if still malformed
  assertValidUrl(process.env.NEXTAUTH_URL as string)

  // ----  Client patch  -----------------------------------------------------
  if (!isServer) {
    if (!("process" in globalThis)) {
      // @ts-ignore – we’re polyfilling a Node-ish process env for NextAuth
      globalThis.process = { env: {} }
    }
    // @ts-ignore
    globalThis.process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL
  }
}

// Execute immediately on import.
ensureNextAuthUrl()
