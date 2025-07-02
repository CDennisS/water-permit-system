/**
 * Guarantee NEXTAUTH_URL is a valid absolute URL on **all** environments
 * (local dev, Vercel preview, CI, production).
 *
 * ‼️  Must be imported BEFORE anything from `next-auth`.
 */
declare global {
  // helps us run the patch only once, even if the module is re-evaluated
  // eslint-disable-next-line no-var
  var __nextAuthUrlPatched: boolean | undefined
}

if (!globalThis.__nextAuthUrlPatched) {
  const ENV_KEY = "NEXTAUTH_URL"
  const raw = process.env[ENV_KEY]

  // Helper that returns a safe fallback host (localhost or Vercel host)
  const fallbackHost = () => {
    if (process.env.VERCEL_URL) return process.env.VERCEL_URL
    if (process.env.HOST) return process.env.HOST
    const port = process.env.PORT ?? "3000"
    return `localhost:${port}`
  }

  const makeAbsolute = (val: string) => (val.startsWith("http") ? val : `http://${val}`)

  let finalUrl: string

  if (!raw || raw.trim() === "") {
    finalUrl = `http://${fallbackHost()}`
  } else {
    try {
      // Will throw if `raw` is not a valid absolute URL
      new URL(raw)
      finalUrl = raw
    } catch {
      // Try to fix relative / malformed values
      try {
        const patched = makeAbsolute(raw)
        new URL(patched) // validate
        finalUrl = patched
      } catch {
        // Last-resort fallback
        finalUrl = `http://${fallbackHost()}`
      }
    }
  }

  process.env[ENV_KEY] = finalUrl
  globalThis.__nextAuthUrlPatched = true
}

export {} // makes this a module
