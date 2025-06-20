"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type React from "react"

/**
 * Wraps Next-Auth’s SessionProvider so pages and components can
 * safely call `useSession()` without runtime errors.
 *
 * Usage: place <AuthSessionProvider> at the top of the app tree
 * (already done in app/layout.tsx).
 */
export default function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session?: Session | null
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
