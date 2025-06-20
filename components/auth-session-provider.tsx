"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

interface AuthSessionProviderProps {
  /** The session delivered from the server (optional). */
  session?: Session | null
  children: React.ReactNode
}

/**
 * Thin wrapper around next-auth's SessionProvider so we can
 * tree-shake / swap implementations later without touching layout.tsx.
 */
export default function AuthSessionProvider({ session, children }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
