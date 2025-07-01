"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send, MessageCircle, Clock, CheckCircle2 } from "lucide-react"
import type { User, Message } from "@/types"

interface MessageThreadViewProps {
  currentUser: User
  otherUser: User
  messages: Message[]
  onSendMessage: (message: Omit<Message, "id" | "timestamp" | "isRead">) => void
  onMarkAsRead?: (messageId: string) => void
  onBack: () => void
}

const MESSAGE_CHAR_LIMIT = 500

// User type color mapping for avatars
const getUserTypeColor = (userType: string): string => {
  const colors = {
    applicant: "bg-blue-500",
    permitting_officer: "bg-green-500",
    permit_supervisor: "bg-purple-500",
    catchment_manager: "bg-orange-500",
    catchment_chairperson: "bg-red-500",
    ict: "bg-gray-800",
  }
  return colors[userType as keyof typeof colors] || "bg-gray-500"
}

// Get user initials for avatar
const getUserInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function MessageThreadView({
  currentUser,
  otherUser,
  messages,
  onSendMessage,
  onMarkAsRead,
  onBack,
}: MessageThreadViewProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  // Filter and sort messages for this conversation
  const conversationMessages = useMemo(() => {
    return messages
      .filter(
        (message) =>
          (message.senderId === currentUser.id && message.recipientId === otherUser.id) ||
          (message.senderId === otherUser.id && message.recipientId === currentUser.id),
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [messages, currentUser.id, otherUser.id])

  // Mark unread messages as read when component mounts or messages change
  useEffect(() => {
    if (onMarkAsRead) {
      const unreadMessages = conversationMessages.filter(
        (message) => message.recipientId === currentUser.id && !message.isRead,
      )

      unreadMessages.forEach((message) => {
        onMarkAsRead(message.id)
      })
    }
  }, [conversationMessages, currentUser.id, onMarkAsRead])

  // Handle sending message
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!newMessage.trim() || isSending) return

    if (newMessage.length > MESSAGE_CHAR_LIMIT) {
      toast({
        title: "Message Too Long",
        description: `Message must be ${MESSAGE_CHAR_LIMIT} characters or less.`,
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      await onSendMessage({
        senderId: currentUser.id,
        recipientId: otherUser.id,
        content: newMessage.trim(),
        subject: `Message from ${currentUser.name}`,
        priority: "normal",
      })

      setNewMessage("")

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      })
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }, [newMessage, isSending, currentUser, otherUser, onSendMessage, toast])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  // Character count
  const remainingChars = MESSAGE_CHAR_LIMIT - newMessage.length
  const isOverLimit = remainingChars < 0

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Avatar className="h-8 w-8">
              <AvatarFallback className={`text-white ${getUserTypeColor(otherUser.userType)}`}>
                {getUserInitials(otherUser.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <CardTitle className="text-lg">{otherUser.name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {otherUser.userType.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {conversationMessages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500">Start the conversation by sending a message below</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversationMessages.map((message, index) => {
                  const isFromCurrentUser = message.senderId === currentUser.id
                  const sender = isFromCurrentUser ? currentUser : otherUser

                  return (
                    <div key={message.id} className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-2 max-w-[70%] ${isFromCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className={`text-white text-xs ${getUserTypeColor(sender.userType)}`}>
                            {getUserInitials(sender.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className={`flex flex-col ${isFromCurrentUser ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              isFromCurrentUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>

                          <div
                            className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isFromCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>{new Date(message.timestamp).toLocaleString()}</span>
                            {message.isRead && isFromCurrentUser && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Message Input */}
          <div className="p-4 space-y-3">
            <Textarea
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`min-h-[80px] resize-none ${isOverLimit ? "border-red-500" : ""}`}
              disabled={isSending}
            />

            <div className="flex justify-between items-center">
              <div className={`text-sm ${isOverLimit ? "text-red-500" : "text-gray-500"}`}>
                {remainingChars} characters remaining
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending || isOverLimit}
                size="sm"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
