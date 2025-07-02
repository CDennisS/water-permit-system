"use client"

/**
 * Patch environment BEFORE importing anything from next-auth/react
 */
import "@/lib/init-env"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  children: ReactNode
  session: Session | null
}

/**
 * Wraps the NextAuth SessionProvider so all nested components
 * have access to `useSession()`.
 */
export default function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
