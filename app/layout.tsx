import "@/lib/ensure-env" // ⭐ MUST come first
import "./globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import AuthSessionProvider from "@/components/auth-session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UMSCC Permit Management System",
  description: "Manage permit application workflow and records.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
