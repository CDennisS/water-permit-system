"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  session?: Session | null
}

export default function AuthSessionProvider({ children, session }: Props) {
  // We intentionally do NOT pass `baseUrl`; next-auth will use
  // process.env.NEXTAUTH_URL (now guaranteed) or window.location.origin.
  return <SessionProvider session={session}>{children}</SessionProvider>
}
