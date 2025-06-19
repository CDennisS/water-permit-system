import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { createServerClient } from "./supabase"
import type { UserType } from "@/types"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"
const secretKey = new TextEncoder().encode(JWT_SECRET) // Uint8Array for jose
const JWT_EXPIRES_IN = "7d"

export interface AuthUser {
  id: string
  username: string
  email: string
  userType: UserType
  isActive: boolean
}

export interface LoginCredentials {
  username: string
  password: string
  userType: UserType
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Generate JWT token
  static async generateToken(user: AuthUser): Promise<string> {
    return await new SignJWT({
      id: user.id,
      username: user.username,
      email: user.email,
      userType: user.userType,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secretKey)
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const { payload } = await jwtVerify(token, secretKey)
      return {
        id: payload.id as string,
        username: payload.username as string,
        email: payload.email as string,
        userType: payload.userType as UserType,
        isActive: true,
      }
    } catch {
      return null
    }
  }

  // Authenticate user
  static async authenticate(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string } | null> {
    const serverClient = createServerClient()

    try {
      const { data: user, error } = await serverClient
        .from("users")
        .select("*")
        .eq("username", credentials.username)
        .eq("user_type", credentials.userType)
        .eq("is_active", true)
        .single()

      if (error || !user) {
        return null
      }

      const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash)
      if (!isValidPassword) {
        return null
      }

      // Update last login
      await serverClient.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.user_type as UserType,
        isActive: user.is_active,
      }

      const token = await this.generateToken(authUser)

      return { user: authUser, token }
    } catch (error) {
      console.error("Authentication error:", error)
      return null
    }
  }

  // Create new user
  static async createUser(userData: {
    username: string
    email: string
    password: string
    userType: UserType
  }): Promise<AuthUser | null> {
    const serverClient = createServerClient()

    try {
      const passwordHash = await this.hashPassword(userData.password)

      const { data: user, error } = await serverClient
        .from("users")
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: passwordHash,
          user_type: userData.userType,
        })
        .select()
        .single()

      if (error || !user) {
        return null
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.user_type as UserType,
        isActive: user.is_active,
      }
    } catch (error) {
      console.error("User creation error:", error)
      return null
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<AuthUser | null> {
    const serverClient = createServerClient()

    try {
      const { data: user, error } = await serverClient
        .from("users")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single()

      if (error || !user) {
        return null
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.user_type as UserType,
        isActive: user.is_active,
      }
    } catch (error) {
      console.error("Get user error:", error)
      return null
    }
  }

  // Rate limiting for login attempts
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

  static checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.loginAttempts.get(identifier)

    if (!attempts) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now })
      return true
    }

    // Reset if more than 15 minutes have passed
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now })
      return true
    }

    // Allow up to 5 attempts per 15 minutes
    if (attempts.count >= 5) {
      return false
    }

    attempts.count++
    attempts.lastAttempt = now
    return true
  }
}
