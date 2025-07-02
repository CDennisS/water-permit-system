import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export interface AuthUser {
  id: string
  username: string
  role: string
}

/**
 * Singleton Supabase admin client (server-side only)
 */
const supabaseAdmin = (() => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server")
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch },
  })
})()

/**
 * Finds a user by username & verifies password using bcrypt.
 * Returns `null` if user not found or password mismatch.
 */
export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, password_hash, role")
    .eq("username", username)
    .single()

  if (error || !data) return null

  const ok = await bcrypt.compare(password, data.password_hash)
  if (!ok) return null

  return { id: data.id, username: data.username, role: data.role }
}
