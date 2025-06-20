"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, MessageSquare, Bell, User } from "lucide-react"
import type { User as UserType } from "@/types"
import { getUserTypeLabel } from "@/lib/auth"
import { db } from "@/lib/database"

interface DashboardHeaderProps {
  user: UserType
  onLogout: () => void
  onMessagesClick?: () => void
}

export function DashboardHeader({ user, onLogout, onMessagesClick }: DashboardHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const publicMsgs = await db.getMessages(user.id, true)
        const privateMsgs = await db.getMessages(user.id, false)

        const unreadPublic = publicMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length
        const unreadPrivate = privateMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length

        setUnreadCount(unreadPublic + unreadPrivate)
      } catch (error) {
        console.error("Failed to load unread count:", error)
      }
    }

    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [user.id])

  const handleMessagesClick = () => {
    setUnreadCount(0) // Reset count when messages are accessed
    onMessagesClick?.()
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">UM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">UMSCC Permit Management</h1>
              <p className="text-sm text-gray-600">Upper Manyame Sub Catchment Council</p>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Unread Messages Notification */}
            {unreadCount > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Bell className="h-5 w-5 text-orange-600 animate-pulse" />
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        {unreadCount === 1 ? "1 unread message" : `${unreadCount} unread messages`}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMessagesClick}
                        className="text-orange-700 hover:text-orange-900 p-0 h-auto"
                      >
                        View Messages →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages Button */}
            <Button variant="ghost" size="sm" onClick={handleMessagesClick} className="relative" title="View Messages">
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-600">{getUserTypeLabel(user.userType)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>

            {/* Logout Button */}
            <Button variant="outline" onClick={onLogout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
