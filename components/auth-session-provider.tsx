"use client"

import "@/lib/ensure-env" // 🛡️ must run before `next-auth/react`
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  session?: Session | null
  children: ReactNode
}

/**
 * Wrap your app (or layout) with this provider so that
 * `useSession` works on the client.
 */
export function AuthSessionProvider({ session, children }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
