import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { PermitTemplate } from "@/components/permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { PermitApplication, User } from "@/types"

// Mock the permit template component
vi.mock("@/components/permit-template", () => ({
  PermitTemplate: vi.fn(({ permitData, id }) => (
    <div data-testid="permit-template" id={id}>
      <div data-testid="permit-number">{permitData.permitNumber}</div>
      <div data-testid="applicant-name">{permitData.applicantName}</div>
      <div data-testid="issue-date">{permitData.issueDate}</div>
      <div data-testid="valid-until">{permitData.validUntil}</div>
      <div data-testid="water-allocation">{permitData.waterAllocation}</div>
      <div data-testid="total-allocation">{permitData.totalAllocatedAbstraction}</div>
      {permitData.boreholeDetails.map((borehole, index) => (
        <div key={index} data-testid={`borehole-${index}`}>
          <span data-testid={`borehole-number-${index}`}>{borehole.boreholeNumber}</span>
          <span data-testid={`borehole-gps-${index}`}>{borehole.gpsCoordinates}</span>
          <span data-testid={`borehole-allocation-${index}`}>{borehole.allocatedAmount}</span>
        </div>
      ))}
      {permitData.conditions.map((condition, index) => (
        <div key={index} data-testid={`condition-${index}`}>
          {condition}
        </div>
      ))}
    </div>
  )),
}))

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("Permit Preview Integration Tests", () => {
  const mockApplication: PermitApplication = {
    id: "1",
    applicationNumber: "APP001",
    applicantName: "John Doe",
    applicantAddress: "123 Main St, Harare",
    contactNumber: "+263771234567",
    emailAddress: "john.doe@email.com",
    intendedUse: "Domestic",
    waterAllocation: 50,
    numberOfBoreholes: 2,
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
        comment: "Application approved",
        author: "permit_supervisor",
        timestamp: new Date("2024-01-15"),
        type: "approval",
      },
    ],
    workflowStage: "approved",
    assignedTo: "permit_supervisor",
  }

  const mockUser: User = {
    id: "1",
    username: "admin",
    userType: "permitting_officer",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Data Integration", () => {
    it("should pass correct permit data to template component", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      })

      // Verify permit data is correctly passed
      const permitData = preparePermitData(mockApplication)
      expect(PermitTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          permitData: expect.objectContaining({
            permitNumber: permitData.permitNumber,
            applicantName: mockApplication.applicantName,
            intendedUse: mockApplication.intendedUse,
            waterAllocation: mockApplication.waterAllocation,
          }),
          id: "permit-preview-template",
        }),
        expect.any(Object),
      )
    })

    it("should display all permit information correctly", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByTestId("permit-number")).toBeInTheDocument()
        expect(screen.getByTestId("applicant-name")).toBeInTheDocument()
        expect(screen.getByTestId("issue-date")).toBeInTheDocument()
        expect(screen.getByTestId("valid-until")).toBeInTheDocument()
        expect(screen.getByTestId("water-allocation")).toBeInTheDocument()
        expect(screen.getByTestId("total-allocation")).toBeInTheDocument()
      })

      // Check specific values
      expect(screen.getByTestId("applicant-name")).toHaveTextContent("John Doe")
      expect(screen.getByTestId("water-allocation")).toHaveTextContent("50")
    })

    it("should handle multiple boreholes correctly", async () => {
      const user = userEvent.setup()

      const multiBoreholeApp = {
        ...mockApplication,
        numberOfBoreholes: 3,
        gpsCoordinates: "-17.8252, 31.0335; -17.8300, 31.0400; -17.8350, 31.0450",
      }

      render(<PermitPreviewDialog application={multiBoreholeApp} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        // Should have multiple borehole entries
        expect(screen.getByTestId("borehole-0")).toBeInTheDocument()
        expect(screen.getByTestId("borehole-1")).toBeInTheDocument()
        expect(screen.getByTestId("borehole-2")).toBeInTheDocument()
      })
    })

    it("should display permit conditions", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByTestId("condition-0")).toBeInTheDocument()
        expect(screen.getByTestId("condition-1")).toBeInTheDocument()
      })
    })
  })

  describe("Template Rendering Integration", () => {
    it("should render template with correct ID for print functionality", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        const template = screen.getByTestId("permit-template")
        expect(template).toHaveAttribute("id", "permit-preview-template")
      })
    })

    it("should maintain template structure for print operations", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        const template = screen.getByTestId("permit-template")
        expect(template).toBeInTheDocument()

        // Verify all required elements are present
        expect(screen.getByTestId("permit-number")).toBeInTheDocument()
        expect(screen.getByTestId("applicant-name")).toBeInTheDocument()
        expect(screen.getByTestId("borehole-0")).toBeInTheDocument()
      })
    })
  })

  describe("Workflow Integration", () => {
    it("should work with different application statuses", async () => {
      const user = userEvent.setup()

      const statusTests = [
        { status: "approved" as const, shouldShow: true },
        { status: "permit_issued" as const, shouldShow: true },
        { status: "pending" as const, shouldShow: false },
        { status: "rejected" as const, shouldShow: false },
      ]

      for (const { status, shouldShow } of statusTests) {
        const testApp = { ...mockApplication, status }

        const { container, unmount } = render(<PermitPreviewDialog application={testApp} currentUser={mockUser} />)

        if (shouldShow) {
          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        } else {
          expect(container.firstChild).toBeNull()
        }

        unmount()
      }
    })

    it("should integrate with user permission system", async () => {
      const user = userEvent.setup()

      const userTypes = [
        { userType: "permitting_officer" as const, canView: true },
        { userType: "permit_supervisor" as const, canView: true },
        { userType: "catchment_manager" as const, canView: true },
        { userType: "catchment_chairperson" as const, canView: true },
        { userType: "ict" as const, canView: true },
        { userType: "applicant" as const, canView: false },
      ]

      for (const { userType, canView } of userTypes) {
        const testUser = { ...mockUser, userType }

        const { container, unmount } = render(
          <PermitPreviewDialog application={mockApplication} currentUser={testUser} />,
        )

        if (canView) {
          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        } else {
          expect(container.firstChild).toBeNull()
        }

        unmount()
      }
    })
  })

  describe("Print Integration", () => {
    it("should prepare content correctly for printing", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return the template element
      const mockTemplateElement = {
        innerHTML: "<div>Mock permit template content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      // Mock window.open
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }
      vi.mocked(window.open).mockReturnValue(mockPrintWindow as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalledWith("permit-preview-content")
        expect(window.open).toHaveBeenCalledWith("", "_blank")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(mockPrintWindow.print).toHaveBeenCalled()
      })
    })

    it("should include proper print styles in generated content", async () => {
      const user = userEvent.setup()

      const mockTemplateElement = {
        innerHTML: "<div>Mock permit template content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }
      vi.mocked(window.open).mockReturnValue(mockPrintWindow as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        const writeCall = mockPrintWindow.document.write.mock.calls[0][0]

        // Check for A4 page setup
        expect(writeCall).toContain("@page")
        expect(writeCall).toContain("size: A4")
        expect(writeCall).toContain("margin: 20mm")

        // Check for print-friendly fonts
        expect(writeCall).toContain("font-family: 'Times New Roman', serif")
        expect(writeCall).toContain("font-size: 12pt")

        // Check for table styles
        expect(writeCall).toContain("border-collapse: collapse")
        expect(writeCall).toContain("border: 1px solid black")
      })
    })
  })

  describe("Download Integration", () => {
    it("should create downloadable HTML file with correct content", async () => {
      const user = userEvent.setup()

      const mockTemplateElement = {
        innerHTML: "<div>Mock permit template content</div>",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(mockTemplateElement as any)

      // Mock URL methods
      const mockBlobUrl = "blob:mock-url"
      vi.mocked(URL.createObjectURL).mockReturnValue(mockBlobUrl)

      // Mock anchor element
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
        expect(mockAnchor.href).toBe(mockBlobUrl)
        expect(mockAnchor.download).toMatch(/permit-.*\.html/)
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockBlobUrl)
      })
    })
  })

  describe("Error Handling Integration", () => {
    it("should handle permit data generation errors", async () => {
      const user = userEvent.setup()

      // Mock preparePermitData to throw an error
      vi.mocked(preparePermitData).mockImplementation(() => {
        throw new Error("Failed to prepare permit data")
      })

      vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)
      }).toThrow("Failed to prepare permit data")
    })

    it("should handle template rendering errors gracefully", async () => {
      const user = userEvent.setup()

      // Mock PermitTemplate to throw an error
      vi.mocked(PermitTemplate).mockImplementation(() => {
        throw new Error("Template rendering failed")
      })

      vi.spyOn(console, "error").mockImplementation(() => {})

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })

      expect(() => user.click(previewButton)).rejects.toThrow("Template rendering failed")
    })
  })

  describe("Performance Integration", () => {
    it("should handle large applications efficiently", async () => {
      const user = userEvent.setup()

      // Create a large application with many boreholes and documents
      const largeApplication = {
        ...mockApplication,
        numberOfBoreholes: 50,
        documents: Array.from({ length: 100 }, (_, i) => ({
          id: `doc-${i}`,
          filename: `document-${i}.pdf`,
          uploadDate: new Date(),
          fileSize: 1024000,
          fileType: "application/pdf",
          uploadedBy: "applicant",
        })),
        comments: Array.from({ length: 50 }, (_, i) => ({
          id: `comment-${i}`,
          comment: `Comment ${i}`,
          author: "reviewer",
          timestamp: new Date(),
          type: "review" as const,
        })),
      }

      const startTime = performance.now()

      render(<PermitPreviewDialog application={largeApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByTestId("permit-template")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000)
    })
  })
})
