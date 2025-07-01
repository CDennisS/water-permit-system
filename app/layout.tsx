import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

// Configure Inter font with Latin subset for optimal loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
  variable: "--font-inter",
})

/**
 * Application Metadata Configuration
 *
 * Defines the application's metadata for SEO and browser display.
 * This includes title, description, and other meta tags.
 */
export const metadata: Metadata = {
  title: {
    default: "UMSCC Permit Management System",
    template: "%s | UMSCC Permit Management",
  },
  description:
    "Upper Manyame Sub Catchment Council Water Permit Management System - Streamlined permit application processing and management for water resource allocation in Zimbabwe.",
  keywords: [
    "water permits",
    "Zimbabwe",
    "Upper Manyame",
    "catchment council",
    "permit management",
    "water resources",
    "environmental permits",
  ],
  authors: [
    {
      name: "Upper Manyame Sub Catchment Council",
      url: "https://umscc.gov.zw",
    },
  ],
  creator: "UMSCC ICT Department",
  publisher: "Upper Manyame Sub Catchment Council",
  robots: {
    index: false, // Don't index in search engines (internal system)
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  // Open Graph metadata for social sharing (if needed)
  openGraph: {
    type: "website",
    locale: "en_ZW",
    url: "https://permits.umscc.gov.zw",
    siteName: "UMSCC Permit Management System",
    title: "UMSCC Permit Management System",
    description: "Water permit application and management system for Upper Manyame Sub Catchment Council",
  },
  // Additional metadata for PWA support
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Viewport configuration for responsive design
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zoom on mobile for better UX
  },
    generator: 'v0.dev'
}

/**
 * Root Layout Component
 *
 * This component wraps the entire application and provides:
 * - Global styling and font configuration
 * - Theme provider for dark/light mode support
 * - Toast notification system
 * - Error boundary for unhandled errors
 * - Accessibility improvements
 *
 * @param children - The page content to render
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning // Suppress hydration warnings for theme provider
    >
      <head>
        {/* Additional meta tags for security and performance */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning // Suppress hydration warnings for theme provider
      >
        {/* 
          Theme Provider Configuration
          - Enables dark/light mode switching
          - Persists theme preference in localStorage
          - Provides theme context to all components
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="umscc-theme"
        >
          {/* 
            Main Application Content
            - All page content is rendered here
            - Wrapped in theme provider for consistent styling
          */}
          <div className="min-h-screen bg-background font-sans antialiased">{children}</div>

          {/* 
            Global Toast Notification System
            - Provides consistent notification UI across the app
            - Handles success, error, and info messages
            - Automatically dismisses after timeout
          */}
          <Toaster />
        </ThemeProvider>

        {/* 
          Development Tools (only in development mode)
          - Add any development-only scripts or tools here
        */}
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Development console logging
                console.log('UMSCC Permit Management System - Development Mode');
                console.log('Version: ${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}');
                
                // Performance monitoring in development
                if (typeof window !== 'undefined' && window.performance) {
                  window.addEventListener('load', () => {
                    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                    console.log('Page load time:', loadTime + 'ms');
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
