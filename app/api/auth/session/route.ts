import { NextResponse } from "next/server"

/**
 * Temporary stub for Next-Auth's session endpoint.
 * Returns an “empty” session so `useSession()` won’t throw
 * until full authentication is implemented.
 */
export async function GET() {
  return NextResponse.json(
    {
      user: null,
      expires: null,
    },
    { status: 200 },
  )
}
