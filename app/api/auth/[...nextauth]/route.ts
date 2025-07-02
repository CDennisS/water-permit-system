import "@/lib/ensure-env" // 🛡  MUST come before *any* `next-auth` import
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * NextAuth route-handler (App Router)
 *
 *   • Guarantees NEXTAUTH_URL is valid via `ensure-env`
 *   • Uses the centralised `authOptions` from `lib/auth.ts`
 *
 * Exported as both GET and POST to satisfy NextAuth’s requirements.
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
