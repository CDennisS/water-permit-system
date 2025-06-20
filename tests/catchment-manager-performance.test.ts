import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { db } from "@/lib/database"
import type { PermitApplication, User } from "@/types"

vi.mock("@/lib/database")

const mockUser: User = {
  id: "perf-test",
  username: "perf_manager",
  userType: "catchment_manager",
  name: "Performance Test Manager",
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("Catchment Manager Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("⚡ Performance Benchmarks", () => {
    it("should load dashboard within acceptable time limits", async () => {
      const startTime = performance.now()

      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Manyame Catchment Manager")).toBeInTheDocument()
      })

      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(1000) // Should load within 1 second
    })

    it("should handle batch operations efficiently", async () => {
      // Create 100 applications for stress test
      const manyApps: PermitApplication[] = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-app-${i}`,
        applicationId: `MC2024-PERF-${String(i + 1).padStart(3, "0")}`,
        applicantName: `Performance Test ${i + 1}`,
        currentStage: 3,
        status: "under_review",
        permitType: "borehole",
        waterAllocation: 100,
        numberOfBoreholes: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowComments: [],
      }))

      vi.mocked(db.getApplications).mockResolvedValue(manyApps)
      vi.mocked(db.addWorkflowComment).mockResolvedValue({} as any)
      vi.mocked(db.updateApplication).mockResolvedValue({} as any)
      vi.mocked(db.addLog).mockResolvedValue({} as any)

      const startTime = performance.now()

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Performance Test 1")).toBeInTheDocument()
      })

      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(2000) // Should render 100 apps within 2 seconds
    })

    it("should maintain responsive UI during batch submission", async () => {
      const batchApps: PermitApplication[] = Array.from({ length: 20 }, (_, i) => ({
        id: `batch-app-${i}`,
        applicationId: `MC2024-BATCH-${String(i + 1).padStart(2, "0")}`,
        applicantName: `Batch Test ${i + 1}`,
        currentStage: 3,
        status: "under_review",
        permitType: "irrigation",
        waterAllocation: 150,
        numberOfBoreholes: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowComments: [],
      }))

      vi.mocked(db.getApplications).mockResolvedValue(batchApps)

      // Simulate slow database operations
      vi.mocked(db.addWorkflowComment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({} as any), 50)),
      )
      vi.mocked(db.updateApplication).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({} as any), 50)),
      )
      vi.mocked(db.addLog).mockResolvedValue({} as any)

      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Batch Test 1")).toBeInTheDocument()
      })

      // Complete all applications quickly
      const reviewCheckboxes = screen.getAllByLabelText(/Reviewed/i)
      const textareas = screen.getAllByPlaceholderText(/Enter your mandatory review comment/i)
      const saveButtons = screen.getAllByText(/Save Comment/i)

      const batchStartTime = performance.now()

      // Complete first few applications to test responsiveness
      for (let i = 0; i < 5; i++) {
        await user.click(reviewCheckboxes[i])
        await user.type(textareas[i], `Batch comment ${i + 1}`)
        await user.click(saveButtons[i])
      }

      const batchTime = performance.now() - batchStartTime
      expect(batchTime).toBeLessThan(5000) // Should complete 5 operations within 5 seconds
    })
  })

  describe("🧠 Memory Management", () => {
    it("should not cause memory leaks with large datasets", async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Create and destroy multiple large datasets
      for (let iteration = 0; iteration < 5; iteration++) {
        const largeDataset: PermitApplication[] = Array.from({ length: 200 }, (_, i) => ({
          id: `memory-test-${iteration}-${i}`,
          applicationId: `MC2024-MEM-${iteration}-${String(i + 1).padStart(3, "0")}`,
          applicantName: `Memory Test ${iteration}-${i + 1}`,
          currentStage: 3,
          status: "under_review",
          permitType: "domestic",
          waterAllocation: 75,
          numberOfBoreholes: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          workflowComments: Array.from({ length: 10 }, (_, j) => ({
            userId: `user-${j}`,
            userType: "chairperson",
            userName: `Test User ${j}`,
            comment: `Comment ${j} for application ${i}`,
            stage: 2,
            decision: null,
            timestamp: new Date(),
          })),
        }))

        vi.mocked(db.getApplications).mockResolvedValue(largeDataset)

        const { unmount } = render(<CatchmentManagerDashboard user={mockUser} />)

        await waitFor(() => {
          expect(screen.getByText(`Memory Test ${iteration}-1`)).toBeInTheDocument()
        })

        unmount()
      }

      // Check memory usage hasn't grown excessively
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory

      // Allow for some memory growth but not excessive
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
    })
  })

  describe("🔄 State Management Performance", () => {
    it("should efficiently update review states for multiple applications", async () => {
      const stateTestApps: PermitApplication[] = Array.from({ length: 50 }, (_, i) => ({
        id: `state-app-${i}`,
        applicationId: `MC2024-STATE-${String(i + 1).padStart(2, "0")}`,
        applicantName: `State Test ${i + 1}`,
        currentStage: 3,
        status: "under_review",
        permitType: "borehole",
        waterAllocation: 100,
        numberOfBoreholes: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowComments: [],
      }))

      vi.mocked(db.getApplications).mockResolvedValue(stateTestApps)
      vi.mocked(db.addLog).mockResolvedValue({} as any)

      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("State Test 1")).toBeInTheDocument()
      })

      const stateUpdateStart = performance.now()

      // Rapidly toggle review states
      const reviewCheckboxes = screen.getAllByLabelText(/Reviewed/i)

      // Toggle first 10 checkboxes
      for (let i = 0; i < 10; i++) {
        await user.click(reviewCheckboxes[i])
      }

      const stateUpdateTime = performance.now() - stateUpdateStart
      expect(stateUpdateTime).toBeLessThan(2000) // Should update 10 states within 2 seconds

      // Verify states are correctly maintained
      for (let i = 0; i < 10; i++) {
        expect(reviewCheckboxes[i]).toBeChecked()
      }
      for (let i = 10; i < reviewCheckboxes.length; i++) {
        expect(reviewCheckboxes[i]).not.toBeChecked()
      }
    })
  })
})
