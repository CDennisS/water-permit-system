"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

/**
 * Wraps next-auth’s SessionProvider so that any client component
 * can safely call `useSession()`.
 *
 * You normally don’t need to pass a `session` prop here unless
 * you’re doing advanced server-side session hydration.
 */
export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
