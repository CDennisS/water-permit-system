import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EnhancedReportsAnalytics } from "@/components/enhanced-reports-analytics"
import { db } from "@/lib/database"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
  },
}))

// Mock recharts for testing
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

const mockApplications = [
  {
    id: "1",
    applicationId: "APP-2024-001",
    applicantName: "John Doe",
    physicalAddress: "123 Main St",
    customerAccountNumber: "ACC-001",
    cellularNumber: "+263771234567",
    permitType: "urban",
    waterSource: "ground_water",
    waterAllocation: 100,
    landSize: 50,
    gpsLatitude: -17.8,
    gpsLongitude: 31.0,
    status: "approved" as const,
    currentStage: 4,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    submittedAt: new Date("2024-01-15"),
    approvedAt: new Date("2024-01-20"),
    documents: [],
    comments: [],
    intendedUse: "Domestic use",
  },
  {
    id: "2",
    applicationId: "APP-2024-002",
    applicantName: "Jane Smith",
    physicalAddress: "456 Oak Ave",
    customerAccountNumber: "ACC-002",
    cellularNumber: "+263771234568",
    permitType: "irrigation",
    waterSource: "surface_water",
    waterAllocation: 200,
    landSize: 100,
    gpsLatitude: -17.9,
    gpsLongitude: 31.1,
    status: "submitted" as const,
    currentStage: 2,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    submittedAt: new Date("2024-02-01"),
    approvedAt: null,
    documents: [],
    comments: [],
    intendedUse: "Agricultural irrigation",
  },
  {
    id: "3",
    applicationId: "APP-2024-003",
    applicantName: "Bob Johnson",
    physicalAddress: "789 Pine St",
    customerAccountNumber: "ACC-003",
    cellularNumber: "+263771234569",
    permitType: "industrial",
    waterSource: "ground_water",
    waterAllocation: 500,
    landSize: 200,
    gpsLatitude: -17.7,
    gpsLongitude: 30.9,
    status: "rejected" as const,
    currentStage: 3,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
    submittedAt: new Date("2024-01-10"),
    approvedAt: null,
    documents: [],
    comments: [],
    intendedUse: "Manufacturing process",
  },
]

describe("Deployment Readiness Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)
  })

  describe("Enhanced Reports Analytics - Core Functionality", () => {
    it("should load and display applications correctly", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should show correct statistics
      expect(screen.getByText("3 applications")).toBeInTheDocument()
      expect(screen.getByText("33%")).toBeInTheDocument() // 1 approved out of 3 = 33%
    })

    it("should handle search filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test search functionality
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "John")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })

      // Clear search
      await user.clear(searchInput)
      await waitFor(() => {
        expect(screen.getByText("3 applications")).toBeInTheDocument()
      })
    })

    it("should handle date filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test date filtering
      const startDateInput = screen.getByLabelText("Start Date")
      await user.type(startDateInput, "2024-01-20")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })
    })

    it("should handle permit type filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test permit type filtering
      const permitTypeSelect = screen.getByRole("combobox")
      await user.click(permitTypeSelect)

      const urbanOption = screen.getByText("Urban")
      await user.click(urbanOption)

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })
    })

    it("should handle joint filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "APP-2024")

      const startDateInput = screen.getByLabelText("Start Date")
      await user.type(startDateInput, "2024-01-01")

      const endDateInput = screen.getByLabelText("End Date")
      await user.type(endDateInput, "2024-01-31")

      await waitFor(() => {
        // Should show applications that match all criteria
        expect(screen.getByText("2 applications")).toBeInTheDocument()
      })
    })

    it("should clear all filters correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply some filters
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "John")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })

      // Clear all filters
      const clearButton = screen.getByText("Clear All")
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText("3 applications")).toBeInTheDocument()
        expect(searchInput).toHaveValue("")
      })
    })

    it("should export reports correctly", async () => {
      const user = userEvent.setup()

      // Mock URL.createObjectURL and related functions
      const mockCreateObjectURL = vi.fn(() => "mock-url")
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      const mockCreateElement = vi.fn(() => mockAnchor)
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()

      document.createElement = mockCreateElement
      document.body.appendChild = mockAppendChild
      document.body.removeChild = mockRemoveChild

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test export functionality
      const exportButton = screen.getByText("Export Report")
      await user.click(exportButton)

      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty data gracefully", async () => {
      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      expect(screen.getByText("0 applications")).toBeInTheDocument()
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle network errors gracefully", async () => {
      vi.mocked(db.getApplications).mockRejectedValue(new Error("Network error"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Error Loading Analytics Data")).toBeInTheDocument()
      })

      expect(screen.getByText("Failed to load applications. Please try again.")).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should handle malformed data gracefully", async () => {
      const malformedData = [
        {
          id: "1",
          applicationId: null,
          applicantName: undefined,
          permitType: "",
          status: "approved" as const,
          createdAt: new Date(),
          waterAllocation: null,
          landSize: undefined,
        },
      ]

      vi.mocked(db.getApplications).mockResolvedValue(malformedData as any)

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should handle null/undefined values gracefully
      expect(screen.getByText("1 applications")).toBeInTheDocument()
    })
  })

  describe("Performance and Scalability", () => {
    it("should handle large datasets efficiently", async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        applicationId: `APP-2024-${String(i + 1).padStart(4, "0")}`,
        applicantName: `Applicant ${i + 1}`,
        physicalAddress: `Address ${i + 1}`,
        customerAccountNumber: `ACC-${i + 1}`,
        cellularNumber: `+263${Math.floor(Math.random() * 1000000000)}`,
        permitType: ["urban", "irrigation", "industrial"][i % 3],
        waterSource: ["ground_water", "surface_water"][i % 2],
        waterAllocation: Math.floor(Math.random() * 500) + 50,
        landSize: Math.floor(Math.random() * 200) + 10,
        gpsLatitude: -17.8 + Math.random() * 0.2,
        gpsLongitude: 31.0 + Math.random() * 0.2,
        status: ["approved", "submitted", "rejected"][i % 3] as const,
        currentStage: Math.floor(Math.random() * 4) + 1,
        createdAt: new Date(2024, 0, 1 + (i % 365)),
        updatedAt: new Date(2024, 0, 1 + (i % 365)),
        submittedAt: new Date(2024, 0, 1 + (i % 365)),
        approvedAt: i % 3 === 0 ? new Date(2024, 0, 1 + (i % 365)) : null,
        documents: [],
        comments: [],
        intendedUse: `Use case ${i + 1}`,
      }))

      vi.mocked(db.getApplications).mockResolvedValue(largeDataset as any)

      const startTime = performance.now()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000)
      expect(screen.getByText("1000 applications")).toBeInTheDocument()
    })

    it("should handle rapid filter changes efficiently", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")

      // Simulate rapid typing
      const startTime = performance.now()
      await user.type(searchInput, "test")
      await user.clear(searchInput)
      await user.type(searchInput, "john")
      await user.clear(searchInput)
      const endTime = performance.now()

      const operationTime = endTime - startTime

      // Should handle rapid changes efficiently
      expect(operationTime).toBeLessThan(1000)
      expect(screen.getByText("3 applications")).toBeInTheDocument()
    })
  })

  describe("Browser Compatibility", () => {
    it("should work without modern JavaScript features", async () => {
      // Mock older browser environment
      const originalURL = global.URL
      delete (global as any).URL

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should still render basic functionality
      expect(screen.getByText("3 applications")).toBeInTheDocument()

      // Restore URL
      global.URL = originalURL
    })

    it("should handle touch events for mobile", async () => {
      // Mock touch events
      const mockTouchEvent = new Event("touchstart")

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const permitTypeSelect = screen.getByRole("combobox")
      fireEvent(permitTypeSelect, mockTouchEvent)

      // Should not crash on touch events
      expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Check for proper form labels
      expect(screen.getByLabelText("Search Applications")).toBeInTheDocument()
      expect(screen.getByLabelText("Start Date")).toBeInTheDocument()
      expect(screen.getByLabelText("End Date")).toBeInTheDocument()
      expect(screen.getByLabelText("Permit Type")).toBeInTheDocument()

      // Check for proper roles
      expect(screen.getByRole("combobox")).toBeInTheDocument()
      expect(screen.getAllByRole("button")).toHaveLength(3) // Clear All, Refresh, Export
    })

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test keyboard navigation
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.tab()

      // Should be able to focus on form elements
      expect(document.activeElement).toBe(searchInput)
    })
  })

  describe("Data Integrity", () => {
    it("should maintain data consistency during filtering", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply filter
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "John")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })

      // Check that statistics are consistent with filtered data
      expect(screen.getByText("100%")).toBeInTheDocument() // 1 approved out of 1 = 100%
    })

    it("should handle concurrent filter operations", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply multiple filters simultaneously
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      const startDateInput = screen.getByLabelText("Start Date")

      await Promise.all([user.type(searchInput, "APP"), user.type(startDateInput, "2024-01-01")])

      await waitFor(() => {
        // Should handle concurrent operations without data corruption
        expect(screen.getByText(/applications/)).toBeInTheDocument()
      })
    })
  })
})
