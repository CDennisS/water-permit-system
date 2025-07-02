"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

/**
 * Client-side wrapper that injects `baseUrl` so the browser never needs the
 * NEXTAUTH_URL environment variable (which is server-only).
 */
export default function AuthSessionProvider({
  children,
}: {
  children: ReactNode
}) {
  // Runs only in the browser
  const baseUrl = typeof window !== "undefined" ? window.location.origin : undefined

  return (
    <SessionProvider baseUrl={baseUrl} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
