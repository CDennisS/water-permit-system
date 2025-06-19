import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AuthService } from "./lib/auth-service"
import { SecurityUtils, validateRequest } from "./lib/security"
import { MonitoringService } from "./lib/monitoring"

export async function middleware(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Validate request for security threats
    const validation = validateRequest(request)
    if (!validation.isValid) {
      SecurityUtils.logSecurityEvent(
        "Malicious Request Blocked",
        `Blocked request: ${validation.errors.join(", ")}`,
        "high",
        request,
      )
      return new NextResponse("Bad Request", { status: 400 })
    }

    // Rate limiting check
    const clientIP = SecurityUtils.getClientIP(request)
    if (!AuthService.checkRateLimit(clientIP)) {
      SecurityUtils.logSecurityEvent("Rate Limit Exceeded", `IP ${clientIP} exceeded rate limit`, "medium", request)
      return new NextResponse("Too Many Requests", { status: 429 })
    }

    // Check authentication for protected routes
    const { pathname } = request.nextUrl
    const isProtectedRoute = !pathname.startsWith("/api/auth") && pathname !== "/"

    if (isProtectedRoute) {
      const token = request.cookies.get("auth-token")?.value

      const user = token ? await AuthService.verifyToken(token) : null
      if (!user) {
        return NextResponse.redirect(new URL("/", request.url))
      }

      // Add user info to headers for API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", user.id)
      requestHeaders.set("x-user-type", user.userType)

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

      // Record performance metrics
      const responseTime = Date.now() - startTime
      MonitoringService.recordMetrics({
        responseTime,
        activeUsers: 1, // This would be tracked more accurately in production
      })

      return response
    }

    return NextResponse.next()
  } catch (error) {
    MonitoringService.recordError(error as Error, "middleware")
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
