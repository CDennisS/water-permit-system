"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, Search, Users, Clock, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { loadUsers, loadMessages, saveMessage, markMessageAsRead } from "@/lib/database"
import type { Message } from "@/types"

interface EnhancedMessagingSystemProps {
  currentUser: any
}

export default function EnhancedMessagingSystem({ currentUser }: EnhancedMessagingSystemProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<string>("")
  const [messageContent, setMessageContent] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [allUsers, allMessages] = await Promise.all([loadUsers(), loadMessages()])

      // Remove duplicates using Map for better deduplication
      const uniqueUsersMap = new Map()
      allUsers
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
      setMessages(allMessages)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load messaging data")
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

    setIsLoading(true)
    try {
      const newMessage: Omit<Message, "id"> = {
        senderId: currentUser.id,
        receiverId: isPublic ? undefined : selectedRecipient,
        content: messageContent,
        isPublic,
        createdAt: new Date(),
        readAt: undefined,
        applicationId: undefined,
        subject: undefined,
      }

      await saveMessage(newMessage)

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
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId)
      await loadData() // Reload to update read status
    } catch (error) {
      console.error("Failed to mark message as read:", error)
    }
  }

  const formatMessageTime = (date: Date) => {
    if (!(date instanceof Date)) {
      date = new Date(date)
    }
    return date.toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSenderName = (senderId: string) => {
    const sender = users.find((u) => u.id === senderId)
    return sender ? `${sender.username} (${sender.userType.replace("_", " ")})` : "Unknown User"
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSenderName(message.senderId).toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const publicMessages = filteredMessages.filter((m) => m.isPublic)
  const privateMessages = filteredMessages.filter(
    (m) => !m.isPublic && (m.senderId === currentUser.id || m.receiverId === currentUser.id),
  )

  const unreadCount = privateMessages.filter((m) => m.receiverId === currentUser.id && !m.readAt).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messaging System
          </CardTitle>
          <CardDescription>
            Communicate with team members through public announcements or private messages
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="public" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Public Messages
          </TabsTrigger>
          <TabsTrigger value="private" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Private Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="space-y-4">
          {/* Send Public Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Public Announcement</CardTitle>
              <CardDescription>This message will be visible to all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="public-message">Message</Label>
                <Textarea
                  id="public-message"
                  placeholder="Type your public announcement here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={() => handleSendMessage(true)} disabled={isLoading} className="gap-2">
                <Send className="h-4 w-4" />
                {isLoading ? "Sending..." : "Send Public Message"}
              </Button>
            </CardContent>
          </Card>

          {/* Public Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Public Messages</span>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {publicMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No public messages yet</p>
                  ) : (
                    publicMessages
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((message) => (
                        <div key={message.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{getSenderName(message.senderId)}</Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatMessageTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="private" className="space-y-4">
          {/* Send Private Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Private Message</CardTitle>
              <CardDescription>Send a message to a specific user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.username} ({recipient.userType.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="private-message">Message</Label>
                <Textarea
                  id="private-message"
                  placeholder="Type your private message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={() => handleSendMessage(false)} disabled={isLoading} className="gap-2">
                <Send className="h-4 w-4" />
                {isLoading ? "Sending..." : "Send Private Message"}
              </Button>
            </CardContent>
          </Card>

          {/* Private Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Private Messages</span>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {privateMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No private messages yet</p>
                  ) : (
                    privateMessages
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((message) => (
                        <div key={message.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={message.senderId === currentUser.id ? "default" : "secondary"}>
                                {message.senderId === currentUser.id ? "You" : getSenderName(message.senderId)}
                              </Badge>
                              {message.senderId !== currentUser.id && (
                                <Badge variant="outline">
                                  To:{" "}
                                  {message.receiverId === currentUser.id
                                    ? "You"
                                    : getSenderName(message.receiverId || "")}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatMessageTime(message.createdAt)}
                              </div>
                              {message.readAt && (
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Read
                                </div>
                              )}
                            </div>
                            {message.receiverId === currentUser.id && !message.readAt && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(message.id)}>
                                Mark as Read
                              </Button>
                            )}
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
