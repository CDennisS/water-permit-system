"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  children: ReactNode
  session?: Session | null
}

/**
 * Wraps the application with `next-auth`'s `SessionProvider`.
 * We do **not** pass `baseUrl` unless we're certain it’s valid.
 * This prevents “Invalid URL” runtime errors.
 */
export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}

export default AuthSessionProvider
