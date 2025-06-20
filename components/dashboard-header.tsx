"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Bell, MessageSquare } from "lucide-react"
import type { User as UserType } from "@/types"
import { getUserTypeLabel } from "@/lib/auth"
import { useState, useEffect } from "react"
import { db } from "@/lib/database"

interface DashboardHeaderProps {
  user: UserType
  onLogout: () => void
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnreadCount()
    // Set up interval to check for new messages every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  const loadUnreadCount = async () => {
    const publicMsgs = await db.getMessages(user.id, true)
    const privateMsgs = await db.getMessages(user.id, false)

    const unreadPublic = publicMsgs.filter((msg) => msg.senderId !== user.id && !msg.readAt).length

    const unreadPrivate = privateMsgs.filter((msg) => msg.senderId !== user.id && !msg.readAt).length

    setUnreadCount(unreadPublic + unreadPrivate)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">UM</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900">UMSCC Permit Management System</h1>
            <p className="text-sm text-gray-600">Upper Manyame Sub Catchment Council</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>

          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>

          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <div className="text-right">
              <Badge variant="secondary" className="text-xs">
                {getUserTypeLabel(user.userType)}
              </Badge>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
