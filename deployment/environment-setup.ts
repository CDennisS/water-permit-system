// Environment variable setup and validation
export const ENVIRONMENT_VARIABLES = {
  // Already configured
  LOG_LEVEL: "info", // ✅ Set

  // Remaining variables to configure
  ENABLE_MONITORING: "true", // Enable system monitoring
  RATE_LIMIT_WINDOW_MS: "900000", // 15 minutes in milliseconds
  RATE_LIMIT_MAX_REQUESTS: "100", // Max 100 requests per 15 minutes

  // Security recommendations
  SECURITY_HEADERS: "true",
  CORS_ENABLED: "false",
}

// Complete environment variable checklist
export const ENV_CHECKLIST = {
  // Database (Required)
  NEXT_PUBLIC_SUPABASE_URL: "https://your-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "your-service-role-key",

  // Authentication (Required)
  JWT_SECRET: "your-super-secret-jwt-key-minimum-32-characters",

  // File Storage (Required)
  BLOB_READ_WRITE_TOKEN: "your-vercel-blob-token",

  // Application (Required)
  NEXT_PUBLIC_APP_URL: "https://your-app.vercel.app",

  // Email (Optional but recommended)
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "your-email@gmail.com",
  SMTP_PASSWORD: "your-app-password",
  SMTP_FROM: "noreply@umscc.co.zw",

  // System Configuration
  NODE_ENV: "production",
  LOG_LEVEL: "info",
  ENABLE_MONITORING: "true",
  RATE_LIMIT_WINDOW_MS: "900000",
  RATE_LIMIT_MAX_REQUESTS: "100",
}
