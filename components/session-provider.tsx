"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"

interface SessionProviderProps {
  children: React.ReactNode
}

/**
 * Combines the Next-Auth SessionProvider with the existing ThemeProvider
 * so we only have to import one wrapper in the root layout.
 */
export default function AppSessionProvider({ children }: SessionProviderProps) {
  return (
    <SessionProvider>
      {/* keep any other global providers here */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
