import { db } from "@/lib/database"

/**
 * Delete a permit application by its internal ID.
 * Returns `true` when the application existed and was removed,
 * otherwise `false`.
 *
 * Throws on database errors.
 */
export async function deleteApplication(applicationId: string): Promise<boolean> {
  if (!applicationId) {
    throw new Error("deleteApplication: applicationId is required")
  }

  // db.deleteApplication is assumed to be provided by lib/database.ts.
  // Fall back to a simple SQL call if your implementation differs.
  const deleted = await db.deleteApplication(applicationId)

  return Boolean(deleted)
}
