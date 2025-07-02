/**
 * ────────────────────────────────────────────────────────────────────────────────
 * ensure-env.ts
 * ────────────────────────────────────────────────────────────────────────────────
 * Runs ONLY on the server and makes sure `process.env.NEXTAUTH_URL` is a valid
 * absolute URL before *any* `next-auth` code executes.
 */

declare global {
  // eslint-disable-next-line no-var
  var __nextAuthEnvPatched: boolean | undefined
}

if (typeof window === "undefined" && !globalThis.__nextAuthEnvPatched) {
  globalThis.__nextAuthEnvPatched = true

  const key = "NEXTAUTH_URL"

  /** Build a fallback value (dev ⇢ localhost, Vercel ⇢ https://<VERCEL_URL>) */
  const buildFallback = (): string => {
    if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== "") {
      return `https://${process.env.VERCEL_URL}`
    }
    const port = process.env.PORT ?? "3000"
    return `http://localhost:${port}`
  }

  /** Returns a valid absolute URL string, or null if `value` is junk. */
  const validate = (value: string | undefined | null): string | null => {
    if (!value || value.trim() === "") return null
    try {
      new URL(value) // will throw if invalid
      return value
    } catch {
      // maybe user wrote "example.com" without scheme
      try {
        const fixed = `https://${value}`
        new URL(fixed)
        return fixed
      } catch {
        return null
      }
    }
  }

  const ensured = validate(process.env[key]) ?? buildFallback()
  process.env[key] = ensured

  // NEXTAUTH_SECRET must also exist for JWT signing
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "umscc-dev-secret-change-me"
  }

  // eslint-disable-next-line no-console
  console.info(`[next-auth] ${key} set to ${process.env[key]}`)
}

export {} // keep this file a module
