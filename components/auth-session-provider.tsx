"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

/**
 * AuthSessionProvider
 * -------------------
 * • On the client we pass `baseUrl={window.location.origin}`, so the browser
 *   never needs the NEXTAUTH_URL environment variable.
 * • On the server this prop is ignored (it is only read in the browser).
 */
export default function AuthSessionProvider({
  children,
  session,
}: {
  children: ReactNode
  session?: any
}) {
  // This check is always true in the browser / false on the server
  const baseUrl = typeof window !== "undefined" ? window.location.origin : undefined

  return (
    <SessionProvider
      session={session}
      // @ts-ignore (baseUrl is an accepted prop even if not in the type defs yet)
      baseUrl={baseUrl}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}
