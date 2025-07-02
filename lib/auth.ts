"use server"

/**
 * IMPORTANT: patch environment first!
 * This must be the first import, otherwise `next-auth` will throw.
 */
import "@/lib/init-env"

import { getServerSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"

/**
 * Configure your NextAuth providers and callbacks here.
 * Feel free to extend as needed.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Extend / tighten as you wish
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
}

/**
 * Helper to fetch the server session everywhere in the app.
 */
export async function getAuthSession() {
  return getServerSession(authOptions)
}
