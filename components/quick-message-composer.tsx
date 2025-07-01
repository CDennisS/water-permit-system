"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Send } from "lucide-react"
import type { User, Message } from "@/types"

interface QuickMessageComposerProps {
  currentUser: User
  users: User[]
  onSendMessage: (message: Omit<Message, "id" | "timestamp" | "isRead">) => void
  triggerButton?: React.ReactNode
  defaultRecipient?: string
}

const MESSAGE_CHAR_LIMIT = 500

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

export function QuickMessageComposer({
  currentUser,
  users,
  onSendMessage,
  triggerButton,
  defaultRecipient = "",
}: QuickMessageComposerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState(defaultRecipient)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  // Filter available recipients (exclude current user)
  const availableRecipients = users.filter((user) => user.id !== currentUser.id)

  // Handle sending message
  const handleSendMessage = useCallback(async (): Promise<void> => {
    if (!message.trim() || !selectedRecipient || isSending) return

    if (message.length > MESSAGE_CHAR_LIMIT) {
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
        content: message.trim(),
        subject: `Quick message from ${currentUser.name}`,
        priority: "normal",
      })

      // Reset form
      setMessage("")
      setSelectedRecipient(defaultRecipient)
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
  }, [message, selectedRecipient, isSending, currentUser, onSendMessage, defaultRecipient, toast])

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

  // Character count
  const remainingChars = MESSAGE_CHAR_LIMIT - message.length
  const isOverLimit = remainingChars < 0

  // Reset form when dialog opens/closes
  const handleOpenChange = useCallback(
    (open: boolean): void => {
      setIsOpen(open)
      if (!open) {
        setMessage("")
        setSelectedRecipient(defaultRecipient)
        setIsSending(false)
      }
    },
    [defaultRecipient],
  )

  const defaultTrigger = (
    <Button size="sm" className="flex items-center gap-2">
      <MessageSquare className="h-4 w-4" />
      Quick Message
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerButton || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Quick Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Send to</Label>
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
                      <span className="font-medium">{user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.userType.replace("_", " ")}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`min-h-[100px] resize-none ${isOverLimit ? "border-red-500" : ""}`}
              disabled={isSending}
            />
            <div className={`text-sm ${isOverLimit ? "text-red-500" : "text-gray-500"}`}>
              {remainingChars} characters remaining
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !selectedRecipient || isSending || isOverLimit}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
