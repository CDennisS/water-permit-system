import rateLimit from "express-rate-limit"
import type { NextRequest } from "next/server"

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = createRateLimit(15 * 60 * 1000, 5)

// API rate limiter - 100 requests per 15 minutes
export const apiLimiter = createRateLimit(15 * 60 * 1000, 100)

// File upload rate limiter - 10 uploads per hour
export const uploadLimiter = createRateLimit(60 * 60 * 1000, 10)

// Input validation and sanitization
export class SecurityUtils {
  // Sanitize input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim()
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate phone number
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
  }

  // Check password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Get client IP address
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")

    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }

    if (realIP) {
      return realIP
    }

    return request.ip || "unknown"
  }

  // Get user agent
  static getUserAgent(request: NextRequest): string {
    return request.headers.get("user-agent") || "unknown"
  }

  // Generate secure random string
  static generateSecureToken(length = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
  }

  // Validate GPS coordinates
  static validateGPSCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  }

  // Sanitize filename
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_")
      .substring(0, 255)
  }

  // Check for SQL injection patterns
  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
    ]

    return sqlPatterns.some((pattern) => pattern.test(input))
  }

  // Log security event
  static async logSecurityEvent(
    event: string,
    details: string,
    severity: "low" | "medium" | "high" | "critical",
    request?: NextRequest,
  ): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity,
      ip: request ? this.getClientIP(request) : "unknown",
      userAgent: request ? this.getUserAgent(request) : "unknown",
    }

    // In production, send to security monitoring service
    console.warn("[SECURITY EVENT]", logData)

    // Send critical events via email
    if (severity === "critical") {
      // Import EmailService dynamically to avoid circular dependencies
      const { EmailService } = await import("./email-service")
      await EmailService.sendSystemAlert(
        `Critical Security Event: ${event}`,
        `${details}\n\nIP: ${logData.ip}\nUser Agent: ${logData.userAgent}`,
        "error",
      )
    }
  }
}

// Middleware for request validation
export function validateRequest(request: NextRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for common attack patterns in URL
  const url = request.url.toLowerCase()
  const suspiciousPatterns = [
    "script",
    "javascript",
    "vbscript",
    "onload",
    "onerror",
    "../",
    "..\\",
    "union+select",
    "drop+table",
  ]

  for (const pattern of suspiciousPatterns) {
    if (url.includes(pattern)) {
      errors.push(`Suspicious pattern detected: ${pattern}`)
    }
  }

  // Check request size
  const contentLength = request.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) {
    errors.push("Request too large")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
