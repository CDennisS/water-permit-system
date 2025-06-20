import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { db } from "@/lib/database"
import type { User, Message } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getMessages: vi.fn(),
    getApplications: vi.fn(),
    addLog: vi.fn(),
    updateApplication: vi.fn(),
    addWorkflowComment: vi.fn(),
  },
}))

const createE2EUser = (userType: string): User => ({
  id: `e2e_${userType}`,
  username: `${userType}_test`,
  userType: userType as any,
  password: "test",
  createdAt: new Date(),
  updatedAt: new Date(),
})

const createE2EMessages = (receiverId: string, scenarios: Array<{ unread: boolean; isPublic: boolean }>): Message[] => {
  return scenarios.map((scenario, i) => ({
    id: `e2e_msg_${i}`,
    senderId: "sender_id",
    receiverId,
    content: `E2E test message ${i}`,
    isPublic: scenario.isPublic,
    createdAt: new Date(Date.now() - i * 60000),
    readAt: scenario.unread ? undefined : new Date(Date.now() - i * 30000),
  }))
}

describe("End-to-End Notification Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock empty applications by default
    vi.mocked(db.getApplications).mockResolvedValue([])
  })

  describe("Complete User Journey - Chairperson", () => {
    it("should show notification, navigate to messages, and return to dashboard", async () => {
      const user = createE2EUser("chairperson")
      const messages = createE2EMessages(user.id, [
        { unread: true, isPublic: false },
        { unread: true, isPublic: true },
        { unread: false, isPublic: false },
      ])

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<ChairpersonDashboard user={user} />)

      // Step 1: Verify notification appears
      await waitFor(() => {
        expect(screen.getByText("2 Unread Messages")).toBeInTheDocument()
        expect(screen.getByText("You have new messages in your inbox")).toBeInTheDocument()
      })

      // Step 2: Click "View Messages"
      fireEvent.click(screen.getByText("View Messages"))

      // Step 3: Verify navigation to messages view
      await waitFor(() => {
        expect(screen.getByText("Messages")).toBeInTheDocument()
        expect(screen.getByText("← Back to Dashboard")).toBeInTheDocument()
      })

      // Step 4: Return to dashboard
      fireEvent.click(screen.getByText("← Back to Dashboard"))

      // Step 5: Verify back on dashboard (notification should be gone)
      await waitFor(() => {
        expect(screen.getByText("Upper Manyame Sub Catchment Council Chairperson")).toBeInTheDocument()
        expect(screen.queryByText("2 Unread Messages")).not.toBeInTheDocument()
      })
    })
  })

  describe("Complete User Journey - Catchment Manager", () => {
    it("should handle notification workflow in tabbed interface", async () => {
      const user = createE2EUser("catchment_manager")
      const messages = createE2EMessages(user.id, [
        { unread: true, isPublic: false },
        { unread: true, isPublic: false },
        { unread: true, isPublic: true },
      ])

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<CatchmentManagerDashboard user={user} />)

      // Step 1: Verify notification appears
      await waitFor(() => {
        expect(screen.getByText("3 Unread Messages")).toBeInTheDocument()
      })

      // Step 2: Click "View Messages" from notification
      fireEvent.click(screen.getByText("View Messages"))

      // Step 3: Verify navigation to messages
      await waitFor(() => {
        expect(screen.getByText("Messages")).toBeInTheDocument()
        expect(screen.getByText("← Back to Dashboard")).toBeInTheDocument()
      })

      // Step 4: Return to dashboard
      fireEvent.click(screen.getByText("← Back to Dashboard"))

      // Step 5: Verify return to main dashboard
      await waitFor(() => {
        expect(screen.getByText("Manyame Catchment Manager")).toBeInTheDocument()
      })
    })
  })

  describe("Real-time Update Simulation", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should update notification count when new messages arrive", async () => {
      const user = createE2EUser("chairperson")
      let messageCount = 1

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        const messages = createE2EMessages(
          user.id,
          Array.from({ length: messageCount }, () => ({ unread: true, isPublic: !isPublic })),
        )
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<ChairpersonDashboard user={user} />)

      // Step 1: Initial notification
      await waitFor(() => {
        expect(screen.getByText("1 Unread Message")).toBeInTheDocument()
      })

      // Step 2: Simulate new message arriving
      messageCount = 4
      vi.advanceTimersByTime(30000) // Trigger polling

      // Step 3: Verify updated count
      await waitFor(() => {
        expect(screen.getByText("4 Unread Messages")).toBeInTheDocument()
      })

      // Step 4: Simulate all messages read
      messageCount = 0
      vi.advanceTimersByTime(30000)

      // Step 5: Verify notification disappears
      await waitFor(() => {
        expect(screen.queryByText(/unread message/i)).not.toBeInTheDocument()
      })
    })
  })

  describe("Multi-User Scenario Simulation", () => {
    it("should handle different users with different message counts", async () => {
      const chairperson = createE2EUser("chairperson")
      const manager = createE2EUser("catchment_manager")

      const chairpersonMessages = createE2EMessages(chairperson.id, [
        { unread: true, isPublic: false },
        { unread: true, isPublic: false },
      ])

      const managerMessages = createE2EMessages(manager.id, [
        { unread: true, isPublic: true },
        { unread: true, isPublic: true },
        { unread: true, isPublic: false },
        { unread: true, isPublic: false },
        { unread: true, isPublic: false },
      ])

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        if (userId === chairperson.id) {
          return Promise.resolve(chairpersonMessages.filter((m) => m.isPublic === isPublic))
        } else if (userId === manager.id) {
          return Promise.resolve(managerMessages.filter((m) => m.isPublic === isPublic))
        }
        return Promise.resolve([])
      })

      // Render both dashboards
      const { rerender } = render(<ChairpersonDashboard user={chairperson} />)

      // Verify chairperson notifications
      await waitFor(() => {
        expect(screen.getByText("2 Unread Messages")).toBeInTheDocument()
      })

      // Switch to manager dashboard
      rerender(<CatchmentManagerDashboard user={manager} />)

      // Verify manager notifications
      await waitFor(() => {
        expect(screen.getByText("5 Unread Messages")).toBeInTheDocument()
      })
    })
  })

  describe("Error Recovery Scenarios", () => {
    it("should recover from database errors and continue functioning", async () => {
      const user = createE2EUser("chairperson")
      let shouldFail = true

      vi.mocked(db.getMessages).mockImplementation(() => {
        if (shouldFail) {
          shouldFail = false
          return Promise.reject(new Error("Database connection failed"))
        }
        return Promise.resolve(
          createE2EMessages(user.id, [{ unread: true, isPublic: false }]).filter((m) => !m.isPublic),
        )
      })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<ChairpersonDashboard user={user} />)

      // Initial load should fail
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Simulate retry after 30 seconds
      vi.useFakeTimers()
      vi.advanceTimersByTime(30000)

      // Should recover and show notification
      await waitFor(() => {
        expect(screen.getByText("1 Unread Message")).toBeInTheDocument()
      })

      vi.useRealTimers()
      consoleSpy.mockRestore()
    })
  })

  describe("Accessibility E2E Tests", () => {
    it("should support full keyboard navigation workflow", async () => {
      const user = createE2EUser("chairperson")
      const messages = createE2EMessages(user.id, [{ unread: true, isPublic: false }])

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(messages.filter((m) => m.isPublic === isPublic))
      })

      render(<ChairpersonDashboard user={user} />)

      await waitFor(() => {
        expect(screen.getByText("1 Unread Message")).toBeInTheDocument()
      })

      // Test keyboard navigation
      const viewButton = screen.getByText("View Messages")

      // Focus and activate with keyboard
      viewButton.focus()
      fireEvent.keyDown(viewButton, { key: "Enter" })

      await waitFor(() => {
        expect(screen.getByText("Messages")).toBeInTheDocument()
      })

      // Navigate back with keyboard
      const backButton = screen.getByText("← Back to Dashboard")
      backButton.focus()
      fireEvent.keyDown(backButton, { key: "Enter" })

      await waitFor(() => {
        expect(screen.getByText("Upper Manyame Sub Catchment Council Chairperson")).toBeInTheDocument()
      })
    })
  })

  describe("Performance E2E Tests", () => {
    it("should maintain responsiveness during heavy notification load", async () => {
      const user = createE2EUser("ict")
      const heavyMessageLoad = createE2EMessages(
        user.id,
        Array.from({ length: 500 }, (_, i) => ({
          unread: i % 2 === 0,
          isPublic: i % 3 === 0,
        })),
      )

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        return Promise.resolve(heavyMessageLoad.filter((m) => m.isPublic === isPublic))
      })

      const startTime = performance.now()

      render(<ChairpersonDashboard user={user} />)

      await waitFor(
        () => {
          expect(screen.getByText(/\d+ Unread Messages/)).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Should load within reasonable time even with heavy load
      expect(loadTime).toBeLessThan(3000)
    })
  })
})
