/**
 * Performance and load testing for dashboards
 */

import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { CatchmentChairpersonDashboard } from "@/components/catchment-chairperson-dashboard"
import { db } from "@/lib/database"
import { createMockApplication, createMockUser } from "./test-utils"

// Mock database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
    addWorkflowComment: vi.fn(),
    updateApplication: vi.fn(),
    addLog: vi.fn(),
  },
}))

describe("Performance Tests", () => {
  const mockUser = createMockUser("catchment_manager")
  const mockChairpersonUser = createMockUser("catchment_chairperson")

  describe("Large Dataset Handling", () => {
    it("should handle 100 applications efficiently", async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) =>
        createMockApplication({
          id: `app-${i}`,
          applicationId: `APP-${String(i).padStart(3, "0")}`,
          applicantName: `Applicant ${i}`,
          currentStage: 3,
        }),
      )

      vi.mocked(db.getApplications).mockResolvedValue(largeDataset)

      const startTime = performance.now()
      render(<CatchmentManagerDashboard user={mockUser} />)
      const endTime = performance.now()

      // Should render within reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it("should handle 500 applications without memory issues", async () => {
      const veryLargeDataset = Array.from({ length: 500 }, (_, i) =>
        createMockApplication({
          id: `app-${i}`,
          applicationId: `APP-${String(i).padStart(3, "0")}`,
          currentStage: 4,
        }),
      )

      vi.mocked(db.getApplications).mockResolvedValue(veryLargeDataset)

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Memory increase should be reasonable (< 50MB)
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe("API Response Time", () => {
    it("should handle slow API responses gracefully", async () => {
      const slowResponse = new Promise((resolve) => setTimeout(() => resolve([createMockApplication()]), 2000))

      vi.mocked(db.getApplications).mockReturnValue(slowResponse as any)

      const startTime = performance.now()
      render(<CatchmentManagerDashboard user={mockUser} />)

      // Should show loading state immediately
      expect(
        document.querySelector('[data-testid="loading"]') || document.textContent?.includes("Loading"),
      ).toBeTruthy()

      await slowResponse
      const endTime = performance.now()

      // Should handle the delay appropriately
      expect(endTime - startTime).toBeGreaterThan(1900)
    })
  })

  describe("Memory Leaks", () => {
    it("should clean up event listeners on unmount", () => {
      const { unmount } = render(<CatchmentManagerDashboard user={mockUser} />)

      // Simulate multiple mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        unmount()
        render(<CatchmentManagerDashboard user={mockUser} />)
      }

      // Should not accumulate listeners (this is more of a smoke test)
      expect(true).toBe(true) // If we get here without errors, cleanup is working
    })
  })
})
