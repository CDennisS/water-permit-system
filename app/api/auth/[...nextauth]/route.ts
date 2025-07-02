import "@/lib/ensure-env" // Must be first to set NEXTAUTH_URL before NextAuth imports

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
