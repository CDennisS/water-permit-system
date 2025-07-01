"use client"

import type React from "react"

import { Loader2, FileText, Users, BarChart3, Activity } from "lucide-react"

/**
 * Global Loading Component
 *
 * This component is displayed while pages are loading.
 * It provides a professional loading experience with:
 * - Animated spinner
 * - System branding
 * - Loading progress indicators
 * - Accessibility support
 *
 * Used by Next.js App Router for route transitions and
 * can be used manually for async operations.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Loading Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* System Logo/Branding */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">UMSCC Permit Management</h1>
            <p className="text-sm text-gray-600">Upper Manyame Sub Catchment Council</p>
          </div>

          {/* Primary Loading Spinner */}
          <div className="mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" aria-label="Loading application" />
            <p className="text-gray-700 font-medium">Loading System...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your dashboard</p>
          </div>

          {/* Loading Progress Indicators */}
          <div className="space-y-3">
            <LoadingStep icon={Users} label="Authenticating user" isActive={true} />
            <LoadingStep icon={FileText} label="Loading applications" isActive={false} />
            <LoadingStep icon={BarChart3} label="Preparing analytics" isActive={false} />
            <LoadingStep icon={Activity} label="Checking notifications" isActive={false} />
          </div>

          {/* Loading Animation Bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full animate-pulse"
                style={{
                  width: "60%",
                  animation: "loading-progress 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              System Status: <span className="text-green-600 font-medium">Operational</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Version 2.1.0 • Last updated: March 2024</p>
          </div>
        </div>

        {/* Additional Loading Information */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            If loading takes longer than expected, please{" "}
            <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 underline">
              refresh the page
            </button>
          </p>
        </div>
      </div>

      {/* Custom CSS for loading animation */}
      <style jsx>{`
        @keyframes loading-progress {
          0% { width: 10%; }
          50% { width: 80%; }
          100% { width: 60%; }
        }
        
        @keyframes fade-in-out {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/**
 * Loading Step Component
 *
 * Represents an individual step in the loading process
 * with icon, label, and active state indication.
 */
interface LoadingStepProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
}

function LoadingStep({ icon: Icon, label, isActive }: LoadingStepProps) {
  return (
    <div
      className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
        isActive ? "bg-blue-50 text-blue-700" : "text-gray-400"
      }`}
    >
      <div className={`flex-shrink-0 ${isActive ? "animate-pulse" : ""}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium">{label}</span>
      {isActive && (
        <div className="flex-shrink-0">
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}
    </div>
  )
}

/**
 * Loading Hook for Components
 *
 * Custom hook that can be used by components to show
 * loading states with consistent styling.
 */
export function useLoadingState() {
  return {
    LoadingSpinner: ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
      const sizeClasses = {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
      }

      return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} aria-label="Loading" />
    },

    LoadingOverlay: ({ message = "Loading..." }: { message?: string }) => (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    ),

    LoadingButton: ({
      isLoading,
      children,
      ...props
    }: {
      isLoading: boolean
      children: React.ReactNode
      [key: string]: any
    }) => (
      <button
        disabled={isLoading}
        className={`inline-flex items-center ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {children}
      </button>
    ),
  }
}
