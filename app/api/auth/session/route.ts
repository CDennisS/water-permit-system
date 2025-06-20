import { NextResponse } from "next/server"

/**
 * TEMPORARY stub for NextAuth’s `/api/auth/session` endpoint.
 *
 * It returns an “anonymous” session so that `useSession()` in
 * client-side components gets valid JSON instead of a 404 HTML page.
 *
 * Replace this file with a full NextAuth configuration when you add
 * real authentication.
 */

export const dynamic = "force-dynamic" // ensure it always runs (no ISR)

export async function GET() {
  // one-hour “expires” so the client re-checks periodically
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  return NextResponse.json({
    user: null, // not signed in
    expires,
  })
}
