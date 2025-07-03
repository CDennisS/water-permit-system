"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type React from "react"

interface AuthSessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export default function AuthSessionProvider({ children, session = null }: AuthSessionProviderProps) {
  // On the browser we always have window.location.origin
  const baseUrl = typeof window !== "undefined" ? window.location.origin : undefined

  return (
    <SessionProvider session={session} baseUrl={baseUrl}>
      {children}
    </SessionProvider>
  )
}
