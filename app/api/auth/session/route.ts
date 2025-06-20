import { NextResponse } from "next/server"

/**
 * This is a temporary stub endpoint that returns an empty session
 * to prevent CLIENT_FETCH_ERROR when NextAuth tries to fetch session data.
 *
 * It returns a valid JSON response with an empty session object.
 */
export async function GET() {
  return NextResponse.json({
    user: null,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
}
