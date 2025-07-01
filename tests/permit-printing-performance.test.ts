import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { PermitPrinter } from "@/components/permit-printer"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { PermitApplication, User } from "@/types"

// Mock dependencies
vi.mock("@/lib/enhanced-permit-generator")
vi.mock("@/lib/auth", () => ({
  canPrintPermits: () => true,
}))
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

const mockApplication: PermitApplication = {
  id: "test-app-1",
  applicationNumber: "APP-2024-001",
  applicantName: "John Doe",
  physicalAddress: "123 Main Street, Harare",
  postalAddress: "P.O. Box 123, Harare",
  landSize: 10.5,
  numberOfBoreholes: 2,
  waterAllocation: 50,
  intendedUse: "irrigation",
  gpsLatitude: -17.8252,
  gpsLongitude: 31.0335,
  status: "approved",
  submittedAt: new Date("2024-01-15"),
  approvedAt: new Date("2024-01-20"),
  permitNumber: "UMSCC-2024-01-0001",
}

const mockUser: User = {
  id: "user-1",
  username: "officer1",
  email: "officer@umscc.co.zw",
  userType: "permitting_officer",
  fullName: "Jane Smith",
  isActive: true,
}

const mockPermitData = {
  permitNumber: "UMSCC-2024-01-0001",
  applicantName: "John Doe",
  physicalAddress: "123 Main Street, Harare",
  postalAddress: "P.O. Box 123, Harare",
  landSize: 10.5,
  numberOfBoreholes: 2,
  totalAllocatedAbstraction: 50000,
  intendedUse: "irrigation",
  validUntil: "January 20, 2025",
  issueDate: "January 20, 2024",
  gpsCoordinates: { latitude: -17.8252, longitude: 31.0335 },
  catchment: "MANYAME",
  subCatchment: "UPPER MANYAME",
  permitType: "temporary",
  boreholeDetails: [],
}

describe("Permit Printing Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(preparePermitData).mockReturnValue(mockPermitData)
  })

  describe("Memoization Tests", () => {
    it("should memoize permit data calculation", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(preparePermitData).toHaveBeenCalledTimes(1)

      // Rerender with same props - should not recalculate
      rerender(<PermitPrinter application={mockApplication} user={mockUser} />)
      expect(preparePermitData).toHaveBeenCalledTimes(1)

      // Rerender with same props again - should still not recalculate
      rerender(<PermitPrinter application={mockApplication} user={mockUser} />)
      expect(preparePermitData).toHaveBeenCalledTimes(1)
    })

    it("should recalculate when application changes", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(preparePermitData).toHaveBeenCalledTimes(1)

      // Change application data
      const updatedApplication = { ...mockApplication, applicantName: "Jane Doe" }
      rerender(<PermitPrinter application={updatedApplication} user={mockUser} />)

      expect(preparePermitData).toHaveBeenCalledTimes(2)
    })

    it("should not recalculate when user changes but application stays same", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(preparePermitData).toHaveBeenCalledTimes(1)

      // Change user but keep application same
      const differentUser = { ...mockUser, fullName: "Different User" }
      rerender(<PermitPrinter application={mockApplication} user={differentUser} />)

      // Should not recalculate permit data since application didn't change
      expect(preparePermitData).toHaveBeenCalledTimes(1)
    })
  })

  describe("Permission Status Memoization", () => {
    it("should memoize permission status calculation", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      // Should show print buttons (permission granted)
      expect(screen.getByText("Print Permit")).toBeInTheDocument()

      // Rerender with same props
      rerender(<PermitPrinter application={mockApplication} user={mockUser} />)

      // Should still show print buttons without recalculation
      expect(screen.getByText("Print Permit")).toBeInTheDocument()
    })

    it("should recalculate permission when user changes", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(screen.getByText("Print Permit")).toBeInTheDocument()

      // Change to user without permissions
      const unauthorizedUser = { ...mockUser, userType: "applicant" as const }
      rerender(<PermitPrinter application={mockApplication} user={unauthorizedUser} />)

      // Should now show permission error
      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
    })

    it("should recalculate permission when application status changes", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      expect(screen.getByText("Print Permit")).toBeInTheDocument()

      // Change application status to pending
      const pendingApplication = { ...mockApplication, status: "pending" as const }
      rerender(<PermitPrinter application={pendingApplication} user={mockUser} />)

      // Should now show permission error
      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
    })
  })

  describe("Render Performance", () => {
    it("should render quickly with large permit data", () => {
      const largeApplication = {
        ...mockApplication,
        numberOfBoreholes: 10,
        waterAllocation: 500,
      }

      const largeMockData = {
        ...mockPermitData,
        numberOfBoreholes: 10,
        totalAllocatedAbstraction: 500000,
        boreholeDetails: Array.from({ length: 10 }, (_, i) => ({
          boreholeNumber: `BH-${String(i + 1).padStart(2, "0")}`,
          allocatedAmount: 50000,
          gpsX: "-17.825200",
          gpsY: "31.033500",
          intendedUse: "irrigation",
          maxAbstractionRate: 55000,
          waterSampleFrequency: "3 months",
        })),
      }

      vi.mocked(preparePermitData).mockReturnValue(largeMockData)

      const startTime = performance.now()
      render(<PermitPrinter application={largeApplication} user={mockUser} />)
      const endTime = performance.now()

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      expect(screen.getByText("Print Permit")).toBeInTheDocument()
    })

    it("should handle multiple rapid rerenders efficiently", () => {
      const { rerender } = render(<PermitPrinter application={mockApplication} user={mockUser} />)

      const startTime = performance.now()

      // Perform 10 rapid rerenders with same props
      for (let i = 0; i < 10; i++) {
        rerender(<PermitPrinter application={mockApplication} user={mockUser} />)
      }

      const endTime = performance.now()

      // Should handle rapid rerenders efficiently
      expect(endTime - startTime).toBeLessThan(50)
      expect(preparePermitData).toHaveBeenCalledTimes(1) // Should only calculate once due to memoization
    })
  })

  describe("Memory Management", () => {
    it("should not create memory leaks with multiple instances", () => {
      const instances = []

      // Create multiple instances
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <PermitPrinter application={{ ...mockApplication, id: `app-${i}` }} user={mockUser} />,
        )
        instances.push(unmount)
      }

      // Unmount all instances
      instances.forEach((unmount) => unmount())

      // Should have called preparePermitData for each unique application
      expect(preparePermitData).toHaveBeenCalledTimes(5)
    })
  })
})
