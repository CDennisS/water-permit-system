import type { User, UserType } from "@/types"

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
    permitting_officer: ["create_application", "edit_application", "upload_documents", "view_applications"],
    chairperson: ["review_applications", "add_comments", "view_applications"],
    catchment_manager: ["review_applications", "add_comments", "view_applications"],
    catchment_chairperson: ["review_applications", "add_comments", "view_applications"],
    permit_supervisor: ["view_applications", "print_permits", "manage_user_credentials"],
  }

  return permissions[user.userType]?.includes(action) || false
}
