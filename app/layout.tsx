import "@/lib/ensure-env" // 🛡️  set NEXTAUTH_URL **first**
import "./globals.css"

import AuthSessionProvider from "@/components/auth-session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "UMSCC Permit Management System",
  description: "Manage permit applications and approvals",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased">
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
