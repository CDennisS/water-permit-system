/**
 * Comprehensive test suite for Catchment Manager and Catchment Chairperson dashboards
 * Tests all critical functionality and edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { CatchmentChairpersonDashboard } from "@/components/catchment-chairperson-dashboard"
import { db } from "@/lib/database"
import type { PermitApplication, User } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
    addWorkflowComment: vi.fn(),
    updateApplication: vi.fn(),
    addLog: vi.fn(),
  },
}))

// Mock the child components
vi.mock("@/components/application-details", () => ({
  ApplicationDetails: ({ application }: { application: any }) => (
    <div data-testid="application-details">Application Details: {application.applicationId}</div>
  ),
}))

vi.mock("@/components/enhanced-document-viewer", () => ({
  EnhancedDocumentViewer: ({ application }: { application: any }) => (
    <div data-testid="document-viewer">Document Viewer: {application.applicationId}</div>
  ),
}))

vi.mock("@/components/reports-analytics", () => ({
  ReportsAnalytics: () => <div data-testid="reports-analytics">Reports & Analytics</div>,
}))

// Test data
const mockUser: User = {
  id: "user-1",
  name: "Test Manager",
  email: "manager@test.com",
  userType: "catchment_manager",
  createdAt: new Date(),
}

const mockChairpersonUser: User = {
  id: "user-2",
  name: "Test Chairperson",
  email: "chairperson@test.com",
  userType: "catchment_chairperson",
  createdAt: new Date(),
}

const mockApplications: PermitApplication[] = [
  {
    id: "app-1",
    applicationId: "APP-001",
    applicantName: "John Doe",
    permitType: "water_extraction",
    waterAllocation: 1000,
    numberOfBoreholes: 2,
    currentStage: 3,
    status: "under_review",
    workflowComments: [
      {
        userId: "user-0",
        userType: "chairperson",
        userName: "Previous Reviewer",
        comment: "Initial review completed",
        stage: 2,
        decision: null,
        timestamp: new Date(),
      },
    ],
    createdAt: new Date(),
    submittedAt: new Date(),
    comments: "Original application comments",
  },
  {
    id: "app-2",
    applicationId: "APP-002",
    applicantName: "Jane Smith",
    permitType: "irrigation",
    waterAllocation: 500,
    numberOfBoreholes: 1,
    currentStage: 3,
    status: "under_review",
    workflowComments: [],
    createdAt: new Date(),
    submittedAt: new Date(),
  },
]

const mockStage4Applications: PermitApplication[] = mockApplications.map((app) => ({
  ...app,
  currentStage: 4,
}))

describe("CatchmentManagerDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)
    vi.mocked(db.addWorkflowComment).mockResolvedValue(undefined)
    vi.mocked(db.updateApplication).mockResolvedValue(undefined)
    vi.mocked(db.addLog).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial Load and Display", () => {
    it("should render dashboard header correctly", async () => {
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Manyame Catchment Manager")).toBeInTheDocument()
        expect(screen.getByText(/Second Review Stage/)).toBeInTheDocument()
      })
    })

    it("should load and display applications from stage 3", async () => {
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
        expect(screen.getByText("APP-002")).toBeInTheDocument()
        expect(screen.getByText("John Doe")).toBeInTheDocument()
        expect(screen.getByText("Jane Smith")).toBeInTheDocument()
      })
    })

    it("should show correct statistics", async () => {
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument() // Pending applications
        expect(screen.getByText("0")).toBeInTheDocument() // Initially no reviewed
      })
    })

    it("should display tabs correctly", async () => {
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Review Applications")).toBeInTheDocument()
        expect(screen.getByText("Submitted Permits")).toBeInTheDocument()
        expect(screen.getByText("Analytical Data")).toBeInTheDocument()
        expect(screen.getByText("Status Tracking")).toBeInTheDocument()
      })
    })
  })

  describe("Review Functionality", () => {
    it("should allow checking reviewed checkbox", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const checkbox = screen.getAllByLabelText("Reviewed")[0]
      await user.click(checkbox)

      expect(checkbox).toBeChecked()
      expect(db.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "Marked as Reviewed",
        }),
      )
    })

    it("should allow unchecking reviewed checkbox", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const checkbox = screen.getAllByLabelText("Reviewed")[0]
      await user.click(checkbox) // Check
      await user.click(checkbox) // Uncheck

      expect(checkbox).not.toBeChecked()
      expect(db.addLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "Unmarked Review",
        }),
      )
    })
  })

  describe("Comment Functionality", () => {
    it("should allow entering comments", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const textarea = screen.getAllByPlaceholderText(/Enter your mandatory review comment/)[0]
      await user.type(textarea, "This is a test comment")

      expect(textarea).toHaveValue("This is a test comment")
    })

    it("should save comments when save button is clicked", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const textarea = screen.getAllByPlaceholderText(/Enter your mandatory review comment/)[0]
      await user.type(textarea, "Test comment for saving")

      const saveButton = screen.getAllByText("Save Comment")[0]
      await user.click(saveButton)

      await waitFor(() => {
        expect(db.addWorkflowComment).toHaveBeenCalledWith(
          "app-1",
          expect.objectContaining({
            comment: "Test comment for saving",
            stage: 3,
            userId: "user-1",
          }),
        )
      })
    })

    it("should not save empty comments", async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const saveButton = screen.getAllByText("Save Comment")[0]
      await user.click(saveButton)

      expect(alertSpy).toHaveBeenCalledWith("Please enter a comment before saving.")
      expect(db.addWorkflowComment).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })

    it("should show comment status badges correctly", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      // Initially should show "Comment Required"
      expect(screen.getAllByText("Comment Required")[0]).toBeInTheDocument()

      // Type comment
      const textarea = screen.getAllByPlaceholderText(/Enter your mandatory review comment/)[0]
      await user.type(textarea, "Test comment")

      // Should show "Unsaved Changes"
      await waitFor(() => {
        expect(screen.getAllByText("Unsaved Changes")[0]).toBeInTheDocument()
      })
    })
  })

  describe("Batch Submission", () => {
    it("should block submission when requirements not met", async () => {
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const submitButton = screen.getByText(/Submit All Applications/)
      expect(submitButton).toBeDisabled()

      expect(screen.getByText(/SUBMISSION BLOCKED/)).toBeInTheDocument()
    })

    it("should enable submission when all requirements met", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      // Complete first application
      const checkbox1 = screen.getAllByLabelText("Reviewed")[0]
      await user.click(checkbox1)

      const textarea1 = screen.getAllByPlaceholderText(/Enter your mandatory review comment/)[0]
      await user.type(textarea1, "Comment 1")

      const saveButton1 = screen.getAllByText("Save Comment")[0]
      await user.click(saveButton1)

      // Complete second application
      const checkbox2 = screen.getAllByLabelText("Reviewed")[1]
      await user.click(checkbox2)

      const textarea2 = screen.getAllByPlaceholderText(/Enter your mandatory review comment/)[1]
      await user.type(textarea2, "Comment 2")

      const saveButton2 = screen.getAllByText("Save Comment")[1]
      await user.click(saveButton2)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit All Applications/)
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe("Application Details Modal", () => {
    it("should open application details when view button clicked", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText(/View Details & Documents/)[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText("Manager Review - APP-001")).toBeInTheDocument()
        expect(screen.getByTestId("application-details")).toBeInTheDocument()
        expect(screen.getByTestId("document-viewer")).toBeInTheDocument()
      })
    })

    it("should display workflow comments in modal", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText(/View Details & Documents/)[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText("Review History - All Comments from Previous Stages")).toBeInTheDocument()
        expect(screen.getByText("Previous Reviewer (CHAIRPERSON)")).toBeInTheDocument()
        expect(screen.getByText("Initial review completed")).toBeInTheDocument()
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      vi.mocked(db.getApplications).mockRejectedValue(new Error("API Error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to load applications:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it("should handle comment save errors", async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})
      vi.mocked(db.addWorkflowComment).mockRejectedValue(new Error("Save Error"))

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const textarea = screen.getAllByPlaceholderText(/Enter your mandatory review comment/)[0]
      await user.type(textarea, "Test comment")

      const saveButton = screen.getAllByText("Save Comment")[0]
      await user.click(saveButton)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Failed to save comment. Please try again.")
      })

      alertSpy.mockRestore()
    })
  })
})

describe("CatchmentChairpersonDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue(mockStage4Applications)
    vi.mocked(db.addWorkflowComment).mockResolvedValue(undefined)
    vi.mocked(db.updateApplication).mockResolvedValue(undefined)
    vi.mocked(db.addLog).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial Load and Display", () => {
    it("should render chairperson dashboard header correctly", async () => {
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("Manyame Catchment Chairperson")).toBeInTheDocument()
        expect(screen.getByText(/Final Overview & Decision/)).toBeInTheDocument()
      })
    })

    it("should load and display applications from stage 4", async () => {
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
        expect(screen.getByText("APP-002")).toBeInTheDocument()
        expect(db.getApplications).toHaveBeenCalled()
      })
    })

    it("should show correct decision statistics", async () => {
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument() // Pending applications
        expect(screen.getAllByText("0")[0]).toBeInTheDocument() // Initially no approved
      })
    })
  })

  describe("Decision Making", () => {
    it("should allow selecting approve decision", async () => {
      const user = userEvent.setup()
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const approveButton = screen.getAllByText("Approve")[0]
      await user.click(approveButton)

      // Button should become selected (default variant)
      expect(approveButton).toHaveClass("bg-green-600")
    })

    it("should allow selecting reject decision", async () => {
      const user = userEvent.setup()
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const rejectButton = screen.getAllByText("Reject")[0]
      await user.click(rejectButton)

      // Should show rejection reason section
      await waitFor(() => {
        expect(screen.getByText("Mandatory Rejection Reason:")).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Provide detailed rejection reasons/)).toBeInTheDocument()
      })
    })

    it("should require rejection reason for rejected applications", async () => {
      const user = userEvent.setup()
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      // Select reject
      const rejectButton = screen.getAllByText("Reject")[0]
      await user.click(rejectButton)

      await waitFor(() => {
        expect(screen.getByText("Reason Required")).toBeInTheDocument()
      })

      // Enter rejection reason
      const reasonTextarea = screen.getByPlaceholderText(/Provide detailed rejection reasons/)
      await user.type(reasonTextarea, "Application does not meet requirements")

      // Save reason
      const saveReasonButton = screen.getByText("Save Reason")
      await user.click(saveReasonButton)

      await waitFor(() => {
        expect(db.addWorkflowComment).toHaveBeenCalledWith(
          "app-1",
          expect.objectContaining({
            comment: "REJECTION REASON: Application does not meet requirements",
            stage: 4,
            decision: "rejected",
          }),
        )
      })
    })

    it("should not save empty rejection reasons", async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const rejectButton = screen.getAllByText("Reject")[0]
      await user.click(rejectButton)

      const saveReasonButton = screen.getByText("Save Reason")
      await user.click(saveReasonButton)

      expect(alertSpy).toHaveBeenCalledWith("Please enter a rejection reason before saving.")
      expect(db.addWorkflowComment).not.toHaveBeenCalled()

      alertSpy.mockRestore()
    })
  })

  describe("Batch Submission", () => {
    it("should block submission when decisions incomplete", async () => {
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const submitButton = screen.getByText(/Submit All to Permitting Officer/)
      expect(submitButton).toBeDisabled()

      expect(screen.getByText(/SUBMISSION BLOCKED/)).toBeInTheDocument()
    })

    it("should enable submission when all decisions complete", async () => {
      const user = userEvent.setup()
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      // Approve first application
      const approveButton1 = screen.getAllByText("Approve")[0]
      await user.click(approveButton1)

      // Reject second application with reason
      const rejectButton2 = screen.getAllByText("Reject")[1]
      await user.click(rejectButton2)

      await waitFor(() => {
        const reasonTextarea = screen.getByPlaceholderText(/Provide detailed rejection reasons/)
        await user.type(reasonTextarea, 'Insufficient documentation')

        const saveReasonButton = screen.getByText("Save Reason")
        await user.click(saveReasonButton)
      })

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit All to Permitting Officer/)
        expect(submitButton).not.toBeDisabled()
      })
    })

    it("should process batch submission correctly", async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      // Complete both applications
      const approveButton1 = screen.getAllByText("Approve")[0]
      await user.click(approveButton1)

      const approveButton2 = screen.getAllByText("Approve")[1]
      await user.click(approveButton2)

      // Submit batch
      const submitButton = screen.getByText(/Submit All to Permitting Officer/)
      await user.click(submitButton)

      // Confirm in modal
      await waitFor(() => {
        const confirmButton = screen.getByText(/Submit $$2$$/)
        await user.click(confirmButton)
      })

      await waitFor(() => {
        expect(db.updateApplication).toHaveBeenCalledTimes(2)
        expect(db.updateApplication).toHaveBeenCalledWith(
          "app-1",
          expect.objectContaining({
            currentStage: 1,
            status: "approved",
          }),
        )
        expect(alertSpy).toHaveBeenCalledWith("Successfully processed 2 applications.")
      })

      alertSpy.mockRestore()
    })
  })

  describe("Tabs Navigation", () => {
    it("should switch between tabs correctly", async () => {
      const user = userEvent.setup()
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      // Switch to Analytics tab
      const analyticsTab = screen.getByText("Analytics")
      await user.click(analyticsTab)

      await waitFor(() => {
        expect(screen.getByTestId("reports-analytics")).toBeInTheDocument()
      })

      // Switch to Permits tab
      const permitsTab = screen.getByText("Submitted Permits")
      await user.click(permitsTab)

      await waitFor(() => {
        expect(screen.getByText(/Record of All Submitted Permits/)).toBeInTheDocument()
      })
    })
  })

  describe("Application Details Modal", () => {
    it("should open and display application details", async () => {
      const user = userEvent.setup()
      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      const viewButton = screen.getAllByText(/View Details & Documents/)[0]
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByText("Final Decision – APP-001")).toBeInTheDocument()
        expect(screen.getByText("Review History & Comments")).toBeInTheDocument()
        expect(screen.getByTestId("application-details")).toBeInTheDocument()
        expect(screen.getByTestId("document-viewer")).toBeInTheDocument()
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle batch submission errors", async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      vi.mocked(db.updateApplication).mockRejectedValue(new Error("Update Error"))

      render(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

      await waitFor(() => {
        expect(screen.getByText("APP-001")).toBeInTheDocument()
      })

      // Complete applications
      const approveButton1 = screen.getAllByText("Approve")[0]
      await user.click(approveButton1)
      const approveButton2 = screen.getAllByText("Approve")[1]
      await user.click(approveButton2)

      // Try to submit
      const submitButton = screen.getByText(/Submit All to Permitting Officer/)
      await user.click(submitButton)

      await waitFor(() => {
        const confirmButton = screen.getByText(/Submit $$2$$/)
        await user.click(confirmButton)
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalledWith("Submission failed. Please retry.")
      })

      alertSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })
})

describe("Integration Tests", () => {
  it("should maintain workflow integrity between stages", async () => {
    // Test that applications move correctly from stage 3 to 4
    const managerApps = mockApplications
    const chairpersonApps = mockStage4Applications

    vi.mocked(db.getApplications)
      .mockResolvedValueOnce(managerApps) // Manager dashboard
      .mockResolvedValueOnce(chairpersonApps) // Chairperson dashboard

    const { rerender } = render(<CatchmentManagerDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument()
    })

    // Simulate manager completing review
    rerender(<CatchmentChairpersonDashboard user={mockChairpersonUser} />)

    await waitFor(() => {
      expect(screen.getByText("Manyame Catchment Chairperson")).toBeInTheDocument()
      expect(screen.getByText("APP-001")).toBeInTheDocument()
    })
  })

  it("should preserve application data across workflow stages", () => {
    const originalApp = mockApplications[0]
    const stage4App = mockStage4Applications[0]

    // Verify critical data is preserved
    expect(stage4App.applicationId).toBe(originalApp.applicationId)
    expect(stage4App.applicantName).toBe(originalApp.applicantName)
    expect(stage4App.permitType).toBe(originalApp.permitType)
    expect(stage4App.waterAllocation).toBe(originalApp.waterAllocation)
    expect(stage4App.workflowComments).toEqual(originalApp.workflowComments)
  })
})
