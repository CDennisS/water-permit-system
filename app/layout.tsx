import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import AppSessionProvider from "@/components/session-provider"
import { Inter } from "next/font/google"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontSans.variable)}>
        <AppSessionProvider>{children}</AppSessionProvider>
        <Toaster />
      </body>
    </html>
  )
}
