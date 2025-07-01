"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, MessageSquare, Users, User } from "lucide-react"
import type { Message, User as UserType } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface MessagingSystemProps {
  user: UserType
}

export function MessagingSystem({ user }: MessagingSystemProps) {
  const [publicMessages, setPublicMessages] = useState<Message[]>([])
  const [privateMessages, setPrivateMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [newPublicMessage, setNewPublicMessage] = useState("")
  const [newPrivateMessage, setNewPrivateMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("")

  useEffect(() => {
    loadMessages()
    loadUsers()
  }, [user])

  const loadMessages = async () => {
    const publicMsgs = await db.getMessages(user.id, true)
    // Filter private messages to only show conversations involving current user
    const privateMsgs = await db.getMessages(user.id, false)
    const filteredPrivateMsgs = privateMsgs.filter((msg) => msg.senderId === user.id || msg.receiverId === user.id)
    setPublicMessages(publicMsgs)
    setPrivateMessages(filteredPrivateMsgs)
  }

  const loadUsers = async () => {
    const allUsers = await db.getUsers()
    setUsers(allUsers.filter((u) => u.id !== user.id))
  }

  const getUnreadCount = () => {
    const unreadPublic = publicMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length

    const unreadPrivate = privateMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length

    return unreadPublic + unreadPrivate
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

    await db.sendMessage({
      senderId: user.id,
      content: newPublicMessage,
      isPublic: true,
    })

    await db.addLog({
      userId: user.id,
      userType: user.userType,
      action: "Sent Public Message",
      details: "Posted a public message",
    })

    setNewPublicMessage("")
    loadMessages()
  }

  const sendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !selectedRecipient) return

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
      details: `Sent private message to user`,
    })

    setNewPrivateMessage("")
    setSelectedRecipient("")
    loadMessages()
  }

  const formatMessageTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Messaging System
          </CardTitle>
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
                Public Messages
                {publicMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {publicMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length}
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
                {privateMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {privateMessages.filter((msg) => msg.senderId !== user.id && !msg.readAt).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Public Messages */}
            <TabsContent value="public" className="space-y-4">
              <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-3">
                {publicMessages.map((message) => (
                  <div key={message.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {getUserTypeLabel(
                            users.find((u) => u.id === message.senderId)?.userType || "permitting_officer",
                          )}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
                {publicMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No public messages yet. Start the conversation!</div>
                )}
              </div>

              <div className="flex space-x-2">
                <Textarea
                  value={newPublicMessage}
                  onChange={(e) => setNewPublicMessage(e.target.value)}
                  placeholder="Type your public message..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={sendPublicMessage} disabled={!newPublicMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Private Messages */}
            <TabsContent value="private" className="space-y-4">
              <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-3">
                {privateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg max-w-xs ${
                      message.senderId === user.id ? "bg-blue-100 ml-auto text-right" : "bg-gray-100 mr-auto text-left"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {message.senderId === user.id
                          ? "You"
                          : `To: ${users.find((u) => u.id === message.receiverId)?.username || "Unknown"}`}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                    {message.senderId !== user.id && (
                      <div className="text-xs text-gray-400 mt-1">
                        From: {users.find((u) => u.id === message.senderId)?.username || "Unknown"}
                      </div>
                    )}
                  </div>
                ))}
                {privateMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No private messages yet.</div>
                )}
              </div>

              <div className="space-y-2">
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {getUserTypeLabel(recipient.userType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Textarea
                    value={newPrivateMessage}
                    onChange={(e) => setNewPrivateMessage(e.target.value)}
                    placeholder="Type your private message..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={sendPrivateMessage} disabled={!newPrivateMessage.trim() || !selectedRecipient}>
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
