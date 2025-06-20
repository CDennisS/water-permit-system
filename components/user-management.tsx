"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Key, Users, Save, X } from "lucide-react"
import type { User as UserType } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface UserManagementProps {
  currentUser: UserType
}

interface EditingUser {
  id: string
  username: string
  password: string
  confirmPassword: string
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const allUsers = await db.getUsers()

      // Filter out ICT users for Permit Supervisor
      const filteredUsers =
        currentUser.userType === "permit_supervisor" ? allUsers.filter((user) => user.userType !== "ict") : allUsers

      setUsers(filteredUsers)
    } catch (error) {
      console.error("Failed to load users:", error)
      setError("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = (user: UserType) => {
    // Prevent editing ICT users
    if (user.userType === "ict" && currentUser.userType === "permit_supervisor") {
      setError("You do not have permission to edit ICT Administrator accounts")
      return
    }

    setEditingUser({
      id: user.id,
      username: user.username,
      password: "",
      confirmPassword: "",
    })
    setIsDialogOpen(true)
    setError("")
    setSuccess("")
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    // Validation
    if (!editingUser.username.trim()) {
      setError("Username is required")
      return
    }

    if (editingUser.password && editingUser.password !== editingUser.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (editingUser.password && editingUser.password.length < 4) {
      setError("Password must be at least 4 characters")
      return
    }

    // Check for duplicate username (excluding current user)
    const existingUser = users.find((u) => u.username === editingUser.username && u.id !== editingUser.id)
    if (existingUser) {
      setError("Username already exists")
      return
    }

    try {
      // Update user credentials only
      const updateData: Partial<UserType> = {
        username: editingUser.username,
      }

      // Add password to update if provided
      if (editingUser.password) {
        updateData.password = editingUser.password
      }

      await db.updateUser(editingUser.id, updateData)

      await db.addLog({
        userId: currentUser.id,
        userType: currentUser.userType,
        action: "Updated User Credentials",
        details: `Updated login credentials for user ${editingUser.username}`,
      })

      setSuccess("User credentials updated successfully")
      loadUsers()
      setIsDialogOpen(false)
      setEditingUser(null)
      setError("")
    } catch (error) {
      console.error("Failed to save user:", error)
      setError("Failed to save user")
    }
  }

  const handleResetPassword = async (user: UserType) => {
    // Prevent resetting ICT passwords
    if (user.userType === "ict" && currentUser.userType === "permit_supervisor") {
      setError("You do not have permission to reset ICT Administrator passwords")
      return
    }

    const newPassword = prompt(`Enter new password for ${user.username}:`)
    if (!newPassword) return

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters")
      return
    }

    try {
      await db.updateUser(user.id, { password: newPassword })

      await db.addLog({
        userId: currentUser.id,
        userType: currentUser.userType,
        action: "Reset Password",
        details: `Reset password for user ${user.username}`,
      })

      setSuccess(`Password reset for ${user.username}`)
    } catch (error) {
      console.error("Failed to reset password:", error)
      setError("Failed to reset password")
    }
  }

  const getUserTypeBadgeColor = (userType: string) => {
    const colors = {
      permitting_officer: "bg-blue-100 text-blue-800",
      chairperson: "bg-green-100 text-green-800",
      catchment_manager: "bg-purple-100 text-purple-800",
      catchment_chairperson: "bg-red-100 text-red-800",
      permit_supervisor: "bg-yellow-100 text-yellow-800",
      ict: "bg-gray-100 text-gray-800",
    }
    return colors[userType as keyof typeof colors]
  }

  const canEditUser = (user: UserType) => {
    // Cannot edit ICT users
    if (user.userType === "ict" && currentUser.userType === "permit_supervisor") {
      return false
    }
    return true
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Users className="h-6 w-6 mr-2" />
            User Credential Management
          </h2>
          <p className="text-gray-600 mt-1">
            {currentUser.userType === "permit_supervisor"
              ? "Manage user login credentials (username and password only)"
              : "Manage system users, passwords, and permissions"}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Restrictions Notice for Permit Supervisor */}
      {currentUser.userType === "permit_supervisor" && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Restricted Access:</strong> You can only edit usernames and passwords. User types cannot be changed
            and ICT Administrator accounts are not accessible.
          </AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                    {user.id === currentUser.id && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getUserTypeBadgeColor(user.userType)}>{getUserTypeLabel(user.userType)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{user.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm text-gray-600">{user.updatedAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {canEditUser(user) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit credentials"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                            title="Reset password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {!canEditUser(user) && <span className="text-sm text-gray-400">No access</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Edit User Credentials
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                <Input
                  id="password"
                  type="password"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>

              {editingUser.password && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={editingUser.confirmPassword}
                    onChange={(e) => setEditingUser({ ...editingUser, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingUser(null)
                    setError("")
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Credentials
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
