import "@/lib/ensure-env"
import "./globals.css"

import type React from "react"
import type { Metadata } from "next"
import AuthSessionProvider from "@/components/auth-session-provider"

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
    <html lang="en">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
