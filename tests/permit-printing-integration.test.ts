import { describe, it, expect, vi, beforeEach, afterEach, fireEvent } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPrinter } from "@/components/permit-printer"
import { PermitTemplate } from "@/components/permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { PermitApplication, User } from "@/types"

// Mock dependencies
vi.mock("@/lib/enhanced-permit-generator")
vi.mock("@/lib/auth", () => ({
  canPrintPermits: () => true,
}))

const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock PermitTemplate component
vi.mock("@/components/permit-template", () => ({
  PermitTemplate: vi.fn(({ permitData, id }) => (
    <div id={id} data-testid="permit-template">
      <h1>Permit {permitData.permitNumber}</h1>
      <p>Applicant: {permitData.applicantName}</p>
      <p>Valid Until: {permitData.validUntil}</p>
    </div>
  )),
}))

// Mock print functionality
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
  ],
}

describe("Permit Printing Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(preparePermitData).mockReturnValue(mockPermitData)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Full Print Workflow", () => {
    it("should complete full print workflow from preview", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      // Step 1: Open preview
      await user.click(screen.getByText("Preview Permit"))

      // Step 2: Verify preview dialog opens
      await waitFor(() => {
        expect(screen.getByText("Permit Preview - UMSCC-2024-01-0001")).toBeInTheDocument()
      })

      // Step 3: Verify PermitTemplate is rendered with correct data
      expect(PermitTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          permitData: mockPermitData,
          id: "permit-template-preview",
        }),
        expect.any(Object),
      )

      // Step 4: Click print button in dialog
      const printButtons = screen.getAllByText("Print")
      await user.click(printButtons[0])

      // Step 5: Verify print process
      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith("", "_blank", "width=800,height=600")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(mockPrintWindow.document.close).toHaveBeenCalled()
      })

      // Step 6: Verify success toast
      expect(mockToast).toHaveBeenCalledWith({
        title: "Print Initiated",
        description: "Permit has been sent to printer.",
      })
    })

    it("should handle direct print without preview", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      // Click direct print button
      await user.click(screen.getByText("Print Permit"))

      // Should create hidden template and print
      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith("", "_blank", "width=800,height=600")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: "Print Initiated",
        description: "Permit has been sent to printer.",
      })
    })
  })

  describe("Print Content Validation", () => {
    it("should generate correct print HTML content", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      })

      await user.click(screen.getAllByText("Print")[0])

      await waitFor(() => {
        const writeCall = mockPrintWindow.document.write.mock.calls[0][0]

        // Verify HTML structure
        expect(writeCall).toContain("<!DOCTYPE html>")
        expect(writeCall).toContain("<title>Permit UMSCC-2024-01-0001</title>")
        expect(writeCall).toContain("Permit UMSCC-2024-01-0001")
        expect(writeCall).toContain("Applicant: John Doe")
        expect(writeCall).toContain("Valid Until: January 20, 2025")

        // Verify CSS styles are included
        expect(writeCall).toContain("@page")
        expect(writeCall).toContain("font-family: 'Times New Roman'")
        expect(writeCall).toContain("@media print")
      })
    })

    it("should include all required permit data in print content", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(preparePermitData).toHaveBeenCalledWith(mockApplication)
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
      })
    })
  })

  describe("Error Recovery", () => {
    it("should recover from print window creation failure", async () => {
      const user = userEvent.setup()
      vi.mocked(window.open).mockReturnValueOnce(null)

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Print Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive",
        })
      })

      // Should be able to try again
      vi.mocked(window.open).mockReturnValue(mockPrintWindow)
      await user.click(screen.getByText("Print Permit"))

      await waitFor(() => {
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
      })
    })

    it("should handle permit data preparation errors", async () => {
      const user = userEvent.setup()
      vi.mocked(preparePermitData).mockImplementation(() => {
        throw new Error("Data preparation failed")
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
  })

  describe("State Management", () => {
    it("should manage loading states correctly", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")

      // Initial state
      expect(printButton).not.toBeDisabled()
      expect(printButton).toHaveTextContent("Print Permit")

      // Click print
      await user.click(printButton)

      // Should show loading state briefly
      expect(screen.getByText("Printing...")).toBeInTheDocument()

      // Should return to normal state
      await waitFor(() => {
        expect(screen.getByText("Print Permit")).toBeInTheDocument()
      })
    })

    it("should handle preview dialog state correctly", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      // Initially closed
      expect(screen.queryByText("Permit Preview")).not.toBeInTheDocument()

      // Open preview
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Permit Preview - UMSCC-2024-01-0001")).toBeInTheDocument()
      })

      // Close preview (simulate ESC key or clicking outside)
      fireEvent.keyDown(document, { key: "Escape" })

      await waitFor(() => {
        expect(screen.queryByText("Permit Preview - UMSCC-2024-01-0001")).not.toBeInTheDocument()
      })
    })
  })

  describe("Component Integration", () => {
    it("should properly integrate with PermitTemplate component", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(PermitTemplate).toHaveBeenCalledWith(
          {
            permitData: mockPermitData,
            id: "permit-template-preview",
          },
          expect.any(Object),
        )
      })

      // Verify template is rendered in preview
      expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      expect(screen.getByText("Permit UMSCC-2024-01-0001")).toBeInTheDocument()
    })

    it("should pass correct props to PermitTemplate", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApplication} user={mockUser} />)

      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(PermitTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            permitData: expect.objectContaining({
              permitNumber: "UMSCC-2024-01-0001",
              applicantName: "John Doe",
              physicalAddress: "123 Main Street, Harare",
              validUntil: "January 20, 2025",
            }),
            id: "permit-template-preview",
          }),
          expect.any(Object),
        )
      })
    })
  })
})
