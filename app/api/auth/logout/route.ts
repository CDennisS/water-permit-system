import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"
import { ProductionDatabase } from "@/lib/production-database"
import { SecurityUtils } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      const user = AuthService.verifyToken(token)

      if (user) {
        // Log logout
        await ProductionDatabase.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Logout",
          details: "User logged out",
          ipAddress: SecurityUtils.getClientIP(request),
          userAgent: SecurityUtils.getUserAgent(request),
        })
      }
    }

    const response = NextResponse.json({ message: "Logged out successfully" })
    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    const response = NextResponse.json({ message: "Logged out" })
    response.cookies.delete("auth-token")
    return response
  }
}
