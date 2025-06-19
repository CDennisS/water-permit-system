// Log level validation
function validateLogLevel(level: string): string {
  const validLevels = ["error", "warn", "info", "debug"]
  const normalizedLevel = level.toLowerCase()

  if (!validLevels.includes(normalizedLevel)) {
    console.warn(`Invalid LOG_LEVEL "${level}". Using default "info". Valid levels: ${validLevels.join(", ")}`)
    return "info"
  }

  return normalizedLevel
}

// Log level descriptions for reference
export const LOG_LEVEL_INFO = {
  error: "Only log errors (most restrictive, production recommended for minimal logging)",
  warn: "Log warnings and errors (good for production with moderate detail)",
  info: "Log info, warnings, and errors (recommended for production - balanced detail)",
  debug: "Log everything including debug info (development/troubleshooting only)",
}

// Production deployment configuration
export const PRODUCTION_CONFIG = {
  // Database Configuration
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    sessionDuration: "7d",
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    maxLoginAttempts: 5,
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || "noreply@umscc.co.zw",
  },

  // File Storage
  storage: {
    blobToken: process.env.BLOB_READ_WRITE_TOKEN,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
  },

  // Application Settings
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL,
    environment: process.env.NODE_ENV,
    logLevel: validateLogLevel(process.env.LOG_LEVEL || "info"),
    enableMonitoring: process.env.ENABLE_MONITORING === "true",
  },

  // Security
  security: {
    rateLimitWindowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    rateLimitMaxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
    enableSecurityHeaders: true,
    enableCORS: false,
  },
}

// Validate configuration
export function validateProductionConfig() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "BLOB_READ_WRITE_TOKEN",
    "NEXT_PUBLIC_APP_URL",
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  console.log("✅ Production configuration validated successfully")
  return true
}
