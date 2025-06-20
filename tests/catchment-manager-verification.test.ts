import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
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

// Mock user
const mockCatchmentManager: User = {
  id: "cm-1",
  username: "catchment_manager",
  userType: "catchment_manager",
  name: "Test Catchment Manager",
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock applications at stage 3 (from Chairperson)
const mockApplications: PermitApplication[] = [
  {
    id: "app-1",
    applicationId: "MC2024-001",
    applicantName: "John Doe",
    permitType: "borehole",
    waterAllocation: 100,
    numberOfBoreholes: 2,
    currentStage: 3,
    status: "under_review",
    createdAt: new Date(),
    updatedAt: new Date(),
    workflowComments: [
      {
        userId: "chair-1",
        userType: "chairperson",
        userName: "Test Chairperson",
        comment: "Initial review completed",
        stage: 2,
        decision: null,
        timestamp: new Date(),
      },
    ],
  },
  {
    id: "app-2",
    applicationId: "MC2024-002",
    applicantName: "Jane Smith",
    permitType: "irrigation",
    waterAllocation: 200,
    numberOfBoreholes: 1,
    currentStage: 3,
    status: "under_review",
    createdAt: new Date(),
    updatedAt: new Date(),
    workflowComments: [],
  },
  {
    id: "app-3",
    applicationId: "MC2024-003",
    applicantName: "Bob Wilson",
    permitType: "domestic",
    waterAllocation: 50,
    numberOfBoreholes: 1,
    currentStage: 3,
    status: "under_review",
    createdAt: new Date(),
    updatedAt: new Date(),
    workflowComments: [],
  },
]

describe("Catchment Manager Dashboard - Strict Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock database responses
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)
    vi.mocked(db.addWorkflowComment).mockResolvedValue({
      id: "comment-1",
      userId: "cm-1",
      userType: "catchment_manager",
      userName: "Test Catchment Manager",
      comment: "Test comment",
      stage: 3,
      decision: null,
      timestamp: new Date(),
    })
    vi.mocked(db.updateApplication).mockResolvedValue(mockApplications[0])
    vi.mocked(db.addLog).mockResolvedValue({
      id: "log-1",
      userId: "cm-1",
      userType: "catchment_manager",
      action: "Test Action",
      details: "Test details",
      timestamp: new Date(),
    })
  })

  describe("🔒 READ-ONLY Enforcement", () => {
    it("should display application details as READ-ONLY with clear indicators", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Check for READ-ONLY indicators
      expect(screen.getByText(/Application details are READ-ONLY - Cannot edit or modify/i)).toBeInTheDocument()
      expect(screen.getByText(/View Details & Documents $$READ-ONLY$$/i)).toBeInTheDocument()

      // Verify no edit buttons or input fields for application details
      expect(screen.queryByText(/Edit Application/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Modify Details/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Update Application/i)).not.toBeInTheDocument()
    })

    it("should not allow editing of applicant details", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })

      // Applicant name should be displayed as text, not input
      const applicantNameElements = screen.getAllByText("John Doe")
      applicantNameElements.forEach((element) => {
        expect(element.tagName).not.toBe("INPUT")
        expect(element.tagName).not.toBe("TEXTAREA")
      })
    })

    it("should not allow editing of permit details", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText(/100 ML/)).toBeInTheDocument()
      })

      // Water allocation should be displayed as text, not input
      expect(screen.queryByDisplayValue("100")).not.toBeInTheDocument()

      // Permit type should be displayed as text, not select
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    })
  })

  describe("✅ Mandatory Comment Requirements", () => {
    it("should require comments for each application", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Check for mandatory comment labels
      const mandatoryLabels = screen.getAllByText(/Mandatory Manager Comment $$Required$$/i)
      expect(mandatoryLabels).toHaveLength(3) // One for each application

      // Check for comment required badges
      const commentRequiredBadges = screen.getAllByText(/Comment Required/i)
      expect(commentRequiredBadges).toHaveLength(3)
    })

    it("should not allow saving empty comments", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Try to save empty comment
      const saveButtons = screen.getAllByText(/Save Comment/i)
      await user.click(saveButtons[0])

      // Should show alert for empty comment
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Please enter a comment before saving.")
      })
    })

    it("should save comments and update status correctly", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Add comment to first application
      const textareas = screen.getAllByPlaceholderText(/Enter your mandatory review comment/i)
      await user.type(textareas[0], "This is a mandatory review comment")

      // Save comment
      const saveButtons = screen.getAllByText(/Save Comment/i)
      await user.click(saveButtons[0])

      await waitFor(() => {
        expect(db.addWorkflowComment).toHaveBeenCalledWith("app-1", {
          userId: "cm-1",
          userType: "catchment_manager",
          userName: "Test Catchment Manager",
          comment: "This is a mandatory review comment",
          stage: 3,
          decision: null,
          timestamp: expect.any(Date),
        })
      })
    })
  })

  describe("☑️ Reviewed Checkbox Requirements", () => {
    it("should require reviewed checkbox for each application", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Check for reviewed checkboxes
      const reviewedCheckboxes = screen.getAllByLabelText(/Reviewed/i)
      expect(reviewedCheckboxes).toHaveLength(3)

      // All should be unchecked initially
      reviewedCheckboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked()
      })
    })

    it("should track reviewed status correctly", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Check first application as reviewed
      const reviewedCheckboxes = screen.getAllByLabelText(/Reviewed/i)
      await user.click(reviewedCheckboxes[0])

      await waitFor(() => {
        expect(reviewedCheckboxes[0]).toBeChecked()
        expect(db.addLog).toHaveBeenCalledWith({
          userId: "cm-1",
          userType: "catchment_manager",
          action: "Marked as Reviewed",
          details: "Marked application app-1 as reviewed",
          applicationId: "app-1",
        })
      })
    })
  })

  describe("🚫 STRICT Batch Submission Rules", () => {
    it("should block submission when not all applications are complete", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Submit button should be disabled
      const submitButton = screen.getByText(/Submit Applications $$3$$/i)
      expect(submitButton).toBeDisabled()

      // Should show blocking message
      expect(screen.getByText(/SUBMISSION BLOCKED/i)).toBeInTheDocument()
      expect(screen.getByText(/CRITICAL RULE.*ALL applications must have BOTH/i)).toBeInTheDocument()
    })

    it("should show correct progress indicators", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Check progress indicators
      expect(screen.getByText(/0 of 3 ready for submission/i)).toBeInTheDocument()
      expect(screen.getByText(/Reviewed: 0\/3/i)).toBeInTheDocument()
      expect(screen.getByText(/Commented: 0\/3/i)).toBeInTheDocument()
    })

    it("should only enable submission when ALL applications are complete", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Complete first application
      const reviewedCheckboxes = screen.getAllByLabelText(/Reviewed/i)
      await user.click(reviewedCheckboxes[0])

      const textareas = screen.getAllByPlaceholderText(/Enter your mandatory review comment/i)
      await user.type(textareas[0], "Comment for app 1")

      const saveButtons = screen.getAllByText(/Save Comment/i)
      await user.click(saveButtons[0])

      await waitFor(() => {
        // Submit should still be disabled (only 1 of 3 complete)
        const submitButton = screen.getByText(/Submit Applications $$3$$/i)
        expect(submitButton).toBeDisabled()
      })

      // Complete second application
      await user.click(reviewedCheckboxes[1])
      await user.type(textareas[1], "Comment for app 2")
      await user.click(saveButtons[1])

      await waitFor(() => {
        // Submit should still be disabled (only 2 of 3 complete)
        const submitButton = screen.getByText(/Submit Applications $$3$$/i)
        expect(submitButton).toBeDisabled()
      })

      // Complete third application
      await user.click(reviewedCheckboxes[2])
      await user.type(textareas[2], "Comment for app 3")
      await user.click(saveButtons[2])

      await waitFor(() => {
        // Now submit should be enabled (all 3 complete)
        const submitButton = screen.getByText(/Submit Applications $$3$$/i)
        expect(submitButton).not.toBeDisabled()
        expect(screen.getByText(/All 3 applications ready/i)).toBeInTheDocument()
      })
    })

    it('should enforce "if even one lacks comment, none can be submitted" rule', async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Complete 2 out of 3 applications fully
      const reviewedCheckboxes = screen.getAllByLabelText(/Reviewed/i)
      const textareas = screen.getAllByPlaceholderText(/Enter your mandatory review comment/i)
      const saveButtons = screen.getAllByText(/Save Comment/i)

      // Complete app 1
      await user.click(reviewedCheckboxes[0])
      await user.type(textareas[0], "Comment for app 1")
      await user.click(saveButtons[0])

      // Complete app 2
      await user.click(reviewedCheckboxes[1])
      await user.type(textareas[1], "Comment for app 2")
      await user.click(saveButtons[1])

      // Only check app 3 as reviewed but don't add comment
      await user.click(reviewedCheckboxes[2])

      await waitFor(() => {
        // Submit should be disabled because app 3 lacks comment
        const submitButton = screen.getByText(/Submit Applications $$3$$/i)
        expect(submitButton).toBeDisabled()

        // Should show blocking message
        expect(screen.getByText(/If even one application lacks a comment, NONE can be submitted/i)).toBeInTheDocument()
      })
    })

    it("should successfully submit when all requirements are met", async () => {
      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Complete all applications
      const reviewedCheckboxes = screen.getAllByLabelText(/Reviewed/i)
      const textareas = screen.getAllByPlaceholderText(/Enter your mandatory review comment/i)
      const saveButtons = screen.getAllByText(/Save Comment/i)

      for (let i = 0; i < 3; i++) {
        await user.click(reviewedCheckboxes[i])
        await user.type(textareas[i], `Comment for app ${i + 1}`)
        await user.click(saveButtons[i])
      }

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Applications $$3$$/i)
        expect(submitButton).not.toBeDisabled()
      })

      // Click submit
      const submitButton = screen.getByText(/Submit Applications $$3$$/i)
      await user.click(submitButton)

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/Confirm Batch Submission/i)).toBeInTheDocument()
        expect(screen.getByText(/You are about to submit ALL 3 applications/i)).toBeInTheDocument()
      })

      // Confirm submission
      const confirmButton = screen.getByText(/Submit All 3 Applications/i)
      await user.click(confirmButton)

      await waitFor(() => {
        // Should update all applications to stage 4
        expect(db.updateApplication).toHaveBeenCalledTimes(3)
        mockApplications.forEach((app) => {
          expect(db.updateApplication).toHaveBeenCalledWith(app.id, {
            currentStage: 4,
            status: "under_review",
          })
        })
      })
    })
  })

  describe("📊 Dashboard Features", () => {
    it("should display correct statistics", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Check stats cards
      expect(screen.getByText("3")).toBeInTheDocument() // Pending Review
      expect(screen.getByText("0")).toBeInTheDocument() // Reviewed (initially)
      expect(screen.getByText("0")).toBeInTheDocument() // Commented (initially)
      expect(screen.getByText("0")).toBeInTheDocument() // Ready (initially)
    })

    it("should have all required tabs", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("Review Applications")).toBeInTheDocument()
        expect(screen.getByText("Record of Submitted Permits")).toBeInTheDocument()
        expect(screen.getByText("Analytical Data")).toBeInTheDocument()
        expect(screen.getByText("Overall Status Tracking")).toBeInTheDocument()
      })
    })

    it("should show proper role identification", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("Manyame Catchment Manager")).toBeInTheDocument()
        expect(screen.getByText("Second Review Stage - Review applications from Chairperson")).toBeInTheDocument()
      })
    })
  })

  describe("🔐 Security & Permissions", () => {
    it("should not show any create/edit application buttons", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Should not have any creation or editing buttons
      expect(screen.queryByText(/New Application/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Create Application/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Edit Application/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Modify Application/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Delete Application/i)).not.toBeInTheDocument()
    })

    it("should not allow editing of other users comments", async () => {
      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Should not have edit buttons for existing comments
      expect(screen.queryByText(/Edit Comment/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Delete Comment/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Modify Comment/i)).not.toBeInTheDocument()
    })

    it("should prevent comment editing after submission", async () => {
      // Mock application that has moved past stage 3
      const submittedApp = { ...mockApplications[0], currentStage: 4 }
      vi.mocked(db.getApplications).mockResolvedValue([submittedApp])

      render(<CatchmentManagerDashboard user={mockCatchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("MC2024-001")).toBeInTheDocument()
      })

      // Comment textarea should be disabled
      const textarea = screen.getByPlaceholderText(/Enter your mandatory review comment/i)
      expect(textarea).toBeDisabled()

      // Save button should be disabled
      const saveButton = screen.getByText(/Save Comment/i)
      expect(saveButton).toBeDisabled()

      // Should show lock message
      expect(screen.getByText(/Comments cannot be edited after submission/i)).toBeInTheDocument()
    })
  })
})
