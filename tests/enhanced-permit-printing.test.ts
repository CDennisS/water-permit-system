import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPrinter } from "@/components/permit-printer"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import { canPrintPermits } from "@/lib/auth"
import type { PermitApplication, User } from "@/types"

// Mock dependencies
vi.mock("@/lib/enhanced-permit-generator")
vi.mock("@/lib/auth")
vi.mock("@/hooks/use-toast")

const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock window.open for print testing
const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
  focus: vi.fn(),
  print: vi.fn(),
  close: vi.fn(),
}

Object.defineProperty(window, "open", {
  writable: true,
  value: vi.fn(() => mockPrintWindow),
})

// Mock URL.createObjectURL for download testing
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "mock-blob-url"),
})

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
})

// Test data
const mockApplication: PermitApplication = {
  id: "test-app-1",
  applicationNumber: "APP-2024-001",
  applicantName: "John Doe",
  physicalAddress: "123 Main Street, Harare",
  postalAddress: "P.O. Box 123, Harare",
  landSize: 10.5,
  numberOfBoreholes: 2,
  waterAllocation: 50,
  intendedUse: "irrigation",
  gpsLatitude: -17.8252,
  gpsLongitude: 31.0335,
  status: "approved",
  submittedAt: new Date("2024-01-15"),
  approvedAt: new Date("2024-01-20"),
  permitNumber: "UMSCC-2024-01-0001",
}

const mockPermittingOfficer: User = {
  id: "user-1",
  username: "officer1",
  email: "officer@umscc.co.zw",
  userType: "permitting_officer",
  fullName: "Jane Smith",
  isActive: true,
}

const mockApplicant: User = {
  id: "user-2",
  username: "applicant1",
  email: "applicant@example.com",
  userType: "applicant",
  fullName: "John Doe",
  isActive: true,
}

const mockPermitData = {
  permitNumber: "UMSCC-2024-01-0001",
  applicantName: "John Doe",
  physicalAddress: "123 Main Street, Harare",
  postalAddress: "P.O. Box 123, Harare",
  landSize: 10.5,
  numberOfBoreholes: 2,
  totalAllocatedAbstraction: 50000,
  intendedUse: "irrigation",
  validUntil: "January 20, 2025",
  issueDate: "January 20, 2024",
  gpsCoordinates: { latitude: -17.8252, longitude: 31.0335 },
  catchment: "MANYAME",
  subCatchment: "UPPER MANYAME",
  permitType: "temporary",
  boreholeDetails: [
    {
      boreholeNumber: "BH-01",
      allocatedAmount: 25000,
      gpsX: "-17.825200",
      gpsY: "31.033500",
      intendedUse: "irrigation",
      maxAbstractionRate: 27500,
      waterSampleFrequency: "3 months",
    },
    {
      boreholeNumber: "BH-02",
      allocatedAmount: 25000,
      gpsX: "-17.825300",
      gpsY: "31.033600",
      intendedUse: "irrigation",
      maxAbstractionRate: 27500,
      waterSampleFrequency: "3 months",
    },
  ],
}

describe("Enhanced Permit Printing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(preparePermitData).mockReturnValue(mockPermitData)
    vi.mocked(canPrintPermits).mockReturnValue(true)

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Permission Checks", () => {
    it("should allow printing for permitting officers with approved applications", () => {
      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
      expect(screen.getByText("Print Permit")).toBeInTheDocument()
      expect(screen.queryByText("Cannot Print Permit")).not.toBeInTheDocument()
    })

    it("should deny printing for applicants", () => {
      vi.mocked(canPrintPermits).mockReturnValue(false)

      render(<PermitPrinter application={mockApplication} user={mockApplicant} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.getByText(/User type 'applicant' cannot print permits/)).toBeInTheDocument()
      expect(screen.queryByText("Preview Permit")).not.toBeInTheDocument()
    })

    it("should deny printing for unapproved applications", () => {
      const unapprovedApplication = { ...mockApplication, status: "pending" as const }

      render(<PermitPrinter application={unapprovedApplication} user={mockPermittingOfficer} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.getByText("Application must be approved first")).toBeInTheDocument()
    })

    it("should deny printing for unauthenticated users", () => {
      render(<PermitPrinter application={mockApplication} user={null} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.getByText("User not authenticated")).toBeInTheDocument()
    })
  })

  describe("Print Functionality", () => {
    it("should open print preview dialog", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Permit Preview - UMSCC-2024-01-0001")).toBeInTheDocument()
      })
    })

    it("should handle print from preview dialog", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      // Open preview
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Permit Preview - UMSCC-2024-01-0001")).toBeInTheDocument()
      })

      // Click print button in dialog
      const printButtons = screen.getAllByText("Print")
      await user.click(printButtons[0])

      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith("", "_blank", "width=800,height=600")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Initiated",
          description: "Permit has been sent to printer.",
        })
      })
    })

    it("should handle direct print without preview", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      // Click direct print button
      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith("", "_blank", "width=800,height=600")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Initiated",
          description: "Permit has been sent to printer.",
        })
      })
    })

    it("should handle print window blocked error", async () => {
      const user = userEvent.setup()
      vi.mocked(window.open).mockReturnValue(null)

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive",
        })
      })
    })

    it("should show loading state during printing", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      const printButton = screen.getByText("Print Permit")
      await user.click(printButton)

      // Should show loading state briefly
      expect(screen.getByText("Printing...")).toBeInTheDocument()
    })
  })

  describe("Download Functionality", () => {
    it("should handle permit download", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      // Open preview to access download button
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Mock document.createElement and appendChild
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
        setAttribute: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as any)

      await user.click(screen.getByText("Download"))

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
        expect(mockLink.click).toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith({
          title: "Download Complete",
          description: "Permit document has been downloaded.",
        })
      })
    })

    it("should handle download errors gracefully", async () => {
      const user = userEvent.setup()

      // Mock URL.createObjectURL to throw an error
      vi.mocked(URL.createObjectURL).mockImplementation(() => {
        throw new Error("Blob creation failed")
      })

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      await user.click(screen.getByText("Download"))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Download Error",
          description: "An error occurred while downloading. Please try again.",
          variant: "destructive",
        })
      })
    })
  })

  describe("Performance Optimizations", () => {
    it("should memoize permit data preparation", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      expect(preparePermitData).toHaveBeenCalledTimes(1)

      // Rerender with same props
      rerender(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      // Should not call preparePermitData again due to memoization
      expect(preparePermitData).toHaveBeenCalledTimes(1)
    })

    it("should recalculate permit data when application changes", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      expect(preparePermitData).toHaveBeenCalledTimes(1)

      // Rerender with different application
      const updatedApplication = { ...mockApplication, applicantName: "Jane Doe" }
      rerender(<PermitPrinter application={updatedApplication} user={mockPermittingOfficer} />)

      // Should call preparePermitData again
      expect(preparePermitData).toHaveBeenCalledTimes(2)
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      expect(screen.getByLabelText(`Preview permit ${mockPermitData.permitNumber}`)).toBeInTheDocument()
      expect(screen.getByLabelText(`Print permit ${mockPermitData.permitNumber}`)).toBeInTheDocument()
    })

    it("should have proper dialog accessibility", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByText("Preview of permit document for John Doe")).toHaveClass("sr-only")
      })
    })

    it("should handle disabled state properly", () => {
      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} disabled={true} />)

      const printButton = screen.getByLabelText("Print permit (disabled)")
      expect(printButton).toBeDisabled()
    })
  })

  describe("Error Handling", () => {
    it("should handle missing permit template gracefully", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      // Mock getElementById to return null
      vi.spyOn(document, "getElementById").mockReturnValue(null)
      vi.spyOn(document, "createElement").mockImplementation(() => {
        throw new Error("Failed to create element")
      })

      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Error",
          description: "Unable to generate permit template for printing.",
          variant: "destructive",
        })
      })
    })

    it("should handle print exceptions gracefully", async () => {
      const user = userEvent.setup()

      // Mock window.open to throw an error
      vi.mocked(window.open).mockImplementation(() => {
        throw new Error("Print failed")
      })

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Error",
          description: "An error occurred while printing. Please try again.",
          variant: "destructive",
        })
      })
    })
  })

  describe("Development Mode Logging", () => {
    it("should log debug information in development mode", () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "development"

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      expect(console.log).toHaveBeenCalledWith("PermitPrinter - User:", mockPermittingOfficer)
      expect(console.log).toHaveBeenCalledWith("PermitPrinter - User type:", "permitting_officer")
      expect(console.log).toHaveBeenCalledWith("PermitPrinter - Application status:", "approved")

      process.env.NODE_ENV = originalEnv
    })

    it("should not log in production mode", () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "production"

      render(<PermitPrinter application={mockApplication} user={mockPermittingOfficer} />)

      expect(console.log).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })
})
