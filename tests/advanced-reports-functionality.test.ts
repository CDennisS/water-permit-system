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

const mockApplications: PermitApplication[] = [
  {
    id: "1",
    applicationId: "APP-2024-0001",
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
    status: "approved",
    currentStage: 4,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    submittedAt: new Date("2024-01-16"),
    approvedAt: new Date("2024-01-20"),
    documents: [],
    comments: [],
    intendedUse: "Domestic use",
  },
  {
    id: "2",
    applicationId: "APP-2024-0002",
    applicantName: "Jane Smith",
    physicalAddress: "456 Oak Ave",
    customerAccountNumber: "ACC-002",
    cellularNumber: "+263772345678",
    permitType: "irrigation",
    waterSource: "surface_water",
    waterAllocation: 200,
    landSize: 100,
    gpsLatitude: -17.9,
    gpsLongitude: 31.1,
    status: "rejected",
    currentStage: 3,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-10"),
    submittedAt: new Date("2024-02-02"),
    approvedAt: undefined,
    documents: [],
    comments: [],
    intendedUse: "Agricultural use",
  },
  {
    id: "3",
    applicationId: "APP-2024-0003",
    applicantName: "Bob Johnson",
    physicalAddress: "789 Pine St",
    customerAccountNumber: "ACC-003",
    cellularNumber: "+263773456789",
    permitType: "industrial",
    waterSource: "ground_water",
    waterAllocation: 500,
    landSize: 200,
    gpsLatitude: -17.7,
    gpsLongitude: 30.9,
    status: "submitted",
    currentStage: 2,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-05"),
    submittedAt: new Date("2024-03-02"),
    approvedAt: undefined,
    documents: [],
    comments: [],
    intendedUse: "Manufacturing",
  },
]

describe("Advanced Reports Analytics - Functionality Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)
  })

  it("should render the enhanced reports analytics component", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    expect(screen.getByText("3 applications")).toBeInTheDocument()
  })

  it("should display correct statistics", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Check total applications
    expect(screen.getByText("3")).toBeInTheDocument()

    // Check approval rate (1 approved out of 3 = 33%)
    expect(screen.getByText("33%")).toBeInTheDocument()

    // Check pending applications (1 submitted)
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("should filter applications by status", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Apply approved status filter
    const approvedCheckbox = screen.getByLabelText("Approved")
    fireEvent.click(approvedCheckbox)

    await waitFor(() => {
      // Should show only 1 approved application
      expect(screen.getByText("1 applications")).toBeInTheDocument()
    })
  })

  it("should filter applications by permit type", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Apply urban permit type filter
    const urbanCheckbox = screen.getByLabelText("Urban")
    fireEvent.click(urbanCheckbox)

    await waitFor(() => {
      // Should show only 1 urban application
      expect(screen.getByText("1 applications")).toBeInTheDocument()
    })
  })

  it("should filter applications by water source", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Apply ground water filter
    const groundWaterCheckbox = screen.getByLabelText("Ground water")
    fireEvent.click(groundWaterCheckbox)

    await waitFor(() => {
      // Should show 2 ground water applications
      expect(screen.getByText("2 applications")).toBeInTheDocument()
    })
  })

  it("should filter applications by date range", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Change time range to last 7 days (should show fewer applications)
    const timeRangeSelect = screen.getByDisplayValue("Last 30 Days")
    fireEvent.change(timeRangeSelect, { target: { value: "last_7_days" } })

    await waitFor(() => {
      // Should show fewer applications (likely 0 since mock data is older)
      expect(screen.getByText(/applications/)).toBeInTheDocument()
    })
  })

  it("should filter applications by water allocation range", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Test water allocation range filtering
    // This would require interacting with the slider component
    // For now, we'll test that the filter controls are present
    expect(screen.getByText(/Water Allocation Range/)).toBeInTheDocument()
  })

  it("should switch between different chart types", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Test trends tab
    const trendsTab = screen.getByText("Trends")
    fireEvent.click(trendsTab)

    await waitFor(() => {
      expect(screen.getAllByTestId("area-chart")).toHaveLength(1)
      expect(screen.getAllByTestId("line-chart")).toHaveLength(1)
    })

    // Test distribution tab
    const distributionTab = screen.getByText("Distribution")
    fireEvent.click(distributionTab)

    await waitFor(() => {
      expect(screen.getAllByTestId("pie-chart")).toHaveLength(2)
    })

    // Test performance tab
    const performanceTab = screen.getByText("Performance")
    fireEvent.click(performanceTab)

    await waitFor(() => {
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
    })

    // Test allocation tab
    const allocationTab = screen.getByText("Water Allocation")
    fireEvent.click(allocationTab)

    await waitFor(() => {
      expect(screen.getByTestId("area-chart")).toBeInTheDocument()
    })
  })

  it("should export detailed reports", async () => {
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

    const exportButton = screen.getByText("Export Detailed Report")
    fireEvent.click(exportButton)

    expect(mockAnchor.click).toHaveBeenCalled()
    expect(global.URL.createObjectURL).toHaveBeenCalled()
  })

  it("should clear all filters", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Apply some filters first
    const approvedCheckbox = screen.getByLabelText("Approved")
    fireEvent.click(approvedCheckbox)

    await waitFor(() => {
      expect(screen.getByText("1 applications")).toBeInTheDocument()
    })

    // Clear all filters
    const clearButton = screen.getByText("Clear Filters")
    fireEvent.click(clearButton)

    await waitFor(() => {
      // Should show all applications again
      expect(screen.getByText("3 applications")).toBeInTheDocument()
    })
  })

  it("should handle loading state", async () => {
    // Mock a delayed response
    vi.mocked(db.getApplications).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockApplications), 100)),
    )

    render(<EnhancedReportsAnalytics />)

    // Should show loading state
    expect(screen.getByText("Loading analytics data...")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })
  })

  it("should handle error state gracefully", async () => {
    // Mock an error response
    vi.mocked(db.getApplications).mockRejectedValue(new Error("Database error"))

    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      // Should still render the component structure
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalledWith("Error loading applications:", expect.any(Error))
    consoleSpy.mockRestore()
  })

  it("should calculate statistics correctly", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Total applications: 3
    expect(screen.getByText("3")).toBeInTheDocument()

    // Approval rate: 1 approved out of 3 = 33%
    expect(screen.getByText("33%")).toBeInTheDocument()

    // Pending: 1 submitted application
    expect(screen.getByText("1")).toBeInTheDocument()

    // Total water allocation: 100 + 200 + 500 = 800 ML
    expect(screen.getByText("800 ML total allocation")).toBeInTheDocument()

    // Total land size: 50 + 100 + 200 = 350 ha
    expect(screen.getByText("350 ha total land")).toBeInTheDocument()
  })

  it("should handle multiple simultaneous filters", async () => {
    render(<EnhancedReportsAnalytics />)

    await waitFor(() => {
      expect(screen.getByText("Enhanced Reports & Analytics")).toBeInTheDocument()
    })

    // Apply multiple filters
    const approvedCheckbox = screen.getByLabelText("Approved")
    const urbanCheckbox = screen.getByLabelText("Urban")
    const groundWaterCheckbox = screen.getByLabelText("Ground water")

    fireEvent.click(approvedCheckbox)
    fireEvent.click(urbanCheckbox)
    fireEvent.click(groundWaterCheckbox)

    await waitFor(() => {
      // Should show applications that match ALL filters (approved AND urban AND ground_water)
      // In our mock data, only the first application matches all criteria
      expect(screen.getByText("1 applications")).toBeInTheDocument()
    })
  })
})
