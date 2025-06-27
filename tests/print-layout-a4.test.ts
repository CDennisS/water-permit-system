import { describe, it, expect, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import { PermitTemplate } from "@/components/permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { PermitApplication } from "@/types"

// Mock application data for A4 layout testing
const mockApplication: PermitApplication = {
  id: "APP-2024-A4-TEST",
  applicantName: "A4 Layout Test Company Ltd",
  physicalAddress: "456 Test Avenue, Harare, Zimbabwe",
  postalAddress: "P.O. Box 789, Harare",
  landSize: 50.75,
  numberOfBoreholes: 5,
  waterAllocation: 25.0,
  intendedUse: "industrial",
  gpsLatitude: -17.8252,
  gpsLongitude: 31.0335,
  status: "approved",
  currentStage: 5,
  permitNumber: "UMSCC-2024-A4-0001",
  approvedAt: new Date("2024-03-20"),
  createdAt: new Date("2024-02-15"),
  updatedAt: new Date("2024-03-20"),
  submittedAt: new Date("2024-02-15"),
  documents: [],
}

describe("A4 Print Layout Tests", () => {
  let permitData: any

  beforeEach(() => {
    permitData = preparePermitData(mockApplication)
  })

  describe("Page Layout and Dimensions", () => {
    it("should have proper A4 page structure", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      const permitElement = container.firstChild as HTMLElement

      // Check main container styling
      expect(permitElement).toHaveClass("bg-white", "text-black", "w-full", "max-w-none")
      expect(permitElement).toHaveStyle({
        fontFamily: "Times New Roman, serif",
        fontSize: "12pt",
        lineHeight: "1.4",
      })
    })

    it("should have proper typography hierarchy for A4 printing", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check header typography
      const h1Elements = container.querySelectorAll("h1")
      const h2Elements = container.querySelectorAll("h2")
      const h3Elements = container.querySelectorAll("h3")

      expect(h1Elements.length).toBeGreaterThan(0)
      expect(h2Elements.length).toBeGreaterThan(0)
      expect(h3Elements.length).toBeGreaterThan(0)

      // Verify text hierarchy classes
      h1Elements.forEach((h1) => {
        expect(h1).toHaveClass("text-xl", "font-bold")
      })

      h2Elements.forEach((h2) => {
        expect(h2).toHaveClass("text-lg", "font-bold")
      })
    })

    it("should have proper spacing for A4 layout", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check for proper margin classes
      const spacedElements = container.querySelectorAll('[class*="mb-"], [class*="mt-"]')
      expect(spacedElements.length).toBeGreaterThan(10)

      // Verify specific spacing elements
      const headerSection = container.querySelector(".text-center.mb-8")
      expect(headerSection).toBeInTheDocument()

      const signatureSection = container.querySelector(".mt-12")
      expect(signatureSection).toBeInTheDocument()
    })

    it("should use grid layouts appropriate for A4 printing", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check for grid layouts
      const gridElements = container.querySelectorAll(".grid-cols-2, .grid-cols-3")
      expect(gridElements.length).toBeGreaterThan(0)

      // Verify grid spacing
      gridElements.forEach((grid) => {
        expect(grid).toHaveClass("gap-4", "mb-6")
      })
    })
  })

  describe("Table Layout for A4", () => {
    it("should have properly formatted borehole details table", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      const table = container.querySelector("table")
      expect(table).toBeInTheDocument()
      expect(table).toHaveClass("w-full", "border-collapse", "border-2", "border-black", "text-sm")

      // Check table headers
      const headers = table?.querySelectorAll("th")
      expect(headers?.length).toBeGreaterThan(5)

      headers?.forEach((header) => {
        expect(header).toHaveClass("border", "border-black", "p-2", "text-center")
      })
    })

    it("should have proper table cell formatting", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      const table = container.querySelector("table")
      const cells = table?.querySelectorAll("td")

      expect(cells?.length).toBeGreaterThan(0)

      cells?.forEach((cell) => {
        expect(cell).toHaveClass("border", "border-black", "p-2")
      })
    })

    it("should handle multiple boreholes in table layout", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Should have 5 boreholes based on mock data
      const boreholeRows = container.querySelectorAll("tbody tr")
      expect(boreholeRows.length).toBe(5) // 5 boreholes, no empty rows needed

      // Check that each borehole has proper data
      boreholeRows.forEach((row, index) => {
        const cells = row.querySelectorAll("td")
        expect(cells.length).toBe(8) // 8 columns in the table

        // First cell should contain borehole number
        expect(cells[0].textContent).toContain(`BH-${String(index + 1).padStart(2, "0")}`)
      })
    })
  })

  describe("Content Fitting and Page Breaks", () => {
    it("should fit all content within reasonable A4 dimensions", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check that all major sections are present
      expect(container.textContent).toContain("Form GW7B")
      expect(container.textContent).toContain("TEMPORARY/PROVISIONAL* SPECIFIC GROUNDWATER ABSTRACTION PERMIT")
      expect(container.textContent).toContain("CONDITIONS")
      expect(container.textContent).toContain("ADDITIONAL CONDITIONS")
      expect(container.textContent).toContain("Catchment Council Chairperson")

      // Verify all application data is included
      expect(container.textContent).toContain(permitData.applicantName)
      expect(container.textContent).toContain(permitData.physicalAddress)
      expect(container.textContent).toContain(permitData.permitNumber)
    })

    it("should have proper section breaks for readability", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check for section spacing
      const sections = container.querySelectorAll(".mb-6, .mb-8")
      expect(sections.length).toBeGreaterThan(5)

      // Verify conditions section has proper spacing
      const conditionsSection = container.querySelector("h3")
      expect(conditionsSection?.textContent).toContain("CONDITIONS")
      expect(conditionsSection).toHaveClass("text-lg", "font-bold", "mb-4")
    })

    it("should handle long content gracefully", () => {
      // Test with longer content
      const longContentApplication = {
        ...mockApplication,
        applicantName: "Very Long Company Name That Might Cause Layout Issues Ltd Incorporated",
        physicalAddress:
          "A Very Long Physical Address That Spans Multiple Lines And Could Potentially Cause Layout Problems, Harare, Zimbabwe, Southern Africa",
        postalAddress: "Private Bag X123456789, Very Long Postal Address, Harare, Zimbabwe",
      }

      const longPermitData = preparePermitData(longContentApplication)
      const { container } = render(<PermitTemplate permitData={longPermitData} />)

      // Should still render without breaking layout
      expect(container.textContent).toContain(longContentApplication.applicantName)
      expect(container.textContent).toContain(longContentApplication.physicalAddress)
      expect(container.textContent).toContain(longContentApplication.postalAddress)
    })
  })

  describe("Print-Specific Styling", () => {
    it("should have print-friendly font and sizing", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      const permitElement = container.firstChild as HTMLElement

      // Check font family and size
      expect(permitElement).toHaveStyle({
        fontFamily: "Times New Roman, serif",
        fontSize: "12pt",
        lineHeight: "1.4",
      })

      // Check text color for print
      expect(permitElement).toHaveClass("text-black")
      expect(permitElement).toHaveClass("bg-white")
    })

    it("should use appropriate text sizes for different elements", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check for various text size classes
      const smallText = container.querySelectorAll(".text-sm")
      const extraSmallText = container.querySelectorAll(".text-xs")

      expect(smallText.length).toBeGreaterThan(0)
      expect(extraSmallText.length).toBeGreaterThan(0)
    })

    it("should have proper border styling for print", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check table borders
      const table = container.querySelector("table")
      expect(table).toHaveClass("border-2", "border-black")

      // Check signature lines
      const signatureLines = container.querySelectorAll(".border-b")
      expect(signatureLines.length).toBeGreaterThan(0)

      signatureLines.forEach((line) => {
        expect(line).toHaveClass("border-black")
      })
    })
  })

  describe("Data Accuracy in Print Layout", () => {
    it("should display all permit data accurately", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Verify permit number
      expect(container.textContent).toContain(permitData.permitNumber)

      // Verify applicant details
      expect(container.textContent).toContain(permitData.applicantName)
      expect(container.textContent).toContain(permitData.physicalAddress)
      expect(container.textContent).toContain(permitData.postalAddress)

      // Verify property details
      expect(container.textContent).toContain(`${permitData.landSize} (ha)`)
      expect(container.textContent).toContain(permitData.numberOfBoreholes.toString())
      expect(container.textContent).toContain(permitData.totalAllocatedAbstraction.toLocaleString())

      // Verify validity date
      expect(container.textContent).toContain(permitData.validUntil)
    })

    it("should display borehole data accurately in table", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      permitData.boreholeDetails.forEach((borehole: any, index: number) => {
        expect(container.textContent).toContain(borehole.boreholeNumber)
        expect(container.textContent).toContain(borehole.allocatedAmount.toLocaleString())
        expect(container.textContent).toContain(borehole.intendedUse)
        expect(container.textContent).toContain(borehole.waterSampleFrequency)
      })
    })

    it("should calculate and display totals correctly", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Verify total allocation calculation
      const expectedTotal = permitData.boreholeDetails.reduce(
        (sum: number, borehole: any) => sum + borehole.allocatedAmount,
        0,
      )

      expect(container.textContent).toContain(expectedTotal.toLocaleString())
      expect(expectedTotal).toBe(permitData.totalAllocatedAbstraction)
    })
  })

  describe("Signature and Authorization Section", () => {
    it("should have proper signature section layout", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Check signature section structure
      const signatureSection = container.querySelector(".mt-12")
      expect(signatureSection).toBeInTheDocument()

      // Should have grid layout for signatures
      const signatureGrid = signatureSection?.querySelector(".grid-cols-3")
      expect(signatureGrid).toBeInTheDocument()

      // Check signature fields
      expect(container.textContent).toContain("Name (print)")
      expect(container.textContent).toContain("Signature")
      expect(container.textContent).toContain("Official Date Stamp")
      expect(container.textContent).toContain("(Catchment Council Chairperson)")
    })

    it("should have proper signature line spacing", () => {
      const { container } = render(<PermitTemplate permitData={permitData} />)

      const signatureLines = container.querySelectorAll(".border-b.border-black.mb-2.h-12")
      expect(signatureLines.length).toBe(3) // Name, Signature, Date Stamp

      signatureLines.forEach((line) => {
        expect(line).toHaveClass("h-12", "mb-2")
      })
    })
  })

  describe("Responsive Print Layout", () => {
    it("should maintain layout integrity with different content lengths", () => {
      // Test with minimal content
      const minimalApplication = {
        ...mockApplication,
        numberOfBoreholes: 1,
        waterAllocation: 5.0,
      }

      const minimalPermitData = preparePermitData(minimalApplication)
      const { container: minimalContainer } = render(<PermitTemplate permitData={minimalPermitData} />)

      // Should still have proper structure
      expect(minimalContainer.textContent).toContain("Form GW7B")
      expect(minimalContainer.textContent).toContain("BH-01")

      // Test with maximum content
      const maximalApplication = {
        ...mockApplication,
        numberOfBoreholes: 10,
        waterAllocation: 100.0,
      }

      const maximalPermitData = preparePermitData(maximalApplication)
      const { container: maximalContainer } = render(<PermitTemplate permitData={maximalPermitData} />)

      // Should handle more boreholes
      expect(maximalContainer.textContent).toContain("BH-01")
      expect(maximalContainer.textContent).toContain("BH-10")
    })

    it("should handle edge cases in data display", () => {
      const edgeCaseApplication = {
        ...mockApplication,
        landSize: 0.1,
        waterAllocation: 0.5,
        postalAddress: "", // Empty postal address
        numberOfBoreholes: 1,
      }

      const edgeCasePermitData = preparePermitData(edgeCaseApplication)
      const { container } = render(<PermitTemplate permitData={edgeCasePermitData} />)

      // Should handle small numbers
      expect(container.textContent).toContain("0.1 (ha)")
      expect(container.textContent).toContain("500") // 0.5 ML = 500 m³

      // Should handle empty postal address
      expect(container.textContent).toContain("N/A")
    })
  })
})
