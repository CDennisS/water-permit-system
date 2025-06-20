"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { PropsWithChildren } from "react"

interface AuthSessionProviderProps extends PropsWithChildren {
  session?: Session | null
}

/**
 * Global provider so that `useSession()` works anywhere in the app.
 */
export default function AuthSessionProvider({ children, session }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
