"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, Search, Users, Bell, Filter } from "lucide-react"
import { toast } from "sonner"
import { loadUsers, loadMessages, sendMessage, markMessageAsRead } from "@/lib/database"
import type { User, Message } from "@/types"

interface EnhancedMessagingSystemProps {
  currentUser: User
}

export default function EnhancedMessagingSystem({ currentUser }: EnhancedMessagingSystemProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<string>("")
  const [messageContent, setMessageContent] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "unread" | "public" | "private">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [loadedMessages, loadedUsers] = await Promise.all([loadMessages(), loadUsers()])

      setMessages(loadedMessages)

      // Deduplicate users using Map for better performance
      const uniqueUsersMap = new Map<string, User>()
      loadedUsers
        .filter((u) => u.id !== currentUser.id) // Remove current user
        .forEach((user) => {
          uniqueUsersMap.set(user.id, user)
        })

      const uniqueUsers = Array.from(uniqueUsersMap.values())
      console.log(
        "Loaded unique users:",
        uniqueUsers.map((u) => ({ id: u.id, username: u.username, userType: u.userType })),
      )

      setUsers(uniqueUsers)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load messages and users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (isPublic: boolean) => {
    if (!messageContent.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (!isPublic && !selectedRecipient) {
      toast.error("Please select a recipient for private messages")
      return
    }

    setIsSending(true)
    try {
      const newMessage: Omit<Message, "id"> = {
        senderId: currentUser.id,
        receiverId: isPublic ? undefined : selectedRecipient,
        content: messageContent.trim(),
        isPublic,
        createdAt: new Date(),
        readAt: undefined,
        applicationId: undefined,
        subject: undefined,
      }

      await sendMessage(newMessage)

      // Reload messages to show the new one
      await loadData()

      // Clear form
      setMessageContent("")
      setSelectedRecipient("")

      toast.success(isPublic ? "Public message sent successfully" : "Private message sent successfully")
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId)
      await loadData() // Refresh messages
    } catch (error) {
      console.error("Failed to mark message as read:", error)
    }
  }

  const getSenderName = (senderId: string): string => {
    const sender = users.find((u) => u.id === senderId)
    if (sender) {
      return `${sender.username} (${sender.userType.replace("_", " ").toUpperCase()})`
    }

    // Check if it's the current user
    if (senderId === currentUser.id) {
      return `${currentUser.username} (${currentUser.userType.replace("_", " ").toUpperCase()})`
    }

    return "Unknown User"
  }

  const getRecipientName = (receiverId?: string): string => {
    if (!receiverId) return "Public"

    const recipient = users.find((u) => u.id === receiverId)
    if (recipient) {
      return `${recipient.username} (${recipient.userType.replace("_", " ").toUpperCase()})`
    }

    // Check if it's the current user
    if (receiverId === currentUser.id) {
      return `${currentUser.username} (${currentUser.userType.replace("_", " ").toUpperCase()})`
    }

    return "Unknown User"
  }

  const formatMessageTime = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "Invalid Date"
    }

    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    }
  }

  const filteredMessages = messages.filter((message) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesContent = message.content.toLowerCase().includes(searchLower)
      const matchesSender = getSenderName(message.senderId).toLowerCase().includes(searchLower)
      if (!matchesContent && !matchesSender) return false
    }

    // Type filter
    switch (filterType) {
      case "unread":
        return !message.readAt && (message.isPublic || message.receiverId === currentUser.id)
      case "public":
        return message.isPublic
      case "private":
        return !message.isPublic && (message.senderId === currentUser.id || message.receiverId === currentUser.id)
      default:
        return message.isPublic || message.senderId === currentUser.id || message.receiverId === currentUser.id
    }
  })

  const unreadCount = messages.filter((m) => !m.readAt && (m.isPublic || m.receiverId === currentUser.id)).length

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messaging System
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Send and receive messages with other users in the system</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="public">Public Messages</SelectItem>
                    <SelectItem value="private">Private Messages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages ({filteredMessages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border ${
                          !message.readAt && (message.isPublic || message.receiverId === currentUser.id)
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50"
                        }`}
                        onClick={() => {
                          if (!message.readAt && (message.isPublic || message.receiverId === currentUser.id)) {
                            handleMarkAsRead(message.id)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={message.isPublic ? "default" : "secondary"}>
                              {message.isPublic ? "Public" : "Private"}
                            </Badge>
                            {!message.readAt && (message.isPublic || message.receiverId === currentUser.id) && (
                              <Badge variant="destructive" className="text-xs">
                                <Bell className="h-3 w-3 mr-1" />
                                New
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(new Date(message.createdAt))}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">From:</span>
                            <span>{getSenderName(message.senderId)}</span>
                            {!message.isPublic && (
                              <>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">To:</span>
                                <span>{getRecipientName(message.receiverId)}</span>
                              </>
                            )}
                          </div>

                          <div className="text-sm">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          {/* Public Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Public Message
              </CardTitle>
              <CardDescription>Send a message visible to all users in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your public message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />
              <Button
                onClick={() => handleSendMessage(true)}
                disabled={isSending || !messageContent.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Public Message"}
              </Button>
            </CardContent>
          </Card>

          {/* Private Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Private Message
              </CardTitle>
              <CardDescription>Send a private message to a specific user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Recipient</label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a recipient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.username} ({recipient.userType.replace("_", " ").toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Type your private message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />

              <Button
                onClick={() => handleSendMessage(false)}
                disabled={isSending || !messageContent.trim() || !selectedRecipient}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Private Message"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
