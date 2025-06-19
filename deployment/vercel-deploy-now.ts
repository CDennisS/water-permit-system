// Immediate deployment configuration for Vercel
export const VERCEL_DEPLOYMENT_CONFIG = {
  // Project settings
  project: {
    name: "umscc-permit-management",
    framework: "nextjs",
    buildCommand: "npm run build",
    outputDirectory: ".next",
    installCommand: "npm install",
    devCommand: "npm run dev",
  },

  // Environment variables for immediate deployment
  environmentVariables: {
    // Database (Supabase)
    NEXT_PUBLIC_SUPABASE_URL: "https://your-project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-anon-key-here",
    SUPABASE_SERVICE_ROLE_KEY: "your-service-role-key-here",

    // Authentication
    JWT_SECRET: "your-super-secret-jwt-key-minimum-32-characters-long",

    // File Storage (Vercel Blob)
    BLOB_READ_WRITE_TOKEN: "your-vercel-blob-token",

    // Application
    NEXT_PUBLIC_APP_URL: "https://your-app-name.vercel.app",

    // Logging & Monitoring
    LOG_LEVEL: "info",
    ENABLE_MONITORING: "true",

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: "900000",
    RATE_LIMIT_MAX_REQUESTS: "100",

    // Email (Optional - can be configured later)
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "your-email@gmail.com",
    SMTP_PASSWORD: "your-app-password",
    SMTP_FROM: "noreply@umscc.co.zw",
  },

  // Deployment regions
  regions: ["iad1"], // US East (closest to Zimbabwe)

  // Build settings
  build: {
    env: {
      NODE_ENV: "production",
    },
  },
}

// Pre-deployment checklist
export const PRE_DEPLOYMENT_CHECKLIST = [
  "✅ Database schema created and seeded",
  "✅ All code components implemented",
  "✅ Security measures in place",
  "✅ Environment variables prepared",
  "✅ Health checks configured",
  "✅ Error handling implemented",
  "✅ Production configuration ready",
]

// Post-deployment verification steps
export const POST_DEPLOYMENT_STEPS = [
  "1. Visit your deployed URL",
  "2. Check /api/health endpoint",
  "3. Test login with admin/admin123",
  "4. Verify database connection",
  "5. Test file upload functionality",
  "6. Send test email notification",
  "7. Create first permit application",
]
