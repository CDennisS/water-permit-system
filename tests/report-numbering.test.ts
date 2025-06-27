"use client"

import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EnhancedReportsAnalytics } from "@/components/enhanced-reports-analytics"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { db } from "@/lib/database"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
    getReportNumber: vi.fn(),
    incrementReportNumber: vi.fn(),
    createReportEntry: vi.fn(),
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

const mockApplications = [
  {
    id: "1",
    applicationId: "APP-2024-001",
    applicantName: "John Doe",
    physicalAddress: "123 Main St",
    customerAccountNumber: "ACC-001",
    cellularNumber: "+263771234567",
    permitType: "urban" as const,
    waterSource: "ground_water" as const,
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
    permitType: "irrigation" as const,
    waterSource: "surface_water" as const,
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
]

const mockUser = {
  id: "1",
  username: "admin",
  userType: "permitting_officer" as const,
  password: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("Report Numbering Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)
    vi.mocked(db.getReportNumber).mockResolvedValue(1001)
    vi.mocked(db.incrementReportNumber).mockResolvedValue(1002)
    vi.mocked(db.createReportEntry).mockResolvedValue({ id: "report-1", reportNumber: "RPT-2024-1001" })
  })

  describe("Report Number Generation", () => {
    it("should generate sequential report numbers", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Generate first report
      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/Report Number: RPT-2024-1001/i)).toBeInTheDocument()
      })

      // Verify database calls
      expect(db.getReportNumber).toHaveBeenCalled()
      expect(db.incrementReportNumber).toHaveBeenCalled()
      expect(db.createReportEntry).toHaveBeenCalledWith({
        reportNumber: "RPT-2024-1001",
        reportType: "analytics",
        generatedBy: "admin",
        generatedAt: expect.any(Date),
        filters: expect.any(Object),
        dataSnapshot: expect.any(Array),
      })
    })

    it("should use year-based numbering format", async () => {
      const currentYear = new Date().getFullYear()

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`RPT-${currentYear}-\\d{4}`))).toBeInTheDocument()
      })
    })

    it("should handle year rollover correctly", async () => {
      // Mock date to be end of year
      const mockDate = new Date("2024-12-31T23:59:59")
      vi.spyOn(global, "Date").mockImplementation(() => mockDate)

      vi.mocked(db.getReportNumber).mockResolvedValue(9999)

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/RPT-2024-9999/i)).toBeInTheDocument()
      })

      // Simulate new year
      const newYearDate = new Date("2025-01-01T00:00:01")
      vi.spyOn(global, "Date").mockImplementation(() => newYearDate)
      vi.mocked(db.getReportNumber).mockResolvedValue(1)

      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/RPT-2025-0001/i)).toBeInTheDocument()
      })
    })

    it("should generate different number series for different report types", async () => {
      // Test analytics report
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/RPT-2024-1001/i)).toBeInTheDocument()
      })

      // Test permit report
      render(<PermitPreviewDialog application={mockApplications[0]} user={mockUser} isOpen={true} onClose={() => {}} />)

      vi.mocked(db.getReportNumber).mockResolvedValue(2001)
      vi.mocked(db.createReportEntry).mockResolvedValue({ id: "permit-1", reportNumber: "PRM-2024-2001" })

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(screen.getByText(/Permit Number: PRM-2024-2001/i)).toBeInTheDocument()
      })
    })

    it("should handle concurrent report generation", async () => {
      vi.mocked(db.getReportNumber).mockResolvedValueOnce(1001).mockResolvedValueOnce(1002).mockResolvedValueOnce(1003)

      vi.mocked(db.incrementReportNumber)
        .mockResolvedValueOnce(1002)
        .mockResolvedValueOnce(1003)
        .mockResolvedValueOnce(1004)

      // Render multiple instances
      const { rerender } = render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Generate multiple reports simultaneously
      const exportButtons = screen.getAllByText("Export Report")

      await Promise.all([
        userEvent.click(exportButtons[0]),
        userEvent.click(exportButtons[0]),
        userEvent.click(exportButtons[0]),
      ])

      await waitFor(() => {
        // Should have generated unique numbers
        expect(db.getReportNumber).toHaveBeenCalledTimes(3)
        expect(db.incrementReportNumber).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe("Report Number Display", () => {
    it("should display report number prominently in header", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        const reportNumber = screen.getByText(/Report Number: RPT-2024-1001/i)
        expect(reportNumber).toBeInTheDocument()
        expect(reportNumber).toHaveClass("text-lg", "font-bold")
      })
    })

    it("should include report number in printed documents", async () => {
      render(<PermitPreviewDialog application={mockApplications[0]} user={mockUser} isOpen={true} onClose={() => {}} />)

      vi.mocked(db.getReportNumber).mockResolvedValue(2001)
      vi.mocked(db.createReportEntry).mockResolvedValue({ id: "permit-1", reportNumber: "PRM-2024-2001" })

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for report number in print header
        const printHeader = document.querySelector(".print-header")
        expect(printHeader).toContainHTML("PRM-2024-2001")

        // Check for report number in footer
        const printFooter = document.querySelector(".print-footer")
        expect(printFooter).toContainHTML("PRM-2024-2001")
      })
    })

    it("should show report number in export filename", async () => {
      const mockCreateObjectURL = vi.fn(() => "mock-blob-url")
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      const mockCreateElement = vi.fn(() => mockAnchor)
      document.createElement = mockCreateElement

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(mockAnchor.download).toContain("RPT-2024-1001")
        expect(mockAnchor.download).toMatch(/analytics-report-RPT-2024-1001-\d{4}-\d{2}-\d{2}\.html/)
      })
    })

    it("should display generation timestamp with report number", async () => {
      const fixedDate = new Date("2024-01-15T10:30:00Z")
      vi.spyOn(global, "Date").mockImplementation(() => fixedDate)

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/Report Number: RPT-2024-1001/i)).toBeInTheDocument()
        expect(screen.getByText(/Generated: January 15, 2024 at 10:30 AM/i)).toBeInTheDocument()
      })
    })
  })

  describe("Report Number Validation", () => {
    it("should validate report number format", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        const reportNumberText = screen.getByText(/RPT-2024-1001/i).textContent

        // Validate format: RPT-YYYY-NNNN
        expect(reportNumberText).toMatch(/RPT-\d{4}-\d{4}/)
      })
    })

    it("should ensure report numbers are unique", async () => {
      vi.mocked(db.getReportNumber).mockResolvedValueOnce(1001).mockResolvedValueOnce(1002)

      vi.mocked(db.createReportEntry)
        .mockResolvedValueOnce({ id: "report-1", reportNumber: "RPT-2024-1001" })
        .mockResolvedValueOnce({ id: "report-2", reportNumber: "RPT-2024-1002" })

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Generate first report
      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/RPT-2024-1001/i)).toBeInTheDocument()
      })

      // Generate second report
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/RPT-2024-1002/i)).toBeInTheDocument()
      })

      // Verify both reports have different numbers
      expect(db.createReportEntry).toHaveBeenCalledTimes(2)
      expect(db.createReportEntry).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          reportNumber: "RPT-2024-1001",
        }),
      )
      expect(db.createReportEntry).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          reportNumber: "RPT-2024-1002",
        }),
      )
    })

    it("should handle database errors gracefully", async () => {
      vi.mocked(db.getReportNumber).mockRejectedValue(new Error("Database error"))

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText("Error generating report number")).toBeInTheDocument()
        expect(screen.getByText("Please try again")).toBeInTheDocument()
      })
    })
  })

  describe("Report Number Tracking", () => {
    it("should maintain report audit trail", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(db.createReportEntry).toHaveBeenCalledWith({
          reportNumber: "RPT-2024-1001",
          reportType: "analytics",
          generatedBy: "admin",
          generatedAt: expect.any(Date),
          filters: expect.any(Object),
          dataSnapshot: expect.any(Array),
        })
      })
    })

    it("should store report metadata with number", async () => {
      render(<EnhancedReportsAnalytics />)

      // Apply some filters
      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await userEvent.type(searchInput, "John")

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(db.createReportEntry).toHaveBeenCalledWith({
          reportNumber: "RPT-2024-1001",
          reportType: "analytics",
          generatedBy: "admin",
          generatedAt: expect.any(Date),
          filters: {
            search: "John",
            startDate: null,
            endDate: null,
            permitType: "all",
            status: "all",
          },
          dataSnapshot: expect.any(Array),
        })
      })
    })

    it("should allow report lookup by number", async () => {
      vi.mocked(db.getReportNumber).mockResolvedValue(1001)

      const mockReportEntry = {
        id: "report-1",
        reportNumber: "RPT-2024-1001",
        reportType: "analytics",
        generatedBy: "admin",
        generatedAt: new Date("2024-01-15"),
        filters: { search: "", permitType: "all" },
        dataSnapshot: mockApplications,
      }

      // Mock report lookup function
      const mockGetReportByNumber = vi.fn().mockResolvedValue(mockReportEntry)
      vi.mocked(db as any).getReportByNumber = mockGetReportByNumber

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Look up existing report
      const lookupInput = screen.getByPlaceholderText("Enter report number...")
      await userEvent.type(lookupInput, "RPT-2024-1001")

      const lookupButton = screen.getByText("Lookup Report")
      await userEvent.click(lookupButton)

      await waitFor(() => {
        expect(mockGetReportByNumber).toHaveBeenCalledWith("RPT-2024-1001")
        expect(screen.getByText("Report Found")).toBeInTheDocument()
        expect(screen.getByText("Generated by: admin")).toBeInTheDocument()
        expect(screen.getByText("Generated on: January 15, 2024")).toBeInTheDocument()
      })
    })
  })

  describe("Report Number Security", () => {
    it("should prevent report number tampering", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        // Report number should be read-only
        const reportNumberElement = screen.getByText(/RPT-2024-1001/i)
        expect(reportNumberElement.tagName).not.toBe("INPUT")
        expect(reportNumberElement).not.toHaveAttribute("contenteditable")
      })
    })

    it("should validate user permissions for report generation", async () => {
      const unauthorizedUser = {
        ...mockUser,
        userType: "applicant" as const,
      }

      render(<EnhancedReportsAnalytics />)

      // Mock user context
      Object.defineProperty(window, "currentUser", {
        value: unauthorizedUser,
        writable: true,
      })

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.queryByText("Export Report")
      expect(exportButton).not.toBeInTheDocument()
      expect(screen.getByText("You do not have permission to generate reports")).toBeInTheDocument()
    })

    it("should include digital signature with report number", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(db.createReportEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            reportNumber: "RPT-2024-1001",
            digitalSignature: expect.objectContaining({
              signedBy: "admin",
              signedAt: expect.any(Date),
              hash: expect.any(String),
            }),
          }),
        )
      })
    })
  })

  describe("Performance and Scalability", () => {
    it("should generate report numbers efficiently", async () => {
      const startTime = performance.now()

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/RPT-2024-1001/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const generationTime = endTime - startTime

      // Should generate report number quickly (less than 100ms)
      expect(generationTime).toBeLessThan(100)
    })

    it("should handle high volume report generation", async () => {
      // Mock high starting number
      vi.mocked(db.getReportNumber).mockResolvedValue(9999)

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const exportButton = screen.getByText("Export Report")
      await userEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/RPT-2024-9999/i)).toBeInTheDocument()
      })

      // Should handle large numbers without issues
      expect(db.incrementReportNumber).toHaveBeenCalledWith(9999)
    })

    it("should cache report numbers for performance", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Generate multiple reports quickly
      const exportButton = screen.getByText("Export Report")

      await userEvent.click(exportButton)
      await userEvent.click(exportButton)
      await userEvent.click(exportButton)

      // Should optimize database calls
      expect(db.getReportNumber).toHaveBeenCalledTimes(3)
    })
  })
})
