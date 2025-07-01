"use client"

import { useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from "lucide-react"

/**
 * Global Error Boundary Component
 *
 * This component catches and handles unhandled errors in the application.
 * It provides:
 * - User-friendly error messages
 * - Error reporting capabilities
 * - Recovery options (retry, go home)
 * - Development error details
 * - Accessibility support
 *
 * Automatically used by Next.js App Router for error boundaries.
 */
interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  /**
   * Log error details for debugging and monitoring
   * Only logs in development to avoid exposing sensitive info
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Application Error:", {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "Unknown",
        url: typeof window !== "undefined" ? window.location.href : "Unknown",
      })
    }

    // In production, you might want to send error to monitoring service
    // Example: sendErrorToMonitoring(error)
  }, [error])

  /**
   * Handles retry action with error clearing
   */
  const handleRetry = useCallback(() => {
    try {
      // Clear any cached data that might be causing issues
      if (typeof window !== "undefined") {
        // Clear localStorage if it might be corrupted
        try {
          localStorage.removeItem("umscc-cache")
          sessionStorage.clear()
        } catch (storageError) {
          console.warn("Failed to clear storage:", storageError)
        }
      }

      // Reset the error boundary
      reset()
    } catch (resetError) {
      console.error("Failed to reset application:", resetError)
      // If reset fails, reload the page
      window.location.reload()
    }
  }, [reset])

  /**
   * Handles navigation to home page
   */
  const handleGoHome = useCallback(() => {
    try {
      window.location.href = "/"
    } catch (navigationError) {
      console.error("Failed to navigate home:", navigationError)
      window.location.reload()
    }
  }, [])

  /**
   * Handles error reporting (in production, this would send to monitoring service)
   */
  const handleReportError = useCallback(() => {
    try {
      const errorReport = {
        message: error.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        digest: error.digest,
      }

      // In production, send to error reporting service
      if (process.env.NODE_ENV === "production") {
        // Example: sendErrorReport(errorReport)
        console.log("Error report would be sent:", errorReport)
      }

      // For now, copy to clipboard for manual reporting
      navigator.clipboard
        .writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          alert("Error details copied to clipboard. Please send this to the ICT department.")
        })
        .catch(() => {
          alert("Please manually copy the error details and send to ICT department.")
        })
    } catch (reportError) {
      console.error("Failed to report error:", reportError)
    }
  }, [error])

  /**
   * Determines error severity and type
   */
  const getErrorInfo = useCallback(() => {
    const message = error.message.toLowerCase()

    if (message.includes("network") || message.includes("fetch")) {
      return {
        type: "Network Error",
        severity: "medium",
        description: "There seems to be a connection issue. Please check your internet connection.",
        canRetry: true,
      }
    }

    if (message.includes("permission") || message.includes("unauthorized")) {
      return {
        type: "Permission Error",
        severity: "high",
        description: "You do not have permission to access this resource. Please contact your administrator.",
        canRetry: false,
      }
    }

    if (message.includes("not found") || message.includes("404")) {
      return {
        type: "Resource Not Found",
        severity: "medium",
        description: "The requested resource could not be found.",
        canRetry: false,
      }
    }

    return {
      type: "Application Error",
      severity: "high",
      description: "An unexpected error occurred. Our team has been notified.",
      canRetry: true,
    }
  }, [error])

  const errorInfo = getErrorInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Error Card */}
        <Card className="shadow-lg border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">{errorInfo.type}</CardTitle>
            <p className="text-gray-600 mt-2">UMSCC Permit Management System</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Description */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">{errorInfo.description}</AlertDescription>
            </Alert>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === "development" && (
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertTitle>Development Error Details</AlertTitle>
                <AlertDescription className="mt-2">
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Click to view technical details</summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      <code>{error.stack || error.message}</code>
                    </pre>
                    {error.digest && <p className="mt-2 text-xs text-gray-600">Error ID: {error.digest}</p>}
                  </details>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {errorInfo.canRetry && (
                <Button onClick={handleRetry} className="flex-1" aria-label="Retry the failed operation">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1 bg-transparent"
                aria-label="Return to home page"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>

              <Button
                onClick={handleReportError}
                variant="outline"
                className="flex-1 bg-transparent"
                aria-label="Report this error to administrators"
              >
                <Mail className="h-4 w-4 mr-2" />
                Report Error
              </Button>
            </div>

            {/* Help Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Try refreshing the page or clearing your browser cache</p>
                <p>• Check your internet connection</p>
                <p>• Contact ICT support if the problem persists</p>
                <p className="mt-2 font-medium">ICT Support: ict@umscc.gov.zw | +263-4-123-4567</p>
              </div>
            </div>

            {/* System Information */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Error occurred at: {new Date().toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">UMSCC Permit Management System v2.1.0</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Recovery Options */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">Still having trouble?</p>
          <div className="flex justify-center space-x-4 text-xs">
            <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 underline">
              Reload Page
            </button>
            <button
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              }}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Error Reporting Utility
 *
 * In production, this would integrate with error monitoring services
 * like Sentry, LogRocket, or custom error tracking systems.
 */
export function reportError(error: Error, context?: Record<string, any>) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "Unknown",
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "Unknown",
    context: context || {},
  }

  if (process.env.NODE_ENV === "development") {
    console.error("Error Report:", errorData)
  } else {
    // In production, send to monitoring service
    // Example: sendToErrorService(errorData)
  }
}

/**
 * Error Boundary Hook
 *
 * Custom hook for components that need to handle errors gracefully
 */
export function useErrorHandler() {
  return {
    handleError: (error: Error, context?: Record<string, any>) => {
      reportError(error, context)

      // Show user-friendly error message
      if (typeof window !== "undefined") {
        // You could integrate with toast system here
        console.error("Handled error:", error.message)
      }
    },

    withErrorHandling: <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await fn(...args)
        } catch (error) {
          reportError(error as Error, { function: fn.name, args })
          return null
        }
      }
    },
  }
}
