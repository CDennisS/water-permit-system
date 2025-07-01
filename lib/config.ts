import { z } from "zod"

// Environment variable validation schema
const envSchema = z.object({
  // Database
  NEON_DATABASE_URL: z.string().url(),
  POSTGRES_URL: z.string().url(),
  POSTGRES_PRISMA_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url(),

  // Authentication
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // File Storage
  BLOB_READ_WRITE_TOKEN: z.string().min(1),

  // Email
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().regex(/^\d+$/),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),

  // Security
  ENCRYPTION_KEY: z.string().length(32),
  JWT_SECRET: z.string().min(32),

  // Optional deployment vars
  VERCEL: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  VERCEL_GIT_COMMIT_REF: z.string().optional(),
  BUILD_TIME: z.string().optional(),
  GIT_COMMIT: z.string().optional(),
  GIT_BRANCH: z.string().optional(),
  DEPLOY_URL: z.string().url().optional(),
})

// Client-side environment variables
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("UMSCC Permit Management System"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("1.0.0"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ENABLE_PWA: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  NEXT_PUBLIC_ENABLE_NOTIFICATIONS: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_ENABLE_DEBUG: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_MAX_FILE_SIZE: z
    .string()
    .transform((val) => Number.parseInt(val))
    .default("10485760"),
  NEXT_PUBLIC_ALLOWED_FILE_TYPES: z.string().default("pdf,doc,docx,jpg,jpeg,png"),
  NEXT_PUBLIC_SESSION_TIMEOUT: z
    .string()
    .transform((val) => Number.parseInt(val))
    .default("3600000"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
  NEXT_PUBLIC_TIMEZONE: z.string().default("Africa/Harare"),
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
})

// Validate environment variables
function validateEnv() {
  try {
    // Server-side validation
    if (typeof window === "undefined") {
      envSchema.parse(process.env)
    }

    // Client-side validation
    return clientEnvSchema.parse(process.env)
  } catch (error) {
    console.error("Environment validation failed:", error)
    throw new Error("Invalid environment configuration")
  }
}

// Export validated config
export const config = validateEnv()

// Application configuration
export const appConfig = {
  name: config.NEXT_PUBLIC_APP_NAME,
  version: config.NEXT_PUBLIC_APP_VERSION,
  url: config.NEXT_PUBLIC_APP_URL,

  // Feature flags
  features: {
    pwa: config.NEXT_PUBLIC_ENABLE_PWA,
    notifications: config.NEXT_PUBLIC_ENABLE_NOTIFICATIONS,
    analytics: config.NEXT_PUBLIC_ENABLE_ANALYTICS,
    debug: config.NEXT_PUBLIC_ENABLE_DEBUG,
    performanceMonitoring: config.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
  },

  // File upload configuration
  upload: {
    maxFileSize: config.NEXT_PUBLIC_MAX_FILE_SIZE,
    allowedTypes: config.NEXT_PUBLIC_ALLOWED_FILE_TYPES.split(","),
    maxFiles: 10,
  },

  // Session configuration
  session: {
    timeout: config.NEXT_PUBLIC_SESSION_TIMEOUT,
    refreshInterval: 300000, // 5 minutes
  },

  // Localization
  locale: {
    default: config.NEXT_PUBLIC_DEFAULT_LOCALE,
    timezone: config.NEXT_PUBLIC_TIMEZONE,
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm",
  },

  // Logging
  logging: {
    level: config.NEXT_PUBLIC_LOG_LEVEL,
    enableConsole: config.NEXT_PUBLIC_ENABLE_DEBUG,
  },

  // API configuration
  api: {
    timeout: 30000,
    retries: 3,
    baseUrl: config.NEXT_PUBLIC_APP_URL,
  },

  // UI configuration
  ui: {
    itemsPerPage: 10,
    maxItemsPerPage: 100,
    debounceDelay: 300,
    toastDuration: 5000,
  },

  // Security configuration
  security: {
    passwordMinLength: 8,
    sessionCookieName: "umscc-session",
    csrfTokenName: "umscc-csrf",
  },
}

// Export types
export type AppConfig = typeof appConfig
export type FeatureFlags = typeof appConfig.features
