"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  children: ReactNode
  session?: Session | null
}

export function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  // This check is always true in the browser / false on the server
  const baseUrl = process.env.NEXTAUTH_URL

  return (
    <SessionProvider session={session} baseUrl={baseUrl} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}

// Export as default for backward compatibility
export default AuthSessionProvider
