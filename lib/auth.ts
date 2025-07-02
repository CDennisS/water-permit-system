import "@/lib/ensure-env" // 🛡️ Must be first import to prevent Invalid URL errors

import { getServerSession } from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions, User } from "next-auth"
import type { UserType } from "@/types"

// Import existing authentication functions
import { authenticateUser, getUserTypeLabel } from "@/lib/auth"

// Extend NextAuth User type to include our custom fields
declare module "next-auth" {
  interface User {
    id: string
    username: string
    userType: UserType
    userTypeLabel: string
  }

  interface Session {
    user: {
      id: string
      username: string
      userType: UserType
      userTypeLabel: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    userType: UserType
    userTypeLabel: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "UMSCC Permit System",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
        userType: {
          label: "User Type",
          type: "select",
          placeholder: "Select your role",
        },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.username || !credentials?.password || !credentials?.userType) {
          return null
        }

        try {
          // Use existing authentication system
          const user = await authenticateUser(
            credentials.username,
            credentials.password,
            credentials.userType as UserType,
          )

          if (!user) {
            return null
          }

          // Return user data in NextAuth format
          return {
            id: user.id,
            username: user.username,
            userType: user.userType,
            userTypeLabel: getUserTypeLabel(user.userType),
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  callbacks: {
    async jwt({ token, user }) {
      // Persist user data in JWT token
      if (user) {
        token.id = user.id
        token.username = user.username
        token.userType = user.userType
        token.userTypeLabel = user.userTypeLabel
      }
      return token
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user = {
          id: token.id,
          username: token.username,
          userType: token.userType,
          userTypeLabel: token.userTypeLabel,
        }
      }
      return session
    },
  },

  events: {
    async signIn({ user, account, profile }) {
      console.log(`User ${user.username} (${user.userTypeLabel}) signed in`)
    },
    async signOut({ session, token }) {
      console.log(`User signed out`)
    },
  },
}

// Helper function to get server session with proper typing
export async function getAuthSession() {
  return await getServerSession(authOptions)
}

// Helper function to get current user
export async function getCurrentUser() {
  const session = await getAuthSession()
  return session?.user || null
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const session = await getAuthSession()
  return !!session?.user
}

// Helper function to check user permissions
export async function hasPermission(requiredUserType: UserType | UserType[]) {
  const user = await getCurrentUser()
  if (!user) return false

  // ICT users have all permissions
  if (user.userType === "ict") return true

  const allowedTypes = Array.isArray(requiredUserType) ? requiredUserType : [requiredUserType]
  return allowedTypes.includes(user.userType)
}

// Helper function to require authentication (throws if not authenticated)
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

// Helper function to require specific user type
export async function requireUserType(requiredUserType: UserType | UserType[]) {
  const user = await requireAuth()
  const hasAccess = await hasPermission(requiredUserType)

  if (!hasAccess) {
    throw new Error(
      `Access denied. Required user type: ${Array.isArray(requiredUserType) ? requiredUserType.join(", ") : requiredUserType}`,
    )
  }

  return user
}
