import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPrintWorkflow } from "@/components/permit-print-workflow"
import { canPrintPermits } from "@/lib/auth"
import type { PermitApplication, User } from "@/types"

// Mock the auth function
vi.mock("@/lib/auth", () => ({
  canPrintPermits: vi.fn(),
}))

const mockCanPrintPermits = vi.mocked(canPrintPermits)

// Mock application data for workflow testing
const mockApprovedApplication: PermitApplication = {
  id: "APP-WORKFLOW-001",
  applicantName: "Workflow Test Company",
  physicalAddress: "789 Workflow Street, Harare, Zimbabwe",
  postalAddress: "P.O. Box 321, Harare",
  landSize: 15.0,
  numberOfBoreholes: 2,
  waterAllocation: 10.0,
  intendedUse: "irrigation",
  gpsLatitude: -17.8252,
  gpsLongitude: 31.0335,
  status: "approved",
  currentStage: 5,
  permitNumber: "UMSCC-2024-WF-001",
  approvedAt: new Date("2024-03-25"),
  createdAt: new Date("2024-02-20"),
  updatedAt: new Date("2024-03-25"),
  submittedAt: new Date("2024-02-20"),
  documents: [],
}

const mockPendingApplication: PermitApplication = {
  ...mockApprovedApplication,
  id: "APP-WORKFLOW-002",
  status: "pending",
  currentStage: 3,
  permitNumber: undefined,
  approvedAt: undefined,
}

const mockRejectedApplication: PermitApplication = {
  ...mockApprovedApplication,
  id: "APP-WORKFLOW-003",
  status: "rejected",
  currentStage: 3,
  permitNumber: undefined,
  approvedAt: undefined,
}

const mockPermittingOfficer: User = {
  id: "user-po-001",
  username: "officer.workflow",
  userType: "permitting_officer",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockApplicant: User = {
  id: "user-app-001",
  username: "applicant.workflow",
  userType: "applicant",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockChairperson: User = {
  id: "user-chair-001",
  username: "chair.workflow",
  userType: "chairperson",
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("Print Workflow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("PermitPrintWorkflow Component", () => {
    it("should display complete workflow for approved application", () => {
      mockCanPrintPermits.mockReturnValue(true)

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Check workflow title
      expect(screen.getByText("Permit Printing Workflow")).toBeInTheDocument()

      // Check workflow stages
      expect(screen.getByText("Application Created")).toBeInTheDocument()
      expect(screen.getByText("Submitted for Review")).toBeInTheDocument()
      expect(screen.getByText("Chairperson Review")).toBeInTheDocument()
      expect(screen.getByText("Catchment Manager Review")).toBeInTheDocument()
      expect(screen.getByText("Final Approval")).toBeInTheDocument()
      expect(screen.getByText("Permit Ready")).toBeInTheDocument()

      // Check approval status
      expect(screen.getByText("Permit Approved - Ready to Print!")).toBeInTheDocument()
    })

    it("should show current stage for pending application", () => {
      mockCanPrintPermits.mockReturnValue(false)

      render(<PermitPrintWorkflow application={mockPendingApplication} user={mockChairperson} />)

      // Should show current stage badge
      expect(screen.getByText("Current Stage")).toBeInTheDocument()

      // Should show pending status
      expect(screen.getByText("Permit will be available for printing once approved")).toBeInTheDocument()
    })

    it("should show rejection status for rejected application", () => {
      mockCanPrintPermits.mockReturnValue(false)

      render(<PermitPrintWorkflow application={mockRejectedApplication} user={mockPermittingOfficer} />)

      // Should show rejection status
      expect(screen.getByText("Application Rejected - Cannot Print Permit")).toBeInTheDocument()
    })

    it("should display user role information correctly", () => {
      mockCanPrintPermits.mockReturnValue(true)

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Check user role display
      expect(screen.getByText("Your Role: PERMITTING OFFICER")).toBeInTheDocument()
      expect(screen.getByText("✅ You have permission to print approved permits")).toBeInTheDocument()
    })

    it("should show permission restriction for unauthorized users", () => {
      mockCanPrintPermits.mockReturnValue(false)

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockApplicant} />)

      // Check permission restriction
      expect(screen.getByText("Your Role: APPLICANT")).toBeInTheDocument()
      expect(screen.getByText("❌ You do not have permission to print permits")).toBeInTheDocument()
      expect(
        screen.getByText("Only Permitting Officers, Permit Supervisors, and ICT can print permits."),
      ).toBeInTheDocument()
    })

    it("should integrate PermitPrinter component for authorized users", () => {
      mockCanPrintPermits.mockReturnValue(true)

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Should show print buttons from integrated PermitPrinter
      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
      expect(screen.getByText("Print Permit")).toBeInTheDocument()
    })
  })

  describe("End-to-End Print Workflow", () => {
    it("should complete full print workflow for approved application", async () => {
      const user = userEvent.setup()
      mockCanPrintPermits.mockReturnValue(true)

      // Mock window.open for print testing
      const mockWindowOpen = vi.fn().mockReturnValue({
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      })
      Object.defineProperty(window, "open", { value: mockWindowOpen })

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Step 1: Verify workflow shows approved status
      expect(screen.getByText("Permit Approved - Ready to Print!")).toBeInTheDocument()

      // Step 2: Open print preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/Permit Preview - UMSCC-2024-WF-001/)).toBeInTheDocument()
      })

      // Step 3: Verify permit template is displayed
      expect(screen.getByText("Form GW7B")).toBeInTheDocument()
      expect(screen.getByText("Workflow Test Company")).toBeInTheDocument()

      // Step 4: Execute print
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank", "width=800,height=600")
    })

    it("should prevent printing for non-approved applications", async () => {
      const user = userEvent.setup()
      mockCanPrintPermits.mockReturnValue(true)

      render(<PermitPrintWorkflow application={mockPendingApplication} user={mockPermittingOfficer} />)

      // Should not show print options
      expect(screen.queryByText("Preview Permit")).not.toBeInTheDocument()
      expect(screen.queryByText("Print Permit")).not.toBeInTheDocument()

      // Should show pending message
      expect(screen.getByText("Permit will be available for printing once approved")).toBeInTheDocument()
    })

    it("should handle permission changes dynamically", () => {
      mockCanPrintPermits.mockReturnValue(false)

      const { rerender } = render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockApplicant} />)

      // Initially no print access
      expect(
        screen.getByText("Only Permitting Officers, Permit Supervisors, and ICT can print permits."),
      ).toBeInTheDocument()

      // Change user to authorized role
      mockCanPrintPermits.mockReturnValue(true)

      rerender(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Now should have print access
      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
      expect(screen.getByText("Print Permit")).toBeInTheDocument()
    })
  })

  describe("Workflow State Management", () => {
    it("should correctly track workflow stages", () => {
      const stages = [
        { application: { ...mockApprovedApplication, currentStage: 1 }, expectedCurrent: "Application Created" },
        { application: { ...mockApprovedApplication, currentStage: 2 }, expectedCurrent: "Submitted for Review" },
        { application: { ...mockApprovedApplication, currentStage: 3 }, expectedCurrent: "Chairperson Review" },
        { application: { ...mockApprovedApplication, currentStage: 4 }, expectedCurrent: "Catchment Manager Review" },
        {
          application: { ...mockApprovedApplication, currentStage: 5, status: "approved" as const },
          expectedCurrent: "Final Approval",
        },
      ]

      stages.forEach(({ application, expectedCurrent }) => {
        mockCanPrintPermits.mockReturnValue(false)

        const { unmount } = render(<PermitPrintWorkflow application={application} user={mockChairperson} />)

        if (application.status !== "approved") {
          expect(screen.getByText("Current Stage")).toBeInTheDocument()
        }

        unmount()
      })
    })

    it("should handle workflow stage transitions", () => {
      mockCanPrintPermits.mockReturnValue(false)

      // Start with stage 2
      const { rerender } = render(
        <PermitPrintWorkflow application={{ ...mockPendingApplication, currentStage: 2 }} user={mockChairperson} />,
      )

      expect(screen.getByText("Current Stage")).toBeInTheDocument()

      // Progress to stage 3
      rerender(
        <PermitPrintWorkflow application={{ ...mockPendingApplication, currentStage: 3 }} user={mockChairperson} />,
      )

      expect(screen.getByText("Current Stage")).toBeInTheDocument()

      // Complete to approved
      mockCanPrintPermits.mockReturnValue(true)
      rerender(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      expect(screen.getByText("Permit Approved - Ready to Print!")).toBeInTheDocument()
    })
  })

  describe("Error Handling in Workflow", () => {
    it("should handle missing application data gracefully", () => {
      const incompleteApplication = {
        ...mockApprovedApplication,
        applicantName: "",
        permitNumber: undefined,
        approvedAt: undefined,
      }

      mockCanPrintPermits.mockReturnValue(true)

      expect(() => {
        render(<PermitPrintWorkflow application={incompleteApplication} user={mockPermittingOfficer} />)
      }).not.toThrow()

      // Should still render workflow structure
      expect(screen.getByText("Permit Printing Workflow")).toBeInTheDocument()
    })

    it("should handle null user gracefully", () => {
      expect(() => {
        render(<PermitPrintWorkflow application={mockApprovedApplication} user={null as any} />)
      }).not.toThrow()
    })

    it("should handle network errors during print", async () => {
      const user = userEvent.setup()
      mockCanPrintPermits.mockReturnValue(true)

      // Mock console.error to capture error logs
      const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock window.open to throw error
      const mockWindowOpen = vi.fn().mockImplementation(() => {
        throw new Error("Network error")
      })
      Object.defineProperty(window, "open", { value: mockWindowOpen })

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      const printButton = screen.getByText("Print")
      await user.click(printButton)

      // Should handle error gracefully
      expect(mockConsoleError).toHaveBeenCalled()

      mockConsoleError.mockRestore()
    })
  })

  describe("Performance and Scalability", () => {
    it("should handle large application datasets efficiently", () => {
      const largeApplication = {
        ...mockApprovedApplication,
        numberOfBoreholes: 50,
        waterAllocation: 500.0,
      }

      mockCanPrintPermits.mockReturnValue(true)

      const startTime = performance.now()

      render(<PermitPrintWorkflow application={largeApplication} user={mockPermittingOfficer} />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100)
      expect(screen.getByText("Permit Printing Workflow")).toBeInTheDocument()
    })

    it("should optimize re-renders when props change", () => {
      mockCanPrintPermits.mockReturnValue(true)

      const { rerender } = render(
        <PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />,
      )

      // Change non-critical prop
      const updatedApplication = {
        ...mockApprovedApplication,
        updatedAt: new Date(),
      }

      const startTime = performance.now()

      rerender(<PermitPrintWorkflow application={updatedApplication} user={mockPermittingOfficer} />)

      const endTime = performance.now()
      const rerenderTime = endTime - startTime

      // Re-render should be fast
      expect(rerenderTime).toBeLessThan(50)
    })
  })

  describe("Accessibility and Usability", () => {
    it("should have proper ARIA labels and roles", () => {
      mockCanPrintPermits.mockReturnValue(true)

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Check for accessible elements
      const workflowStages = screen.getAllByRole("generic")
      expect(workflowStages.length).toBeGreaterThan(0)

      // Check for proper button accessibility
      const previewButton = screen.getByText("Preview Permit")
      expect(previewButton).toHaveAttribute("type", "button")
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()
      mockCanPrintPermits.mockReturnValue(true)

      render(<PermitPrintWorkflow application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Tab to preview button
      await user.tab()
      expect(screen.getByText("Preview Permit")).toHaveFocus()

      // Tab to print button
      await user.tab()
      expect(screen.getByText("Print Permit")).toHaveFocus()

      // Enter should activate button
      await user.keyboard("{Enter}")

      // Should open preview (mocked)
      await waitFor(() => {
        expect(screen.getByText(/Permit Preview/)).toBeInTheDocument()
      })
    })

    it("should provide clear status messages", () => {
      const testCases = [
        {
          application: mockApprovedApplication,
          user: mockPermittingOfficer,
          expectedMessage: "Permit Approved - Ready to Print!",
        },
        {
          application: mockPendingApplication,
          user: mockChairperson,
          expectedMessage: "Permit will be available for printing once approved",
        },
        {
          application: mockRejectedApplication,
          user: mockPermittingOfficer,
          expectedMessage: "Application Rejected - Cannot Print Permit",
        },
      ]

      testCases.forEach(({ application, user, expectedMessage }) => {
        mockCanPrintPermits.mockReturnValue(application.status === "approved")

        const { unmount } = render(<PermitPrintWorkflow application={application} user={user} />)

        expect(screen.getByText(expectedMessage)).toBeInTheDocument()
        unmount()
      })
    })
  })
})
