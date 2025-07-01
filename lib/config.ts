/**
 * Application Configuration
 *
 * Centralized configuration management for the UMSCC Permit Management System.
 * This file handles environment variables, feature flags, and system constants.
 */

/**
 * Environment variable validation and parsing
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || ""
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  const parsed = Number.parseInt(value, 10)
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${key}: ${value}, using default: ${defaultValue}`)
    return defaultValue
  }
  return parsed
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  if (!value) return defaultValue
  return value.toLowerCase() === "true"
}

/**
 * Application Configuration Object
 */
export const config = {
  // Application Information
  app: {
    name: getEnvVar("NEXT_PUBLIC_APP_NAME", "UMSCC Permit Management System"),
    version: getEnvVar("NEXT_PUBLIC_APP_VERSION", "2.1.0"),
    description: getEnvVar(
      "NEXT_PUBLIC_APP_DESCRIPTION",
      "Upper Manyame Sub Catchment Council Water Permit Management System",
    ),
    baseUrl: getEnvVar("NEXT_PUBLIC_BASE_URL", "http://localhost:3000"),
    apiUrl: getEnvVar("NEXT_PUBLIC_API_URL", "http://localhost:3000/api"),
  },

  // Organization Information
  organization: {
    name: getEnvVar("NEXT_PUBLIC_ORGANIZATION", "Upper Manyame Sub Catchment Council"),
    url: getEnvVar("NEXT_PUBLIC_ORGANIZATION_URL", "https://umscc.gov.zw"),
    supportEmail: getEnvVar("NEXT_PUBLIC_SUPPORT_EMAIL", "ict@umscc.gov.zw"),
    supportPhone: getEnvVar("NEXT_PUBLIC_SUPPORT_PHONE", "+263-4-123-4567"),
    adminEmail: getEnvVar("NEXT_PUBLIC_ADMIN_EMAIL", "admin@umscc.gov.zw"),
  },

  // Feature Flags
  features: {
    darkMode: getEnvBoolean("NEXT_PUBLIC_ENABLE_DARK_MODE", true),
    notifications: getEnvBoolean("NEXT_PUBLIC_ENABLE_NOTIFICATIONS", true),
    analytics: getEnvBoolean("NEXT_PUBLIC_ENABLE_ANALYTICS", false),
    errorReporting: getEnvBoolean("NEXT_PUBLIC_ENABLE_ERROR_REPORTING", false),
    performanceMonitoring: getEnvBoolean("NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING", false),
    userAnalytics: getEnvBoolean("NEXT_PUBLIC_ENABLE_USER_ANALYTICS", false),
  },

  // Security Settings
  security: {
    sessionTimeout: getEnvNumber("NEXT_PUBLIC_SESSION_TIMEOUT", 3600000), // 1 hour
    maxFileSize: getEnvNumber("NEXT_PUBLIC_MAX_FILE_SIZE", 10485760), // 10MB
    allowedFileTypes: getEnvVar("NEXT_PUBLIC_ALLOWED_FILE_TYPES", "pdf,doc,docx,jpg,jpeg,png,gif").split(","),
  },

  // System Limits
  limits: {
    maxApplicationsPerUser: getEnvNumber("NEXT_PUBLIC_MAX_APPLICATIONS_PER_USER", 50),
    maxDocumentsPerApplication: getEnvNumber("NEXT_PUBLIC_MAX_DOCUMENTS_PER_APPLICATION", 20),
    messagePollInterval: getEnvNumber("NEXT_PUBLIC_MESSAGE_POLL_INTERVAL", 30000), // 30 seconds
  },

  // Localization
  locale: {
    timezone: getEnvVar("NEXT_PUBLIC_DEFAULT_TIMEZONE", "Africa/Harare"),
    locale: getEnvVar("NEXT_PUBLIC_DEFAULT_LOCALE", "en_ZW"),
    currency: getEnvVar("NEXT_PUBLIC_CURRENCY", "USD"),
  },

  // Development Settings
  development: {
    debugMode: getEnvBoolean("NEXT_PUBLIC_DEBUG_MODE", process.env.NODE_ENV === "development"),
    logLevel: getEnvVar("NEXT_PUBLIC_LOG_LEVEL", process.env.NODE_ENV === "development" ? "debug" : "info"),
  },

  // Cache Settings
  cache: {
    duration: getEnvNumber("NEXT_PUBLIC_CACHE_DURATION", 300000), // 5 minutes
    staticDuration: getEnvNumber("NEXT_PUBLIC_STATIC_CACHE_DURATION", 86400000), // 24 hours
  },

  // API Endpoints
  api: {
    errorReporting: getEnvVar("NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT", "/api/errors"),
  },

  // Environment Detection
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const

/**
 * Validation function to check if all required configuration is present
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!config.app.name) errors.push("App name is required")
  if (!config.app.version) errors.push("App version is required")
  if (!config.organization.name) errors.push("Organization name is required")

  // Validate URLs
  try {
    new URL(config.app.baseUrl)
  } catch {
    errors.push("Invalid base URL")
  }

  try {
    new URL(config.app.apiUrl)
  } catch {
    errors.push("Invalid API URL")
  }

  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(config.organization.supportEmail)) {
    errors.push("Invalid support email address")
  }
  if (!emailRegex.test(config.organization.adminEmail)) {
    errors.push("Invalid admin email address")
  }

  // Validate numeric values
  if (config.security.sessionTimeout < 60000) {
    errors.push("Session timeout must be at least 1 minute")
  }
  if (config.security.maxFileSize < 1024) {
    errors.push("Max file size must be at least 1KB")
  }
  if (config.limits.messagePollInterval < 5000) {
    errors.push("Message poll interval must be at least 5 seconds")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get configuration for specific environment
 */
export function getEnvironmentConfig() {
  return {
    ...config,
    environment: process.env.NODE_ENV || "development",
    buildTime: new Date().toISOString(),
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF || "unknown",
  }
}

/**
 * Feature flag checker
 */
export function isFeatureEnabled(feature: keyof typeof config.features): boolean {
  return config.features[feature]
}

/**
 * Get user-facing configuration (safe for client-side)
 */
export function getPublicConfig() {
  return {
    app: {
      name: config.app.name,
      version: config.app.version,
      description: config.app.description,
    },
    organization: {
      name: config.organization.name,
      url: config.organization.url,
      supportEmail: config.organization.supportEmail,
      supportPhone: config.organization.supportPhone,
    },
    features: config.features,
    limits: config.limits,
    locale: config.locale,
  }
}

/**
 * Development utilities
 */
export const devUtils = {
  logConfig: () => {
    if (config.development.debugMode) {
      console.group("🔧 Application Configuration")
      console.log("Environment:", process.env.NODE_ENV)
      console.log("Version:", config.app.version)
      console.log("Features:", config.features)
      console.log("Limits:", config.limits)
      console.groupEnd()
    }
  },

  validateEnvironment: () => {
    const validation = validateConfig()
    if (!validation.isValid) {
      console.error("❌ Configuration validation failed:")
      validation.errors.forEach((error) => console.error(`  - ${error}`))
      if (config.isProduction) {
        throw new Error("Invalid configuration in production environment")
      }
    } else {
      console.log("✅ Configuration validation passed")
    }
  },
}

// Auto-validate configuration in development
if (config.isDevelopment && typeof window === "undefined") {
  devUtils.validateEnvironment()
  devUtils.logConfig()
}
