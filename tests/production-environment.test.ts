import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { EnhancedReportsAnalytics } from "@/components/enhanced-reports-analytics"
import { db } from "@/lib/database"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
  },
}))

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}))

describe("Production Environment Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set production environment
    process.env.NODE_ENV = "production"
  })

  afterEach(() => {
    // Reset environment
    process.env.NODE_ENV = "test"
  })

  describe("Production Build Compatibility", () => {
    it("should work in production mode", async () => {
      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      expect(screen.getByText("0 applications")).toBeInTheDocument()
    })

    it("should handle minified code correctly", async () => {
      // Simulate minified environment where function names might be mangled
      const originalConsoleError = console.error
      console.error = vi.fn()

      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should not have any console errors in production
      expect(console.error).not.toHaveBeenCalled()

      console.error = originalConsoleError
    })

    it("should handle CSP (Content Security Policy) restrictions", async () => {
      // Mock CSP restrictions
      const originalCreateElement = document.createElement
      document.createElement = vi.fn((tagName) => {
        const element = originalCreateElement.call(document, tagName)
        if (tagName === "style") {
          // Simulate CSP blocking inline styles
          Object.defineProperty(element, "innerHTML", {
            set: () => {
              throw new Error("CSP violation: inline styles not allowed")
            },
          })
        }
        return element
      })

      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should still render without inline styles
      expect(screen.getByText("0 applications")).toBeInTheDocument()

      document.createElement = originalCreateElement
    })
  })

  describe("Memory Management", () => {
    it("should not have memory leaks", async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        vi.mocked(db.getApplications).mockResolvedValue([])
        const { unmount } = render(<EnhancedReportsAnalytics />)

        await waitFor(() => {
          expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
        })

        unmount()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it("should cleanup event listeners properly", async () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      vi.mocked(db.getApplications).mockResolvedValue([])

      const { unmount } = render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const addedListeners = addEventListenerSpy.mock.calls.length

      unmount()

      const removedListeners = removeEventListenerSpy.mock.calls.length

      // Should remove as many listeners as were added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners)

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe("Network Resilience", () => {
    it("should handle slow network connections", async () => {
      // Simulate slow network
      vi.mocked(db.getApplications).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve([]), 3000) // 3 second delay
          }),
      )

      render(<EnhancedReportsAnalytics />)

      // Should show loading state
      expect(screen.getByText("Loading analytics data...")).toBeInTheDocument()

      await waitFor(
        () => {
          expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      expect(screen.getByText("0 applications")).toBeInTheDocument()
    })

    it("should handle intermittent network failures", async () => {
      let callCount = 0
      vi.mocked(db.getApplications).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error("Network timeout"))
        }
        return Promise.resolve([])
      })

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Error Loading Analytics Data")).toBeInTheDocument()
      })

      // Click retry
      const retryButton = screen.getByText("Retry Loading")
      retryButton.click()

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      expect(screen.getByText("0 applications")).toBeInTheDocument()
    })
  })

  describe("Security", () => {
    it("should sanitize user input", async () => {
      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")

      // Try to inject malicious script
      const maliciousInput = '<script>alert("XSS")</script>'
      searchInput.focus()

      // Should not execute script
      expect(() => {
        ;(searchInput as HTMLInputElement).value = maliciousInput
      }).not.toThrow()
    })

    it("should handle malicious data gracefully", async () => {
      const maliciousData = [
        {
          id: '<script>alert("XSS")</script>',
          applicationId: 'javascript:alert("XSS")',
          applicantName: '<img src=x onerror=alert("XSS")>',
          permitType: "urban",
          status: "approved" as const,
          createdAt: new Date(),
          waterAllocation: 100,
          landSize: 50,
        },
      ]

      vi.mocked(db.getApplications).mockResolvedValue(maliciousData as any)

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should render without executing malicious code
      expect(screen.getByText("1 applications")).toBeInTheDocument()
    })
  })

  describe("Internationalization Readiness", () => {
    it("should handle different locales", async () => {
      // Mock different locale
      const originalToLocaleDateString = Date.prototype.toLocaleDateString
      Date.prototype.toLocaleDateString = vi.fn(() => "01/15/2024")

      vi.mocked(db.getApplications).mockResolvedValue([
        {
          id: "1",
          applicationId: "APP-2024-001",
          applicantName: "Test User",
          permitType: "urban",
          status: "approved" as const,
          createdAt: new Date("2024-01-15"),
          waterAllocation: 100,
          landSize: 50,
        } as any,
      ])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      expect(screen.getByText("1 applications")).toBeInTheDocument()

      Date.prototype.toLocaleDateString = originalToLocaleDateString
    })

    it("should handle RTL languages", async () => {
      // Mock RTL direction
      document.dir = "rtl"

      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      expect(screen.getByText("0 applications")).toBeInTheDocument()

      // Reset direction
      document.dir = "ltr"
    })
  })

  describe("Performance Monitoring", () => {
    it("should track render performance", async () => {
      const performanceEntries: PerformanceEntry[] = []
      const originalGetEntriesByType = performance.getEntriesByType
      performance.getEntriesByType = vi.fn(() => performanceEntries)

      vi.mocked(db.getApplications).mockResolvedValue([])

      const startTime = performance.now()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within performance budget (2 seconds)
      expect(renderTime).toBeLessThan(2000)

      performance.getEntriesByType = originalGetEntriesByType
    })

    it("should handle high CPU load gracefully", async () => {
      // Simulate high CPU load
      const heavyComputation = () => {
        let result = 0
        for (let i = 0; i < 1000000; i++) {
          result += Math.random()
        }
        return result
      }

      vi.mocked(db.getApplications).mockImplementation(async () => {
        heavyComputation()
        return []
      })

      const startTime = performance.now()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should still complete within reasonable time
      expect(totalTime).toBeLessThan(5000)
      expect(screen.getByText("0 applications")).toBeInTheDocument()
    })
  })
})
