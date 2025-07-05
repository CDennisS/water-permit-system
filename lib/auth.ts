import type { User, UserType } from "@/types"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Mock user data - in production this would come from a database
const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    userType: "permitting_officer",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    username: "admin",
    userType: "chairperson",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    username: "admin",
    userType: "catchment_manager",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    username: "admin",
    userType: "catchment_chairperson",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    username: "admin",
    userType: "permit_supervisor",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    username: "umsccict2025",
    userType: "ict",
    password: "umsccict2025",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export async function authenticateUser(username: string, password: string, userType: UserType): Promise<User | null> {
  // Mock authentication - in production this would verify against a database
  const user = mockUsers.find((u) => u.username === username && u.userType === userType)

  if (!user) return null

  // Check password based on user type
  if (userType === "ict" && password === "umsccict2025" && username === "umsccict2025") {
    return user
  } else if (userType !== "ict" && password === "admin" && username === "admin") {
    return user
  }

  return null
}

export function getUserTypeLabel(userType: UserType): string {
  const labels = {
    permitting_officer: "Permitting Officer",
    chairperson: "Upper Manyame Sub Catchment Council Chairperson",
    catchment_manager: "Manyame Catchment Manager",
    catchment_chairperson: "Manyame Catchment Chairperson",
    permit_supervisor: "Permit Supervisor",
    ict: "ICT Administrator",
  }
  return labels[userType]
}

// ICT User Permissions Check
export function hasICTPermissions(user: User): boolean {
  return user.userType === "ict"
}

// Check if user can perform any action (ICT can do everything)
export function canPerformAction(user: User, action: string): boolean {
  if (user.userType === "ict") return true

  // Define specific permissions for other users
  const permissions = {
    permitting_officer: [
      "create_application",
      "edit_application",
      "upload_documents",
      "view_applications",
      "print_permits",
    ],
    chairperson: ["review_applications", "add_comments", "view_applications"],
    catchment_manager: ["review_applications", "add_comments", "view_applications"],
    catchment_chairperson: ["review_applications", "add_comments", "view_applications"],
    permit_supervisor: ["view_applications", "print_permits", "manage_user_credentials", "print_rejection_comments"],
  }

  return permissions[user.userType]?.includes(action) || false
}

// Add a specific function to check permit printing permissions
export function canPrintPermits(user: User): boolean {
  const allowedUserTypes = ["permitting_officer", "permit_supervisor", "ict"]
  return allowedUserTypes.includes(user.userType)
}

// Add a function to check rejection comment printing permissions
export function canPrintRejectionComments(user: User): boolean {
  const allowedUserTypes = [
    "permitting_officer",
    "permit_supervisor",
    "ict",
    "chairperson",
    "catchment_manager",
    "catchment_chairperson",
  ]
  return allowedUserTypes.includes(user.userType)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "chairperson" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // This is a mock authentication.
        // In a real application, you'd validate against a database.
        if (credentials?.username === "chairperson" && credentials?.password === "password") {
          return {
            id: "1",
            name: "UMSCC Chairperson",
            email: "chairperson@umscc.gov.zw",
            role: "chairperson",
          }
        }
        // Add other roles like 'manager', 'officer' here
        if (credentials?.username === "manager" && credentials?.password === "password") {
          return {
            id: "2",
            name: "Catchment Manager",
            email: "manager@umscc.gov.zw",
            role: "manager",
          }
        }
        return null
      },
    }),
  ],
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
      if (session.user) {
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  // Using `trustHost` is recommended for Vercel deployments
  trustHost: true,
}
