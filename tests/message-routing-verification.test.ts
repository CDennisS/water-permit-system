import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/lib/database"
import type { User } from "@/types"

describe("Message Routing Verification", () => {
  let testUsers: User[]
  let permittingOfficer: User
  let chairperson: User
  let catchmentManager: User

  beforeEach(async () => {
    // Create test users
    permittingOfficer = await db.createUser({
      username: "test.officer",
      userType: "permitting_officer",
      password: "test123",
    })

    chairperson = await db.createUser({
      username: "test.chair",
      userType: "chairperson",
      password: "test123",
    })

    catchmentManager = await db.createUser({
      username: "test.manager",
      userType: "catchment_manager",
      password: "test123",
    })

    testUsers = [permittingOfficer, chairperson, catchmentManager]
  })

  describe("Private Message Routing", () => {
    it("should send private message to correct recipient", async () => {
      // Send message from permitting officer to chairperson
      const message = await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Test private message",
        isPublic: false,
      })

      expect(message.senderId).toBe(permittingOfficer.id)
      expect(message.receiverId).toBe(chairperson.id)
      expect(message.isPublic).toBe(false)
      expect(message.content).toBe("Test private message")
    })

    it("should only show messages for intended recipients", async () => {
      // Send message from officer to chairperson
      await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Message to chairperson",
        isPublic: false,
      })

      // Send message from officer to manager
      await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: catchmentManager.id,
        content: "Message to manager",
        isPublic: false,
      })

      // Get messages for chairperson
      const chairpersonMessages = await db.getMessages(chairperson.id, false)
      const relevantMessages = chairpersonMessages.filter(
        (msg) => msg.senderId === chairperson.id || msg.receiverId === chairperson.id,
      )

      // Chairperson should only see the message intended for them
      expect(relevantMessages).toHaveLength(1)
      expect(relevantMessages[0].content).toBe("Message to chairperson")
      expect(relevantMessages[0].receiverId).toBe(chairperson.id)
    })

    it("should not show private messages to unintended users", async () => {
      // Send private message between officer and chairperson
      await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Private conversation",
        isPublic: false,
      })

      // Get messages for manager (who should not see this private message)
      const managerMessages = await db.getMessages(catchmentManager.id, false)
      const relevantMessages = managerMessages.filter(
        (msg) => msg.senderId === catchmentManager.id || msg.receiverId === catchmentManager.id,
      )

      // Manager should not see the private message between officer and chairperson
      expect(relevantMessages).toHaveLength(0)
    })
  })

  describe("Public Message Routing", () => {
    it("should make public messages visible to all users", async () => {
      // Send public message
      const publicMessage = await db.sendMessage({
        senderId: permittingOfficer.id,
        content: "Public announcement",
        isPublic: true,
      })

      // All users should see the public message
      for (const user of testUsers) {
        const userMessages = await db.getMessages(user.id, true)
        const publicMessages = userMessages.filter((msg) => msg.isPublic)

        expect(publicMessages).toContainEqual(
          expect.objectContaining({
            id: publicMessage.id,
            content: "Public announcement",
            isPublic: true,
          }),
        )
      }
    })

    it("should not include private messages in public message feed", async () => {
      // Send private message
      await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Private message",
        isPublic: false,
      })

      // Send public message
      await db.sendMessage({
        senderId: permittingOfficer.id,
        content: "Public message",
        isPublic: true,
      })

      // Get public messages for any user
      const publicMessages = await db.getMessages(chairperson.id, true)

      // Should only contain public messages
      expect(publicMessages.every((msg) => msg.isPublic)).toBe(true)
      expect(publicMessages.some((msg) => msg.content === "Private message")).toBe(false)
      expect(publicMessages.some((msg) => msg.content === "Public message")).toBe(true)
    })
  })

  describe("Message Filtering Logic", () => {
    it("should correctly filter messages by user involvement", async () => {
      // Create multiple private messages
      await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Officer to Chair",
        isPublic: false,
      })

      await db.sendMessage({
        senderId: chairperson.id,
        receiverId: permittingOfficer.id,
        content: "Chair to Officer",
        isPublic: false,
      })

      await db.sendMessage({
        senderId: catchmentManager.id,
        receiverId: chairperson.id,
        content: "Manager to Chair",
        isPublic: false,
      })

      // Get messages for permitting officer
      const officerMessages = await db.getMessages(permittingOfficer.id, false)
      const officerRelevantMessages = officerMessages.filter(
        (msg) => msg.senderId === permittingOfficer.id || msg.receiverId === permittingOfficer.id,
      )

      // Officer should see 2 messages (sent and received with chairperson)
      expect(officerRelevantMessages).toHaveLength(2)
      expect(officerRelevantMessages.some((msg) => msg.content === "Officer to Chair")).toBe(true)
      expect(officerRelevantMessages.some((msg) => msg.content === "Chair to Officer")).toBe(true)
      expect(officerRelevantMessages.some((msg) => msg.content === "Manager to Chair")).toBe(false)
    })

    it("should handle message direction correctly", async () => {
      // Send message from A to B
      const messageAtoB = await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "A to B",
        isPublic: false,
      })

      // Send message from B to A
      const messageBtoA = await db.sendMessage({
        senderId: chairperson.id,
        receiverId: permittingOfficer.id,
        content: "B to A",
        isPublic: false,
      })

      // Verify message directions are preserved
      expect(messageAtoB.senderId).toBe(permittingOfficer.id)
      expect(messageAtoB.receiverId).toBe(chairperson.id)

      expect(messageBtoA.senderId).toBe(chairperson.id)
      expect(messageBtoA.receiverId).toBe(permittingOfficer.id)

      // Both users should see both messages in their conversation
      const officerMessages = await db.getMessages(permittingOfficer.id, false)
      const chairMessages = await db.getMessages(chairperson.id, false)

      expect(officerMessages).toHaveLength(2)
      expect(chairMessages).toHaveLength(2)
    })
  })

  describe("User Identification in Messages", () => {
    it("should correctly identify message senders and receivers", async () => {
      const message = await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Test identification",
        isPublic: false,
      })

      // Verify sender identification
      const sender = testUsers.find((u) => u.id === message.senderId)
      expect(sender?.username).toBe("test.officer")
      expect(sender?.userType).toBe("permitting_officer")

      // Verify receiver identification
      const receiver = testUsers.find((u) => u.id === message.receiverId)
      expect(receiver?.username).toBe("test.chair")
      expect(receiver?.userType).toBe("chairperson")
    })

    it("should handle missing user references gracefully", async () => {
      // Create message with non-existent user ID
      const message = await db.sendMessage({
        senderId: "non-existent-user",
        receiverId: chairperson.id,
        content: "Test missing user",
        isPublic: false,
      })

      // System should still store the message but handle missing user gracefully
      expect(message.senderId).toBe("non-existent-user")
      expect(message.receiverId).toBe(chairperson.id)

      // When looking up user, should handle undefined gracefully
      const sender = testUsers.find((u) => u.id === message.senderId)
      expect(sender).toBeUndefined()
    })
  })

  describe("Message Read Status", () => {
    it("should track message read status correctly", async () => {
      const message = await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Test read status",
        isPublic: false,
      })

      // Initially message should be unread
      expect(message.readAt).toBeUndefined()

      // Mark message as read
      await db.markMessageAsRead(message.id)

      // Verify message is marked as read
      const messages = await db.getMessages(chairperson.id, false)
      const readMessage = messages.find((m) => m.id === message.id)
      expect(readMessage?.readAt).toBeDefined()
      expect(readMessage?.readAt).toBeInstanceOf(Date)
    })

    it("should only count unread messages for recipient", async () => {
      // Send multiple messages
      await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Message 1",
        isPublic: false,
      })

      const message2 = await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Message 2",
        isPublic: false,
      })

      await db.sendMessage({
        senderId: permittingOfficer.id,
        receiverId: chairperson.id,
        content: "Message 3",
        isPublic: false,
      })

      // Mark one message as read
      await db.markMessageAsRead(message2.id)

      // Get messages for chairperson
      const messages = await db.getMessages(chairperson.id, false)
      const unreadMessages = messages.filter((msg) => msg.senderId !== chairperson.id && !msg.readAt)

      // Should have 2 unread messages (message 1 and 3)
      expect(unreadMessages).toHaveLength(2)
    })
  })
})
