import "@/lib/ensure-env"
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Route handler for all `/api/auth/*` requests (App Router).
 * Exports both GET and POST as required by NextAuth.
 */
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
