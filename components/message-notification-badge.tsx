"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import type { Message, User } from "@/types"

interface MessageNotificationBadgeProps {
  messages: Message[]
  currentUser: User
  className?: string
}

export function MessageNotificationBadge({ messages, currentUser, className = "" }: MessageNotificationBadgeProps) {
  // Calculate unread message count for current user
  const unreadCount = useMemo(() => {
    return messages.filter((message) => message.recipientId === currentUser.id && !message.isRead).length
  }, [messages, currentUser.id])

  if (unreadCount === 0) {
    return (
      <div className={`relative ${className}`}>
        <Bell className="h-5 w-5 text-gray-600" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Bell className="h-5 w-5 text-gray-600" />
      <Badge
        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
        variant="destructive"
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    </div>
  )
}
