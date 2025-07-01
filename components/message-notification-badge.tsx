"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { db } from "@/lib/database"
import type { User } from "@/types"

interface MessageNotificationBadgeProps {
  user: User
  className?: string
}

export function MessageNotificationBadge({ user, className = "" }: MessageNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        const publicMessages = await db.getMessages(user.id, true)
        const privateMessages = await db.getMessages(user.id, false)

        const unreadPublic = publicMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length

        const unreadPrivate = privateMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length

        setUnreadCount(unreadPublic + unreadPrivate)
      } catch (error) {
        console.error("Failed to check unread messages:", error)
      }
    }

    checkUnreadMessages()

    // Check for new messages every 30 seconds
    const interval = setInterval(checkUnreadMessages, 30000)

    return () => clearInterval(interval)
  }, [user.id])

  if (unreadCount === 0) {
    return (
      <div className={`relative ${className}`}>
        <Bell className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Bell className="h-5 w-5" />
      <Badge
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    </div>
  )
}
