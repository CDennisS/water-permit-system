import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { EnhancedReportsAnalytics } from "@/components/enhanced-reports-analytics"
import { db } from "@/lib/database"
import type { PermitApplication } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
  },
}))

// Mock recharts to avoid canvas issues in tests
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

// Generate mock data for performance testing
const generateMockApplications = (count: number): PermitApplication[] => {
  const applications: PermitApplication[] = []
  const statuses = ["approved", "rejected", "submitted", "under_review", "unsubmitted"]
  const permitTypes = ["urban", "bulk_water", "irrigation", "institution", "industrial"]
  const waterSources = ["ground_water", "surface_water"]

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const submittedAt =
      Math.random() > 0.3 ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined
    const approvedAt =
      submittedAt && Math.random() > 0.5
        ? new Date(submittedAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
        : undefined

    applications.push({
      id: `app-${i}`,
      applicationId: `APP-2024-${String(i).padStart(4, "0")}`,
      applicantName: `Applicant ${i}`,
      physicalAddress: `Address ${i}`,
      customerAccountNumber: `ACC-${i}`,
      cellularNumber: `+263${Math.floor(Math.random() * 1000000000)}`,
      permitType: permitTypes[Math.floor(Math.random() * permitTypes.length)],
      waterSource: waterSources[Math.floor(Math.random() * waterSources.length)],
      waterAllocation: Math.floor(Math.random() * 1000) + 1,
      landSize: Math.floor(Math.random() * 500) + 1,
      gpsLatitude: -17.8 + Math.random() * 0.5,
      gpsLongitude: 31.0 + Math.random() * 0.5,
      status: statuses[Math.floor(Math.random() * statuses.length)] as any,
      currentStage: Math.floor(Math.random() * 4) + 1,
      createdAt,
      updatedAt: createdAt,
      submittedAt,
      approvedAt,
      documents: [],
      comments: [],
      intendedUse: `Use case ${i}`,
    })
  }

  return applications
}

describe("Advanced Reports Analytics - Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should handle large datasets efficiently (1000 applications)", async () => {
    const startTime = performance.now()
    const mockApplications = generateMockApplications(1000)

    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should render within 2 seconds even with 1000 applications
    expect(renderTime).toBeLessThan(2000)
    expect(screen.getByText("1000 applications")).toBeInTheDocument()
  })

  it("should handle very large datasets (5000 applications)", async () => {
    const startTime = performance.now()
    const mockApplications = generateMockApplications(5000)

    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should still render within 5 seconds even with 5000 applications
    expect(renderTime).toBeLessThan(5000)
    expect(screen.getByText("5000 applications")).toBeInTheDocument()
  })

  it("should filter applications efficiently", async () => {
    const mockApplications = generateMockApplications(1000)
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Test filtering performance
    const startTime = performance.now()

    // Apply multiple filters
    const statusCheckbox = screen.getByLabelText("Approved")
    fireEvent.click(statusCheckbox)

    const permitTypeCheckbox = screen.getByLabelText("Urban")
    fireEvent.click(permitTypeCheckbox)

    await waitFor(() => {
      // Should update filtered count
      expect(screen.getByText(/applications/)).toBeInTheDocument()
    })

    const endTime = performance.now()
    const filterTime = endTime - startTime

    // Filtering should be fast (under 500ms)
    expect(filterTime).toBeLessThan(500)
  })

  it("should generate charts efficiently", async () => {
    const mockApplications = generateMockApplications(500)
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    const startTime = performance.now()

    // Switch between different chart types
    const distributionTab = screen.getByText("Distribution")
    fireEvent.click(distributionTab)

    await waitFor(() => {
      expect(screen.getAllByTestId("pie-chart")).toHaveLength(2)
    })

    const performanceTab = screen.getByText("Performance")
    fireEvent.click(performanceTab)

    await waitFor(() => {
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
    })

    const endTime = performance.now()
    const chartTime = endTime - startTime

    // Chart generation should be fast (under 1 second)
    expect(chartTime).toBeLessThan(1000)
  })

  it("should export reports efficiently", async () => {
    const mockApplications = generateMockApplications(1000)
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = vi.fn(() => "mock-url")
    global.URL.revokeObjectURL = vi.fn()

    // Mock document.createElement and related DOM methods
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    }
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    const startTime = performance.now()

    const exportButton = screen.getByText("Export Detailed Report")
    fireEvent.click(exportButton)

    const endTime = performance.now()
    const exportTime = endTime - startTime

    // Export should be fast (under 2 seconds for 1000 records)
    expect(exportTime).toBeLessThan(2000)
    expect(mockAnchor.click).toHaveBeenCalled()
  })

  it("should handle memory efficiently with large datasets", async () => {
    const mockApplications = generateMockApplications(2000)
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    const { unmount } = render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Test multiple filter operations
    for (let i = 0; i < 10; i++) {
      const statusCheckbox = screen.getByLabelText("Approved")
      fireEvent.click(statusCheckbox)
      fireEvent.click(statusCheckbox) // Toggle off
    }

    // Component should still be responsive
    expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()

    // Cleanup should not throw errors
    expect(() => unmount()).not.toThrow()
  })

  it("should handle concurrent filter operations", async () => {
    const mockApplications = generateMockApplications(1000)
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    const startTime = performance.now()

    // Apply multiple filters rapidly
    const approvedCheckbox = screen.getByLabelText("Approved")
    const urbanCheckbox = screen.getByLabelText("Urban")
    const groundWaterCheckbox = screen.getByLabelText("Ground water")

    fireEvent.click(approvedCheckbox)
    fireEvent.click(urbanCheckbox)
    fireEvent.click(groundWaterCheckbox)

    await waitFor(() => {
      // Should handle concurrent updates without issues
      expect(screen.getByText(/applications/)).toBeInTheDocument()
    })

    const endTime = performance.now()
    const concurrentTime = endTime - startTime

    // Concurrent operations should complete quickly
    expect(concurrentTime).toBeLessThan(1000)
  })

  it("should maintain performance with complex date filtering", async () => {
    const mockApplications = generateMockApplications(1000)
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    const startTime = performance.now()

    // Test date range filtering
    const timeRangeSelect = screen.getByDisplayValue("Last 30 Days")
    fireEvent.change(timeRangeSelect, { target: { value: "last_90_days" } })

    await waitFor(() => {
      expect(screen.getByText(/applications/)).toBeInTheDocument()
    })

    const endTime = performance.now()
    const dateFilterTime = endTime - startTime

    // Date filtering should be efficient
    expect(dateFilterTime).toBeLessThan(500)
  })
})
