"use client"

import "@/lib/ensure-env" // <<< NEW – must precede next-auth
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface AuthSessionProviderProps {
  children: ReactNode
  session?: Session | null
}

export default function AuthSessionProvider({ children, session = null }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
