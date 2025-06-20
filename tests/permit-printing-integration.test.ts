import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PermitPrintWorkflow } from "@/components/permit-print-workflow"
import { EnhancedPermitPrinter } from "@/components/enhanced-permit-printer"
import { preparePermitData } from "@/lib/permit-generator"
import type { PermitApplication, User } from "@/types"

describe("Permit Printing Integration Tests", () => {
  let approvedApplication: PermitApplication
  let authorizedUsers: User[]
  let unauthorizedUsers: User[]

  beforeEach(() => {
    vi.clearAllMocks()

    approvedApplication = {
      id: "approved-app-1",
      applicationId: "APPROVED-2024-001",
      applicantName: "Approved Applicant",
      physicalAddress: "789 Approved St, Harare",
      postalAddress: "P.O. Box 789, Harare",
      numberOfBoreholes: 4,
      landSize: 15.0,
      waterAllocation: 5000,
      intendedUse: "Industrial",
      permitType: "bulk_water",
      validityPeriod: 10,
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "approved",
      currentStage: 1,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
    }

    authorizedUsers = [
      {
        id: "auth-1",
        username: "permitting_officer_1",
        userType: "permitting_officer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "auth-2",
        username: "permit_supervisor_1",
        userType: "permit_supervisor",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "auth-3",
        username: "ict_admin_1",
        userType: "ict",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    unauthorizedUsers = [
      {
        id: "unauth-1",
        username: "chairperson_1",
        userType: "chairperson",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "unauth-2",
        username: "catchment_manager_1",
        userType: "catchment_manager",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "unauth-3",
        username: "applicant_1",
        userType: "applicant",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
  })

  describe("Workflow Status Integration", () => {
    it("should show complete workflow progression for approved application", () => {
      render(<PermitPrintWorkflow user={authorizedUsers[0]} application={approvedApplication} />)

      // Check all workflow stages are completed
      const workflowStages = [
        "Application Created",
        "Submitted for Review",
        "Chairperson Review",
        "Catchment Manager Review",
        "Final Approval",
        "Permit Ready",
      ]

      workflowStages.forEach((stage) => {
        expect(screen.getByText(stage)).toBeInTheDocument()
      })

      // Check approval status
      expect(screen.getByText(/Permit Approved - Ready to Print!/)).toBeInTheDocument()
    })

    it("should show correct user permissions in workflow", () => {
      // Test authorized user
      const { rerender } = render(<PermitPrintWorkflow user={authorizedUsers[0]} application={approvedApplication} />)

      expect(screen.getByText(/✅ You have permission to print approved permits/)).toBeInTheDocument()

      // Test unauthorized user
      rerender(<PermitPrintWorkflow user={unauthorizedUsers[0]} application={approvedApplication} />)

      expect(screen.getByText(/❌ You do not have permission to print permits/)).toBeInTheDocument()
    })
  })

  describe("Print Button Integration", () => {
    it("should integrate print buttons correctly for authorized users", () => {
      authorizedUsers.forEach((user) => {
        const { unmount } = render(<EnhancedPermitPrinter application={approvedApplication} user={user} />)

        // Should show preview and print buttons
        expect(screen.getByRole("button", { name: /Preview/ })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Print/ })).toBeInTheDocument()
        expect(screen.getByText(/Ready to Print/)).toBeInTheDocument()

        unmount()
      })
    })

    it("should disable print buttons for unauthorized users", () => {
      unauthorizedUsers.forEach((user) => {
        const { unmount } = render(<EnhancedPermitPrinter application={approvedApplication} user={user} />)

        const printButton = screen.getByRole("button", { name: /Print Permit/ })
        expect(printButton).toBeDisabled()
        expect(screen.getByText(/Insufficient permissions/)).toBeInTheDocument()

        unmount()
      })
    })
  })

  describe("Permit Data Integration", () => {
    it("should generate correct permit data for bulk water permits", () => {
      const permitData = preparePermitData(approvedApplication)

      expect(permitData).toMatchObject({
        applicantName: "Approved Applicant",
        physicalAddress: "789 Approved St, Harare",
        postalAddress: "P.O. Box 789, Harare",
        numberOfBoreholes: 4,
        landSize: 15.0,
        totalAllocatedAbstraction: 5000,
        intendedUse: "Industrial",
      })

      // Check bulk water specific calculations
      expect(permitData.boreholeDetails).toHaveLength(4)
      expect(permitData.boreholeDetails[0].allocatedAmount).toBe(1250) // 5000/4

      // Check custom validity period (10 years for bulk water)
      const issueDate = new Date(permitData.issueDate.split("/").reverse().join("-"))
      const validUntil = new Date(permitData.validUntil.split("/").reverse().join("-"))
      const yearsDiff = validUntil.getFullYear() - issueDate.getFullYear()
      expect(yearsDiff).toBe(10)
    })

    it("should handle different permit types correctly", () => {
      const urbanApp = { ...approvedApplication, permitType: "urban", validityPeriod: undefined }
      const urbanPermitData = preparePermitData(urbanApp)

      // Urban permits should have 5-year validity
      const issueDate = new Date(urbanPermitData.issueDate.split("/").reverse().join("-"))
      const validUntil = new Date(urbanPermitData.validUntil.split("/").reverse().join("-"))
      const yearsDiff = validUntil.getFullYear() - issueDate.getFullYear()
      expect(yearsDiff).toBe(5)
    })
  })

  describe("Print Preview Integration", () => {
    it("should show permit preview with correct data", async () => {
      render(<EnhancedPermitPrinter application={approvedApplication} user={authorizedUsers[0]} />)

      const previewButton = screen.getByRole("button", { name: /Preview/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/Water Permit Preview/)).toBeInTheDocument()
      })

      // Check permit summary data
      expect(screen.getByText(/5000 ML/)).toBeInTheDocument() // Water allocation
      expect(screen.getByText(/Industrial/)).toBeInTheDocument() // Intended use
    })

    it("should show download and print options in preview", async () => {
      render(<EnhancedPermitPrinter application={approvedApplication} user={authorizedUsers[0]} />)

      const previewButton = screen.getByRole("button", { name: /Preview/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Download/ })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /Print Permit/ })).toBeInTheDocument()
      })
    })
  })

  describe("Error Handling Integration", () => {
    it("should handle non-approved applications correctly", () => {
      const pendingApp = { ...approvedApplication, status: "submitted" as const }

      render(<PermitPrintWorkflow user={authorizedUsers[0]} application={pendingApp} />)

      expect(screen.getByText(/Permit will be available for printing once approved/)).toBeInTheDocument()
      expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()
    })

    it("should handle rejected applications correctly", () => {
      const rejectedApp = {
        ...approvedApplication,
        status: "rejected" as const,
        rejectedAt: new Date(),
      }

      render(<PermitPrintWorkflow user={authorizedUsers[0]} application={rejectedApp} />)

      expect(screen.getByText(/Application Rejected - Cannot Print Permit/)).toBeInTheDocument()
      expect(screen.queryByText(/Print Permit/)).not.toBeInTheDocument()
    })
  })

  describe("Performance Integration", () => {
    it("should handle multiple print operations efficiently", async () => {
      const mockWindowOpen = vi.fn().mockReturnValue({
        document: { write: vi.fn(), close: vi.fn() },
        print: vi.fn(),
      })
      Object.defineProperty(window, "open", { value: mockWindowOpen })

      render(<EnhancedPermitPrinter application={approvedApplication} user={authorizedUsers[0]} />)

      const printButton = screen.getByRole("button", { name: /Print/ })

      // Simulate multiple rapid clicks
      const startTime = performance.now()
      for (let i = 0; i < 5; i++) {
        fireEvent.click(printButton)
      }
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should handle multiple clicks quickly
      expect(mockWindowOpen).toHaveBeenCalledTimes(5)
    })

    it("should handle large permit data without performance issues", () => {
      const largeApp = {
        ...approvedApplication,
        numberOfBoreholes: 100,
        waterAllocation: 1000000,
      }

      const startTime = performance.now()
      render(<EnhancedPermitPrinter application={largeApp} user={authorizedUsers[0]} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(500) // Should render quickly even with large data
    })
  })
})
