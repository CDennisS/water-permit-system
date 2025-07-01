"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MessageSquare } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { User } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface QuickMessageComposerProps {
  user: User
  users: User[]
  onMessageSent?: () => void
}

export function QuickMessageComposer({ user, users, onMessageSent }: QuickMessageComposerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const availableUsers = users.filter((u) => u.id !== user.id)

  const getUserInitials = (userType: string) => {
    const labels = getUserTypeLabel(userType as any)
    return labels
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const sendMessage = async () => {
    if (!message.trim()) return
    if (!isPublic && !selectedRecipient) return

    setIsSending(true)
    try {
      await db.sendMessage({
        senderId: user.id,
        receiverId: isPublic ? undefined : selectedRecipient,
        content: message.trim(),
        isPublic,
      })

      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: isPublic ? "Sent Public Message" : "Sent Private Message",
        details: isPublic
          ? "Posted a quick public message"
          : `Sent quick private message to ${getUserTypeLabel((users.find((u) => u.id === selectedRecipient)?.userType as any) || "permitting_officer")}`,
      })

      // Reset form
      setMessage("")
      setSelectedRecipient("")
      setIsPublic(false)
      setIsOpen(false)

      onMessageSent?.()
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Quick Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Send Quick Message
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Message Type Selection */}
          <div className="flex space-x-2">
            <Button
              variant={isPublic ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPublic(true)}
              className="flex-1"
            >
              Public Message
            </Button>
            <Button
              variant={!isPublic ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPublic(false)}
              className="flex-1"
            >
              Private Message
            </Button>
          </div>

          {/* Recipient Selection (for private messages) */}
          {!isPublic && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Send to:</label>
              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{getUserInitials(recipient.userType)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{getUserTypeLabel(recipient.userType)}</span>
                          <span className="text-xs text-gray-500">{recipient.username || recipient.id}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isPublic ? "Share an update with everyone..." : "Type your private message..."}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{message.length}/500 characters</span>
              {isPublic && (
                <Badge variant="secondary" className="text-xs">
                  Visible to all users
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || message.length > 500 || (!isPublic && !selectedRecipient) || isSending}
              className="flex items-center"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
