import { db } from "@/lib/database"
import type { User, UserType } from "@/types"

/* -------------------------------------------------------------------------- */
/*                            USER LOOK-UP & HELPERS                          */
/* -------------------------------------------------------------------------- */

/**
 * Validate a username / password / role combo against the mock DB.
 * In production you would replace this with a real SQL / Supabase query.
 */
export async function authenticateUser(username: string, password: string, userType: UserType): Promise<User | null> {
  const user = await db.getUserByCredentials(username, password)

  if (!user) return null
  if (user.userType !== userType) return null

  return user
}

export function getUserTypeLabel(userType: UserType): string {
  const labels: Record<UserType, string> = {
    permitting_officer: "Permitting Officer",
    chairperson: "Upper Manyame Sub-Catchment Council Chairperson",
    catchment_manager: "Manyame Catchment Manager",
    catchment_chairperson: "Manyame Catchment Chairperson",
    permit_supervisor: "Permit Supervisor",
    ict: "ICT Administrator",
  }
  return labels[userType]
}

/** ICT has every permission. */
export function hasICTPermissions(user: User): boolean {
  return user.userType === "ict"
}
