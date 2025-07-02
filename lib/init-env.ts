/**
 * Guarantees that `process.env.NEXTAUTH_URL` is a valid absolute URL
 * before NextAuth is ever imported.  This prevents the
 * `Failed to construct 'URL': Invalid URL` runtime error.
 *
 * • In the browser preview (Next.js), we fall back to `window.location.origin`.
 * • On the server, we fall back to "http://localhost:3000".
 */
declare global {
  // Allow adding to NodeJS.ProcessEnv
  // eslint-disable-next-line no-var, @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_URL?: string
    }
  }
}
;(function ensureNextAuthUrl() {
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith("http")) {
    return
  }

  if (typeof window !== "undefined") {
    // Running in the browser (Next.js preview)
    process.env.NEXTAUTH_URL = window.location.origin
  } else {
    // Running on the server (Node)
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  }
})()
