import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MessagingSystem } from "@/components/messaging-system"
import { db } from "@/lib/database"
import type { User } from "@/types"

describe("Messaging System Integration", () => {
  let testUser: User
  let otherUsers: User[]

  beforeEach(async () => {
    // Create test users
    testUser = await db.createUser({
      username: "test.user",
      userType: "permitting_officer",
      password: "test123",
    })

    const chairperson = await db.createUser({
      username: "test.chair",
      userType: "chairperson",
      password: "test123",
    })

    const manager = await db.createUser({
      username: "test.manager",
      userType: "catchment_manager",
      password: "test123",
    })

    otherUsers = [chairperson, manager]
  })

  describe("Recipient Selection", () => {
    it("should show correct recipients in dropdown", async () => {
      render(<MessagingSystem user={testUser} />)

      // Click on private messages tab
      const privateTab = screen.getByText("Private Messages")
      fireEvent.click(privateTab)

      // Open recipient dropdown
      const recipientSelect = screen.getByText("Select recipient")
      fireEvent.click(recipientSelect)

      // Should show other users but not current user
      await waitFor(() => {
        expect(screen.getByText("Chairperson")).toBeInTheDocument()
        expect(screen.getByText("Catchment Manager")).toBeInTheDocument()
        expect(screen.queryByText("Permitting Officer")).not.toBeInTheDocument()
      })
    })

    it("should not show duplicate recipients", async () => {
      render(<MessagingSystem user={testUser} />)

      // Click on private messages tab
      const privateTab = screen.getByText("Private Messages")
      fireEvent.click(privateTab)

      // Open recipient dropdown
      const recipientSelect = screen.getByText("Select recipient")
      fireEvent.click(recipientSelect)

      // Count occurrences of each user type
      await waitFor(() => {
        const chairpersonElements = screen.getAllByText("Chairperson")
        const managerElements = screen.getAllByText("Catchment Manager")

        // Each user type should appear only once
        expect(chairpersonElements).toHaveLength(1)
        expect(managerElements).toHaveLength(1)
      })
    })
  })

  describe("Message Sending", () => {
    it("should send message to selected recipient", async () => {
      render(<MessagingSystem user={testUser} />)

      // Click on private messages tab
      const privateTab = screen.getByText("Private Messages")
      fireEvent.click(privateTab)

      // Select recipient
      const recipientSelect = screen.getByText("Select recipient")
      fireEvent.click(recipientSelect)

      await waitFor(() => {
        const chairpersonOption = screen.getByText("Chairperson")
        fireEvent.click(chairpersonOption)
      })

      // Type message
      const messageInput = screen.getByPlaceholderText("Type your private message...")
      fireEvent.change(messageInput, { target: { value: "Test message to chairperson" } })

      // Send message
      const sendButton = screen.getByRole("button", { name: /send/i })
      fireEvent.click(sendButton)

      // Verify message was sent to correct recipient
      await waitFor(async () => {
        const messages = await db.getMessages(testUser.id, false)
        const sentMessage = messages.find(
          (msg) => msg.senderId === testUser.id && msg.content === "Test message to chairperson",
        )

        expect(sentMessage).toBeDefined()
        expect(sentMessage?.receiverId).toBe(otherUsers[0].id) // chairperson
      })
    })

    it("should clear form after sending message", async () => {
      render(<MessagingSystem user={testUser} />)

      // Click on private messages tab
      const privateTab = screen.getByText("Private Messages")
      fireEvent.click(privateTab)

      // Select recipient and send message
      const recipientSelect = screen.getByText("Select recipient")
      fireEvent.click(recipientSelect)

      await waitFor(() => {
        const chairpersonOption = screen.getByText("Chairperson")
        fireEvent.click(chairpersonOption)
      })

      const messageInput = screen.getByPlaceholderText("Type your private message...")
      fireEvent.change(messageInput, { target: { value: "Test message" } })

      const sendButton = screen.getByRole("button", { name: /send/i })
      fireEvent.click(sendButton)

      // Form should be cleared
      await waitFor(() => {
        expect(messageInput.value).toBe("")
        expect(screen.getByText("Select recipient")).toBeInTheDocument()
      })
    })
  })

  describe("Message Display", () => {
    it("should display messages with correct sender/receiver info", async () => {
      // Send a message first
      await db.sendMessage({
        senderId: otherUsers[0].id, // chairperson
        receiverId: testUser.id,
        content: "Message from chairperson",
        isPublic: false,
      })

      render(<MessagingSystem user={testUser} />)

      // Click on private messages tab
      const privateTab = screen.getByText("Private Messages")
      fireEvent.click(privateTab)

      // Should display the received message
      await waitFor(() => {
        expect(screen.getByText("Message from chairperson")).toBeInTheDocument()
        expect(screen.getByText("From: test.chair")).toBeInTheDocument()
      })
    })

    it("should distinguish between sent and received messages", async () => {
      // Send message from test user
      await db.sendMessage({
        senderId: testUser.id,
        receiverId: otherUsers[0].id,
        content: "Sent message",
        isPublic: false,
      })

      // Receive message to test user
      await db.sendMessage({
        senderId: otherUsers[0].id,
        receiverId: testUser.id,
        content: "Received message",
        isPublic: false,
      })

      render(<MessagingSystem user={testUser} />)

      // Click on private messages tab
      const privateTab = screen.getByText("Private Messages")
      fireEvent.click(privateTab)

      await waitFor(() => {
        // Sent message should show "You"
        const sentMessageContainer = screen.getByText("Sent message").closest("div")
        expect(sentMessageContainer).toHaveClass("bg-blue-100", "ml-auto")

        // Received message should show sender info
        const receivedMessageContainer = screen.getByText("Received message").closest("div")
        expect(receivedMessageContainer).toHaveClass("bg-gray-100", "mr-auto")
      })
    })
  })

  describe("Message Filtering", () => {
    it("should only show messages involving current user", async () => {
      // Create message between other users (not involving test user)
      await db.sendMessage({
        senderId: otherUsers[0].id, // chairperson
        receiverId: otherUsers[1].id, // manager
        content: "Message between others",
        isPublic: false,
      })

      // Create message involving test user
      await db.sendMessage({
        senderId: testUser.id,
        receiverId: otherUsers[0].id,
        content: "Message involving test user",
        isPublic: false,
      })

      render(<MessagingSystem user={testUser} />)

      // Click on private messages tab
      const privateTab = screen.getByText("Private Messages")
      fireEvent.click(privateTab)

      await waitFor(() => {
        // Should see message involving test user
        expect(screen.getByText("Message involving test user")).toBeInTheDocument()

        // Should NOT see message between other users
        expect(screen.queryByText("Message between others")).not.toBeInTheDocument()
      })
    })
  })
})
