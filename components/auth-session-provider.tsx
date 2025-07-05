"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type React from "react"

interface AuthSessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

/**
 * Ensures `baseUrl` is always a valid absolute URL:
 * – On the server pass we read process.env.NEXTAUTH_URL (set by ensure-env.ts)
 * – On the client we switch to window.location.origin
 */
export default function AuthSessionProvider({ children, session = null }: AuthSessionProviderProps) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXTAUTH_URL // server-side render
      : window.location.origin // browser

  return (
    <SessionProvider session={session} baseUrl={baseUrl}>
      {children}
    </SessionProvider>
  )
}
