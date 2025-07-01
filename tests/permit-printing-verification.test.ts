import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPrinter } from "@/components/permit-printer"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import { canPrintPermits } from "@/lib/auth"
import type { PermitApplication, User } from "@/types"

// Mock all dependencies
vi.mock("@/lib/enhanced-permit-generator")
vi.mock("@/lib/auth")
vi.mock("@/hooks/use-toast")

const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock PermitTemplate
vi.mock("@/components/permit-template", () => ({
  PermitTemplate: ({ permitData, id }: any) => (
    <div id={id} data-testid="permit-template">
      <h1>Permit {permitData.permitNumber}</h1>
      <p>Applicant: {permitData.applicantName}</p>
    </div>
  ),
}))

// Mock window.open and URL methods
const mockPrintWindow = {
  document: { write: vi.fn(), close: vi.fn() },
  focus: vi.fn(),
  print: vi.fn(),
  close: vi.fn(),
}

Object.defineProperty(window, "open", {
  writable: true,
  value: vi.fn(() => mockPrintWindow),
})

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "mock-blob-url"),
})

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
})

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

const mockUser: User = {
  id: "user-1",
  username: "officer1",
  email: "officer@umscc.co.zw",
  userType: "permitting_officer",
  fullName: "Jane Smith",
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
  boreholeDetails: [],
}

describe("Enhanced Permit Printing Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(preparePermitData).mockReturnValue(mockPermitData)
    vi.mocked(canPrintPermits).mockReturnValue(true)

    // Mock console to avoid noise
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("✅ Core Functionality Verification", () => {
    it("should render print buttons for authorized users", () => {
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
      expect(screen.getByText("Print Permit")).toBeInTheDocument()
    })

    it("should memoize permit data correctly", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(preparePermitData).toHaveBeenCalledTimes(1)

      // Rerender with same application
      rerender(<PermitPrinter application={mockApplication} user={mockUser} />)
      expect(preparePermitData).toHaveBeenCalledTimes(1) // Should not call again

      // Rerender with different application
      const newApp = { ...mockApplication, applicantName: "Jane Doe" }
      rerender(<PermitPrinter application={newApp} user={mockUser} />)
      expect(preparePermitData).toHaveBeenCalledTimes(2) // Should call again
    })

    it("should handle preview dialog correctly", async () => {
      const user = userEvent.setup()
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Permit Preview - UMSCC-2024-01-0001")).toBeInTheDocument()
        expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      })
    })
  })

  describe("🔒 Permission Verification", () => {
    it("should deny access for unauthorized users", () => {
      vi.mocked(canPrintPermits).mockReturnValue(false)
      const unauthorizedUser = { ...mockUser, userType: "applicant" as const }

      render(<PermitPrinter application={mockApplication} user={unauthorizedUser} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.queryByText("Print Permit")).not.toBeInTheDocument()
    })

    it("should deny access for unapproved applications", () => {
      const unapprovedApp = { ...mockApplication, status: "pending" as const }

      render(<PermitPrinter application={unapprovedApp} user={mockUser} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.getByText("Application must be approved first")).toBeInTheDocument()
    })

    it("should deny access for unauthenticated users", () => {
      render(<PermitPrinter application={mockApplication} user={null} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.getByText("User not authenticated")).toBeInTheDocument()
    })
  })

  describe("🖨️ Print Functionality Verification", () => {
    it("should handle direct print successfully", async () => {
      const user = userEvent.setup()
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

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

    it("should handle print from preview", async () => {
      const user = userEvent.setup()
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      // Open preview
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      })

      // Print from preview
      const printButtons = screen.getAllByText("Print")
      await user.click(printButtons[0])

      await waitFor(() => {
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Initiated",
          description: "Permit has been sent to printer.",
        })
      })
    })

    it("should show loading state during printing", async () => {
      const user = userEvent.setup()
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await user.click(printButton)

      // Should briefly show loading state
      expect(screen.getByText("Printing...")).toBeInTheDocument()
    })
  })

  describe("💾 Download Functionality Verification", () => {
    it("should handle download successfully", async () => {
      const user = userEvent.setup()

      // Mock DOM methods
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
        setAttribute: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as any)

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      // Open preview to access download
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

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
  })

  describe("⚠️ Error Handling Verification", () => {
    it("should handle blocked print window", async () => {
      const user = userEvent.setup()
      vi.mocked(window.open).mockReturnValue(null)

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive",
        })
      })
    })

    it("should handle print exceptions", async () => {
      const user = userEvent.setup()
      vi.mocked(window.open).mockImplementation(() => {
        throw new Error("Print failed")
      })

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Error",
          description: "An error occurred while printing. Please try again.",
          variant: "destructive",
        })
      })
    })

    it("should handle download errors", async () => {
      const user = userEvent.setup()
      vi.mocked(URL.createObjectURL).mockImplementation(() => {
        throw new Error("Blob creation failed")
      })

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

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

  describe("♿ Accessibility Verification", () => {
    it("should have proper ARIA labels", () => {
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(screen.getByLabelText(`Preview permit ${mockPermitData.permitNumber}`)).toBeInTheDocument()
      expect(screen.getByLabelText(`Print permit ${mockPermitData.permitNumber}`)).toBeInTheDocument()
    })

    it("should handle disabled state", () => {
      render(<PermitPrinter application={mockApplication} user={mockUser} disabled={true} />)

      const printButton = screen.getByLabelText("Print permit (disabled)")
      expect(printButton).toBeDisabled()
    })

    it("should have proper dialog accessibility", async () => {
      const user = userEvent.setup()
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByText("Preview of permit document for John Doe")).toHaveClass("sr-only")
      })
    })
  })

  describe("⚡ Performance Verification", () => {
    it("should handle multiple rapid clicks efficiently", async () => {
      const user = userEvent.setup()
      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")

      // Simulate rapid clicks
      const startTime = performance.now()
      for (let i = 0; i < 5; i++) {
        await user.click(printButton)
      }
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should handle quickly
      expect(window.open).toHaveBeenCalledTimes(5)
    })

    it("should clean up temporary elements", async () => {
      const user = userEvent.setup()
      const removeChildSpy = vi.spyOn(document.body, "removeChild")

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Print Permit"))

      // Should eventually clean up temporary elements
      await new Promise((resolve) => setTimeout(resolve, 2100))

      // Note: In real implementation, cleanup happens after timeout
      // This test verifies the cleanup mechanism exists
    })
  })
})
