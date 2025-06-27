import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { EnhancedPermitPrinter } from "@/components/enhanced-permit-printer"
import type { PermitApplication, User } from "@/types"

// Mock dependencies
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
  validatePermitData: vi.fn(() => true),
}))

vi.mock("@/components/permit-template", () => ({
  PermitTemplate: vi.fn(({ permitData, id }) => (
    <div data-testid="permit-template" id={id}>
      <h1>GROUNDWATER ABSTRACTION PERMIT</h1>
      <div data-testid="permit-number">Permit No: {permitData.permitNumber}</div>
      <div data-testid="applicant-name">Applicant: {permitData.applicantName}</div>
      <div data-testid="issue-date">Issue Date: {permitData.issueDate}</div>
      <div data-testid="valid-until">Valid Until: {permitData.validUntil}</div>
      <table data-testid="borehole-table">
        <thead>
          <tr>
            <th>Borehole No.</th>
            <th>GPS Coordinates</th>
            <th>Allocated Amount (m³/annum)</th>
          </tr>
        </thead>
        <tbody>
          {permitData.boreholeDetails.map((borehole, index) => (
            <tr key={index} data-testid={`borehole-row-${index}`}>
              <td>{borehole.boreholeNumber}</td>
              <td>{borehole.gpsCoordinates}</td>
              <td>{borehole.allocatedAmount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div data-testid="conditions">
        <h3>Conditions:</h3>
        <ol>
          {permitData.conditions.map((condition, index) => (
            <li key={index} data-testid={`condition-${index}`}>
              {condition}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("Permit Preview End-to-End Tests", () => {
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
    documents: [
      {
        id: "1",
        filename: "application.pdf",
        uploadDate: new Date("2024-01-01"),
        fileSize: 1024000,
        fileType: "application/pdf",
        uploadedBy: "applicant",
      },
    ],
    comments: [
      {
        id: "1",
        comment: "Application approved for permit generation",
        author: "permit_supervisor",
        timestamp: new Date("2024-01-15"),
        type: "approval",
      },
    ],
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

  const mockPermitSupervisor: User = {
    id: "2",
    username: "supervisor",
    userType: "permit_supervisor",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockApplicant: User = {
    id: "3",
    username: "applicant",
    userType: "applicant",
    password: "password",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Mock window methods
  const mockPrint = vi.fn()
  const mockClose = vi.fn()
  const mockFocus = vi.fn()
  const mockWrite = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.open
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

    // Mock URL methods
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: vi.fn(() => "blob:mock-url"),
    })

    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Complete Workflow Tests", () => {
    it("should complete full preview workflow from button click to dialog close", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      // Step 1: Click preview button
      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      expect(previewButton).toBeInTheDocument()

      await user.click(previewButton)

      // Step 2: Verify dialog opens
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Step 3: Verify permit content is displayed
      expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      expect(screen.getByTestId("permit-number")).toHaveTextContent("GW7B/2024/001")
      expect(screen.getByTestId("applicant-name")).toHaveTextContent("John Doe")

      // Step 4: Verify action buttons are present
      expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument()

      // Step 5: Close dialog
      await user.keyboard("{Escape}")

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })

    it("should handle complete print workflow", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return template element
      const mockTemplateElement = {
        innerHTML: "<div>Complete permit template content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Verify print workflow
      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalledWith("permit-preview-content")
        expect(window.open).toHaveBeenCalledWith("", "_blank")
        expect(mockWrite).toHaveBeenCalled()
        expect(mockFocus).toHaveBeenCalled()
        expect(mockPrint).toHaveBeenCalled()
        expect(mockClose).toHaveBeenCalled()
      })

      // Verify print content includes proper styling
      const printContent = mockWrite.mock.calls[0][0]
      expect(printContent).toContain("@page")
      expect(printContent).toContain("size: A4")
      expect(printContent).toContain("font-family: 'Times New Roman', serif")
      expect(printContent).toContain("Complete permit template content")
    })

    it("should handle complete download workflow", async () => {
      const user = userEvent.setup()

      // Mock DOM methods for download
      const mockTemplateElement = {
        innerHTML: "<div>Complete permit template for download</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      // Verify download workflow
      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalledWith("permit-preview-content")
        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
        expect(mockAnchor.href).toBe("blob:mock-url")
        expect(mockAnchor.download).toBe("permit-GW7B/2024/001.html")
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
      })
    })
  })

  describe("Integration with Enhanced Permit Printer", () => {
    it("should work seamlessly with enhanced permit printer component", async () => {
      const user = userEvent.setup()

      render(<EnhancedPermitPrinter application={mockApplication} currentUser={mockPermittingOfficer} />)

      // Should show permit status card
      expect(screen.getByText("Permit Status")).toBeInTheDocument()
      expect(screen.getByText("Permit Actions")).toBeInTheDocument()

      // Should show preview button
      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      expect(previewButton).toBeInTheDocument()

      // Click preview to open dialog
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Verify permit template is rendered
      expect(screen.getByTestId("permit-template")).toBeInTheDocument()
    })

    it("should handle different user permissions in integrated environment", async () => {
      const testCases = [
        { user: mockPermittingOfficer, shouldShowPreview: true, shouldShowGenerate: false },
        { user: mockPermitSupervisor, shouldShowPreview: true, shouldShowGenerate: true },
        { user: mockApplicant, shouldShowPreview: false, shouldShowGenerate: false },
      ]

      for (const { user, shouldShowPreview, shouldShowGenerate } of testCases) {
        const { unmount } = render(<EnhancedPermitPrinter application={mockApplication} currentUser={user} />)

        if (shouldShowPreview) {
          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        } else {
          expect(screen.queryByRole("button", { name: /preview permit/i })).not.toBeInTheDocument()
        }

        if (shouldShowGenerate) {
          expect(screen.getByRole("button", { name: /generate permit/i })).toBeInTheDocument()
        } else {
          expect(screen.queryByRole("button", { name: /generate permit/i })).not.toBeInTheDocument()
        }

        unmount()
      }
    })
  })

  describe("Real-world Scenarios", () => {
    it("should handle multiple rapid clicks without breaking", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })

      // Rapidly click preview button multiple times
      await user.click(previewButton)
      await user.click(previewButton)
      await user.click(previewButton)

      // Should only open one dialog
      await waitFor(() => {
        const dialogs = screen.getAllByRole("dialog")
        expect(dialogs).toHaveLength(1)
      })
    })

    it("should handle network interruption during print gracefully", async () => {
      const user = userEvent.setup()

      // Mock getElementById to throw an error (simulating network issue)
      vi.spyOn(document, "getElementById").mockImplementation(() => {
        throw new Error("Network error")
      })
      vi.spyOn(console, "error").mockImplementation(() => {})

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })

      // Dialog should still be functional
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("should handle large permit data efficiently", async () => {
      const user = userEvent.setup()

      // Create application with large amount of data
      const largeApplication = {
        ...mockApplication,
        numberOfBoreholes: 20,
        applicantAddress:
          "Very long address with lots of details that might cause rendering issues if not handled properly in the permit preview dialog component",
        comments: Array.from({ length: 100 }, (_, i) => ({
          id: `comment-${i}`,
          comment: `This is a very long comment number ${i} that contains detailed information about the application review process and various technical considerations`,
          author: "reviewer",
          timestamp: new Date(),
          type: "review" as const,
        })),
      }

      const startTime = performance.now()

      render(<PermitPreviewDialog application={largeApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render large data within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000)
    })

    it("should maintain state consistency across multiple operations", async () => {
      const user = userEvent.setup()

      const mockTemplateElement = {
        innerHTML: "<div>Permit template content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      // Open dialog
      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Perform print operation
      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockPrint).toHaveBeenCalled()
      })

      // Perform download operation
      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockAnchor.click).toHaveBeenCalled()
      })

      // Dialog should still be open and functional
      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(screen.getByTestId("permit-template")).toBeInTheDocument()

      // Close dialog
      await user.keyboard("{Escape}")

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })
  })

  describe("Browser Compatibility", () => {
    it("should handle browsers without window.open support", async () => {
      const user = userEvent.setup()

      // Mock window.open to return null (unsupported)
      vi.mocked(window.open).mockReturnValue(null)

      const mockTemplateElement = {
        innerHTML: "<div>Permit template content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should not crash when window.open returns null
      await waitFor(() => {
        expect(window.open).toHaveBeenCalled()
      })

      // Dialog should remain functional
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("should handle browsers without Blob support", async () => {
      const user = userEvent.setup()

      // Mock Blob constructor to throw error
      const originalBlob = global.Blob
      global.Blob = vi.fn().mockImplementation(() => {
        throw new Error("Blob not supported")
      })

      vi.spyOn(console, "error").mockImplementation(() => {})

      const mockTemplateElement = {
        innerHTML: "<div>Permit template content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockPermittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      // Should handle Blob error gracefully
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Download failed:", expect.any(Error))
      })

      // Restore original Blob
      global.Blob = originalBlob
    })
  })
})
