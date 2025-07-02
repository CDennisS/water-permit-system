/**
 * ────────────────────────────────────────────────────────────────────────────────
 * ensure-env.ts
 * ────────────────────────────────────────────────────────────────────────────────
 * Runs **only on the server** and makes sure `process.env.NEXTAUTH_URL` is a valid
 * absolute URL before *any* `next-auth` code executes.
 *
 * HOW IT WORKS
 * • If NEXTAUTH_URL is unset ⇒
 *      – in Vercel Preview/Production  →  https://<VERCEL_URL>
 *      – in local dev                 →  http://localhost:<PORT|3000>
 * • If NEXTAUTH_URL is set but invalid (e.g. "mysite.com") ⇒ it is normalised.
 *
 * Call this as the **first import** in every server file that uses `next-auth`.
 */

declare global {
  // eslint-disable-next-line no-var
  var __nextAuthEnvPatched: boolean | undefined
}

if (typeof window === "undefined" && !globalThis.__nextAuthEnvPatched) {
  globalThis.__nextAuthEnvPatched = true

  const key = "NEXTAUTH_URL"

  const buildFallback = (): string => {
    if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== "") {
      return `https://${process.env.VERCEL_URL}`
    }
    const port = process.env.PORT ?? "3000"
    return `http://localhost:${port}`
  }

  const ensureAbsolute = (value: string): string | null => {
    try {
      // Valid URL? keep it.
      // Will throw if missing scheme / invalid
      new URL(value)
      return value
    } catch {
      // Try to add https:// in front of bare hosts
      try {
        const fixed = `https://${value}`
        new URL(fixed)
        return fixed
      } catch {
        return null
      }
    }
  }

  const current = process.env[key]
  const valid = current && current.trim() !== "" ? ensureAbsolute(current) : null
  process.env[key] = valid ?? buildFallback()

  // `NEXTAUTH_SECRET` must exist for JWT – give it a dev-safe default.
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "umscc-dev-secret-change-me"
  }

  // eslint-disable-next-line no-console
  console.info(`[ensure-env] ${key} = ${process.env[key]}`)
}

export {} // keep this a module
