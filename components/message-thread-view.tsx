"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Send, ArrowLeft, Eye, EyeOff, Edit3, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User, Message } from "@/types"

interface MessageThreadViewProps {
  currentUser: User
  otherUser: User
  messages: Message[]
  onSendMessage: (message: Omit<Message, "id" | "timestamp" | "isRead">) => void
  onMarkAsRead: (messageId: string) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  onBack: () => void
}

const USER_TYPE_COLORS = {
  ICT: "bg-blue-500",
  "Permitting Officer": "bg-green-500",
  "Permit Supervisor": "bg-purple-500",
  "Catchment Manager": "bg-orange-500",
  "Catchment Chairperson": "bg-red-500",
  Applicant: "bg-gray-500",
}

const MAX_MESSAGE_LENGTH = 500

export function MessageThreadView({
  currentUser,
  otherUser,
  messages,
  onSendMessage,
  onMarkAsRead,
  onEditMessage,
  onDeleteMessage,
  onBack,
}: MessageThreadViewProps) {
  const [newMessage, setNewMessage] = useState<string>("")
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>("")
  const [isSending, setIsSending] = useState<boolean>(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Mark unread messages as read when component mounts
  useEffect(() => {
    const unreadMessages = messages.filter((msg) => msg.recipientId === currentUser.id && !msg.isRead)

    unreadMessages.forEach((msg) => {
      onMarkAsRead(msg.id)
    })
  }, [messages, currentUser.id, onMarkAsRead])

  // Get user initials for avatar
  const getUserInitials = useCallback((user: User): string => {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }, [])

  // Get user type color
  const getUserTypeColor = useCallback((userType: string): string => {
    return USER_TYPE_COLORS[userType as keyof typeof USER_TYPE_COLORS] || "bg-gray-500"
  }, [])

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }, [])

  // Handle sending message
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!newMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message before sending.",
        variant: "destructive",
      })
      return
    }

    if (newMessage.length > MAX_MESSAGE_LENGTH) {
      toast({
        title: "Message Too Long",
        description: `Message must be ${MAX_MESSAGE_LENGTH} characters or less.`,
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
        type: "private",
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
  }, [newMessage, currentUser.id, otherUser.id, onSendMessage, toast])

  // Handle editing message
  const handleEditMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!editContent.trim() || !onEditMessage) return

      try {
        await onEditMessage(messageId, editContent.trim())
        setEditingMessage(null)
        setEditContent("")

        toast({
          title: "Message Updated",
          description: "Your message has been updated successfully.",
        })
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update message. Please try again.",
          variant: "destructive",
        })
      }
    },
    [editContent, onEditMessage, toast],
  )

  // Handle deleting message
  const handleDeleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!onDeleteMessage) return

      try {
        await onDeleteMessage(messageId)

        toast({
          title: "Message Deleted",
          description: "Message has been deleted successfully.",
        })
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete message. Please try again.",
          variant: "destructive",
        })
      }
    },
    [onDeleteMessage, toast],
  )

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

  // Sort messages by timestamp
  const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack} aria-label="Go back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar>
              <AvatarFallback className={`text-white ${getUserTypeColor(otherUser.userType)}`}>
                {getUserInitials(otherUser)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">{otherUser.name}</CardTitle>
              <Badge variant="outline" className="text-sm">
                {otherUser.userType}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {sortedMessages.length} messages
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 rounded-t-none rounded-b-none border-t-0 border-b-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {sortedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                sortedMessages.map((message, index) => {
                  const isFromCurrentUser = message.senderId === currentUser.id
                  const showTimestamp =
                    index === 0 ||
                    new Date(message.timestamp).getTime() - new Date(sortedMessages[index - 1].timestamp).getTime() >
                      300000 // 5 minutes

                  return (
                    <div key={message.id} className="space-y-2">
                      {showTimestamp && (
                        <div className="text-center">
                          <Separator className="my-2" />
                          <span className="text-xs text-gray-500 bg-white px-2">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                      )}

                      <div className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            isFromCurrentUser
                              ? "bg-blue-500 text-white"
                              : message.isRead
                                ? "bg-gray-100 text-gray-900"
                                : "bg-yellow-50 text-gray-900 border border-yellow-200"
                          }`}
                        >
                          {editingMessage === message.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="text-sm min-h-[60px]"
                                maxLength={MAX_MESSAGE_LENGTH}
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-xs opacity-75">
                                  {editContent.length}/{MAX_MESSAGE_LENGTH}
                                </span>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditMessage(message.id)}
                                    disabled={!editContent.trim()}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingMessage(null)
                                      setEditContent("")
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-2">
                                  {!message.isRead && message.recipientId === currentUser.id && (
                                    <EyeOff className="h-3 w-3 opacity-75" />
                                  )}
                                  {message.isRead && message.recipientId === currentUser.id && (
                                    <Eye className="h-3 w-3 opacity-75" />
                                  )}
                                  <span className="text-xs opacity-75">
                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

                                {isFromCurrentUser &&
                                  currentUser.userType === "ICT" &&
                                  (onEditMessage || onDeleteMessage) && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 opacity-75 hover:opacity-100"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {onEditMessage && (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEditingMessage(message.id)
                                              setEditContent(message.content)
                                            }}
                                          >
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                        )}
                                        {onDeleteMessage && (
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteMessage(message.id)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={3}
              className="resize-none"
              disabled={isSending}
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs ${newMessage.length > MAX_MESSAGE_LENGTH * 0.9 ? "text-orange-500" : "text-gray-500"}`}
                >
                  {newMessage.length}/{MAX_MESSAGE_LENGTH}
                </span>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending} size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MessageThreadView
