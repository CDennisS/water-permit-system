import "@/lib/ensure-env" // ← make NEXTAUTH_URL safe BEFORE NextAuth runs
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// --- Auth configuration ----------------------------------------------------
const authOptions = {
  trustHost: true, // ← NEW
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 🔐 Replace with real authentication logic
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
    signIn: "/", // custom sign-in page
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (token) (session.user as any).role = token.role
      return session
    },
  },
} satisfies Parameters<typeof NextAuth>[0]

// --- Route handler ---------------------------------------------------------
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
