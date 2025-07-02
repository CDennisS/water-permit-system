import "@/lib/ensure-env" // 🛡️ first – guarantees NEXTAUTH_URL is safe

import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions, User } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "your.username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials) return null

        // 📝 Replace with real DB lookup
        const { username, password } = credentials
        if (username === "admin" && password === "admin") {
          return { id: "1", name: "Admin", email: "admin@example.com" }
        }

        return null
      },
    }),
  ],

  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
}

// Helper you can import inside Server Components / Route Handlers
export function auth() {
  return getServerSession(authOptions)
}
