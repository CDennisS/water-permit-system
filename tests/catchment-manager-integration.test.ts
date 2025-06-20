import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CatchmentManagerDashboard } from "@/components/catchment-manager-dashboard"
import { db } from "@/lib/database"
import type { PermitApplication, User } from "@/types"

// Mock the database
vi.mock("@/lib/database")

const mockUser: User = {
  id: "cm-test",
  username: "test_manager",
  userType: "catchment_manager",
  name: "Test Manager",
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("Catchment Manager Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
    vi.mocked(db.getApplications).mockResolvedValue([])
    vi.mocked(db.addWorkflowComment).mockResolvedValue({} as any)
    vi.mocked(db.updateApplication).mockResolvedValue({} as any)
    vi.mocked(db.addLog).mockResolvedValue({} as any)
  })

  describe("🔄 Workflow Integration", () => {
    it("should only show applications at stage 3 from Chairperson", async () => {
      const mixedApplications: PermitApplication[] = [
        {
          id: "app-stage-1",
          applicationId: "MC2024-001",
          applicantName: "Stage 1 App",
          currentStage: 1,
          status: "draft",
        } as PermitApplication,
        {
          id: "app-stage-2",
          applicationId: "MC2024-002",
          applicantName: "Stage 2 App",
          currentStage: 2,
          status: "submitted",
        } as PermitApplication,
        {
          id: "app-stage-3",
          applicationId: "MC2024-003",
          applicantName: "Stage 3 App",
          currentStage: 3,
          status: "under_review",
        } as PermitApplication,
        {
          id: "app-stage-4",
          applicationId: "MC2024-004",
          applicantName: "Stage 4 App",
          currentStage: 4,
          status: "under_review",
        } as PermitApplication,
      ]

      vi.mocked(db.getApplications).mockResolvedValue(mixedApplications)

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        // Should only show stage 3 application
        expect(screen.getByText("Stage 3 App")).toBeInTheDocument()
        expect(screen.queryByText("Stage 1 App")).not.toBeInTheDocument()
        expect(screen.queryByText("Stage 2 App")).not.toBeInTheDocument()
        expect(screen.queryByText("Stage 4 App")).not.toBeInTheDocument()
      })

      // Should show correct count
      expect(screen.getByText(/1.*Applications for review/)).toBeInTheDocument()
    })

    it("should advance applications to stage 4 after successful submission", async () => {
      const stageThreeApps: PermitApplication[] = [
        {
          id: "app-1",
          applicationId: "MC2024-001",
          applicantName: "Test App 1",
          currentStage: 3,
          status: "under_review",
          permitType: "borehole",
          waterAllocation: 100,
          numberOfBoreholes: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          workflowComments: [],
        },
      ]

      vi.mocked(db.getApplications).mockResolvedValue(stageThreeApps)
      vi.mocked(db.updateApplication).mockResolvedValue({
        ...stageThreeApps[0],
        currentStage: 4,
      })

      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Test App 1")).toBeInTheDocument()
      })

      // Complete the application
      const reviewCheckbox = screen.getByLabelText(/Reviewed/i)
      await user.click(reviewCheckbox)

      const commentTextarea = screen.getByPlaceholderText(/Enter your mandatory review comment/i)
      await user.type(commentTextarea, "Manager review complete")

      const saveButton = screen.getByText(/Save Comment/i)
      await user.click(saveButton)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Applications/i)
        expect(submitButton).not.toBeDisabled()
      })

      // Submit
      const submitButton = screen.getByText(/Submit Applications/i)
      await user.click(submitButton)

      // Confirm in dialog
      await waitFor(async () => {
        const confirmButton = screen.getByText(/Submit All 1 Applications/i)
        await user.click(confirmButton)
      })

      await waitFor(() => {
        expect(db.updateApplication).toHaveBeenCalledWith("app-1", {
          currentStage: 4,
          status: "under_review",
        })
      })
    })
  })

  describe("📝 Comment System Integration", () => {
    it("should properly save comments with correct metadata", async () => {
      const testApp: PermitApplication[] = [
        {
          id: "app-comment-test",
          applicationId: "MC2024-COMMENT",
          applicantName: "Comment Test App",
          currentStage: 3,
          status: "under_review",
          permitType: "irrigation",
          waterAllocation: 150,
          numberOfBoreholes: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          workflowComments: [],
        },
      ]

      vi.mocked(db.getApplications).mockResolvedValue(testApp)

      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Comment Test App")).toBeInTheDocument()
      })

      // Add comment
      const commentTextarea = screen.getByPlaceholderText(/Enter your mandatory review comment/i)
      const testComment = "This is a detailed manager review comment with specific feedback"
      await user.type(commentTextarea, testComment)

      const saveButton = screen.getByText(/Save Comment/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(db.addWorkflowComment).toHaveBeenCalledWith("app-comment-test", {
          userId: "cm-test",
          userType: "catchment_manager",
          userName: "Test Manager",
          comment: testComment,
          stage: 3,
          decision: null,
          timestamp: expect.any(Date),
        })
      })

      // Should also log the action
      expect(db.addLog).toHaveBeenCalledWith({
        userId: "cm-test",
        userType: "catchment_manager",
        action: "Saved Comment",
        details: "Saved review comment for application app-comment-test",
        applicationId: "app-comment-test",
      })
    })
  })

  describe("🚨 Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(db.getApplications).mockRejectedValue(new Error("Database connection failed"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to load applications:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it("should handle comment save failures", async () => {
      const testApp: PermitApplication[] = [
        {
          id: "app-error-test",
          applicationId: "MC2024-ERROR",
          applicantName: "Error Test App",
          currentStage: 3,
          status: "under_review",
          permitType: "domestic",
          waterAllocation: 75,
          numberOfBoreholes: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          workflowComments: [],
        },
      ]

      vi.mocked(db.getApplications).mockResolvedValue(testApp)
      vi.mocked(db.addWorkflowComment).mockRejectedValue(new Error("Comment save failed"))

      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Error Test App")).toBeInTheDocument()
      })

      // Try to save comment
      const commentTextarea = screen.getByPlaceholderText(/Enter your mandatory review comment/i)
      await user.type(commentTextarea, "Test comment")

      const saveButton = screen.getByText(/Save Comment/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Failed to save comment. Please try again.")
      })
    })
  })

  describe("📱 Responsive Behavior", () => {
    it("should handle large numbers of applications", async () => {
      // Create 50 applications
      const manyApps: PermitApplication[] = Array.from({ length: 50 }, (_, i) => ({
        id: `app-${i}`,
        applicationId: `MC2024-${String(i + 1).padStart(3, "0")}`,
        applicantName: `Applicant ${i + 1}`,
        currentStage: 3,
        status: "under_review",
        permitType: "borehole",
        waterAllocation: 100 + i,
        numberOfBoreholes: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowComments: [],
      }))

      vi.mocked(db.getApplications).mockResolvedValue(manyApps)

      render(<CatchmentManagerDashboard user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Applicant 1")).toBeInTheDocument()
        expect(screen.getByText("Applicant 50")).toBeInTheDocument()
      })

      // Should show correct count
      expect(screen.getByText(/50.*Applications for review/)).toBeInTheDocument()
      expect(screen.getByText(/Submit Applications $$50$$/)).toBeInTheDocument()
    })
  })

  describe("🔍 Status Tracking", () => {
    it("should show overall status tracking for all applications", async () => {
      const allApps: PermitApplication[] = [
        {
          id: "app-approved",
          applicationId: "MC2024-APPROVED",
          applicantName: "Approved App",
          currentStage: 1,
          status: "approved",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PermitApplication,
        {
          id: "app-rejected",
          applicationId: "MC2024-REJECTED",
          applicantName: "Rejected App",
          currentStage: 1,
          status: "rejected",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PermitApplication,
        {
          id: "app-pending",
          applicationId: "MC2024-PENDING",
          applicantName: "Pending App",
          currentStage: 3,
          status: "under_review",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PermitApplication,
      ]

      vi.mocked(db.getApplications).mockResolvedValue(allApps)

      const user = userEvent.setup()
      render(<CatchmentManagerDashboard user={mockUser} />)

      // Switch to tracking tab
      await waitFor(() => {
        const trackingTab = screen.getByText("Overall Status Tracking")
        await user.click(trackingTab)
      })

      await waitFor(() => {
        expect(screen.getByText("Approved App")).toBeInTheDocument()
        expect(screen.getByText("Rejected App")).toBeInTheDocument()
        expect(screen.getByText("Pending App")).toBeInTheDocument()

        expect(screen.getByText("APPROVED")).toBeInTheDocument()
        expect(screen.getByText("REJECTED")).toBeInTheDocument()
        expect(screen.getByText("UNDER REVIEW")).toBeInTheDocument()
      })
    })
  })
})
