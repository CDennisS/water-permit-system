import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CommentsPrinter } from "@/components/comments-printer"
import { db } from "@/lib/database"
import type { PermitApplication, User, WorkflowComment } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getCommentsByApplication: vi.fn(),
    updateApplication: vi.fn(),
    addComment: vi.fn(),
    addLog: vi.fn(),
  },
}))

describe("End-to-End Rejected Comments Printing", () => {
  let testApplication: PermitApplication
  let users: Record<string, User>
  let fullWorkflowComments: WorkflowComment[]

  beforeEach(() => {
    vi.clearAllMocks()

    testApplication = {
      id: "e2e-rejected-1",
      applicationId: "E2E-REJ-2024-001",
      applicantName: "Jane Smith Rejected",
      physicalAddress: "456 Test Avenue, Bulawayo, Zimbabwe",
      postalAddress: "P.O. Box 789, Bulawayo",
      customerAccountNumber: "CUST-67890",
      cellularNumber: "+263712345678",
      numberOfBoreholes: 3,
      landSize: 8.0,
      waterAllocation: 2000,
      intendedUse: "Agricultural Irrigation",
      permitType: "bulk_water",
      waterSource: "river",
      gpsLatitude: -20.15,
      gpsLongitude: 28.5833,
      status: "submitted",
      currentStage: 1,
      createdAt: new Date("2024-02-01T08:00:00Z"),
      updatedAt: new Date("2024-02-01T08:00:00Z"),
      documents: [],
      workflowComments: [],
    }

    users = {
      permittingOfficer: {
        id: "po-e2e",
        username: "officer_e2e",
        userType: "permitting_officer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      chairperson: {
        id: "chair-e2e",
        username: "chair_e2e",
        userType: "chairperson",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      catchmentManager: {
        id: "cm-e2e",
        username: "manager_e2e",
        userType: "catchment_manager",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      catchmentChairperson: {
        id: "cc-e2e",
        username: "catchchair_e2e",
        userType: "catchment_chairperson",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    fullWorkflowComments = [
      {
        id: "e2e-comment-1",
        applicationId: "e2e-rejected-1",
        userId: "po-e2e",
        userType: "permitting_officer",
        comment:
          "Application received and initial documentation review completed. All required forms submitted. Forwarding to chairperson for policy review.",
        stage: 1,
        isRejectionReason: false,
        createdAt: new Date("2024-02-02T09:15:00Z"),
      },
      {
        id: "e2e-comment-2",
        applicationId: "e2e-rejected-1",
        userId: "chair-e2e",
        userType: "chairperson",
        comment:
          "Policy review completed. Application complies with basic requirements. However, concerns noted regarding water allocation amount. Forwarding to catchment manager for technical assessment.",
        stage: 2,
        isRejectionReason: false,
        createdAt: new Date("2024-02-03T10:30:00Z"),
      },
      {
        id: "e2e-comment-3",
        applicationId: "e2e-rejected-1",
        userId: "cm-e2e",
        userType: "catchment_manager",
        comment:
          "Technical assessment reveals significant concerns: 1) Requested water allocation exceeds river flow capacity during dry season, 2) Proposed location conflicts with existing downstream users, 3) Environmental impact assessment insufficient. Recommending rejection.",
        stage: 3,
        isRejectionReason: false,
        createdAt: new Date("2024-02-04T14:45:00Z"),
      },
      {
        id: "e2e-comment-4",
        applicationId: "e2e-rejected-1",
        userId: "cc-e2e",
        userType: "catchment_chairperson",
        comment:
          "Final decision: APPLICATION REJECTED. Based on comprehensive technical assessment, this application cannot be approved due to: 1) Water allocation request (2000 m³/annum) exceeds sustainable river flow capacity during critical dry season months (May-October), 2) Proposed abstraction point conflicts with existing downstream agricultural users who have prior water rights, 3) Environmental impact assessment does not adequately address potential effects on riverine ecosystem and fish migration patterns, 4) No alternative water conservation measures proposed to reduce demand. Applicant may resubmit with reduced allocation request (maximum 800 m³/annum) and comprehensive environmental mitigation plan.",
        stage: 4,
        isRejectionReason: true,
        createdAt: new Date("2024-02-05T16:20:00Z"),
      },
    ]

    vi.mocked(db.getCommentsByApplication).mockResolvedValue(fullWorkflowComments)
  })

  it("should complete full workflow to rejection and print comprehensive comments", async () => {
    const user = userEvent.setup()

    // Start with final stage rejection
    const rejectedApp = {
      ...testApplication,
      status: "rejected" as const,
      currentStage: 1,
      rejectedAt: new Date("2024-02-05T16:20:00Z"),
      workflowComments: fullWorkflowComments,
    }

    render(<CommentsPrinter application={rejectedApp} user={users.permittingOfficer} />)

    // Open preview
    const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
    await user.click(previewButton)

    await waitFor(() => {
      // Verify comprehensive applicant details
      expect(screen.getByText("E2E-REJ-2024-001")).toBeInTheDocument()
      expect(screen.getByText("Jane Smith Rejected")).toBeInTheDocument()
      expect(screen.getByText("456 Test Avenue, Bulawayo, Zimbabwe")).toBeInTheDocument()
      expect(screen.getByText("P.O. Box 789, Bulawayo")).toBeInTheDocument()
      expect(screen.getByText("CUST-67890")).toBeInTheDocument()
      expect(screen.getByText("+263712345678")).toBeInTheDocument()
      expect(screen.getByText("Agricultural Irrigation")).toBeInTheDocument()
      expect(screen.getByText("2,000 m³/annum")).toBeInTheDocument()
      expect(screen.getByText("Lat: -20.15, Long: 28.5833")).toBeInTheDocument()

      // Verify rejection status is prominent
      expect(screen.getByText("⚠️ APPLICATION REJECTED ⚠️")).toBeInTheDocument()
      expect(screen.getByText("REJECTED")).toBeInTheDocument()

      // Verify all workflow comments are present
      expect(screen.getByText("Permitting Officer")).toBeInTheDocument()
      expect(screen.getByText("Chairperson")).toBeInTheDocument()
      expect(screen.getByText("Catchment Manager")).toBeInTheDocument()
      expect(screen.getByText("Catchment Chairperson")).toBeInTheDocument()

      // Verify rejection reason is highlighted
      expect(screen.getByText("REJECTION REASON")).toBeInTheDocument()
      expect(screen.getByText(/Final decision: APPLICATION REJECTED/)).toBeInTheDocument()
    })

    // Test print functionality
    const mockPrintWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
    }
    vi.spyOn(window, "open").mockReturnValue(mockPrintWindow)

    const printButton = screen.getByRole("button", { name: /Print/ })
    await user.click(printButton)

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith("", "_blank")
      expect(mockPrintWindow.document.write).toHaveBeenCalled()
      expect(mockPrintWindow.print).toHaveBeenCalled()
    })
  })

  it("should handle bulk water permit rejection with specific formatting", async () => {
    const bulkWaterApp = {
      ...testApplication,
      permitType: "bulk_water" as const,
      waterAllocation: 5000,
      numberOfBoreholes: 0, // Bulk water doesn't use boreholes
      waterSource: "river" as const,
      status: "rejected" as const,
      workflowComments: fullWorkflowComments,
    }

    render(<CommentsPrinter application={bulkWaterApp} user={users.permittingOfficer} />)

    const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
    fireEvent.click(previewButton)

    await waitFor(() => {
      expect(screen.getByText("5,000 m³/annum")).toBeInTheDocument()
      expect(screen.getByText("0")).toBeInTheDocument() // Number of boreholes
      expect(screen.getByText("River")).toBeInTheDocument() // Water source
    })
  })

  it("should generate downloadable report with all rejection details", async () => {
    const user = userEvent.setup()

    const rejectedApp = {
      ...testApplication,
      status: "rejected" as const,
      workflowComments: fullWorkflowComments,
    }

    // Mock blob creation
    const mockBlob = new Blob()
    const mockUrl = "blob:mock-url"
    vi.spyOn(window, "Blob").mockImplementation(() => mockBlob)
    vi.spyOn(URL, "createObjectURL").mockReturnValue(mockUrl)

    // Mock DOM manipulation
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    }
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

    render(<CommentsPrinter application={rejectedApp} user={users.permittingOfficer} />)

    const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
    await user.click(previewButton)

    await waitFor(() => {
      const downloadButton = screen.getByRole("button", { name: /Download/ })
      fireEvent.click(downloadButton)
    })

    await waitFor(() => {
      expect(window.Blob).toHaveBeenCalled()
      const blobContent = (window.Blob as any).mock.calls[0][0][0]

      // Verify comprehensive download content
      expect(blobContent).toContain("APPLICATION COMMENTS REPORT")
      expect(blobContent).toContain("APPLICANT DETAILS:")
      expect(blobContent).toContain("Jane Smith Rejected")
      expect(blobContent).toContain("E2E-REJ-2024-001")
      expect(blobContent).toContain("Agricultural Irrigation")
      expect(blobContent).toContain("*** APPLICATION REJECTED ***")
      expect(blobContent).toContain("COMMENTS AND REVIEW HISTORY:")
      expect(blobContent).toContain("Type: REJECTION REASON")
      expect(blobContent).toContain("Final decision: APPLICATION REJECTED")

      // Verify filename
      expect(mockAnchor.download).toMatch(/Comments_E2E-REJ-2024-001_\d{4}-\d{2}-\d{2}\.txt/)
    })
  })

  it("should handle multiple rejection reasons from different stages", async () => {
    const multipleRejectionComments = [
      ...fullWorkflowComments.slice(0, 2),
      {
        id: "multi-reject-1",
        applicationId: "e2e-rejected-1",
        userId: "cm-e2e",
        userType: "catchment_manager",
        comment: "Technical concerns identified that require rejection.",
        stage: 3,
        isRejectionReason: true,
        createdAt: new Date("2024-02-04T14:45:00Z"),
      },
      {
        id: "multi-reject-2",
        applicationId: "e2e-rejected-1",
        userId: "cc-e2e",
        userType: "catchment_chairperson",
        comment: "Additional policy concerns also require rejection.",
        stage: 4,
        isRejectionReason: true,
        createdAt: new Date("2024-02-05T16:20:00Z"),
      },
    ]

    vi.mocked(db.getCommentsByApplication).mockResolvedValue(multipleRejectionComments)

    const rejectedApp = {
      ...testApplication,
      status: "rejected" as const,
      workflowComments: multipleRejectionComments,
    }

    render(<CommentsPrinter application={rejectedApp} user={users.permittingOfficer} />)

    const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
    fireEvent.click(previewButton)

    await waitFor(() => {
      // Should show multiple rejection reason badges
      const rejectionBadges = screen.getAllByText("REJECTION REASON")
      expect(rejectionBadges).toHaveLength(2)
    })
  })
})
