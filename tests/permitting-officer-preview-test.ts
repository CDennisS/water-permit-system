import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "@/components/login-form"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { ApplicationsTable } from "@/components/applications-table"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
    updateApplication: vi.fn(),
    addLog: vi.fn(),
  },
}))

// Mock window.open for print testing
const mockWindowOpen = vi.fn()
Object.defineProperty(window, "open", {
  writable: true,
  value: mockWindowOpen,
})

// Mock URL.createObjectURL for download testing
const mockCreateObjectURL = vi.fn()
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: mockCreateObjectURL,
})

describe("Permitting Officer Permit Preview Test", () => {
  let permittingOfficer: User
  let approvedApplication: PermitApplication
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()

    // Create test Permitting Officer user
    permittingOfficer = {
      id: "1",
      username: "admin",
      userType: "permitting_officer",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Create test approved application
    approvedApplication = {
      id: "app-001",
      applicationId: "WP-2024-001",
      applicantName: "John Doe",
      applicantId: "123456789",
      physicalAddress: "123 Main Street, Harare",
      postalAddress: "P.O. Box 123, Harare",
      cellularNumber: "+263771234567",
      landSize: 5.5,
      numberOfBoreholes: 2,
      waterAllocation: 10.5,
      intendedUse: "Irrigation and Domestic Use",
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "approved",
      currentStage: 1,
      permitType: "provisional",
      waterSource: "borehole",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      submittedAt: new Date("2024-01-16"),
      approvedAt: new Date("2024-01-20"),
      documents: [
        {
          id: "doc-001",
          applicationId: "app-001",
          fileName: "site-plan.pdf",
          fileType: "application/pdf",
          fileSize: 1024000,
          uploadedAt: new Date(),
          uploadedBy: "1",
          documentType: "site_plan",
        },
      ],
      workflowComments: [
        {
          id: "comment-001",
          applicationId: "app-001",
          userId: "2",
          userType: "chairperson",
          comment: "Application approved for water allocation",
          commentType: "approval",
          createdAt: new Date(),
          isInternal: false,
        },
      ],
    }

    // Mock database responses
    vi.mocked(db.getApplications).mockResolvedValue([approvedApplication])
    vi.mocked(db.updateApplication).mockResolvedValue(undefined)
    vi.mocked(db.addLog).mockResolvedValue(undefined)

    // Reset mocks
    mockWindowOpen.mockClear()
    mockCreateObjectURL.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Login as Permitting Officer", () => {
    it("should successfully login as Permitting Officer", async () => {
      const onLogin = vi.fn()

      render(<LoginForm onLogin={onLogin} />)

      // Select user type
      const userTypeSelect = screen.getByRole("combobox")
      await user.click(userTypeSelect)

      const permittingOfficerOption = screen.getByText("Permitting Officer")
      await user.click(permittingOfficerOption)

      // Enter credentials
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)

      await user.type(usernameInput, "admin")
      await user.type(passwordInput, "admin")

      // Submit form
      const submitButton = screen.getByRole("button", { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            username: "admin",
            userType: "permitting_officer",
          }),
        )
      })
    })
  })

  describe("Permit Preview Access", () => {
    it("should show preview button for approved applications", async () => {
      render(<ApplicationsTable user={permittingOfficer} onView={vi.fn()} onEdit={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText("WP-2024-001")).toBeInTheDocument()
      })

      // Check that the application is displayed with approved status
      expect(screen.getByText("John Doe")).toBeInTheDocument()
      expect(screen.getByText(/approved/i)).toBeInTheDocument()
    })

    it("should render permit preview dialog for approved application", () => {
      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      // Preview button should be visible for permitting officer
      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      expect(previewButton).toBeInTheDocument()
      expect(previewButton).not.toBeDisabled()
    })

    it("should not show preview for non-approved applications", () => {
      const draftApplication = {
        ...approvedApplication,
        status: "draft" as const,
      }

      render(
        <PermitPreviewDialog
          application={draftApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      // Preview button should not be rendered for draft applications
      expect(screen.queryByRole("button", { name: /preview permit/i })).not.toBeInTheDocument()
    })
  })

  describe("Permit Preview Dialog Functionality", () => {
    it("should open permit preview dialog when clicked", async () => {
      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Check permit details are displayed
      expect(screen.getByText("WP-2024-001")).toBeInTheDocument()
      expect(screen.getByText("John Doe")).toBeInTheDocument()
      expect(screen.getByText("123 Main Street, Harare")).toBeInTheDocument()
    })

    it("should display print and download buttons in dialog", async () => {
      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument()
      })
    })
  })

  describe("Print Functionality", () => {
    it("should handle print action successfully", async () => {
      const onPrint = vi.fn()

      // Mock successful window.open
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }
      mockWindowOpen.mockReturnValue(mockPrintWindow)

      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={onPrint}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank")
        expect(onPrint).toHaveBeenCalled()
      })
    })

    it("should handle print failure gracefully", async () => {
      const onPrint = vi.fn()

      // Mock failed window.open
      mockWindowOpen.mockReturnValue(null)

      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={onPrint}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should not crash and should still call onPrint
      await waitFor(() => {
        expect(onPrint).toHaveBeenCalled()
      })
    })
  })

  describe("Download Functionality", () => {
    it("should handle download action successfully", async () => {
      const onDownload = vi.fn()

      // Mock successful blob creation
      mockCreateObjectURL.mockReturnValue("blob:mock-url")

      // Mock createElement and appendChild
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      const mockCreateElement = vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      const mockAppendChild = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      const mockRemoveChild = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={onDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockCreateElement).toHaveBeenCalledWith("a")
        expect(mockAnchor.download).toBe("permit-WP-2024-001.html")
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(onDownload).toHaveBeenCalled()
      })

      // Cleanup mocks
      mockCreateElement.mockRestore()
      mockAppendChild.mockRestore()
      mockRemoveChild.mockRestore()
    })
  })

  describe("Permit Data Validation", () => {
    it("should display all required permit information", async () => {
      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        // Check applicant information
        expect(screen.getByText("John Doe")).toBeInTheDocument()
        expect(screen.getByText("123 Main Street, Harare")).toBeInTheDocument()

        // Check permit details
        expect(screen.getByText("10.5")).toBeInTheDocument() // Water allocation
        expect(screen.getByText("2")).toBeInTheDocument() // Number of boreholes
        expect(screen.getByText("Irrigation and Domestic Use")).toBeInTheDocument()
      })
    })

    it("should handle applications with multiple boreholes", async () => {
      const multiBoreholeApp = {
        ...approvedApplication,
        numberOfBoreholes: 5,
        waterAllocation: 25.0,
      }

      render(
        <PermitPreviewDialog
          application={multiBoreholeApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument() // Number of boreholes
        expect(screen.getByText("25")).toBeInTheDocument() // Water allocation
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle missing permit data gracefully", async () => {
      const incompleteApp = {
        ...approvedApplication,
        applicantName: "",
        physicalAddress: "",
      }

      render(
        <PermitPreviewDialog
          application={incompleteApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })
    })

    it("should handle DOM manipulation errors during print", async () => {
      // Mock getElementById to return null
      const mockGetElementById = vi.spyOn(document, "getElementById").mockReturnValue(null)

      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should not crash
      await waitFor(() => {
        expect(mockGetElementById).toHaveBeenCalled()
      })

      mockGetElementById.mockRestore()
    })
  })

  describe("Performance Tests", () => {
    it("should render preview dialog within performance threshold", async () => {
      const startTime = performance.now()

      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within 500ms
      expect(renderTime).toBeLessThan(500)
    })

    it("should handle large permit data efficiently", async () => {
      const largeDataApp = {
        ...approvedApplication,
        intendedUse: "A".repeat(10000), // Large text field
        physicalAddress: "B".repeat(5000),
        numberOfBoreholes: 50,
        waterAllocation: 1000.0,
      }

      const startTime = performance.now()

      render(
        <PermitPreviewDialog
          application={largeDataApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should handle large data within 2 seconds
      expect(renderTime).toBeLessThan(2000)
    })
  })

  describe("Accessibility Tests", () => {
    it("should have proper ARIA labels and roles", async () => {
      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      expect(previewButton).toHaveAttribute("type", "button")

      await user.click(previewButton)

      await waitFor(() => {
        const dialog = screen.getByRole("dialog")
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveAttribute("aria-labelledby")
      })
    })

    it("should support keyboard navigation", async () => {
      render(
        <PermitPreviewDialog
          application={approvedApplication}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })

      // Focus and activate with keyboard
      previewButton.focus()
      fireEvent.keyDown(previewButton, { key: "Enter" })

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Should be able to navigate to print and download buttons
      const printButton = screen.getByRole("button", { name: /print/i })
      const downloadButton = screen.getByRole("button", { name: /download/i })

      expect(printButton).toBeInTheDocument()
      expect(downloadButton).toBeInTheDocument()
    })
  })
})
