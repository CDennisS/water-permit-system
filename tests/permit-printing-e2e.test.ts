import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WorkflowManager } from "@/components/workflow-manager"
import { db } from "@/lib/database"
import type { PermitApplication, User } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    updateApplication: vi.fn(),
    addComment: vi.fn(),
    addLog: vi.fn(),
    getCommentsByApplication: vi.fn(),
  },
}))

describe("End-to-End Permit Printing Workflow", () => {
  let testApplication: PermitApplication
  let users: Record<string, User>

  beforeEach(() => {
    vi.clearAllMocks()

    testApplication = {
      id: "e2e-app-1",
      applicationId: "E2E-2024-001",
      applicantName: "Test Applicant",
      physicalAddress: "456 Test St, Harare",
      postalAddress: "P.O. Box 456, Harare",
      numberOfBoreholes: 3,
      landSize: 10.0,
      waterAllocation: 2500,
      intendedUse: "Commercial",
      permitType: "urban",
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "submitted",
      currentStage: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
    }

    users = {
      permittingOfficer: {
        id: "po-1",
        username: "officer_test",
        userType: "permitting_officer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      chairperson: {
        id: "chair-1",
        username: "chair_test",
        userType: "chairperson",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      catchmentManager: {
        id: "cm-1",
        username: "manager_test",
        userType: "catchment_manager",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      catchmentChairperson: {
        id: "cc-1",
        username: "catchchair_test",
        userType: "catchment_chairperson",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    vi.mocked(db.getCommentsByApplication).mockResolvedValue([])
    vi.mocked(db.addLog).mockResolvedValue(undefined)
  })

  it("should complete full workflow from submission to permit printing", async () => {
    const user = userEvent.setup()
    let currentApp = { ...testApplication }

    // STAGE 1: Application submitted, moves to Stage 2
    vi.mocked(db.updateApplication).mockResolvedValueOnce({
      ...currentApp,
      currentStage: 2,
      status: "under_review",
    })

    const mockOnUpdate = vi.fn((updatedApp) => {
      currentApp = updatedApp
    })

    // Start with Stage 1 (already submitted)
    const { rerender } = render(
      <WorkflowManager user={users.permittingOfficer} application={currentApp} onUpdate={mockOnUpdate} />,
    )

    // Verify no print options at Stage 1
    expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()

    // STAGE 2: Chairperson Review
    currentApp = { ...currentApp, currentStage: 2, status: "under_review" }
    vi.mocked(db.updateApplication).mockResolvedValueOnce({
      ...currentApp,
      currentStage: 3,
      status: "under_review",
    })

    rerender(<WorkflowManager user={users.chairperson} application={currentApp} onUpdate={mockOnUpdate} />)

    // Chairperson reviews and submits
    const reviewCheckbox = screen.getByLabelText(/I have reviewed this application/)
    await user.click(reviewCheckbox)

    const submitButton = screen.getByRole("button", { name: /Submit/ })
    expect(submitButton).toBeEnabled()
    await user.click(submitButton)

    await waitFor(() => {
      expect(db.updateApplication).toHaveBeenCalledWith(currentApp.id, {
        currentStage: 3,
        status: "under_review",
      })
    })

    // STAGE 3: Catchment Manager Review (requires comment)
    currentApp = { ...currentApp, currentStage: 3, status: "under_review" }
    vi.mocked(db.addComment).mockResolvedValueOnce({
      id: "comment-1",
      applicationId: currentApp.id,
      userId: users.catchmentManager.id,
      userType: "catchment_manager",
      comment: "Technical review completed. Water allocation approved.",
      stage: 3,
      isRejectionReason: false,
      createdAt: new Date(),
    })
    vi.mocked(db.updateApplication).mockResolvedValueOnce({
      ...currentApp,
      currentStage: 4,
      status: "under_review",
    })

    rerender(<WorkflowManager user={users.catchmentManager} application={currentApp} onUpdate={mockOnUpdate} />)

    // Manager must add comment
    const commentTextarea = screen.getByPlaceholderText(/Enter your comments/)
    await user.type(commentTextarea, "Technical review completed. Water allocation approved.")

    const managerReviewCheckbox = screen.getByLabelText(/I have reviewed this application/)
    await user.click(managerReviewCheckbox)

    const managerSubmitButton = screen.getByRole("button", { name: /Submit/ })
    await user.click(managerSubmitButton)

    await waitFor(() => {
      expect(db.addComment).toHaveBeenCalled()
      expect(db.updateApplication).toHaveBeenCalledWith(currentApp.id, {
        currentStage: 4,
        status: "under_review",
      })
    })

    // STAGE 4: Final Approval by Catchment Chairperson
    currentApp = { ...currentApp, currentStage: 4, status: "under_review" }
    vi.mocked(db.updateApplication).mockResolvedValueOnce({
      ...currentApp,
      currentStage: 1,
      status: "approved",
      approvedAt: new Date(),
    })

    rerender(<WorkflowManager user={users.catchmentChairperson} application={currentApp} onUpdate={mockOnUpdate} />)

    // Final approval
    const finalReviewCheckbox = screen.getByLabelText(/I have reviewed this application/)
    await user.click(finalReviewCheckbox)

    const approveButton = screen.getByRole("button", { name: /Approve/ })
    await user.click(approveButton)

    const finalSubmitButton = screen.getByRole("button", { name: /Submit/ })
    await user.click(finalSubmitButton)

    await waitFor(() => {
      expect(db.updateApplication).toHaveBeenCalledWith(currentApp.id, {
        currentStage: 1,
        status: "approved",
        approvedAt: expect.any(Date),
      })
    })

    // Verify workflow completion
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        currentStage: 1,
        approvedAt: expect.any(Date),
      }),
    )
  })

  it("should handle rejection workflow correctly", async () => {
    const user = userEvent.setup()
    const currentApp = { ...testApplication, currentStage: 4, status: "under_review" }

    vi.mocked(db.addComment).mockResolvedValueOnce({
      id: "rejection-comment",
      applicationId: currentApp.id,
      userId: users.catchmentChairperson.id,
      userType: "catchment_chairperson",
      comment: "Insufficient water allocation justification.",
      stage: 4,
      isRejectionReason: true,
      createdAt: new Date(),
    })

    vi.mocked(db.updateApplication).mockResolvedValueOnce({
      ...currentApp,
      currentStage: 1,
      status: "rejected",
      rejectedAt: new Date(),
    })

    const mockOnUpdate = vi.fn()

    render(<WorkflowManager user={users.catchmentChairperson} application={currentApp} onUpdate={mockOnUpdate} />)

    // Review and reject
    const reviewCheckbox = screen.getByLabelText(/I have reviewed this application/)
    await user.click(reviewCheckbox)

    const rejectButton = screen.getByRole("button", { name: /Reject/ })
    await user.click(rejectButton)

    const rejectionTextarea = screen.getByPlaceholderText(/Please provide detailed reasons/)
    await user.type(rejectionTextarea, "Insufficient water allocation justification.")

    const submitButton = screen.getByRole("button", { name: /Submit/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(db.addComment).toHaveBeenCalledWith({
        applicationId: currentApp.id,
        userId: users.catchmentChairperson.id,
        userType: "catchment_chairperson",
        comment: "Insufficient water allocation justification.",
        stage: 4,
        isRejectionReason: true,
      })
    })

    await waitFor(() => {
      expect(db.updateApplication).toHaveBeenCalledWith(currentApp.id, {
        currentStage: 1,
        status: "rejected",
        rejectedAt: expect.any(Date),
      })
    })
  })

  it("should validate required fields at each stage", async () => {
    const user = userEvent.setup()

    // Test Catchment Manager stage (requires comment)
    const managerApp = { ...testApplication, currentStage: 3, status: "under_review" }

    render(<WorkflowManager user={users.catchmentManager} application={managerApp} onUpdate={vi.fn()} />)

    const reviewCheckbox = screen.getByLabelText(/I have reviewed this application/)
    await user.click(reviewCheckbox)

    // Try to submit without comment
    const submitButton = screen.getByRole("button", { name: /Submit/ })
    expect(submitButton).toBeDisabled() // Should be disabled without comment

    // Add comment
    const commentTextarea = screen.getByPlaceholderText(/Enter your comments/)
    await user.type(commentTextarea, "Required comment added.")

    expect(submitButton).toBeEnabled() // Should be enabled with comment
  })

  it("should show appropriate error messages for validation failures", async () => {
    const user = userEvent.setup()

    // Test final stage rejection without reason
    const finalApp = { ...testApplication, currentStage: 4, status: "under_review" }

    // Mock alert
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

    render(<WorkflowManager user={users.catchmentChairperson} application={finalApp} onUpdate={vi.fn()} />)

    const reviewCheckbox = screen.getByLabelText(/I have reviewed this application/)
    await user.click(reviewCheckbox)

    const rejectButton = screen.getByRole("button", { name: /Reject/ })
    await user.click(rejectButton)

    // Try to submit without rejection reason
    const submitButton = screen.getByRole("button", { name: /Submit/ })
    expect(submitButton).toBeDisabled() // Should be disabled without rejection reason

    alertSpy.mockRestore()
  })
})
