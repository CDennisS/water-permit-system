"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Send,
  MessageSquare,
  Users,
  User,
  Bell,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit3,
  MoreVertical,
  RefreshCw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Message, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface RefinedMessagingSystemProps {
  user: UserType
}

interface ConversationThread {
  participantId: string
  participantName: string
  participantType: string
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

export function RefinedMessagingSystem({ user }: RefinedMessagingSystemProps) {
  const [publicMessages, setPublicMessages] = useState<Message[]>([])
  const [privateMessages, setPrivateMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<ConversationThread[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [newPublicMessage, setNewPublicMessage] = useState("")
  const [newPrivateMessage, setNewPrivateMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const publicMessagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    loadUsers()

    // Auto-refresh messages every 30 seconds
    const interval = setInterval(() => {
      loadMessages()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom()
  }, [publicMessages, privateMessages, selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    publicMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    try {
      setError(null)
      const publicMsgs = await db.getMessages(user.id, true)
      const privateMsgs = await db.getMessages(user.id, false)

      setPublicMessages(publicMsgs)
      setPrivateMessages(privateMsgs)

      // Group private messages into conversations
      groupMessagesIntoConversations(privateMsgs)
    } catch (error) {
      console.error("Failed to load messages:", error)
      setError("Failed to load messages. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const groupMessagesIntoConversations = (messages: Message[]) => {
    const conversationMap = new Map<string, ConversationThread>()

    messages.forEach((message) => {
      const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId
      if (!otherUserId) return

      const otherUser = users.find((u) => u.id === otherUserId)
      if (!otherUser) return

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          participantId: otherUserId,
          participantName: otherUser.username || getUserTypeLabel(otherUser.userType),
          participantType: otherUser.userType,
          lastMessage: message,
          unreadCount: 0,
          messages: [],
        })
      }

      const conversation = conversationMap.get(otherUserId)!
      conversation.messages.push(message)

      // Update last message if this one is newer
      if (message.createdAt > conversation.lastMessage.createdAt) {
        conversation.lastMessage = message
      }

      // Count unread messages
      if (message.senderId !== user.id && !message.readAt) {
        conversation.unreadCount++
      }
    })

    // Sort conversations by last message time
    const sortedConversations = Array.from(conversationMap.values()).sort(
      (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
    )

    setConversations(sortedConversations)
  }

  const loadUsers = async () => {
    try {
      const allUsers = await db.getUsers()
      const uniqueUsers = allUsers
        .filter((u) => u.id !== user.id)
        .filter((user, index, self) => index === self.findIndex((u) => u.id === user.id))
      setUsers(uniqueUsers)
    } catch (error) {
      console.error("Failed to load users:", error)
      setError("Failed to load users.")
    }
  }

  const getUnreadCount = () => {
    const unreadPublic = publicMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length
    const unreadPrivate = conversations.reduce((total, conv) => total + conv.unreadCount, 0)
    return { public: unreadPublic, private: unreadPrivate, total: unreadPublic + unreadPrivate }
  }

  const markConversationAsRead = async (participantId: string) => {
    const conversation = conversations.find((c) => c.participantId === participantId)
    if (!conversation) return

    const unreadMessages = conversation.messages.filter((msg) => msg.senderId !== user.id && !msg.readAt)

    for (const message of unreadMessages) {
      await db.markMessageAsRead(message.id)
    }

    loadMessages()
  }

  const markPublicMessagesAsRead = async () => {
    const unreadMessages = publicMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt)

    for (const message of unreadMessages) {
      await db.markMessageAsRead(message.id)
    }

    loadMessages()
  }

  const sendPublicMessage = async () => {
    if (!newPublicMessage.trim()) return

    try {
      setError(null)
      await db.sendMessage({
        senderId: user.id,
        content: newPublicMessage.trim(),
        isPublic: true,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Sent Public Message",
        details: "Posted a public message to the dashboard",
      })

      setNewPublicMessage("")
      loadMessages()
    } catch (error) {
      console.error("Failed to send public message:", error)
      setError("Failed to send message. Please try again.")
    }
  }

  const sendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !selectedRecipient) return

    try {
      setError(null)
      await db.sendMessage({
        senderId: user.id,
        receiverId: selectedRecipient,
        content: newPrivateMessage.trim(),
        isPublic: false,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Sent Private Message",
        details: `Sent private message to ${getUserTypeLabel(users.find((u) => u.id === selectedRecipient)?.userType || "permitting_officer")}`,
      })

      setNewPrivateMessage("")
      setSelectedRecipient("")
      loadMessages()
    } catch (error) {
      console.error("Failed to send private message:", error)
      setError("Failed to send message. Please try again.")
    }
  }

  const sendMessageInConversation = async () => {
    if (!newPrivateMessage.trim() || !selectedConversation) return

    try {
      setError(null)
      await db.sendMessage({
        senderId: user.id,
        receiverId: selectedConversation,
        content: newPrivateMessage.trim(),
        isPublic: false,
      })

      setNewPrivateMessage("")
      loadMessages()
    } catch (error) {
      console.error("Failed to send message:", error)
      setError("Failed to send message. Please try again.")
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (user.userType !== "ict") return

    try {
      // In a real implementation, you'd have a delete message function
      setError("Message deletion is only available for ICT users in production.")
    } catch (error) {
      console.error("Failed to delete message:", error)
      setError("Failed to delete message.")
    }
  }

  const startEditingMessage = (messageId: string, content: string) => {
    if (user.userType !== "ict") return
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  const saveEditedMessage = async () => {
    if (!editingMessageId || user.userType !== "ict") return

    try {
      // In a real implementation, you'd have an edit message function
      setEditingMessageId(null)
      setEditingContent("")
      setError("Message editing is only available for ICT users in production.")
    } catch (error) {
      console.error("Failed to edit message:", error)
      setError("Failed to edit message.")
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
      const days = Math.floor(hours / 24)
      if (days === 1) return "Yesterday"
      if (days < 7) return `${days} days ago`
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

  const filterMessages = (messages: Message[]) => {
    let filtered = messages

    if (searchTerm) {
      filtered = filtered.filter((msg) => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (filterType !== "all") {
      filtered = filtered.filter((msg) => {
        const sender = users.find((u) => u.id === msg.senderId)
        return sender?.userType === filterType
      })
    }

    return filtered
  }

  const getSelectedConversationMessages = () => {
    if (!selectedConversation) return []
    const conversation = conversations.find((c) => c.participantId === selectedConversation)
    return conversation?.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) || []
  }

  const unreadCounts = getUnreadCount()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading messaging system...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
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
              <Button variant="outline" size="sm" onClick={loadMessages} className="flex items-center bg-transparent">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="public" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="public" className="flex items-center relative" onClick={markPublicMessagesAsRead}>
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
              <TabsTrigger value="private" className="flex items-center relative">
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

              {/* Search and Filter for Public Messages */}
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search public messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
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

              <ScrollArea className="h-96 border rounded-lg p-4 bg-gray-50">
                <div className="space-y-4">
                  {filterMessages(publicMessages).map((message) => {
                    const sender = users.find((u) => u.id === message.senderId)
                    const isUnread = message.senderId !== user.id && !message.readAt
                    const isMyMessage = message.senderId === user.id

                    return (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isUnread ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              className={`text-sm ${
                                isMyMessage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {getUserInitials(sender?.userType || user.userType)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant={isMyMessage ? "default" : "outline"} className="text-xs">
                                  {isMyMessage ? "You" : getUserTypeLabel(sender?.userType || user.userType)}
                                </Badge>
                                {isUnread && (
                                  <Badge variant="destructive" className="text-xs">
                                    New
                                  </Badge>
                                )}
                                {message.readAt && <CheckCircle className="h-3 w-3 text-green-500" />}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                {(user.userType === "ict" || isMyMessage) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {user.userType === "ict" && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => startEditingMessage(message.id, message.content)}
                                          >
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => deleteMessage(message.id)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                            {editingMessageId === message.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="text-sm"
                                />
                                <div className="flex space-x-2">
                                  <Button size="sm" onClick={saveEditedMessage}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingMessageId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </p>
                            )}
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
                  <div ref={publicMessagesEndRef} />
                </div>
              </ScrollArea>

              <div className="space-y-3">
                <Textarea
                  value={newPublicMessage}
                  onChange={(e) => setNewPublicMessage(e.target.value)}
                  placeholder="Share an update with all users..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{newPublicMessage.length}/500 characters</span>
                  <Button
                    onClick={sendPublicMessage}
                    disabled={!newPublicMessage.trim() || newPublicMessage.length > 500}
                    className="flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Private Messages */}
            <TabsContent value="private" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Conversations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-1 p-4">
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.participantId}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedConversation === conversation.participantId
                                ? "bg-blue-100 border-blue-200 border"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              setSelectedConversation(conversation.participantId)
                              markConversationAsRead(conversation.participantId)
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-sm">
                                  {getUserInitials(conversation.participantType)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium truncate">
                                    {getUserTypeLabel(conversation.participantType as any)}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{conversation.lastMessage.content}</p>
                                <p className="text-xs text-gray-400">
                                  {formatMessageTime(conversation.lastMessage.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* New Conversation Button */}
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700">Start New Conversation</p>
                          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select recipient" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter((u) => !conversations.some((c) => c.participantId === u.id))
                                .map((recipient) => (
                                  <SelectItem key={recipient.id} value={recipient.id}>
                                    <div className="flex items-center space-x-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {getUserInitials(recipient.userType)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{getUserTypeLabel(recipient.userType)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Conversation View */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {selectedConversation ? (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {getUserInitials(
                                conversations.find((c) => c.participantId === selectedConversation)?.participantType ||
                                  "",
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {getUserTypeLabel(
                              (conversations.find((c) => c.participantId === selectedConversation)
                                ?.participantType as any) || "permitting_officer",
                            )}
                          </span>
                        </div>
                      ) : selectedRecipient ? (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {getUserInitials(users.find((u) => u.id === selectedRecipient)?.userType || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            New conversation with{" "}
                            {getUserTypeLabel(
                              (users.find((u) => u.id === selectedRecipient)?.userType as any) || "permitting_officer",
                            )}
                          </span>
                        </div>
                      ) : (
                        "Select a conversation"
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {selectedConversation || selectedRecipient ? (
                      <>
                        {/* Messages */}
                        <ScrollArea className="h-[400px] p-4">
                          <div className="space-y-4">
                            {(selectedConversation ? getSelectedConversationMessages() : []).map((message) => {
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
                                          : "bg-gray-100 border border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`text-xs ${isFromMe ? "text-blue-100" : "text-gray-500"}`}>
                                        {isFromMe ? "You" : "Them"}
                                      </span>
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
                            <div ref={messagesEndRef} />
                          </div>
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="p-4 border-t">
                          <div className="space-y-3">
                            <Textarea
                              value={newPrivateMessage}
                              onChange={(e) => setNewPrivateMessage(e.target.value)}
                              placeholder="Type your message..."
                              rows={2}
                              className="resize-none"
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{newPrivateMessage.length}/500 characters</span>
                              <Button
                                onClick={selectedConversation ? sendMessageInConversation : sendPrivateMessage}
                                disabled={!newPrivateMessage.trim() || newPrivateMessage.length > 500}
                                className="flex items-center"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-[500px] text-gray-500">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Select a conversation or start a new one</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
