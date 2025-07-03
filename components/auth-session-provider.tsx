"use client"

import "@/lib/ensure-env" // Ensures NEXTAUTH_URL is available on the client bundle.
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  children: ReactNode
  session?: Session | null
}

/**
 * Wraps children with NextAuth's SessionProvider.
 * We intentionally DO NOT pass `baseUrl`; next-auth will use
 * `process.env.NEXTAUTH_URL` (now guaranteed) or `window.location.origin`
 * on the client, preventing “Invalid URL” errors.
 */
export default function AuthSessionProvider({ children, session = null }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
