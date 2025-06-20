"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, X } from "lucide-react"

interface UnreadMessageNotificationProps {
  unreadCount: number
  onViewMessages: () => void
  onDismiss?: () => void
  className?: string
}

export function UnreadMessageNotification({
  unreadCount,
  onViewMessages,
  onDismiss,
  className = "",
}: UnreadMessageNotificationProps) {
  if (unreadCount === 0) return null

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">
                {unreadCount === 1 ? "You have 1 unread message" : `You have ${unreadCount} unread messages`}
              </h3>
              <p className="text-sm text-blue-700">Click to view your messages and notifications</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onViewMessages} size="sm" className="bg-blue-600 hover:bg-blue-700">
              View Messages
            </Button>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
