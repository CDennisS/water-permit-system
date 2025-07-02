"use client"

import "@/lib/ensure-env" // Must run before importing from next-auth/react
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  session?: Session | null
  children: ReactNode
}

/**
 * AuthSessionProvider
 * -------------------
 * Wraps children with NextAuth's SessionProvider so `useSession`
 * works throughout the client-side tree.
 */
export function AuthSessionProvider({ session = null, children }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

/* Preserve the default export expected elsewhere in the codebase */
export default AuthSessionProvider
