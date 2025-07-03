/**
 * ensure-env.ts
 *
 * Guarantees `process.env.NEXTAUTH_URL` is set to a valid, absolute URL
 * **on the server side only**.  (The NextAuth client bundle will default
 * to `window.location.origin`, so we don’t touch env vars in the browser.)
 */

const isServer = typeof window === "undefined"

if (isServer) {
  const makeAbsolute = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`)

  const deriveDefaultUrl = (): string => {
    if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== "") {
      return makeAbsolute(process.env.VERCEL_URL)
    }
    const port = process.env.PORT ?? "3000"
    return `http://localhost:${port}`
  }

  // Pick best candidate, then validate
  const finalUrl = (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.trim()) || deriveDefaultUrl()

  try {
    new URL(finalUrl) // throws if malformed
    process.env.NEXTAUTH_URL = finalUrl
  } catch {
    // Absolute last-chance fallback
    process.env.NEXTAUTH_URL = "http://localhost:3000"
    // eslint-disable-next-line no-console
    console.warn(`[ensure-env] Normalisation failed – defaulted NEXTAUTH_URL to ${process.env.NEXTAUTH_URL}`)
  }
}

export {}
