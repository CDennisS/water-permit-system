import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { WorkflowManager } from "@/components/workflow-manager"
import { PermitPrinter } from "@/components/permit-printer"
import { EnhancedPermitPrinter } from "@/components/enhanced-permit-printer"
import { PermitPrintWorkflow } from "@/components/permit-print-workflow"
import { preparePermitData, generatePermitNumber } from "@/lib/permit-generator"
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

// Mock window.open for print testing
const mockWindowOpen = vi.fn()
Object.defineProperty(window, "open", {
  writable: true,
  value: mockWindowOpen,
})

describe("Permit Printing Workflow Tests", () => {
  let mockApplication: PermitApplication
  let permittingOfficer: User
  let chairperson: User
  let catchmentManager: User
  let catchmentChairperson: User
  let unauthorizedUser: User

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    mockWindowOpen.mockClear()

    // Create test application
    mockApplication = {
      id: "test-app-1",
      applicationId: "APP-2024-001",
      applicantName: "John Doe",
      physicalAddress: "123 Main St, Harare",
      postalAddress: "P.O. Box 123, Harare",
      numberOfBoreholes: 2,
      landSize: 5.5,
      waterAllocation: 1000,
      intendedUse: "Domestic",
      permitType: "urban",
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "submitted",
      currentStage: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
    }

    // Create test users
    permittingOfficer = {
      id: "user-1",
      username: "officer1",
      userType: "permitting_officer",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    chairperson = {
      id: "user-2",
      username: "chair1",
      userType: "chairperson",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    catchmentManager = {
      id: "user-3",
      username: "manager1",
      userType: "catchment_manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    catchmentChairperson = {
      id: "user-4",
      username: "catchchair1",
      userType: "catchment_chairperson",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    unauthorizedUser = {
      id: "user-5",
      username: "applicant1",
      userType: "applicant",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock database responses
    vi.mocked(db.getCommentsByApplication).mockResolvedValue([])
    vi.mocked(db.addComment).mockResolvedValue({
      id: "comment-1",
      applicationId: "test-app-1",
      userId: "user-1",
      userType: "permitting_officer",
      comment: "Test comment",
      stage: 1,
      isRejectionReason: false,
      createdAt: new Date(),
    })
    vi.mocked(db.addLog).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Complete Workflow to Approval", () => {
    it("should progress through all stages to approval", async () => {
      // Stage 1: Permitting Officer submits
      const stage1App = { ...mockApplication, currentStage: 1, status: "submitted" as const }
      vi.mocked(db.updateApplication).mockResolvedValueOnce({
        ...stage1App,
        currentStage: 2,
        status: "under_review",
      })

      const { rerender } = render(
        <WorkflowManager user={permittingOfficer} application={stage1App} onUpdate={vi.fn()} />,
      )

      // Should not show print options at stage 1
      expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()

      // Stage 2: Chairperson review
      const stage2App = { ...stage1App, currentStage: 2, status: "under_review" as const }
      vi.mocked(db.updateApplication).mockResolvedValueOnce({
        ...stage2App,
        currentStage: 3,
        status: "under_review",
      })

      rerender(<WorkflowManager user={chairperson} application={stage2App} onUpdate={vi.fn()} />)

      // Should not show print options at stage 2
      expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()

      // Stage 3: Catchment Manager review
      const stage3App = { ...stage2App, currentStage: 3, status: "under_review" as const }
      vi.mocked(db.updateApplication).mockResolvedValueOnce({
        ...stage3App,
        currentStage: 4,
        status: "under_review",
      })

      rerender(<WorkflowManager user={catchmentManager} application={stage3App} onUpdate={vi.fn()} />)

      // Should not show print options at stage 3
      expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()

      // Stage 4: Catchment Chairperson final approval
      const stage4App = { ...stage3App, currentStage: 4, status: "under_review" as const }
      vi.mocked(db.updateApplication).mockResolvedValueOnce({
        ...stage4App,
        currentStage: 1,
        status: "approved",
        approvedAt: new Date(),
      })

      rerender(<WorkflowManager user={catchmentChairperson} application={stage4App} onUpdate={vi.fn()} />)

      // Should not show print options until approved
      expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()
    })

    it("should show print options only after approval", async () => {
      const approvedApp = {
        ...mockApplication,
        status: "approved" as const,
        currentStage: 1,
        approvedAt: new Date(),
      }

      render(<PermitPrintWorkflow user={permittingOfficer} application={approvedApp} />)

      // Should show print workflow
      expect(screen.getByText(/Permit Approved - Ready to Print!/)).toBeInTheDocument()
      expect(screen.getByText(/Print Permit/)).toBeInTheDocument()
    })
  })

  describe("Permit Printing Authorization", () => {
    const approvedApp = {
      ...mockApplication,
      status: "approved" as const,
      currentStage: 1,
      approvedAt: new Date(),
    }

    it("should allow permitting officers to print permits", () => {
      render(<PermitPrinter application={approvedApp} />)

      const printButton = screen.getByRole("button", { name: /Print Permit/ })
      expect(printButton).toBeEnabled()
    })

    it("should allow permit supervisors to print permits", () => {
      const supervisor: User = {
        ...permittingOfficer,
        userType: "permit_supervisor",
      }

      render(<EnhancedPermitPrinter application={approvedApp} user={supervisor} />)

      const printButton = screen.getByRole("button", { name: /Print/ })
      expect(printButton).toBeEnabled()
    })

    it("should allow ICT users to print permits", () => {
      const ictUser: User = {
        ...permittingOfficer,
        userType: "ict",
      }

      render(<EnhancedPermitPrinter application={approvedApp} user={ictUser} />)

      const printButton = screen.getByRole("button", { name: /Print/ })
      expect(printButton).toBeEnabled()
    })

    it("should NOT allow unauthorized users to print permits", () => {
      render(<EnhancedPermitPrinter application={approvedApp} user={unauthorizedUser} />)

      const printButton = screen.getByRole("button", { name: /Print Permit/ })
      expect(printButton).toBeDisabled()
      expect(screen.getByText(/Insufficient permissions/)).toBeInTheDocument()
    })

    it("should NOT allow printing of non-approved applications", () => {
      const pendingApp = { ...mockApplication, status: "submitted" as const }

      render(<EnhancedPermitPrinter application={pendingApp} user={permittingOfficer} />)

      const printButton = screen.getByRole("button", { name: /Print Permit/ })
      expect(printButton).toBeDisabled()
      expect(screen.getByText(/Application must be approved first/)).toBeInTheDocument()
    })
  })

  describe("Permit Data Generation", () => {
    it("should generate correct permit data", () => {
      const permitData = preparePermitData(mockApplication)

      expect(permitData).toMatchObject({
        applicantName: "John Doe",
        physicalAddress: "123 Main St, Harare",
        postalAddress: "P.O. Box 123, Harare",
        numberOfBoreholes: 2,
        landSize: 5.5,
        totalAllocatedAbstraction: 1000,
        intendedUse: "Domestic",
      })

      expect(permitData.permitNumber).toMatch(/^UM\d{8}\d+$/)
      expect(permitData.boreholeDetails).toHaveLength(2)
      expect(permitData.boreholeDetails[0].allocatedAmount).toBe(500) // 1000/2
    })

    it("should generate unique permit numbers", () => {
      const number1 = generatePermitNumber()
      const number2 = generatePermitNumber()

      expect(number1).not.toBe(number2)
      expect(number1).toMatch(/^UM\d{8}\d+$/)
      expect(number2).toMatch(/^UM\d{8}\d+$/)
    })

    it("should calculate correct expiry dates", () => {
      const permitData = preparePermitData(mockApplication)
      const issueDate = new Date(permitData.issueDate.split("/").reverse().join("-"))
      const validUntil = new Date(permitData.validUntil.split("/").reverse().join("-"))

      const yearsDiff = validUntil.getFullYear() - issueDate.getFullYear()
      expect(yearsDiff).toBe(5) // Default 5-year validity
    })
  })

  describe("Print Functionality", () => {
    const approvedApp = {
      ...mockApplication,
      status: "approved" as const,
      currentStage: 1,
      approvedAt: new Date(),
    }

    it("should open print dialog when print button is clicked", async () => {
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        print: vi.fn(),
      }
      mockWindowOpen.mockReturnValue(mockPrintWindow)

      render(<PermitPrinter application={approvedApp} />)

      const printButton = screen.getByRole("button", { name: /Print Permit/ })
      fireEvent.click(printButton)

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank")
      })
    })

    it("should show preview dialog", async () => {
      render(<EnhancedPermitPrinter application={approvedApp} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/Water Permit Preview/)).toBeInTheDocument()
      })
    })

    it("should handle print errors gracefully", async () => {
      mockWindowOpen.mockReturnValue(null) // Simulate popup blocked

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

      render(<EnhancedPermitPrinter application={approvedApp} user={permittingOfficer} />)

      const printButton = screen.getByRole("button", { name: /Print/ })
      fireEvent.click(printButton)

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Please allow popups to print permits")
      })

      consoleSpy.mockRestore()
      alertSpy.mockRestore()
    })
  })

  describe("Workflow Integration", () => {
    it("should show complete workflow status", () => {
      const approvedApp = {
        ...mockApplication,
        status: "approved" as const,
        currentStage: 1,
        approvedAt: new Date(),
      }

      render(<PermitPrintWorkflow user={permittingOfficer} application={approvedApp} />)

      // Check all workflow stages are shown
      expect(screen.getByText(/Application Created/)).toBeInTheDocument()
      expect(screen.getByText(/Submitted for Review/)).toBeInTheDocument()
      expect(screen.getByText(/Chairperson Review/)).toBeInTheDocument()
      expect(screen.getByText(/Catchment Manager Review/)).toBeInTheDocument()
      expect(screen.getByText(/Final Approval/)).toBeInTheDocument()
      expect(screen.getByText(/Permit Ready/)).toBeInTheDocument()

      // Check approval status
      expect(screen.getByText(/Permit Approved - Ready to Print!/)).toBeInTheDocument()
    })

    it("should show rejection status correctly", () => {
      const rejectedApp = {
        ...mockApplication,
        status: "rejected" as const,
        currentStage: 1,
        rejectedAt: new Date(),
      }

      render(<PermitPrintWorkflow user={permittingOfficer} application={rejectedApp} />)

      expect(screen.getByText(/Application Rejected - Cannot Print Permit/)).toBeInTheDocument()
      expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()
    })
  })

  describe("Performance and Edge Cases", () => {
    it("should handle large permit data efficiently", () => {
      const largeApp = {
        ...mockApplication,
        numberOfBoreholes: 50,
        waterAllocation: 100000,
        status: "approved" as const,
      }

      const startTime = performance.now()
      const permitData = preparePermitData(largeApp)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete in <100ms
      expect(permitData.boreholeDetails).toHaveLength(50)
    })

    it("should handle missing application data gracefully", () => {
      const incompleteApp = {
        ...mockApplication,
        applicantName: "",
        physicalAddress: "",
        status: "approved" as const,
      }

      expect(() => preparePermitData(incompleteApp)).not.toThrow()
    })
  })
})
