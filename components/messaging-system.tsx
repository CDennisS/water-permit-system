"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Mail, MailOpen } from "lucide-react"
import type { User, Message } from "@/types"

interface MessagingSystemProps {
  user: User
}

// Mock messages data
const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "system",
    receiverId: "1",
    subject: "Application APP-2024-001 Approved",
    content: "Your water permit application has been approved. Please proceed to collect your permit.",
    sentAt: new Date("2024-01-20T10:00:00"),
    readAt: null,
    applicationId: "1",
    messageType: "approval_notification",
  },
  {
    id: "2",
    senderId: "2",
    receiverId: "1",
    subject: "Document Clarification Required",
    content: "Please provide additional documentation for your application APP-2024-002.",
    sentAt: new Date("2024-02-01T14:30:00"),
    readAt: new Date("2024-02-01T15:00:00"),
    applicationId: "2",
    messageType: "clarification_request",
  },
]

export function MessagingSystem({ user }: MessagingSystemProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [newMessage, setNewMessage] = useState({ subject: "", content: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading messages
    const timer = setTimeout(() => {
      setMessages(mockMessages)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate sending message
    console.log("Sending message:", newMessage)
    setNewMessage({ subject: "", content: "" })
  }

  const markAsRead = (messageId: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, readAt: new Date() } : msg)))
  }

  const unreadMessages = messages.filter((msg) => !msg.readAt && msg.receiverId === user.id)
  const readMessages = messages.filter((msg) => msg.readAt && msg.receiverId === user.id)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading messages...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Communication and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox">
                Inbox
                {unreadMessages.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadMessages.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="compose">Compose</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="space-y-4">
              {/* Unread Messages */}
              {unreadMessages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Unread Messages</h3>
                  <div className="space-y-2">
                    {unreadMessages.map((message) => (
                      <Card
                        key={message.id}
                        className="cursor-pointer hover:bg-gray-50 border-l-4 border-l-blue-500"
                        onClick={() => {
                          setSelectedMessage(message)
                          markAsRead(message.id)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold">{message.subject}</span>
                            </div>
                            <span className="text-sm text-gray-500">{message.sentAt.toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">{message.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Read Messages */}
              {readMessages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Read Messages</h3>
                  <div className="space-y-2">
                    {readMessages.map((message) => (
                      <Card
                        key={message.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedMessage(message)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MailOpen className="h-4 w-4 text-gray-400" />
                              <span>{message.subject}</span>
                            </div>
                            <span className="text-sm text-gray-500">{message.sentAt.toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">{message.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="compose">
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage((prev) => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-1">
                    Message
                  </label>
                  <Textarea
                    id="content"
                    rows={6}
                    value={newMessage.content}
                    onChange={(e) => setNewMessage((prev) => ({ ...prev, content: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedMessage.subject}</CardTitle>
            <CardDescription>From: System • {selectedMessage.sentAt.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
