import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"
import { SecurityUtils } from "@/lib/security"
import { MonitoringService } from "@/lib/monitoring"
import { ProductionDatabase } from "@/lib/production-database"

export async function POST(request: NextRequest) {
  try {
    const { username, password, userType } = await request.json()

    // Input validation
    if (!username || !password || !userType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedUsername = SecurityUtils.sanitizeInput(username)
    const sanitizedUserType = SecurityUtils.sanitizeInput(userType)

    // Rate limiting
    const clientIP = SecurityUtils.getClientIP(request)
    if (!AuthService.checkRateLimit(clientIP)) {
      await SecurityUtils.logSecurityEvent(
        "Login Rate Limit Exceeded",
        `IP ${clientIP} exceeded login rate limit`,
        "medium",
        request,
      )
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
    }

    // Authenticate user
    const authResult = await AuthService.authenticate({
      username: sanitizedUsername,
      password,
      userType: sanitizedUserType as any,
    })

    if (!authResult) {
      await SecurityUtils.logSecurityEvent(
        "Failed Login Attempt",
        `Failed login for username: ${sanitizedUsername}, userType: ${sanitizedUserType}`,
        "low",
        request,
      )
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Log successful login
    await ProductionDatabase.addLog({
      userId: authResult.user.id,
      userType: authResult.user.userType,
      action: "Login",
      details: `User logged in successfully`,
      ipAddress: clientIP,
      userAgent: SecurityUtils.getUserAgent(request),
    })

    // Set secure cookie
    const response = NextResponse.json({
      user: authResult.user,
      message: "Login successful",
    })

    const token = await AuthService.generateToken(authResult.user)

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    MonitoringService.recordError(error as Error, "login")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
