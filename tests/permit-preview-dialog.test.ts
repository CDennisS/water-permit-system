import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import type { PermitApplication, User } from "@/types"

// Mock the permit generator
vi.mock("@/lib/enhanced-permit-generator", () => ({
  preparePermitData: vi.fn(() => ({
    permitNumber: "GW7B/2024/001",
    issueDate: "2024-01-15",
    validUntil: "2029-01-15",
    applicantName: "John Doe",
    applicantAddress: "123 Main St, Harare",
    intendedUse: "Domestic",
    waterAllocation: 50,
    totalAllocatedAbstraction: 50000,
    boreholeDetails: [
      {
        boreholeNumber: "BH001",
        gpsCoordinates: "-17.8252, 31.0335",
        allocatedAmount: 50000,
        pumpingRate: 2.5,
        staticWaterLevel: 15,
        yieldTest: 3.0,
      },
    ],
    conditions: ["Water shall be used for domestic purposes only", "Permit holder must maintain accurate records"],
  })),
}))

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock window.open and print
const mockPrint = vi.fn()
const mockClose = vi.fn()
const mockFocus = vi.fn()
const mockWrite = vi.fn()

Object.defineProperty(window, "open", {
  writable: true,
  value: vi.fn(() => ({
    document: {
      write: mockWrite,
      close: vi.fn(),
    },
    focus: mockFocus,
    print: mockPrint,
    close: mockClose,
  })),
})

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:mock-url"),
})

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
})

describe("PermitPreviewDialog", () => {
  const mockApplication: PermitApplication = {
    id: "1",
    applicationNumber: "APP001",
    applicantName: "John Doe",
    applicantAddress: "123 Main St, Harare",
    contactNumber: "+263771234567",
    emailAddress: "john.doe@email.com",
    intendedUse: "Domestic",
    waterAllocation: 50,
    numberOfBoreholes: 1,
    gpsCoordinates: "-17.8252, 31.0335",
    status: "approved",
    submissionDate: new Date("2024-01-01"),
    lastModified: new Date("2024-01-15"),
    documents: [],
    comments: [],
    workflowStage: "approved",
    assignedTo: "permit_supervisor",
  }

  const mockPermittingOfficer: User = {
    id: "1",
    username: "admin",
    userType: "permitting_officer",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockApplicant: User = {
    id: "2",
    username: "applicant",
    userType: "applicant",
    password: "password",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOnPrint = vi.fn()
  const mockOnDownload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Rendering and Visibility", () => {
    it("should render preview button for authorized users with approved applications", () => {
      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
    })

    it("should not render for unauthorized users", () => {
      const { container } = render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockApplicant}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      expect(container.firstChild).toBeNull()
    })

    it("should not render for non-approved applications", () => {
      const pendingApplication = { ...mockApplication, status: "pending" as const }

      const { container } = render(
        <PermitPreviewDialog
          application={pendingApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      expect(container.firstChild).toBeNull()
    })

    it("should render for permit_issued status", () => {
      const issuedApplication = { ...mockApplication, status: "permit_issued" as const }

      render(
        <PermitPreviewDialog
          application={issuedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
    })
  })

  describe("Dialog Functionality", () => {
    it("should open dialog when preview button is clicked", async () => {
      const user = userEvent.setup()

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(screen.getByText("Permit Preview")).toBeInTheDocument()
    })

    it("should display permit information in dialog", async () => {
      const user = userEvent.setup()

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      expect(screen.getByText("GW7B/2024/001")).toBeInTheDocument()
      expect(screen.getByText("approved")).toBeInTheDocument()
    })

    it("should show print and download buttons in dialog", async () => {
      const user = userEvent.setup()

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument()
    })

    it("should close dialog when clicking outside or escape", async () => {
      const user = userEvent.setup()

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      expect(screen.getByRole("dialog")).toBeInTheDocument()

      // Press escape to close
      await user.keyboard("{Escape}")

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })
  })

  describe("Print Functionality", () => {
    it("should handle print action correctly", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return a mock element
      const mockElement = {
        innerHTML: "<div>Mock permit content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith("", "_blank")
        expect(mockWrite).toHaveBeenCalled()
        expect(mockFocus).toHaveBeenCalled()
        expect(mockPrint).toHaveBeenCalled()
        expect(mockClose).toHaveBeenCalled()
        expect(mockOnPrint).toHaveBeenCalled()
      })
    })

    it("should show loading state during print", async () => {
      const user = userEvent.setup()

      const mockElement = {
        innerHTML: "<div>Mock permit content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })

      // Click print button
      await user.click(printButton)

      // Button should be disabled during loading
      expect(printButton).toBeDisabled()
    })

    it("should handle print errors gracefully", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return null (error case)
      vi.spyOn(document, "getElementById").mockReturnValue(null)
      vi.spyOn(console, "error").mockImplementation(() => {})

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })
    })
  })

  describe("Download Functionality", () => {
    it("should handle download action correctly", async () => {
      const user = userEvent.setup()

      const mockElement = {
        innerHTML: "<div>Mock permit content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      // Mock document.createElement and appendChild/removeChild
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(URL.revokeObjectURL).toHaveBeenCalled()
        expect(mockOnDownload).toHaveBeenCalled()
      })
    })

    it("should set correct filename for download", async () => {
      const user = userEvent.setup()

      const mockElement = {
        innerHTML: "<div>Mock permit content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockAnchor.download).toBe("permit-GW7B/2024/001.html")
      })
    })

    it("should handle download errors gracefully", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return null (error case)
      vi.spyOn(document, "getElementById").mockReturnValue(null)
      vi.spyOn(console, "error").mockImplementation(() => {})

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Download failed:", expect.any(Error))
      })
    })
  })

  describe("User Permissions", () => {
    const testCases = [
      { userType: "permitting_officer", shouldShow: true },
      { userType: "permit_supervisor", shouldShow: true },
      { userType: "catchment_manager", shouldShow: true },
      { userType: "catchment_chairperson", shouldShow: true },
      { userType: "ict", shouldShow: true },
      { userType: "applicant", shouldShow: false },
      { userType: "chairperson", shouldShow: false },
    ]

    testCases.forEach(({ userType, shouldShow }) => {
      it(`should ${shouldShow ? "show" : "hide"} preview for ${userType}`, () => {
        const user = {
          ...mockPermittingOfficer,
          userType: userType as any,
        }

        const { container } = render(
          <PermitPreviewDialog
            application={mockApplication}
            currentUser={user}
            onPrint={mockOnPrint}
            onDownload={mockOnDownload}
          />,
        )

        if (shouldShow) {
          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        } else {
          expect(container.firstChild).toBeNull()
        }
      })
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", async () => {
      const user = userEvent.setup()

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      expect(previewButton).toHaveAttribute("type", "button")

      await user.click(previewButton)

      const dialog = screen.getByRole("dialog")
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute("aria-modal", "true")
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })

      // Focus and activate with keyboard
      previewButton.focus()
      await user.keyboard("{Enter}")

      expect(screen.getByRole("dialog")).toBeInTheDocument()

      // Should be able to tab to action buttons
      await user.keyboard("{Tab}")
      await user.keyboard("{Tab}")

      const printButton = screen.getByRole("button", { name: /print/i })
      expect(printButton).toHaveFocus()
    })
  })

  describe("Error Handling", () => {
    it("should handle missing permit data gracefully", async () => {
      const user = userEvent.setup()

      // Mock preparePermitData to return incomplete data
      vi.mocked(require("@/lib/enhanced-permit-generator").preparePermitData).mockReturnValue({
        permitNumber: "",
        issueDate: "",
        validUntil: "",
        applicantName: "",
        applicantAddress: "",
        intendedUse: "",
        waterAllocation: 0,
        totalAllocatedAbstraction: 0,
        boreholeDetails: [],
        conditions: [],
      })

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      // Dialog should still open but with empty/default values
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("should handle window.open failure", async () => {
      const user = userEvent.setup()

      // Mock window.open to return null
      vi.mocked(window.open).mockReturnValue(null)

      const mockElement = {
        innerHTML: "<div>Mock permit content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(
        <PermitPreviewDialog
          application={mockApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
          onDownload={mockOnDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should not crash and should still call onPrint
      await waitFor(() => {
        expect(mockOnPrint).toHaveBeenCalled()
      })
    })
  })
})
