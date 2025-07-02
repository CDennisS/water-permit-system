/**
 * ensure-env.ts
 * --------------
 * Guarantees `process.env.NEXTAUTH_URL` is **always** a valid absolute URL
 * before any code from `next-auth` executes.  This prevents the
 * “Failed to construct 'URL': Invalid URL” runtime error during local
 * development, Vercel preview deployments, and production.
 *
 * How it works:
 *  • On the server  – sets `process.env.NEXTAUTH_URL` if it is missing.
 *  • On the client  – nothing to do; `next-auth` uses `window.location.origin`.
 *
 * IMPORTANT: place `import "@/lib/ensure-env"` **above** every `next-auth`
 *            import in your entry files (e.g. lib/auth.ts, providers, etc.).
 */

;(() => {
  // Only run the patch once.
  if ((globalThis as any).__nextAuthEnvPatched) return
  ;(globalThis as any).__nextAuthEnvPatched = true

  // Run this part only on the server where process.env is mutable.
  if (typeof window === "undefined") {
    if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.trim() === "") {
      // Prefer the Vercel-provided URL in preview/production.
      const fallback =
        process.env.VERCEL_URL && process.env.VERCEL_URL !== ""
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"

      process.env.NEXTAUTH_URL = fallback
      // eslint-disable-next-line no-console
      console.info(`[ensure-env] NEXTAUTH_URL was missing – set to "${process.env.NEXTAUTH_URL}".`)
    }
  }
})()

export {} // makes this an ES module
