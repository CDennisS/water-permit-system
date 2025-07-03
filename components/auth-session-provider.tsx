"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type React from "react"

interface AuthSessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

/**
 * Client-side SessionProvider.
 * We supply baseUrl to avoid relying on browser-bundled env vars.
 */
export default function AuthSessionProvider({ children, session = null }: AuthSessionProviderProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : undefined

  return (
    <SessionProvider session={session} baseUrl={baseUrl}>
      {children}
    </SessionProvider>
  )
}
