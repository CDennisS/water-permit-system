"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send } from "lucide-react"
import type { User, Message } from "@/types"

interface QuickMessageComposerProps {
  currentUser: User
  users: User[]
  onSendMessage: (message: Omit<Message, "id" | "timestamp" | "isRead">) => void
  triggerClassName?: string
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

export function QuickMessageComposer({
  currentUser,
  users,
  onSendMessage,
  triggerClassName = "",
}: QuickMessageComposerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")
  const [selectedRecipient, setSelectedRecipient] = useState<string>("")
  const [isSending, setIsSending] = useState<boolean>(false)
  const { toast } = useToast()

  // Get available recipients (exclude current user)
  const availableRecipients = users.filter((user) => user.id !== currentUser.id)

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

  // Handle sending message
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!message.trim() || !selectedRecipient) {
      toast({
        title: "Invalid Message",
        description: "Please enter a message and select a recipient.",
        variant: "destructive",
      })
      return
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
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
        recipientId: selectedRecipient,
        content: message.trim(),
        type: "private",
      })

      // Reset form
      setMessage("")
      setSelectedRecipient("")
      setIsOpen(false)

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
  }, [message, selectedRecipient, currentUser.id, onSendMessage, toast])

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

  // Reset form when dialog closes
  const handleOpenChange = useCallback((open: boolean): void => {
    setIsOpen(open)
    if (!open) {
      setMessage("")
      setSelectedRecipient("")
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={triggerClassName} aria-label="Compose new message">
          <MessageCircle className="h-4 w-4 mr-2" />
          Quick Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" aria-describedby="quick-message-description">
        <DialogHeader>
          <DialogTitle>Send Quick Message</DialogTitle>
          <div id="quick-message-description" className="sr-only">
            Compose and send a quick message to another user
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <label htmlFor="recipient-select" className="text-sm font-medium">
              Recipient
            </label>
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger id="recipient-select">
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
                      <span className="font-medium">{user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.userType}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label htmlFor="message-input" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message-input"
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span className={message.length > MAX_MESSAGE_LENGTH * 0.9 ? "text-orange-500" : ""}>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!message.trim() || !selectedRecipient || isSending}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuickMessageComposer
