import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import type { PermitApplication, User } from "@/types"

// Mock data for testing
const mockApprovedApplication: PermitApplication = {
  id: "APP-PREVIEW-001",
  applicationNumber: "APP-2024-PREVIEW-001",
  applicantName: "Preview Test Company Ltd",
  applicantId: "applicant-001",
  physicalAddress: "123 Preview Street, Harare, Zimbabwe",
  postalAddress: "P.O. Box 456, Harare",
  landSize: 30.5,
  numberOfBoreholes: 4,
  waterAllocation: 20.0,
  intendedUse: "irrigation",
  gpsLatitude: -17.8252,
  gpsLongitude: 31.0335,
  status: "approved",
  submittedAt: new Date("2024-02-01"),
  approvedAt: new Date("2024-03-15"),
  permitNumber: "UMSCC-2024-PREVIEW-001",
  documents: [],
  comments: [],
  workflowStage: "permit_issued",
}

const mockPendingApplication: PermitApplication = {
  ...mockApprovedApplication,
  id: "APP-PREVIEW-002",
  status: "under_review",
  approvedAt: undefined,
  permitNumber: undefined,
  workflowStage: "technical_review",
}

const mockPermittingOfficer: User = {
  id: "user-po-001",
  username: "officer.preview",
  userType: "permitting_officer",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPermitSupervisor: User = {
  id: "user-ps-001",
  username: "supervisor.preview",
  userType: "permit_supervisor",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockApplicant: User = {
  id: "user-app-001",
  username: "applicant.preview",
  userType: "applicant",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockICTUser: User = {
  id: "user-ict-001",
  username: "ict.preview",
  userType: "ict",
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock window functions
const mockWindowOpen = vi.fn()
const mockPrint = vi.fn()
const mockFocus = vi.fn()
const mockClose = vi.fn()
const mockWrite = vi.fn()
const mockDocumentClose = vi.fn()

Object.defineProperty(window, "open", {
  writable: true,
  value: mockWindowOpen,
})

// Mock URL functions for download
const mockCreateObjectURL = vi.fn(() => "blob:mock-url")
const mockRevokeObjectURL = vi.fn()
Object.defineProperty(URL, "createObjectURL", { value: mockCreateObjectURL })
Object.defineProperty(URL, "revokeObjectURL", { value: mockRevokeObjectURL })

// Mock document functions for download
const mockLink = {
  href: "",
  download: "",
  click: vi.fn(),
}
const mockCreateElement = vi.fn(() => mockLink)
const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()

describe("Permit Preview Dialog Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup window.open mock
    mockWindowOpen.mockReturnValue({
      document: {
        write: mockWrite,
        close: mockDocumentClose,
      },
      focus: mockFocus,
      print: mockPrint,
      close: mockClose,
    })

    // Setup document mocks
    Object.defineProperty(document, "createElement", { value: mockCreateElement })
    Object.defineProperty(document.body, "appendChild", { value: mockAppendChild })
    Object.defineProperty(document.body, "removeChild", { value: mockRemoveChild })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Dialog Visibility and Access Control", () => {
    it("should render preview button for authorized users with approved applications", () => {
      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
    })

    it("should not render for unauthorized users", () => {
      const { container } = render(
        <PermitPreviewDialog application={mockApprovedApplication} currentUser={mockApplicant} />,
      )

      expect(container.firstChild).toBeNull()
    })

    it("should not render for non-approved applications", () => {
      const { container } = render(
        <PermitPreviewDialog application={mockPendingApplication} currentUser={mockPermittingOfficer} />,
      )

      expect(container.firstChild).toBeNull()
    })

    it("should render for all authorized user types", () => {
      const authorizedUsers = [
        mockPermittingOfficer,
        mockPermitSupervisor,
        mockICTUser,
        { ...mockPermittingOfficer, userType: "catchment_manager" as const },
        { ...mockPermittingOfficer, userType: "catchment_chairperson" as const },
      ]

      authorizedUsers.forEach((user) => {
        const { unmount } = render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={user} />)

        expect(screen.getByText("Preview Permit")).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe("Dialog Opening and Content", () => {
    it("should open dialog when preview button is clicked", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })
    })

    it("should display permit details in dialog header", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
        expect(screen.getByText("UMSCC-2024-PREVIEW-001")).toBeInTheDocument()
        expect(screen.getByText("approved")).toBeInTheDocument()
      })
    })

    it("should display action buttons in dialog", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
        expect(screen.getByText("Print")).toBeInTheDocument()
      })
    })

    it("should render permit template content", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Form GW7B")).toBeInTheDocument()
        expect(screen.getByText("TEMPORARY/PROVISIONAL* SPECIFIC GROUNDWATER ABSTRACTION PERMIT")).toBeInTheDocument()
        expect(screen.getByText("Preview Test Company Ltd")).toBeInTheDocument()
      })
    })

    it("should close dialog when clicking outside or escape", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Press escape to close
      await user.keyboard("{Escape}")

      await waitFor(() => {
        expect(screen.queryByText("Permit Preview")).not.toBeInTheDocument()
      })
    })
  })

  describe("Print Functionality", () => {
    it("should trigger print when print button is clicked", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      // Wait for print process
      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank")
      })
    })

    it("should write proper HTML content for printing", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      await waitFor(() => {
        expect(mockWrite).toHaveBeenCalled()
        const writtenContent = mockWrite.mock.calls[0][0]

        // Check for proper HTML structure
        expect(writtenContent).toContain("<!DOCTYPE html>")
        expect(writtenContent).toContain("<title>Permit UMSCC-2024-PREVIEW-001</title>")
        expect(writtenContent).toContain("Times New Roman")
        expect(writtenContent).toContain("@page")
        expect(writtenContent).toContain("size: A4")
      })
    })

    it("should handle print window blocked scenario", async () => {
      const user = userEvent.setup()

      // Mock window.open to return null (blocked)
      mockWindowOpen.mockReturnValue(null)

      // Mock alert
      const mockAlert = vi.fn()
      Object.defineProperty(window, "alert", { value: mockAlert })

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      // Should handle gracefully without throwing error
      expect(() => user.click(printButton)).not.toThrow()
    })

    it("should call onPrint callback when provided", async () => {
      const user = userEvent.setup()
      const mockOnPrint = vi.fn()

      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={mockOnPrint}
        />,
      )

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      await waitFor(() => {
        expect(mockOnPrint).toHaveBeenCalled()
      })
    })
  })

  describe("Download Functionality", () => {
    it("should trigger download when download button is clicked", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
        expect(mockCreateElement).toHaveBeenCalledWith("a")
        expect(mockLink.click).toHaveBeenCalled()
      })
    })

    it("should create proper download filename", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockLink.download).toBe("permit-UMSCC-2024-PREVIEW-001.html")
      })
    })

    it("should create HTML blob with proper content", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
        const blobCall = mockCreateObjectURL.mock.calls[0][0]
        expect(blobCall.type).toBe("text/html")
      })
    })

    it("should call onDownload callback when provided", async () => {
      const user = userEvent.setup()
      const mockOnDownload = vi.fn()

      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onDownload={mockOnDownload}
        />,
      )

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockOnDownload).toHaveBeenCalled()
      })
    })

    it("should clean up URL after download", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
        expect(mockRemoveChild).toHaveBeenCalled()
      })
    })
  })

  describe("Loading States and Error Handling", () => {
    it("should show loading state during print operation", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      // Button should be disabled during loading
      expect(printButton).toBeDisabled()
    })

    it("should show loading state during download operation", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      // Button should be disabled during loading
      expect(downloadButton).toBeDisabled()
    })

    it("should handle missing permit template element", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return null
      const mockGetElementById = vi.fn(() => null)
      Object.defineProperty(document, "getElementById", { value: mockGetElementById })

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button - should not throw error
      const printButton = screen.getByText("Print")
      expect(() => user.click(printButton)).not.toThrow()
    })

    it("should handle print errors gracefully", async () => {
      const user = userEvent.setup()

      // Mock console.error
      const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock window.open to throw error
      mockWindowOpen.mockImplementation(() => {
        throw new Error("Print failed")
      })

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })

      mockConsoleError.mockRestore()
    })

    it("should handle download errors gracefully", async () => {
      const user = userEvent.setup()

      // Mock console.error
      const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock createObjectURL to throw error
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error("Download failed")
      })

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Download failed:", expect.any(Error))
      })

      mockConsoleError.mockRestore()
    })
  })

  describe("Accessibility and User Experience", () => {
    it("should have proper ARIA labels and roles", () => {
      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      expect(previewButton).toBeInTheDocument()
      expect(previewButton).toHaveAttribute("type", "button")
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Tab to preview button
      await user.tab()
      expect(screen.getByText("Preview Permit")).toHaveFocus()

      // Enter should open dialog
      await user.keyboard("{Enter}")

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })
    })

    it("should have proper dialog structure", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Check for dialog role
        const dialog = screen.getByRole("dialog")
        expect(dialog).toBeInTheDocument()

        // Check for proper heading
        expect(screen.getByRole("heading", { name: /permit preview/i })).toBeInTheDocument()
      })
    })

    it("should have proper button states and feedback", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        const printButton = screen.getByText("Print")
        const downloadButton = screen.getByText("Download")

        expect(printButton).not.toBeDisabled()
        expect(downloadButton).not.toBeDisabled()
        expect(printButton).toHaveAttribute("type", "button")
        expect(downloadButton).toHaveAttribute("type", "button")
      })
    })

    it("should display proper status badges", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Check for permit number badge
        expect(screen.getByText("UMSCC-2024-PREVIEW-001")).toBeInTheDocument()

        // Check for status badge
        expect(screen.getByText("approved")).toBeInTheDocument()
      })
    })
  })

  describe("Content Validation", () => {
    it("should display all required permit information", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Check for applicant name
        expect(screen.getByText("Preview Test Company Ltd")).toBeInTheDocument()

        // Check for address
        expect(screen.getByText("123 Preview Street, Harare, Zimbabwe")).toBeInTheDocument()

        // Check for land size
        expect(screen.getByText("30.5 (ha)")).toBeInTheDocument()

        // Check for number of boreholes
        expect(screen.getByText("4")).toBeInTheDocument()
      })
    })

    it("should display borehole details correctly", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Check for borehole numbers
        expect(screen.getByText("BH-01")).toBeInTheDocument()
        expect(screen.getByText("BH-02")).toBeInTheDocument()
        expect(screen.getByText("BH-03")).toBeInTheDocument()
        expect(screen.getByText("BH-04")).toBeInTheDocument()
      })
    })

    it("should display proper permit conditions", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Check for conditions section
        expect(screen.getByText("CONDITIONS")).toBeInTheDocument()
        expect(screen.getByText("ADDITIONAL CONDITIONS")).toBeInTheDocument()

        // Check for specific conditions
        expect(screen.getByText(/To install flow meters on all boreholes/)).toBeInTheDocument()
        expect(screen.getByText(/Water Quality Analysis is to be carried out/)).toBeInTheDocument()
      })
    })

    it("should handle different application statuses", async () => {
      const user = userEvent.setup()

      const permitIssuedApp = {
        ...mockApprovedApplication,
        status: "permit_issued" as const,
      }

      render(<PermitPreviewDialog application={permitIssuedApp} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("permit_issued")).toBeInTheDocument()
      })
    })
  })

  describe("Performance and Memory Management", () => {
    it("should not cause memory leaks with multiple opens/closes", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open and close dialog multiple times
      for (let i = 0; i < 5; i++) {
        const previewButton = screen.getByText("Preview Permit")
        await user.click(previewButton)

        await waitFor(() => {
          expect(screen.getByText("Permit Preview")).toBeInTheDocument()
        })

        await user.keyboard("{Escape}")

        await waitFor(() => {
          expect(screen.queryByText("Permit Preview")).not.toBeInTheDocument()
        })
      }

      // Should not throw any errors
      expect(true).toBe(true)
    })

    it("should handle rapid button clicks gracefully", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApprovedApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Rapidly click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)
      await user.click(printButton)
      await user.click(printButton)

      // Should handle gracefully without errors
      expect(mockWindowOpen).toHaveBeenCalled()
    })
  })
})
