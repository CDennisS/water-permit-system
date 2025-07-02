/**
 * ensure-env.ts
 * -------------
 * Runs on the **server only**.  If NEXTAUTH_URL is missing it synthesises a
 * safe absolute URL so `next-auth` will not crash when it constructs
 * `new URL(NEXTAUTH_URL)`.
 *
 *  • In Vercel Preview/Production → https://${VERCEL_URL}
 *  • In Local dev                 → http://localhost:${PORT || 3000}
 *
 * Important: import this **before** any call that might load `next-auth`
 * on the server (API routes, server components, server actions, etc.).
 */

if (typeof window === "undefined") {
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.trim() === "") {
    const vercelUrl = process.env.VERCEL_URL
    const port = process.env.PORT ?? "3000"

    process.env.NEXTAUTH_URL = vercelUrl ? `https://${vercelUrl}` : `http://localhost:${port}`

    // Optional – comment out in production if you don't want the log noise
    console.info(`[ensure-env] NEXTAUTH_URL was missing – set to ${process.env.NEXTAUTH_URL}`)
  }
}
