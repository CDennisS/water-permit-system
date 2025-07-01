"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { User } from "@/types"

interface LoginFormProps {
  onLogin: (user: User) => void
}

// Mock users for testing
const mockUsers: User[] = [
  {
    id: "1",
    username: "officer1",
    userType: "permitting_officer",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    username: "supervisor1",
    userType: "permit_supervisor",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    username: "manager1",
    userType: "catchment_manager",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    username: "chair1",
    userType: "chairperson",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    username: "ict1",
    userType: "ict",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const user = mockUsers.find((u) => u.username === username)
      if (user && password === "password") {
        onLogin(user)
      } else {
        setError("Invalid username or password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">UMSCC Login</CardTitle>
          <CardDescription>Upper Manyame Sub Catchment Council</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <div className="mt-4 text-sm text-gray-600">
            <p>Demo accounts:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>officer1 / password (Permitting Officer)</li>
              <li>supervisor1 / password (Supervisor)</li>
              <li>manager1 / password (Manager)</li>
              <li>chair1 / password (Chairperson)</li>
              <li>ict1 / password (ICT)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
