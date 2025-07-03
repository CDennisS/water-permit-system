import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Mock authentication - replace with real authentication logic
        if (credentials?.username === "chairperson" && credentials?.password === "password") {
          return {
            id: "1",
            name: "Chairperson",
            email: "chairperson@umscc.gov.zw",
            role: "chairperson",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
