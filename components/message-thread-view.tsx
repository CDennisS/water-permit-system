"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Clock, CheckCircle, ArrowLeft } from "lucide-react"
import type { Message, User } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface MessageThreadViewProps {
  user: User
  otherUserId: string
  onBack: () => void
}

export function MessageThreadView({ user, otherUserId, onBack }: MessageThreadViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadThread()
    loadOtherUser()
  }, [otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadThread = async () => {
    try {
      const allMessages = await db.getMessages(user.id, false)
      const threadMessages = allMessages
        .filter(
          (msg) =>
            (msg.senderId === user.id && msg.receiverId === otherUserId) ||
            (msg.senderId === otherUserId && msg.receiverId === user.id),
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      setMessages(threadMessages)

      // Mark messages as read
      const unreadMessages = threadMessages.filter((msg) => msg.senderId === otherUserId && !msg.readAt)

      for (const message of unreadMessages) {
        await db.markMessageAsRead(message.id)
      }
    } catch (error) {
      console.error("Failed to load thread:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOtherUser = async () => {
    try {
      const users = await db.getUsers()
      const user = users.find((u) => u.id === otherUserId)
      setOtherUser(user || null)
    } catch (error) {
      console.error("Failed to load other user:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await db.sendMessage({
        senderId: user.id,
        receiverId: otherUserId,
        content: newMessage.trim(),
        isPublic: false,
      })

      setNewMessage("")
      loadThread()
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const formatMessageTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes < 1 ? "Just now" : `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getUserInitials = (userType: string) => {
    const labels = getUserTypeLabel(userType as any)
    return labels
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm">{getUserInitials(otherUser?.userType || "")}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
              {otherUser ? getUserTypeLabel(otherUser.userType) : "Unknown User"}
            </CardTitle>
            <p className="text-sm text-gray-500">{otherUser?.username || otherUserId}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isFromMe = message.senderId === user.id

              return (
                <div key={message.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      isFromMe ? "bg-blue-500 text-white" : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap mb-1">{message.content}</p>
                    <div
                      className={`flex items-center justify-between text-xs ${
                        isFromMe ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatMessageTime(message.createdAt)}
                      </span>
                      {isFromMe && message.readAt && <CheckCircle className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="space-y-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</span>
              <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="flex items-center">
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
