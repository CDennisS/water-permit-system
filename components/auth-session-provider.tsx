"use client"

import "@/lib/ensure-env" // Import first to set environment variables
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  children: ReactNode
  session?: Session | null
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  // Provide explicit baseUrl for client-side to avoid env var access
  const baseUrl = typeof window !== "undefined" ? window.location.origin : undefined

  return (
    <SessionProvider session={session} baseUrl={baseUrl} basePath="/api/auth">
      {children}
    </SessionProvider>
  )
}

// Export as default for backward compatibility
export default AuthSessionProvider
