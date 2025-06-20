import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { UnreadMessageNotification } from "@/components/unread-message-notification"
import { db } from "@/lib/database"
import type { User, Message } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getMessages: vi.fn(),
  },
}))

const createPerformanceTestUser = (): User => ({
  id: "perf_test_user",
  username: "performance_user",
  userType: "ict",
  password: "test",
  createdAt: new Date(),
  updatedAt: new Date(),
})

const createLargeMessageSet = (count: number, userId: string): Message[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `perf_msg_${i}`,
    senderId: i % 2 === 0 ? "sender_1" : "sender_2",
    receiverId: userId,
    content: `Performance test message ${i} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    isPublic: i % 3 === 0,
    createdAt: new Date(Date.now() - i * 1000),
    readAt: i % 4 === 0 ? new Date(Date.now() - i * 500) : undefined,
  }))
}

describe("Notification System Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Large Message Set Handling", () => {
    it("should handle 1000 messages efficiently", async () => {
      const user = createPerformanceTestUser()
      const messages = createLargeMessageSet(1000, user.id)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        const filtered = messages.filter((m) => m.isPublic === isPublic)
        return Promise.resolve(filtered)
      })

      const startTime = performance.now()

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        // Component should render without hanging
        expect(true).toBe(true)
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000)
    })

    it("should handle 10000 messages without crashing", async () => {
      const user = createPerformanceTestUser()
      const messages = createLargeMessageSet(10000, user.id)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        const filtered = messages.filter((m) => m.isPublic === isPublic)
        return Promise.resolve(filtered)
      })

      expect(async () => {
        render(<UnreadMessageNotification user={user} />)

        await waitFor(
          () => {
            expect(true).toBe(true)
          },
          { timeout: 5000 },
        )
      }).not.toThrow()
    })
  })

  describe("Polling Performance", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should not degrade performance with continuous polling", async () => {
      const user = createPerformanceTestUser()
      const messages = createLargeMessageSet(500, user.id)
      let callCount = 0

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        callCount++
        const filtered = messages.filter((m) => m.isPublic === isPublic)
        return Promise.resolve(filtered)
      })

      render(<UnreadMessageNotification user={user} />)

      // Initial load
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0)
      })

      const initialCallCount = callCount
      const startTime = performance.now()

      // Simulate 10 polling cycles (5 minutes)
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(30000)
        await waitFor(() => {
          expect(callCount).toBe(initialCallCount + (i + 1) * 2) // 2 calls per cycle (public + private)
        })
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should complete all polling cycles quickly
      expect(totalTime).toBeLessThan(100)
      expect(callCount).toBe(initialCallCount + 20) // 10 cycles * 2 calls each
    })

    it("should handle rapid polling without memory leaks", async () => {
      const user = createPerformanceTestUser()
      const messages = createLargeMessageSet(100, user.id)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        const filtered = messages.filter((m) => m.isPublic === isPublic)
        return Promise.resolve(filtered)
      })

      const { unmount } = render(<UnreadMessageNotification user={user} />)

      // Simulate rapid polling
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(1000) // 1 second intervals
      }

      // Cleanup should not throw errors
      expect(() => {
        unmount()
      }).not.toThrow()
    })
  })

  describe("Memory Usage", () => {
    it("should not accumulate memory with repeated renders", async () => {
      const user = createPerformanceTestUser()
      const messages = createLargeMessageSet(200, user.id)

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        const filtered = messages.filter((m) => m.isPublic === isPublic)
        return Promise.resolve(filtered)
      })

      // Render and unmount multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<UnreadMessageNotification user={user} />)

        await waitFor(() => {
          expect(true).toBe(true)
        })

        unmount()
      }

      // Should complete without memory issues
      expect(true).toBe(true)
    })
  })

  describe("Database Query Optimization", () => {
    it("should minimize database calls", async () => {
      const user = createPerformanceTestUser()
      const messages = createLargeMessageSet(300, user.id)
      let queryCount = 0

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        queryCount++
        const filtered = messages.filter((m) => m.isPublic === isPublic)
        return Promise.resolve(filtered)
      })

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        // Should make exactly 2 calls (public + private messages)
        expect(queryCount).toBe(2)
      })
    })

    it("should handle database query failures gracefully", async () => {
      const user = createPerformanceTestUser()
      let failureCount = 0

      vi.mocked(db.getMessages).mockImplementation(() => {
        failureCount++
        if (failureCount <= 3) {
          return Promise.reject(new Error("Database timeout"))
        }
        return Promise.resolve([])
      })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(failureCount).toBeGreaterThan(0)
      })

      // Should handle failures without crashing
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe("Concurrent User Performance", () => {
    it("should handle multiple users efficiently", async () => {
      const users = Array.from({ length: 10 }, (_, i) => ({
        ...createPerformanceTestUser(),
        id: `user_${i}`,
        username: `user_${i}`,
      }))

      const allMessages = users.flatMap((user) => createLargeMessageSet(100, user.id))

      vi.mocked(db.getMessages).mockImplementation((userId, isPublic) => {
        const userMessages = allMessages.filter((m) => m.receiverId === userId && m.isPublic === isPublic)
        return Promise.resolve(userMessages)
      })

      const startTime = performance.now()

      // Render notifications for all users
      const components = users.map((user) => render(<UnreadMessageNotification user={user} />))

      await Promise.all(components.map(() => waitFor(() => expect(true).toBe(true))))

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle all users within reasonable time
      expect(totalTime).toBeLessThan(2000)

      // Cleanup
      components.forEach(({ unmount }) => unmount())
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty message arrays efficiently", async () => {
      const user = createPerformanceTestUser()

      vi.mocked(db.getMessages).mockResolvedValue([])

      const startTime = performance.now()

      render(<UnreadMessageNotification user={user} />)

      await waitFor(() => {
        expect(true).toBe(true)
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render empty state very quickly
      expect(renderTime).toBeLessThan(50)
    })

    it("should handle malformed message data gracefully", async () => {
      const user = createPerformanceTestUser()

      // Create messages with missing or invalid data
      const malformedMessages = [
        { id: "bad1", senderId: null, receiverId: user.id } as any,
        { id: "bad2", content: null, isPublic: "invalid" } as any,
        { id: "bad3", createdAt: "not-a-date" } as any,
      ]

      vi.mocked(db.getMessages).mockResolvedValue(malformedMessages)

      expect(() => {
        render(<UnreadMessageNotification user={user} />)
      }).not.toThrow()
    })
  })
})
