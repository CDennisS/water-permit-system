import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPrinter } from "@/components/permit-printer"
import { PermitTemplate } from "@/components/permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { PermitApplication, User } from "@/types"

// Mock data for approved application
const mockApprovedApplication: PermitApplication = {
  id: "APP-2024-001",
  applicantName: "John Doe Water Services",
  physicalAddress: "123 Main Street, Harare, Zimbabwe",
  postalAddress: "P.O. Box 456, Harare",
  landSize: 25.5,
  numberOfBoreholes: 3,
  waterAllocation: 15.5, // ML/annum
  intendedUse: "irrigation",
  gpsLatitude: -17.8252,
  gpsLongitude: 31.0335,
  status: "approved",
  currentStage: 5,
  permitNumber: "UMSCC-2024-03-0001",
  approvedAt: new Date("2024-03-15"),
  createdAt: new Date("2024-02-01"),
  updatedAt: new Date("2024-03-15"),
  submittedAt: new Date("2024-02-01"),
  documents: [],
}

const mockPermittingOfficer: User = {
  id: "user-001",
  username: "officer1",
  userType: "permitting_officer",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockApplicant: User = {
  id: "user-002",
  username: "applicant1",
  userType: "applicant",
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock window.open for print testing
const mockWindowOpen = vi.fn()
Object.defineProperty(window, "open", {
  writable: true,
  value: mockWindowOpen,
})

// Mock print functionality
const mockPrint = vi.fn()
Object.defineProperty(window, "print", {
  writable: true,
  value: mockPrint,
})

describe("Print Preview for Approved Applications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWindowOpen.mockReturnValue({
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: mockPrint,
      close: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("PermitPrinter Component", () => {
    it("should render print preview button for approved applications", () => {
      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
      expect(screen.getByText("Print Permit")).toBeInTheDocument()
    })

    it("should show permission error for non-authorized users", () => {
      render(<PermitPrinter application={mockApprovedApplication} user={mockApplicant} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.getByText(/User type 'applicant' cannot print permits/)).toBeInTheDocument()
    })

    it("should not show print options for non-approved applications", () => {
      const pendingApplication = { ...mockApprovedApplication, status: "pending" as const }

      render(<PermitPrinter application={pendingApplication} user={mockPermittingOfficer} />)

      expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
      expect(screen.getByText("Application must be approved first")).toBeInTheDocument()
    })

    it("should open print preview dialog when preview button is clicked", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText(/Permit Preview - UMSCC-2024-03-0001/)).toBeInTheDocument()
      })
    })

    it("should display permit template in preview dialog", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Form GW7B")).toBeInTheDocument()
        expect(screen.getByText("TEMPORARY/PROVISIONAL* SPECIFIC GROUNDWATER ABSTRACTION PERMIT")).toBeInTheDocument()
        expect(screen.getByText("John Doe Water Services")).toBeInTheDocument()
      })
    })

    it("should handle print functionality correctly", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Open preview first
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Click print button
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank", "width=800,height=600")
    })

    it("should handle download functionality", async () => {
      const user = userEvent.setup()

      // Mock URL.createObjectURL and related functions
      const mockCreateObjectURL = vi.fn(() => "blob:mock-url")
      const mockRevokeObjectURL = vi.fn()
      Object.defineProperty(URL, "createObjectURL", { value: mockCreateObjectURL })
      Object.defineProperty(URL, "revokeObjectURL", { value: mockRevokeObjectURL })

      // Mock document.createElement and appendChild
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      const mockCreateElement = vi.fn(() => mockLink)
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()

      Object.defineProperty(document, "createElement", { value: mockCreateElement })
      Object.defineProperty(document.body, "appendChild", { value: mockAppendChild })
      Object.defineProperty(document.body, "removeChild", { value: mockRemoveChild })

      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Click download button
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      expect(mockCreateElement).toHaveBeenCalledWith("a")
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe("PermitTemplate Component", () => {
    it("should render permit template with correct data", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      render(<PermitTemplate permitData={permitData} />)

      // Check header
      expect(screen.getByText("Form GW7B")).toBeInTheDocument()
      expect(screen.getByText("TEMPORARY/PROVISIONAL* SPECIFIC GROUNDWATER ABSTRACTION PERMIT")).toBeInTheDocument()

      // Check applicant details
      expect(screen.getByText("John Doe Water Services")).toBeInTheDocument()
      expect(screen.getByText("123 Main Street, Harare, Zimbabwe")).toBeInTheDocument()
      expect(screen.getByText("P.O. Box 456, Harare")).toBeInTheDocument()

      // Check property details
      expect(screen.getByText("25.5 (ha)")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("should display borehole details table correctly", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      render(<PermitTemplate permitData={permitData} />)

      // Check table headers
      expect(screen.getByText("Borehole (BH)-No.")).toBeInTheDocument()
      expect(screen.getByText("BH-No. Allocated")).toBeInTheDocument()
      expect(screen.getByText("Intended use")).toBeInTheDocument()
      expect(screen.getByText("Maximum abstraction rate (m³/annum)")).toBeInTheDocument()

      // Check borehole entries
      expect(screen.getByText("BH-01")).toBeInTheDocument()
      expect(screen.getByText("BH-02")).toBeInTheDocument()
      expect(screen.getByText("BH-03")).toBeInTheDocument()
    })

    it("should display conditions and additional conditions", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      render(<PermitTemplate permitData={permitData} />)

      expect(screen.getByText("CONDITIONS")).toBeInTheDocument()
      expect(screen.getByText("ADDITIONAL CONDITIONS")).toBeInTheDocument()

      // Check some specific conditions
      expect(screen.getByText(/To install flow meters on all boreholes/)).toBeInTheDocument()
      expect(screen.getByText(/Water Quality Analysis is to be carried out/)).toBeInTheDocument()
      expect(screen.getByText(/To allow unlimited access to ZINWA/)).toBeInTheDocument()
    })

    it("should include signature section", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      render(<PermitTemplate permitData={permitData} />)

      expect(screen.getByText("Name (print)")).toBeInTheDocument()
      expect(screen.getByText("Signature")).toBeInTheDocument()
      expect(screen.getByText("Official Date Stamp")).toBeInTheDocument()
      expect(screen.getByText("(Catchment Council Chairperson)")).toBeInTheDocument()
    })

    it("should have proper print styling classes", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      const { container } = render(<PermitTemplate permitData={permitData} />)

      const permitElement = container.firstChild as HTMLElement
      expect(permitElement).toHaveClass("bg-white", "text-black", "w-full", "max-w-none")
      expect(permitElement).toHaveStyle({
        fontFamily: "Times New Roman, serif",
        fontSize: "12pt",
        lineHeight: "1.4",
      })
    })
  })

  describe("Print Data Preparation", () => {
    it("should prepare permit data correctly from application", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      expect(permitData.permitNumber).toBe("UMSCC-2024-03-0001")
      expect(permitData.applicantName).toBe("John Doe Water Services")
      expect(permitData.physicalAddress).toBe("123 Main Street, Harare, Zimbabwe")
      expect(permitData.postalAddress).toBe("P.O. Box 456, Harare")
      expect(permitData.landSize).toBe(25.5)
      expect(permitData.numberOfBoreholes).toBe(3)
      expect(permitData.intendedUse).toBe("irrigation")
      expect(permitData.totalAllocatedAbstraction).toBe(15500) // 15.5 ML converted to m³
    })

    it("should generate correct borehole details", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      expect(permitData.boreholeDetails).toHaveLength(3)

      permitData.boreholeDetails.forEach((borehole, index) => {
        expect(borehole.boreholeNumber).toBe(`BH-${String(index + 1).padStart(2, "0")}`)
        expect(borehole.intendedUse).toBe("irrigation")
        expect(borehole.waterSampleFrequency).toBe("3 months")
        expect(typeof borehole.allocatedAmount).toBe("number")
        expect(borehole.allocatedAmount).toBeGreaterThan(0)
      })

      // Check total allocation matches
      const totalAllocation = permitData.boreholeDetails.reduce((sum, borehole) => sum + borehole.allocatedAmount, 0)
      expect(totalAllocation).toBe(15500)
    })

    it("should generate valid GPS coordinates", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      permitData.boreholeDetails.forEach((borehole) => {
        expect(borehole.gpsX).toMatch(/^-?\d+\.\d{6}$/)
        expect(borehole.gpsY).toMatch(/^-?\d+\.\d{6}$/)

        const x = Number.parseFloat(borehole.gpsX)
        const y = Number.parseFloat(borehole.gpsY)

        // Should be close to original coordinates
        expect(x).toBeCloseTo(-17.8252, 2)
        expect(y).toBeCloseTo(31.0335, 2)
      })
    })

    it("should calculate correct validity date", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      // Should be approximately 1 year from approval date
      const approvalDate = new Date("2024-03-15")
      const expectedValidityDate = new Date(approvalDate)
      expectedValidityDate.setFullYear(expectedValidityDate.getFullYear() + 1)

      expect(permitData.validUntil).toContain("2025")
      expect(permitData.validUntil).toContain("March")
    })
  })

  describe("A4 Print Layout Compliance", () => {
    it("should have proper A4 dimensions and margins", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      render(<PermitTemplate permitData={permitData} />)

      // Check if the template has proper styling for A4 printing
      const permitElement = document.getElementById("permit-template")
      expect(permitElement).toBeInTheDocument()

      // Verify print-friendly styling
      expect(permitElement).toHaveStyle({
        fontFamily: "Times New Roman, serif",
        fontSize: "12pt",
      })
    })

    it("should include print-specific CSS classes", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check for grid layouts that work well in print
      const gridElements = container.querySelectorAll(".grid-cols-2, .grid-cols-3")
      expect(gridElements.length).toBeGreaterThan(0)

      // Check for proper table styling
      const tables = container.querySelectorAll("table")
      expect(tables.length).toBeGreaterThan(0)

      tables.forEach((table) => {
        expect(table).toHaveClass("w-full", "border-collapse")
      })
    })

    it("should have proper spacing for print layout", () => {
      const permitData = preparePermitData(mockApprovedApplication)

      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check for margin and padding classes
      const spacedElements = container.querySelectorAll(".mb-2, .mb-4, .mb-6, .mb-8, .mt-4, .mt-12")
      expect(spacedElements.length).toBeGreaterThan(0)
    })
  })

  describe("Error Handling", () => {
    it("should handle missing permit data gracefully", () => {
      const incompleteApplication = {
        ...mockApprovedApplication,
        applicantName: "",
        physicalAddress: "",
      }

      expect(() => {
        const permitData = preparePermitData(incompleteApplication)
        render(<PermitTemplate permitData={permitData} />)
      }).not.toThrow()
    })

    it("should handle print errors gracefully", async () => {
      const user = userEvent.setup()

      // Mock window.open to return null (blocked popup)
      mockWindowOpen.mockReturnValue(null)

      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Mock alert
      const mockAlert = vi.fn()
      Object.defineProperty(window, "alert", { value: mockAlert })

      const printButton = screen.getByText("Print")
      await user.click(printButton)

      // Should handle the error gracefully
      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining("Unable to open print window"))
    })

    it("should handle missing permit template element", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Mock alert
      const mockAlert = vi.fn()
      Object.defineProperty(window, "alert", { value: mockAlert })

      // Try to print without opening preview first
      const printButton = screen.getByText("Print Permit")
      await user.click(printButton)

      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining("Permit template not found"))
    })
  })

  describe("Integration Tests", () => {
    it("should work with different user types correctly", () => {
      const userTypes = [
        { user: mockPermittingOfficer, canPrint: true },
        { user: mockApplicant, canPrint: false },
        { user: { ...mockPermittingOfficer, userType: "permit_supervisor" as const }, canPrint: true },
        { user: { ...mockPermittingOfficer, userType: "ict" as const }, canPrint: true },
        { user: { ...mockPermittingOfficer, userType: "chairperson" as const }, canPrint: false },
      ]

      userTypes.forEach(({ user, canPrint }) => {
        const { unmount } = render(<PermitPrinter application={mockApprovedApplication} user={user} />)

        if (canPrint) {
          expect(screen.getByText("Preview Permit")).toBeInTheDocument()
          expect(screen.getByText("Print Permit")).toBeInTheDocument()
        } else {
          expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
        }

        unmount()
      })
    })

    it("should work with different application statuses", () => {
      const statuses = ["pending", "approved", "rejected"] as const

      statuses.forEach((status) => {
        const application = { ...mockApprovedApplication, status }

        const { unmount } = render(<PermitPrinter application={application} user={mockPermittingOfficer} />)

        if (status === "approved") {
          expect(screen.getByText("Preview Permit")).toBeInTheDocument()
        } else {
          expect(screen.getByText("Cannot Print Permit")).toBeInTheDocument()
        }

        unmount()
      })
    })

    it("should maintain data consistency between preview and print", async () => {
      const user = userEvent.setup()

      render(<PermitPrinter application={mockApprovedApplication} user={mockPermittingOfficer} />)

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Verify all key data is present in preview
        expect(screen.getByText("John Doe Water Services")).toBeInTheDocument()
        expect(screen.getByText("UMSCC-2024-03-0001")).toBeInTheDocument()
        expect(screen.getByText("25.5 (ha)")).toBeInTheDocument()
        expect(screen.getByText("BH-01")).toBeInTheDocument()
        expect(screen.getByText("BH-02")).toBeInTheDocument()
        expect(screen.getByText("BH-03")).toBeInTheDocument()
      })
    })
  })
})
