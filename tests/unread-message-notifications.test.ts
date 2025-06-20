import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { UnreadMessageNotification } from "@/components/unread-message-notification"
import { DashboardHeader } from "@/components/dashboard-header"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { db } from "@/lib/database"
import type { User, Message } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getMessages: vi.fn(),
    addLog: vi.fn(),
    getApplications: vi.fn(),
    updateApplication: vi.fn(),
    addWorkflowComment: vi.fn(),
  },
}))

// Mock users for testing
const mockUsers: Record<string, User> = {
  chairperson: {
    id: "1",
    username: "chairperson_user",
    userType: "chairperson",
    password: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  catchment_manager: {
    id: "2",
    username: "manager_user",
    userType: "catchment_manager",
    password: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  permitting_officer: {
    id: "3",
    username: "officer_user",
    userType: "permitting_officer",
    password: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ict: {
    id: "4",
    username: "ict_user",
    userType: "ict",
    password: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

// Mock messages
const createMockMessages = (receiverId: string, unreadCount: number): Message[] => {
  const messages: Message[] = []

  // Add read messages
  for (let i = 0; i < 3; i++) {
    messages.push({
      id: `read_${i}`,
      senderId: "other_user",
      receiverId,
      content: `Read message ${i}`,
      isPublic: false,
      createdAt: new Date(Date.now() - (i + 1) * 60000),
      readAt: new Date(Date.now() - i * 30000),
    })
  }

  // Add unread messages
  for (let i = 0; i < unreadCount; i++) {
    messages.push({
      id: `unread_${i}`,
      senderId: "other_user",
      receiverId,
      content: `Unread message ${i}`,
      isPublic: i % 2 === 0, // Mix public and private
      createdAt: new Date(Date.now() - i * 30000),
      readAt: undefined,
    })
  }

  return messages
}

describe("Unread Message Notification System", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock default empty applications
    vi.mocked(db.getApplications).mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe("UnreadMessageNotification Component", () => {
    it("should not render when there are no unread messages", async () => {
      const user = mockUsers.chairperson
      vi.mocked(db.getMessages).mockResolvedValue([])

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(screen.queryByText(/unread message/i)).not.toBeInTheDocument()
      })
    })

    it("should render notification for single unread message", async () => {
      const user = mockUsers.chairperson
      const messages = createMockMessages(user.id, 1)
      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(screen.getByText("1 Unread Message")).toBeInTheDocument()
        expect(screen.getByText("You have new messages in your inbox")).toBeInTheDocument()
      })
    })

    it("should render notification for multiple unread messages", async () => {
      const user = mockUsers.catchment_manager
      const messages = createMockMessages(user.id, 5)
      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(screen.getByText("5 Unread Messages")).toBeInTheDocument()
      })
    })

    it("should handle view messages callback", async () => {
      const user = mockUsers.permitting_officer
      const messages = createMockMessages(user.id, 3)
      const onViewMessages = vi.fn()

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<UnreadMessageNotification user={user} onViewMessages={onViewMessages} />)

      await waitFor(() => {
        expect(screen.getByText("3 Unread Messages")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText("View Messages"))
      expect(onViewMessages).toHaveBeenCalledTimes(1)
    })

    it("should be dismissible", async () => {
      const user = mockUsers.ict
      const messages = createMockMessages(user.id, 2)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(screen.getByText("2 Unread Messages")).toBeInTheDocument()
      })

      // Find and click the dismiss button (X)
      const dismissButton =
        screen.getByRole("button", { name: /close/i }) ||
        screen.getByText("×") ||
        screen.getAllByRole("button").find((btn) => btn.textContent?.includes("×"))

      if (dismissButton) {
        fireEvent.click(dismissButton)

        await waitFor(() => {
          expect(screen.queryByText("2 Unread Messages")).not.toBeInTheDocument()
        })
      }
    })
  })

  describe("Dashboard Header Notifications", () => {
    it("should show unread count in header for chairperson", async () => {
      const user = mockUsers.chairperson
      const messages = createMockMessages(user.id, 7)
      const onLogout = vi.fn()
      const onMessagesClick = vi.fn()

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<DashboardHeader user={user} onLogout={onLogout} onMessagesClick={onMessagesClick} />)

      await waitFor(() => {
        expect(screen.getByText("7")).toBeInTheDocument()
        expect(screen.getByText("Messages")).toBeInTheDocument()
      })
    })

    it("should handle large unread counts (99+)", async () => {
      const user = mockUsers.catchment_manager
      const messages = createMockMessages(user.id, 150)
      const onLogout = vi.fn()

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<DashboardHeader user={user} onLogout={onLogout} />)

      await waitFor(() => {
        expect(screen.getByText("99+")).toBeInTheDocument()
      })
    })

    it("should call onMessagesClick when messages button is clicked", async () => {
      const user = mockUsers.permitting_officer
      const messages = createMockMessages(user.id, 3)
      const onLogout = vi.fn()
      const onMessagesClick = vi.fn()

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<DashboardHeader user={user} onLogout={onLogout} onMessagesClick={onMessagesClick} />)

      await waitFor(() => {
        expect(screen.getByText("Messages")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText("Messages"))
      expect(onMessagesClick).toHaveBeenCalledTimes(1)
    })
  })

  describe("Specialized Dashboard Integration", () => {
    it("should show notifications in Chairperson Dashboard", async () => {
      const user = mockUsers.chairperson
      const messages = createMockMessages(user.id, 4)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<ChairpersonDashboard user={user} />)

      await waitFor(() => {
        expect(screen.getByText("4 Unread Messages")).toBeInTheDocument()
        expect(screen.getByText("View Messages")).toBeInTheDocument()
      })
    })

    it("should show notifications in Catchment Manager Dashboard", async () => {
      const user = mockUsers.catchment_manager
      const messages = createMockMessages(user.id, 6)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<CatchmentManagerDashboard user={user} />)

      await waitFor(() => {
        expect(screen.getByText("6 Unread Messages")).toBeInTheDocument()
      })
    })

    it("should handle messages view navigation in specialized dashboards", async () => {
      const user = mockUsers.chairperson
      const messages = createMockMessages(user.id, 2)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<ChairpersonDashboard user={user} />)

      await waitFor(() => {
        expect(screen.getByText("2 Unread Messages")).toBeInTheDocument()
      })

      // Click view messages
      fireEvent.click(screen.getByText("View Messages"))

      await waitFor(() => {
        expect(screen.getByText("Messages")).toBeInTheDocument()
        expect(screen.getByText("← Back to Dashboard")).toBeInTheDocument()
      })
    })
  })

  describe("Real-time Polling", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should poll for new messages every 30 seconds", async () => {
      const user = mockUsers.ict
      let messageCount = 1

      vi.mocked(db.getMessages).mockImplementation(() => {
        const messages = createMockMessages(user.id, messageCount)
        return Promise.resolve(messages.filter((m) => !m.isPublic))
      })

      render(<UnreadMessageNotification user={user} />)

      // Initial load
      await waitFor(() => {
        expect(screen.getByText("1 Unread Message")).toBeInTheDocument()
      })

      // Simulate new message arriving
      messageCount = 3

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(screen.getByText("3 Unread Messages")).toBeInTheDocument()
      })

      // Verify polling continues
      messageCount = 5
      vi.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(screen.getByText("5 Unread Messages")).toBeInTheDocument()
      })
    })

    it("should handle polling errors gracefully", async () => {
      const user = mockUsers.chairperson
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      vi.mocked(db.getMessages).mockRejectedValue(new Error("Database error"))

      render(<UnreadMessageNotification user={user} />)

      // Fast-forward to trigger polling
      vi.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to load unread message count:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe("Message Type Handling", () => {
    it("should count both public and private unread messages", async () => {
      const user = mockUsers.catchment_manager

      // Create mix of public and private messages
      const publicMessages: Message[] = [
        {
          id: "pub1",
          senderId: "other_user",
          receiverId: user.id,
          content: "Public message 1",
          isPublic: true,
          createdAt: new Date(),
          readAt: undefined,
        },
        {
          id: "pub2",
          senderId: "other_user",
          receiverId: user.id,
          content: "Public message 2",
          isPublic: true,
          createdAt: new Date(),
          readAt: undefined,
        },
      ]

      const privateMessages: Message[] = [
        {
          id: "priv1",
          senderId: "other_user",
          receiverId: user.id,
          content: "Private message 1",
          isPublic: false,
          createdAt: new Date(),
          readAt: undefined,
        },
      ]

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(isPublic ? publicMessages : privateMessages)
      })

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(screen.getByText("3 Unread Messages")).toBeInTheDocument()
      })
    })

    it("should not count messages sent by the user themselves", async () => {
      const user = mockUsers.permitting_officer

      const messages: Message[] = [
        {
          id: "own1",
          senderId: user.id, // User's own message
          receiverId: "other_user",
          content: "Own message",
          isPublic: false,
          createdAt: new Date(),
          readAt: undefined,
        },
        {
          id: "received1",
          senderId: "other_user",
          receiverId: user.id,
          content: "Received message",
          isPublic: false,
          createdAt: new Date(),
          readAt: undefined,
        },
      ]

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(screen.getByText("1 Unread Message")).toBeInTheDocument()
      })
    })

    it("should not count already read messages", async () => {
      const user = mockUsers.ict

      const messages: Message[] = [
        {
          id: "read1",
          senderId: "other_user",
          receiverId: user.id,
          content: "Read message",
          isPublic: false,
          createdAt: new Date(),
          readAt: new Date(), // Already read
        },
        {
          id: "unread1",
          senderId: "other_user",
          receiverId: user.id,
          content: "Unread message",
          isPublic: false,
          createdAt: new Date(),
          readAt: undefined, // Not read
        },
      ]

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(screen.getByText("1 Unread Message")).toBeInTheDocument()
      })
    })
  })

  describe("Cross-User Type Compatibility", () => {
    const userTypes = ["chairperson", "catchment_manager", "permitting_officer", "ict"] as const

    userTypes.forEach((userType) => {
      it(`should work correctly for ${userType} user type`, async () => {
        const user = mockUsers[userType]
        const messages = createMockMessages(user.id, 3)

        vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
          return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
        })

        render(<UnreadMessageNotification user={user} />)

        await waitFor(() => {
          expect(screen.getByText("3 Unread Messages")).toBeInTheDocument()
          expect(screen.getByText("You have new messages in your inbox")).toBeInTheDocument()
          expect(screen.getByText("View Messages")).toBeInTheDocument()
        })
      })
    })
  })
})
