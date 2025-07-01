"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  MessageCircle,
  Send,
  Search,
  Filter,
  Users,
  Clock,
  Edit3,
  Trash2,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
} from "lucide-react"
import type { Message } from "@/types"
import type { User } from "@/types" // Renamed import to avoid redeclaration

interface RefinedMessagingSystemProps {
  currentUser: User
  users: User[]
  messages: Message[]
  onSendMessage: (message: Omit<Message, "id" | "timestamp" | "isRead">) => void
  onEditMessage?: (messageId: string, content: string) => void
  onDeleteMessage?: (messageId: string) => void
  onMarkAsRead?: (messageId: string) => void
}

interface ConversationGroup {
  participants: string[]
  messages: Message[]
  lastMessage: Message
  unreadCount: number
}

const MESSAGE_CHAR_LIMIT = 500
const AUTO_REFRESH_INTERVAL = 30000 // 30 seconds

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

export function RefinedMessagingSystem({
  currentUser,
  users,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onMarkAsRead,
}: RefinedMessagingSystemProps) {
  const [newMessage, setNewMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUserType, setFilterUserType] = useState("all")
  const [isSending, setIsSending] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const { toast } = useToast()

  // Auto-refresh messages
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now())
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  // Filter available recipients (exclude current user)
  const availableRecipients = useMemo(() => {
    return users.filter((user) => user.id !== currentUser.id)
  }, [users, currentUser.id])

  // Group messages into conversations
  const conversations = useMemo((): ConversationGroup[] => {
    const conversationMap = new Map<string, ConversationGroup>()

    messages.forEach((message) => {
      // Create a unique key for the conversation between sender and recipient
      const participants = [message.senderId, message.recipientId].sort()
      const conversationKey = participants.join("-")

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          participants,
          messages: [],
          lastMessage: message,
          unreadCount: 0,
        })
      }

      const conversation = conversationMap.get(conversationKey)!
      conversation.messages.push(message)

      // Update last message if this one is newer
      if (new Date(message.timestamp) > new Date(conversation.lastMessage.timestamp)) {
        conversation.lastMessage = message
      }

      // Count unread messages for current user
      if (message.recipientId === currentUser.id && !message.isRead) {
        conversation.unreadCount++
      }
    })

    // Sort conversations by last message timestamp
    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime(),
    )
  }, [messages, currentUser.id])

  // Filter messages based on search and filters
  const filteredMessages = useMemo(() => {
    let filtered = messages.filter(
      (message) => message.senderId === currentUser.id || message.recipientId === currentUser.id,
    )

    if (searchTerm) {
      filtered = filtered.filter(
        (message) =>
          message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          users
            .find((u) => u.id === message.senderId)
            ?.name.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          users
            .find((u) => u.id === message.recipientId)
            ?.name.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
    }

    if (filterUserType !== "all") {
      filtered = filtered.filter((message) => {
        const sender = users.find((u) => u.id === message.senderId)
        const recipient = users.find((u) => u.id === message.recipientId)
        return sender?.userType === filterUserType || recipient?.userType === filterUserType
      })
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [messages, currentUser.id, searchTerm, filterUserType, users])

  // Get user by ID
  const getUserById = useCallback(
    (userId: string): User | undefined => {
      return users.find((user) => user.id === userId)
    },
    [users],
  )

  // Handle sending message
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!newMessage.trim() || !selectedRecipient || isSending) return

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
        recipientId: selectedRecipient,
        content: newMessage.trim(),
        subject: `Message from ${currentUser.name}`,
        priority: "normal",
      })

      setNewMessage("")
      setSelectedRecipient("")
      setIsComposerOpen(false)

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
  }, [newMessage, selectedRecipient, isSending, currentUser, onSendMessage, toast])

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

  // Handle message editing
  const handleEditMessage = useCallback(
    (messageId: string, content: string): void => {
      if (onEditMessage) {
        onEditMessage(messageId, content)
        toast({
          title: "Message Updated",
          description: "Message has been updated successfully.",
        })
      }
    },
    [onEditMessage, toast],
  )

  // Handle message deletion
  const handleDeleteMessage = useCallback(
    (messageId: string): void => {
      if (onDeleteMessage) {
        onDeleteMessage(messageId)
        toast({
          title: "Message Deleted",
          description: "Message has been deleted successfully.",
        })
      }
    },
    [onDeleteMessage, toast],
  )

  // Get conversation partner
  const getConversationPartner = useCallback(
    (participants: string[]): User | undefined => {
      const partnerId = participants.find((id) => id !== currentUser.id)
      return partnerId ? getUserById(partnerId) : undefined
    },
    [currentUser.id, getUserById],
  )

  // Character count for message input
  const remainingChars = MESSAGE_CHAR_LIMIT - newMessage.length
  const isOverLimit = remainingChars < 0

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Messages</h2>
          <Badge variant="secondary" className="ml-2">
            {conversations.reduce((total, conv) => total + conv.unreadCount, 0)} unread
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLastRefresh(Date.now())}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRecipients.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className={`text-xs text-white ${getUserTypeColor(user.userType)}`}>
                                {getUserInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {user.userType.replace("_", " ")}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`min-h-[100px] ${isOverLimit ? "border-red-500" : ""}`}
                  />
                  <div className={`text-sm mt-1 ${isOverLimit ? "text-red-500" : "text-gray-500"}`}>
                    {remainingChars} characters remaining
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !selectedRecipient || isSending || isOverLimit}
                  className="w-full"
                >
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterUserType} onValueChange={setFilterUserType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All User Types</SelectItem>
                  <SelectItem value="applicant">Applicants</SelectItem>
                  <SelectItem value="permitting_officer">Officers</SelectItem>
                  <SelectItem value="permit_supervisor">Supervisors</SelectItem>
                  <SelectItem value="catchment_manager">Managers</SelectItem>
                  <SelectItem value="catchment_chairperson">Chairpersons</SelectItem>
                  <SelectItem value="ict">ICT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations ({conversations.length})
          </TabsTrigger>
          <TabsTrigger value="all-messages" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Messages ({filteredMessages.length})
          </TabsTrigger>
        </TabsList>

        {/* Conversations View */}
        <TabsContent value="conversations" className="space-y-4">
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-500 mb-4">Start a conversation by sending a message</p>
                  <Button onClick={() => setIsComposerOpen(true)}>Send First Message</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {conversations.map((conversation, index) => {
                const partner = getConversationPartner(conversation.participants)
                if (!partner) return null

                return (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`text-white ${getUserTypeColor(partner.userType)}`}>
                              {getUserInitials(partner.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{partner.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {partner.userType.replace("_", " ")}
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-600 text-xs">{conversation.unreadCount}</Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.content}</p>

                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {new Date(conversation.lastMessage.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConversation(conversation.participants.join("-"))}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* All Messages View */}
        <TabsContent value="all-messages" className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMessages.map((message) => {
                const sender = getUserById(message.senderId)
                const recipient = getUserById(message.recipientId)
                const isFromCurrentUser = message.senderId === currentUser.id
                const canEdit = currentUser.userType === "ict" || isFromCurrentUser
                const canDelete = currentUser.userType === "ict"

                return (
                  <Card
                    key={message.id}
                    className={`${!message.isRead && !isFromCurrentUser ? "border-blue-200 bg-blue-50" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={`text-white text-xs ${getUserTypeColor(sender?.userType || "")}`}
                            >
                              {sender ? getUserInitials(sender.name) : "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{sender?.name || "Unknown"}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-gray-600">{recipient?.name || "Unknown"}</span>
                              {!message.isRead && !isFromCurrentUser && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(message.timestamp).toLocaleString()}
                              {message.isRead && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            </div>
                          </div>
                        </div>

                        {(canEdit || canDelete) && (
                          <div className="flex gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newContent = prompt("Edit message:", message.content)
                                  if (newContent && newContent !== message.content) {
                                    handleEditMessage(message.id, newContent)
                                  }
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this message?")) {
                                    handleDeleteMessage(message.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {!message.isRead && !isFromCurrentUser && onMarkAsRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-transparent"
                          onClick={() => onMarkAsRead(message.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
