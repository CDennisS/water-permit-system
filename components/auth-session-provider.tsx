"use client"

import type { ReactNode } from "react"
import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"

/**
 * Wraps next-auth's SessionProvider so it can be imported
 * with `import AuthSessionProvider from "@/components/auth-session-provider"`
 * (matches the path you used earlier).
 *
 * If you haven't configured next-auth yet this will still work,
 * returning an “empty” session and preventing build-time errors.
 */
export default function AuthSessionProvider({
  children,
  session = null,
}: {
  children: ReactNode
  session?: Session | null
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
