/**
 * Environment Detection and Utilities
 *
 * Provides utilities for detecting the current environment and
 * handling environment-specific logic throughout the application.
 */

import { config } from "./config"

/**
 * Environment Types
 */
export type Environment = "development" | "production" | "test" | "staging"

/**
 * Get current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment
  return env || "development"
}

/**
 * Environment detection utilities
 */
export const env = {
  isDevelopment: getCurrentEnvironment() === "development",
  isProduction: getCurrentEnvironment() === "production",
  isTest: getCurrentEnvironment() === "test",
  isStaging: getCurrentEnvironment() === "staging",

  // Client-side detection
  isClient: typeof window !== "undefined",
  isServer: typeof window === "undefined",

  // Browser detection
  isBrowser: typeof window !== "undefined" && typeof document !== "undefined",

  // Vercel deployment detection
  isVercel: Boolean(process.env.VERCEL),

  // Preview deployment detection
  isPreview: Boolean(process.env.VERCEL_ENV === "preview"),
} as const

/**
 * Environment-specific configuration
 */
export const environmentConfig = {
  development: {
    apiUrl: "http://localhost:3000/api",
    enableDebugLogs: true,
    enableErrorReporting: false,
    enableAnalytics: false,
    cacheTimeout: 0, // No caching in development
  },

  production: {
    apiUrl: "https://permits.umscc.gov.zw/api",
    enableDebugLogs: false,
    enableErrorReporting: true,
    enableAnalytics: true,
    cacheTimeout: 300000, // 5 minutes
  },

  test: {
    apiUrl: "http://localhost:3000/api",
    enableDebugLogs: false,
    enableErrorReporting: false,
    enableAnalytics: false,
    cacheTimeout: 0,
  },

  staging: {
    apiUrl: "https://staging-permits.umscc.gov.zw/api",
    enableDebugLogs: true,
    enableErrorReporting: true,
    enableAnalytics: false,
    cacheTimeout: 60000, // 1 minute
  },
} as const

/**
 * Get configuration for current environment
 */
export function getEnvironmentConfig() {
  const currentEnv = getCurrentEnvironment()
  return environmentConfig[currentEnv] || environmentConfig.development
}

/**
 * Environment-specific logging
 */
export const logger = {
  debug: (...args: any[]) => {
    if (env.isDevelopment || config.development.debugMode) {
      console.debug("[DEBUG]", ...args)
    }
  },

  info: (...args: any[]) => {
    if (!env.isProduction || config.development.logLevel === "info") {
      console.info("[INFO]", ...args)
    }
  },

  warn: (...args: any[]) => {
    console.warn("[WARN]", ...args)
  },

  error: (...args: any[]) => {
    console.error("[ERROR]", ...args)

    // In production, send to error reporting service
    if (env.isProduction && config.features.errorReporting) {
      // sendToErrorService(args)
    }
  },

  group: (label: string, fn: () => void) => {
    if (env.isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  },
} as const

/**
 * Performance monitoring utilities
 */
export const performance = {
  mark: (name: string) => {
    if (env.isDevelopment && typeof window !== "undefined" && window.performance) {
      window.performance.mark(name)
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (env.isDevelopment && typeof window !== "undefined" && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark)
        const measure = window.performance.getEntriesByName(name)[0]
        logger.debug(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`)
      } catch (error) {
        logger.warn("Performance measurement failed:", error)
      }
    }
  },

  time: (label: string) => {
    if (env.isDevelopment) {
      console.time(label)
    }
  },

  timeEnd: (label: string) => {
    if (env.isDevelopment) {
      console.timeEnd(label)
    }
  },
} as const

/**
 * Feature flag utilities
 */
export const features = {
  isEnabled: (feature: keyof typeof config.features): boolean => {
    return config.features[feature]
  },

  withFeature: (feature: keyof typeof config.features, callback: () => any, fallback?: () => any): any | undefined => {
    if (features.isEnabled(feature)) {
      return callback()
    } else if (fallback) {
      return fallback()
    }
    return undefined
  },
} as const

/**
 * Development utilities
 */
export const devUtils = {
  // Add development-only global variables
  exposeGlobals: () => {
    if (env.isDevelopment && env.isClient) {
      ;(window as any).__UMSCC_CONFIG__ = config(window as any).__UMSCC_ENV__ = env
      logger.debug("Development globals exposed: __UMSCC_CONFIG__, __UMSCC_ENV__")
    }
  },

  // Log environment information
  logEnvironmentInfo: () => {
    logger.group("🌍 Environment Information", () => {
      logger.info("Environment:", getCurrentEnvironment())
      logger.info("Version:", config.app.version)
      logger.info("Build Time:", new Date().toISOString())
      logger.info("Client Side:", env.isClient)
      logger.info("Vercel Deployment:", env.isVercel)
      logger.info("Preview Deployment:", env.isPreview)
    })
  },

  // Validate environment setup
  validateEnvironment: () => {
    const issues: string[] = []

    // Check required environment variables
    if (!process.env.NEXT_PUBLIC_APP_VERSION) {
      issues.push("NEXT_PUBLIC_APP_VERSION is not set")
    }

    if (!process.env.NEXT_PUBLIC_APP_NAME) {
      issues.push("NEXT_PUBLIC_APP_NAME is not set")
    }

    // Check for common misconfigurations
    if (env.isProduction && config.development.debugMode) {
      issues.push("Debug mode is enabled in production")
    }

    if (env.isProduction && !config.features.errorReporting) {
      issues.push("Error reporting is disabled in production")
    }

    if (issues.length > 0) {
      logger.warn("Environment validation issues:", issues)
      return false
    }

    logger.info("✅ Environment validation passed")
    return true
  },
} as const

/**
 * Runtime environment checks
 */
export const runtime = {
  // Check if running in browser
  canUseBrowser: () => {
    return typeof window !== "undefined" && typeof document !== "undefined"
  },

  // Check if running in Node.js
  canUseNode: () => {
    return typeof process !== "undefined" && process.versions && process.versions.node
  },

  // Check if running in Web Worker
  canUseWebWorker: () => {
    return typeof importScripts === "function"
  },

  // Check browser capabilities
  browserCapabilities: () => {
    if (!runtime.canUseBrowser()) return {}

    return {
      localStorage: typeof localStorage !== "undefined",
      sessionStorage: typeof sessionStorage !== "undefined",
      indexedDB: typeof indexedDB !== "undefined",
      webWorkers: typeof Worker !== "undefined",
      serviceWorkers: "serviceWorker" in navigator,
      notifications: "Notification" in window,
      geolocation: "geolocation" in navigator,
      camera: "mediaDevices" in navigator,
      clipboard: "clipboard" in navigator,
    }
  },
} as const

// Initialize development utilities
if (env.isDevelopment) {
  devUtils.exposeGlobals()
  devUtils.logEnvironmentInfo()
  devUtils.validateEnvironment()
}

// Export environment information
export default {
  env,
  config: getEnvironmentConfig(),
  logger,
  performance,
  features,
  devUtils,
  runtime,
}
