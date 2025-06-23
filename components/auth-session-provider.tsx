"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type React from "react"

interface AuthSessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

/**
 * Wraps the app with NextAuth’s SessionProvider so that
 * `useSession` and other auth hooks work everywhere.
 */
export default function AuthSessionProvider({ children, session = null }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
