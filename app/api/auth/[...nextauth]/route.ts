import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Mock authentication - replace with real database lookup
        if (credentials?.username === "chairperson" && credentials?.password === "password") {
          return {
            id: "1",
            name: "Chairperson",
            email: "chairperson@umscc.gov.zw",
            role: "chairperson",
          }
        }
        if (credentials?.username === "officer" && credentials?.password === "password") {
          return {
            id: "2",
            name: "Permitting Officer",
            email: "officer@umscc.gov.zw",
            role: "officer",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
