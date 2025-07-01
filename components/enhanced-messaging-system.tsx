"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageSquare, Users, User, Bell, Search, Filter } from "lucide-react"
import type { Message, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface EnhancedMessagingSystemProps {
  user: UserType
}

export function EnhancedMessagingSystem({ user }: EnhancedMessagingSystemProps) {
  const [publicMessages, setPublicMessages] = useState<Message[]>([])
  const [privateMessages, setPrivateMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [newPublicMessage, setNewPublicMessage] = useState("")
  const [newPrivateMessage, setNewPrivateMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMessages()
    loadUsers()

    // Auto-refresh messages every 30 seconds
    const interval = setInterval(() => {
      loadMessages()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  const loadMessages = async () => {
    try {
      const publicMsgs = await db.getMessages(user.id, true)
      const privateMsgs = await db.getMessages(user.id, false)
      setPublicMessages(publicMsgs)
      setPrivateMessages(privateMsgs)
    } catch (error) {
      console.error("Failed to load messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const allUsers = await db.getUsers()
      console.log("All users from database:", allUsers)

      // Remove current user and deduplicate by user ID using Map
      const filteredUsers = allUsers.filter((u) => u.id !== user.id)
      console.log("After filtering current user:", filteredUsers)

      // Create a Map to ensure unique users by ID
      const uniqueUsersMap = new Map()
      filteredUsers.forEach((u) => {
        if (!uniqueUsersMap.has(u.id)) {
          uniqueUsersMap.set(u.id, u)
        }
      })

      const uniqueUsers = Array.from(uniqueUsersMap.values())
      console.log("Final unique users:", uniqueUsers)

      setUsers(uniqueUsers)
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const getUnreadCount = () => {
    const unreadPublic = publicMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length
    const unreadPrivate = privateMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length
    return { public: unreadPublic, private: unreadPrivate, total: unreadPublic + unreadPrivate }
  }

  const markMessagesAsRead = async (isPublic: boolean) => {
    const messages = isPublic ? publicMessages : privateMessages
    const unreadMessages = messages.filter((msg) => msg.senderId !== user.id && !msg.readAt)

    for (const message of unreadMessages) {
      await db.markMessageAsRead(message.id)
    }

    loadMessages()
  }

  const sendPublicMessage = async () => {
    if (!newPublicMessage.trim()) return

    try {
      await db.sendMessage({
        senderId: user.id,
        content: newPublicMessage,
        isPublic: true,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Sent Public Message",
        details: "Posted a public message to the dashboard",
      })

      setNewPublicMessage("")
      await loadMessages()
    } catch (error) {
      console.error("Failed to send public message:", error)
    }
  }

  const sendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !selectedRecipient) return

    try {
      const recipient = users.find((u) => u.id === selectedRecipient)

      await db.sendMessage({
        senderId: user.id,
        receiverId: selectedRecipient,
        content: newPrivateMessage,
        isPublic: false,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Sent Private Message",
        details: `Sent private message to ${recipient ? getUserTypeLabel(recipient.userType) : "user"}`,
      })

      setNewPrivateMessage("")
      setSelectedRecipient("")
      await loadMessages()
    } catch (error) {
      console.error("Failed to send private message:", error)
    }
  }

  const formatMessageTime = (date: Date) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diff = now.getTime() - messageDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      const days = Math.floor(hours / 24)
      if (days === 1) return "Yesterday"
      if (days < 7) return `${days} days ago`
      return messageDate.toLocaleDateString()
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

  const filterMessages = (messages: Message[]) => {
    let filtered = messages

    if (searchTerm) {
      filtered = filtered.filter((msg) => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (filterType !== "all") {
      filtered = filtered.filter((msg) => {
        const sender = users.find((u) => u.id === msg.senderId) || user
        return sender.userType === filterType
      })
    }

    return filtered
  }

  const unreadCounts = getUnreadCount()

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading messaging system...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              UMSCC Messaging System
              {unreadCounts.total > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCounts.total} unread
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="permitting_officer">Officers</SelectItem>
                  <SelectItem value="chairperson">Chairpersons</SelectItem>
                  <SelectItem value="catchment_manager">Managers</SelectItem>
                  <SelectItem value="permit_supervisor">Supervisors</SelectItem>
                  <SelectItem value="ict">ICT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="public" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="public"
                className="flex items-center relative"
                onClick={() => markMessagesAsRead(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Public Dashboard
                {unreadCounts.public > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCounts.public}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="private"
                className="flex items-center relative"
                onClick={() => markMessagesAsRead(false)}
              >
                <User className="h-4 w-4 mr-2" />
                Private Messages
                {unreadCounts.private > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCounts.private}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Public Messages Dashboard */}
            <TabsContent value="public" className="space-y-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-800 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Public Message Dashboard
                  </CardTitle>
                  <p className="text-sm text-blue-600">
                    All users can view and post messages here. Messages are visible to everyone in the system.
                  </p>
                </CardHeader>
              </Card>

              <ScrollArea className="h-96 border rounded-lg p-4 bg-gray-50">
                <div className="space-y-4">
                  {filterMessages(publicMessages).map((message) => {
                    const sender =
                      users.find((u) => u.id === message.senderId) || (message.senderId === user.id ? user : null)
                    const isUnread = message.senderId !== user.id && !message.readAt

                    return (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border ${isUnread ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                              {getUserInitials(sender?.userType || "permitting_officer")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {sender ? getUserTypeLabel(sender.userType) : "Unknown User"}
                                </Badge>
                                {isUnread && (
                                  <Badge variant="destructive" className="text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filterMessages(publicMessages).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      {searchTerm || filterType !== "all"
                        ? "No messages found matching your criteria."
                        : "No public messages yet. Start the conversation!"}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex space-x-2">
                <Textarea
                  value={newPublicMessage}
                  onChange={(e) => setNewPublicMessage(e.target.value)}
                  placeholder="Type your public message for all users to see..."
                  rows={3}
                  className="flex-1"
                />
                <Button onClick={sendPublicMessage} disabled={!newPublicMessage.trim()} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Private Messages */}
            <TabsContent value="private" className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Private Messaging
                  </CardTitle>
                  <p className="text-sm text-green-600">
                    Send direct messages to specific users. Only you and the recipient can see these messages.
                  </p>
                </CardHeader>
              </Card>

              <ScrollArea className="h-96 border rounded-lg p-4 bg-gray-50">
                <div className="space-y-4">
                  {filterMessages(privateMessages).map((message) => {
                    const sender =
                      users.find((u) => u.id === message.senderId) || (message.senderId === user.id ? user : null)
                    const isFromMe = message.senderId === user.id
                    const isUnread = !isFromMe && !message.readAt

                    return (
                      <div key={message.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                            isFromMe
                              ? "bg-blue-500 text-white"
                              : isUnread
                                ? "bg-green-100 border border-green-300"
                                : "bg-white border border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${isFromMe ? "border-blue-200 text-blue-100" : ""}`}
                            >
                              {isFromMe ? "You" : sender ? getUserTypeLabel(sender.userType) : "Unknown User"}
                            </Badge>
                            <span className={`text-xs ${isFromMe ? "text-blue-100" : "text-gray-500"}`}>
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {isUnread && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {filterMessages(privateMessages).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      {searchTerm || filterType !== "all"
                        ? "No private messages found matching your criteria."
                        : "No private messages yet."}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="space-y-3">
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient for private message" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{getUserInitials(recipient.userType)}</AvatarFallback>
                          </Avatar>
                          <span>
                            {getUserTypeLabel(recipient.userType)} - {recipient.username}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Textarea
                    value={newPrivateMessage}
                    onChange={(e) => setNewPrivateMessage(e.target.value)}
                    placeholder="Type your private message..."
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendPrivateMessage}
                    disabled={!newPrivateMessage.trim() || !selectedRecipient}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
