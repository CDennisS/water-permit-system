"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import type { User, Message } from "@/types"

interface MessageNotificationBadgeProps {
  currentUser: User
  messages: Message[]
  className?: string
}

export function MessageNotificationBadge({ currentUser, messages, className = "" }: MessageNotificationBadgeProps) {
  // Calculate unread message count for current user
  const unreadCount = useMemo(() => {
    return messages.filter((message) => message.recipientId === currentUser.id && !message.isRead).length
  }, [messages, currentUser.id])

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
        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    </div>
  )
}

export default MessageNotificationBadge
