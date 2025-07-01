"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Search, Filter, MessageCircle, Eye, EyeOff, Edit3, Trash2, RefreshCw } from "lucide-react"
import type { User, Message } from "@/types"

interface RefinedMessagingSystemProps {
  currentUser: User
  users: User[]
  messages: Message[]
  onSendMessage: (message: Omit<Message, "id" | "timestamp" | "isRead">) => void
  onMarkAsRead: (messageId: string) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
}

interface MessageFilters {
  search: string
  userType: string
  dateRange: string
  isRead: string
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

export function RefinedMessagingSystem({
  currentUser,
  users,
  messages,
  onSendMessage,
  onMarkAsRead,
  onEditMessage,
  onDeleteMessage,
}: RefinedMessagingSystemProps) {
  const [newMessage, setNewMessage] = useState<string>("")
  const [selectedRecipient, setSelectedRecipient] = useState<string>("")
  const [filters, setFilters] = useState<MessageFilters>({
    search: "",
    userType: "all", // Updated default value
    dateRange: "all", // Updated default value
    isRead: "all", // Updated default value
  })
  const [isComposing, setIsComposing] = useState<boolean>(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>("")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { toast } = useToast()

  // Auto-refresh messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Get available recipients (exclude current user)
  const availableRecipients = useMemo(() => {
    return users.filter((user) => user.id !== currentUser.id)
  }, [users, currentUser.id])

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    const filtered = messages.filter((message) => {
      // Only show messages involving current user
      const isInvolved = message.senderId === currentUser.id || message.recipientId === currentUser.id

      if (!isInvolved) return false

      // Apply search filter
      if (filters.search && !message.content.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Apply user type filter
      if (filters.userType !== "all") {
        const sender = users.find((u) => u.id === message.senderId)
        const recipient = users.find((u) => u.id === message.recipientId)
        if (sender?.userType !== filters.userType && recipient?.userType !== filters.userType) {
          return false
        }
      }

      // Apply read status filter
      if (filters.isRead === "read" && !message.isRead) return false
      if (filters.isRead === "unread" && message.isRead) return false

      // Apply date range filter
      if (filters.dateRange !== "all") {
        const messageDate = new Date(message.timestamp)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (filters.dateRange) {
          case "today":
            if (daysDiff > 0) return false
            break
          case "week":
            if (daysDiff > 7) return false
            break
          case "month":
            if (daysDiff > 30) return false
            break
        }
      }

      return true
    })

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [messages, currentUser.id, users, filters])

  // Group messages by conversation
  const conversations = useMemo(() => {
    const convMap = new Map<string, Message[]>()

    filteredMessages.forEach((message) => {
      const otherUserId = message.senderId === currentUser.id ? message.recipientId : message.senderId
      const key = [currentUser.id, otherUserId].sort().join("-")

      if (!convMap.has(key)) {
        convMap.set(key, [])
      }
      convMap.get(key)!.push(message)
    })

    return Array.from(convMap.entries())
      .map(([key, msgs]) => {
        const otherUserId = key.split("-").find((id) => id !== currentUser.id)!
        const otherUser = users.find((u) => u.id === otherUserId)
        const unreadCount = msgs.filter((m) => m.recipientId === currentUser.id && !m.isRead).length

        return {
          key,
          otherUser,
          messages: msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          lastMessage: msgs[msgs.length - 1],
          unreadCount,
        }
      })
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())
  }, [filteredMessages, currentUser.id, users])

  // Get unread message count
  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.recipientId === currentUser.id && !m.isRead).length
  }, [messages, currentUser.id])

  // Handle sending message
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!newMessage.trim() || !selectedRecipient) {
      toast({
        title: "Invalid Message",
        description: "Please enter a message and select a recipient.",
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

    try {
      await onSendMessage({
        senderId: currentUser.id,
        recipientId: selectedRecipient,
        content: newMessage.trim(),
        type: "private",
      })

      setNewMessage("")
      setSelectedRecipient("")
      setIsComposing(false)

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
    }
  }, [newMessage, selectedRecipient, currentUser.id, onSendMessage, toast])

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

  // Handle marking messages as read
  const handleMarkAsRead = useCallback(
    (messageId: string): void => {
      onMarkAsRead(messageId)
    },
    [onMarkAsRead],
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

  // Get user avatar initials
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

    return date.toLocaleDateString()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header with stats and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Messages</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Last updated: {formatTimestamp(lastRefresh.toISOString())}</span>
          <Button variant="outline" size="sm" onClick={() => setLastRefresh(new Date())}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Messages</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User Type</label>
              <Select
                value={filters.userType}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, userType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All user types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All user types</SelectItem>
                  <SelectItem value="ICT">ICT</SelectItem>
                  <SelectItem value="Permitting Officer">Permitting Officer</SelectItem>
                  <SelectItem value="Permit Supervisor">Permit Supervisor</SelectItem>
                  <SelectItem value="Catchment Manager">Catchment Manager</SelectItem>
                  <SelectItem value="Catchment Chairperson">Catchment Chairperson</SelectItem>
                  <SelectItem value="Applicant">Applicant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Read Status</label>
              <Select
                value={filters.isRead}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, isRead: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All messages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All messages</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="read">Read only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compose Message Button */}
      <div className="flex justify-end">
        <Dialog open={isComposing} onOpenChange={setIsComposing}>
          <DialogTrigger asChild>
            <Button>
              <MessageCircle className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient</label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRecipients.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className={`text-xs text-white ${getUserTypeColor(user.userType)}`}>
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.userType}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={4}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>
                    {newMessage.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsComposing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || !selectedRecipient}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {conversations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-500 text-center">
                {Object.values(filters).some((f) => f !== "all")
                  ? "Try adjusting your filters to see more messages."
                  : "Start a conversation by sending your first message."}
              </p>
            </CardContent>
          </Card>
        ) : (
          conversations.map((conversation) => (
            <Card key={conversation.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback
                        className={`text-white ${getUserTypeColor(conversation.otherUser?.userType || "")}`}
                      >
                        {getUserInitials(conversation.otherUser!)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{conversation.otherUser?.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {conversation.otherUser?.userType}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedConversation(conversation.key)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {conversation.messages.slice(-5).map((message) => {
                      const isFromCurrentUser = message.senderId === currentUser.id
                      const sender = users.find((u) => u.id === message.senderId)

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                          onClick={() =>
                            !message.isRead && message.recipientId === currentUser.id && handleMarkAsRead(message.id)
                          }
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              isFromCurrentUser
                                ? "bg-blue-500 text-white"
                                : message.isRead
                                  ? "bg-gray-100 text-gray-900"
                                  : "bg-yellow-50 text-gray-900 border border-yellow-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs opacity-75">{sender?.name}</span>
                              <div className="flex items-center space-x-1">
                                {!message.isRead && message.recipientId === currentUser.id && (
                                  <EyeOff className="h-3 w-3" />
                                )}
                                {isFromCurrentUser && currentUser.userType === "ICT" && onEditMessage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingMessage(message.id)
                                      setEditContent(message.content)
                                    }}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                )}
                                {isFromCurrentUser && currentUser.userType === "ICT" && onDeleteMessage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteMessage(message.id)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {editingMessage === message.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="text-sm"
                                  rows={2}
                                />
                                <div className="flex space-x-1">
                                  <Button size="sm" onClick={() => handleEditMessage(message.id)}>
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
                            ) : (
                              <>
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs opacity-75">{formatTimestamp(message.timestamp)}</span>
                                  {message.type === "private" && (
                                    <Badge variant="outline" className="text-xs">
                                      Private
                                    </Badge>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
                {conversation.messages.length > 5 && (
                  <div className="text-center mt-2">
                    <Button variant="link" size="sm" onClick={() => setSelectedConversation(conversation.key)}>
                      View all {conversation.messages.length} messages
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Full Conversation Dialog */}
      {selectedConversation && (
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Conversation with {conversations.find((c) => c.key === selectedConversation)?.otherUser?.name}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="space-y-4 p-4">
                {conversations
                  .find((c) => c.key === selectedConversation)
                  ?.messages.map((message) => {
                    const isFromCurrentUser = message.senderId === currentUser.id
                    const sender = users.find((u) => u.id === message.senderId)

                    return (
                      <div key={message.id} className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-3 ${
                            isFromCurrentUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium opacity-75">{sender?.name}</span>
                            <span className="text-xs opacity-75">{formatTimestamp(message.timestamp)}</span>
                          </div>
                          <p>{message.content}</p>
                          {!message.isRead && message.recipientId === currentUser.id && (
                            <div className="mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(message.id)}
                                className="text-xs"
                              >
                                Mark as read
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default RefinedMessagingSystem
