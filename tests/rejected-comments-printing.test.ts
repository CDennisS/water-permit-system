import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CommentsPrinter } from "@/components/comments-printer"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"
import type { PermitApplication, User, WorkflowComment } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getCommentsByApplication: vi.fn(),
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

describe("Rejected Application Comments Printing Tests", () => {
  let rejectedApplication: PermitApplication
  let permittingOfficer: User
  let supervisor: User
  let unauthorizedUser: User
  let rejectionComments: WorkflowComment[]

  beforeEach(() => {
    vi.clearAllMocks()
    mockWindowOpen.mockClear()
    mockCreateObjectURL.mockClear()

    // Create rejected application with comprehensive details
    rejectedApplication = {
      id: "rejected-app-1",
      applicationId: "REJ-2024-001",
      applicantName: "John Doe Rejected",
      physicalAddress: "123 Rejection Street, Harare, Zimbabwe",
      postalAddress: "P.O. Box 999, Harare",
      customerAccountNumber: "CUST-12345",
      cellularNumber: "+263771234567",
      numberOfBoreholes: 2,
      landSize: 5.5,
      waterAllocation: 1500,
      intendedUse: "Domestic and Small Scale Commercial",
      permitType: "urban",
      waterSource: "borehole",
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "rejected",
      currentStage: 1,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-20T15:30:00Z"),
      rejectedAt: new Date("2024-01-20T15:30:00Z"),
      documents: [],
      workflowComments: [],
    }

    // Create test users
    permittingOfficer = {
      id: "po-1",
      username: "officer_test",
      userType: "permitting_officer",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    supervisor = {
      id: "sup-1",
      username: "supervisor_test",
      userType: "permit_supervisor",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    unauthorizedUser = {
      id: "unauth-1",
      username: "applicant_test",
      userType: "applicant",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Create comprehensive rejection comments
    rejectionComments = [
      {
        id: "comment-1",
        applicationId: "rejected-app-1",
        userId: "po-1",
        userType: "permitting_officer",
        comment: "Initial review completed. Application forwarded to chairperson for review.",
        stage: 1,
        isRejectionReason: false,
        createdAt: new Date("2024-01-16T09:00:00Z"),
      },
      {
        id: "comment-2",
        applicationId: "rejected-app-1",
        userId: "chair-1",
        userType: "chairperson",
        comment: "Reviewed application documents. All required documents are present. Forwarding to catchment manager.",
        stage: 2,
        isRejectionReason: false,
        createdAt: new Date("2024-01-17T11:30:00Z"),
      },
      {
        id: "comment-3",
        applicationId: "rejected-app-1",
        userId: "cm-1",
        userType: "catchment_manager",
        comment:
          "Technical assessment completed. Water allocation exceeds sustainable limits for this area. Recommending rejection.",
        stage: 3,
        isRejectionReason: false,
        createdAt: new Date("2024-01-18T14:15:00Z"),
      },
      {
        id: "comment-4",
        applicationId: "rejected-app-1",
        userId: "cc-1",
        userType: "catchment_chairperson",
        comment:
          "After careful consideration of the technical assessment, this application is rejected due to: 1) Water allocation exceeds sustainable limits for the catchment area, 2) Insufficient justification for commercial use component, 3) GPS coordinates fall within restricted zone near existing water infrastructure.",
        stage: 4,
        isRejectionReason: true,
        createdAt: new Date("2024-01-20T15:30:00Z"),
      },
    ]

    // Mock database response
    vi.mocked(db.getCommentsByApplication).mockResolvedValue(rejectionComments)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Rejected Application Comments Display", () => {
    it("should display comprehensive applicant details at the top", async () => {
      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("APPLICATION COMMENTS REPORT")).toBeInTheDocument()
        expect(screen.getByText("Upper Manyame Sub Catchment Council")).toBeInTheDocument()
      })

      // Check all applicant details are displayed
      expect(screen.getByText("REJ-2024-001")).toBeInTheDocument()
      expect(screen.getByText("John Doe Rejected")).toBeInTheDocument()
      expect(screen.getByText("123 Rejection Street, Harare, Zimbabwe")).toBeInTheDocument()
      expect(screen.getByText("P.O. Box 999, Harare")).toBeInTheDocument()
      expect(screen.getByText("CUST-12345")).toBeInTheDocument()
      expect(screen.getByText("+263771234567")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument() // Number of boreholes
      expect(screen.getByText("5.5 hectares")).toBeInTheDocument()
      expect(screen.getByText("1,500 m³/annum")).toBeInTheDocument()
      expect(screen.getByText("Domestic and Small Scale Commercial")).toBeInTheDocument()
      expect(screen.getByText("Lat: -17.8252, Long: 31.0335")).toBeInTheDocument()
    })

    it("should prominently display rejection status", async () => {
      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("⚠️ APPLICATION REJECTED ⚠️")).toBeInTheDocument()
        expect(screen.getByText("This application has been rejected during the review process")).toBeInTheDocument()
      })

      // Check status is highlighted
      const statusElement = screen.getByText("REJECTED")
      expect(statusElement).toHaveClass("status-rejected")
    })

    it("should display all comments with proper labels and formatting", async () => {
      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        // Check all user type labels are displayed
        expect(screen.getByText("Permitting Officer")).toBeInTheDocument()
        expect(screen.getByText("Chairperson")).toBeInTheDocument()
        expect(screen.getByText("Catchment Manager")).toBeInTheDocument()
        expect(screen.getByText("Catchment Chairperson")).toBeInTheDocument()

        // Check stage badges
        expect(screen.getAllByText(/Stage \d/)).toHaveLength(4)

        // Check rejection reason is highlighted
        expect(screen.getByText("REJECTION REASON")).toBeInTheDocument()

        // Check all comment content is present
        expect(screen.getByText(/Initial review completed/)).toBeInTheDocument()
        expect(screen.getByText(/Reviewed application documents/)).toBeInTheDocument()
        expect(screen.getByText(/Technical assessment completed/)).toBeInTheDocument()
        expect(screen.getByText(/After careful consideration/)).toBeInTheDocument()
      })
    })

    it("should format rejection reasons prominently", async () => {
      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        // Find the rejection comment
        const rejectionComment = screen.getByText(/After careful consideration/)
        const commentContainer = rejectionComment.closest(".comment")

        expect(commentContainer).toHaveClass("rejection")
        expect(screen.getByText("REJECTION REASON")).toBeInTheDocument()
      })
    })
  })

  describe("Print Functionality for Rejected Applications", () => {
    it("should generate proper print content with all details", async () => {
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        print: vi.fn(),
      }
      mockWindowOpen.mockReturnValue(mockPrintWindow)

      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const printButton = screen.getByRole("button", { name: /Print Comments/ })
      fireEvent.click(printButton)

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(mockPrintWindow.document.close).toHaveBeenCalled()
        expect(mockPrintWindow.print).toHaveBeenCalled()
      })

      // Verify the HTML content includes all required elements
      const printContent = mockPrintWindow.document.write.mock.calls[0][0]
      expect(printContent).toContain("APPLICATION COMMENTS REPORT")
      expect(printContent).toContain("Upper Manyame Sub Catchment Council")
      expect(printContent).toContain("John Doe Rejected")
      expect(printContent).toContain("REJ-2024-001")
      expect(printContent).toContain("*** APPLICATION REJECTED ***")
      expect(printContent).toContain("REJECTION REASON")
    })

    it("should generate comprehensive download content", async () => {
      const mockBlob = new Blob()
      const mockUrl = "blob:mock-url"

      vi.spyOn(window, "Blob").mockImplementation(() => mockBlob)
      mockCreateObjectURL.mockReturnValue(mockUrl)

      // Mock DOM manipulation
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        const downloadButton = screen.getByRole("button", { name: /Download/ })
        fireEvent.click(downloadButton)
      })

      await waitFor(() => {
        expect(window.Blob).toHaveBeenCalled()
        const blobContent = (window.Blob as any).mock.calls[0][0][0]

        // Verify comprehensive content
        expect(blobContent).toContain("APPLICATION COMMENTS REPORT")
        expect(blobContent).toContain("Upper Manyame Sub Catchment Council")
        expect(blobContent).toContain("APPLICANT DETAILS:")
        expect(blobContent).toContain("Application ID: REJ-2024-001")
        expect(blobContent).toContain("Applicant Name: John Doe Rejected")
        expect(blobContent).toContain("Physical Address: 123 Rejection Street, Harare, Zimbabwe")
        expect(blobContent).toContain("Postal Address: P.O. Box 999, Harare")
        expect(blobContent).toContain("Customer Account: CUST-12345")
        expect(blobContent).toContain("Cellular Number: +263771234567")
        expect(blobContent).toContain("Status: REJECTED")
        expect(blobContent).toContain("*** APPLICATION REJECTED ***")
        expect(blobContent).toContain("COMMENTS AND REVIEW HISTORY:")
        expect(blobContent).toContain("Type: REJECTION REASON")
      })
    })
  })

  describe("Authorization and Access Control", () => {
    it("should allow authorized users to print rejected application comments", () => {
      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const printButton = screen.getByRole("button", { name: /Print Comments/ })
      expect(printButton).toBeEnabled()
    })

    it("should allow supervisors to print rejected application comments", () => {
      render(<CommentsPrinter application={rejectedApplication} user={supervisor} />)

      const printButton = screen.getByRole("button", { name: /Print Comments/ })
      expect(printButton).toBeEnabled()
    })

    it("should disable printing for unauthorized users", () => {
      render(<CommentsPrinter application={rejectedApplication} user={unauthorizedUser} disabled={true} />)

      const printButton = screen.getByRole("button", { name: /Print Comments/ })
      expect(printButton).toBeDisabled()
    })
  })

  describe("Edge Cases and Error Handling", () => {
    it("should handle applications with no comments", async () => {
      vi.mocked(db.getCommentsByApplication).mockResolvedValue([])

      const appWithoutComments = {
        ...rejectedApplication,
        workflowComments: [],
      }

      render(<CommentsPrinter application={appWithoutComments} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("No comments available for this application.")).toBeInTheDocument()
      })
    })

    it("should handle missing applicant details gracefully", async () => {
      const incompleteApp = {
        ...rejectedApplication,
        postalAddress: null,
        customerAccountNumber: null,
        cellularNumber: null,
      }

      render(<CommentsPrinter application={incompleteApp} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getAllByText("N/A")).toHaveLength(3) // For missing fields
      })
    })

    it("should handle database errors gracefully", async () => {
      vi.mocked(db.getCommentsByApplication).mockRejectedValue(new Error("Database error"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to load comments:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it("should handle print window blocking", async () => {
      mockWindowOpen.mockReturnValue(null) // Simulate popup blocked

      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const printButton = screen.getByRole("button", { name: /Print Comments/ })
      fireEvent.click(printButton)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Please allow popups to print comments")
      })

      alertSpy.mockRestore()
    })
  })

  describe("User Type Label Testing", () => {
    it("should display correct user type labels", () => {
      expect(getUserTypeLabel("permitting_officer")).toBe("Permitting Officer")
      expect(getUserTypeLabel("chairperson")).toBe("Chairperson")
      expect(getUserTypeLabel("catchment_manager")).toBe("Catchment Manager")
      expect(getUserTypeLabel("catchment_chairperson")).toBe("Catchment Chairperson")
      expect(getUserTypeLabel("permit_supervisor")).toBe("Permit Supervisor")
      expect(getUserTypeLabel("ict")).toBe("ICT Administrator")
    })
  })

  describe("Date and Time Formatting", () => {
    it("should format dates correctly in print output", async () => {
      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        // Check that dates are formatted properly
        expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument() // Created date
        expect(screen.getByText(/Report Generated:/)).toBeInTheDocument()
      })
    })
  })

  describe("Comprehensive Content Verification", () => {
    it("should include all required sections in print preview", async () => {
      render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        // Header section
        expect(screen.getByText("APPLICATION COMMENTS REPORT")).toBeInTheDocument()
        expect(screen.getByText("Upper Manyame Sub Catchment Council")).toBeInTheDocument()

        // Application information section
        expect(screen.getByText("Application Information")).toBeInTheDocument()

        // Rejection warning
        expect(screen.getByText("⚠️ APPLICATION REJECTED ⚠️")).toBeInTheDocument()

        // Comments section
        expect(screen.getByText("Comments and Review History")).toBeInTheDocument()

        // Footer section
        expect(screen.getByText("This report was generated by the UMSCC Permit Management System")).toBeInTheDocument()
        expect(screen.getByText("Upper Manyame Sub Catchment Council - Water Permit Management")).toBeInTheDocument()
      })
    })
  })
})
