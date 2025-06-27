"use client"

import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EnhancedPermitPrinter } from "@/components/enhanced-permit-printer"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"

// Mock window.print and related functions
const mockPrint = vi.fn()
Object.defineProperty(window, "print", {
  value: mockPrint,
  writable: true,
})

// Mock matchMedia for responsive testing
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const mockApplication = {
  id: "1",
  applicationId: "APP-2024-001",
  applicantName: "John Doe",
  physicalAddress: "123 Main Street, Harare, Zimbabwe",
  customerAccountNumber: "ACC-001",
  cellularNumber: "+263771234567",
  permitType: "urban" as const,
  waterSource: "ground_water" as const,
  waterAllocation: 100,
  landSize: 50,
  gpsLatitude: -17.8292,
  gpsLongitude: 31.0522,
  status: "approved" as const,
  currentStage: 4,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-25"),
  submittedAt: new Date("2024-01-15"),
  approvedAt: new Date("2024-01-25"),
  documents: [],
  comments: [],
  intendedUse: "Domestic water supply for residential complex",
}

const mockUser = {
  id: "1",
  username: "admin",
  userType: "permitting_officer" as const,
  password: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("A4 Print Layout Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock CSS media queries for print
    const mockStyleSheet = {
      insertRule: vi.fn(),
      deleteRule: vi.fn(),
      cssRules: [],
    }

    Object.defineProperty(document, "styleSheets", {
      value: [mockStyleSheet],
      writable: true,
    })
  })

  describe("A4 Page Dimensions and Layout", () => {
    it("should apply correct A4 dimensions in print mode", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for A4 print styles
        const printContainer = document.querySelector(".print-container")
        expect(printContainer).toBeInTheDocument()

        // Verify A4 dimensions (210mm x 297mm)
        const computedStyle = window.getComputedStyle(printContainer!)
        expect(printContainer).toHaveClass("w-[210mm]", "min-h-[297mm]")
      })
    })

    it("should set proper margins for A4 printing", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        const printContent = document.querySelector(".print-content")
        expect(printContent).toBeInTheDocument()

        // Check for proper A4 margins (typically 20mm on all sides)
        expect(printContent).toHaveClass("p-[20mm]")

        // Verify content area dimensions
        const contentArea = document.querySelector(".content-area")
        expect(contentArea).toHaveClass("max-w-[170mm]") // 210mm - 40mm margins
      })
    })

    it("should handle page breaks correctly for multi-page permits", async () => {
      const longApplication = {
        ...mockApplication,
        comments: Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 1}`,
          applicationId: "1",
          userId: `user${i}`,
          userName: `Reviewer ${i}`,
          userType: "technical_reviewer" as const,
          comment:
            `This is a very long comment number ${i + 1} that contains detailed feedback about the application. `.repeat(
              10,
            ),
          stage: 2,
          createdAt: new Date(),
          isInternal: false,
        })),
      }

      render(<EnhancedPermitPrinter application={longApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for page break classes
        const pageBreaks = document.querySelectorAll(".page-break-before, .page-break-after")
        expect(pageBreaks.length).toBeGreaterThan(0)

        // Verify page break avoidance for important sections
        const headerSection = document.querySelector(".permit-header")
        expect(headerSection).toHaveClass("break-inside-avoid")

        const signatureSection = document.querySelector(".signature-section")
        expect(signatureSection).toHaveClass("break-inside-avoid")
      })
    })

    it("should maintain proper font sizes for A4 readability", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        // Check main heading font size (should be readable on A4)
        const mainHeading = screen.getByText(/WATER USE PERMIT/i)
        expect(mainHeading).toHaveClass("text-2xl") // 24px for main heading

        // Check body text font size
        const bodyText = document.querySelector(".permit-body")
        expect(bodyText).toHaveClass("text-sm") // 14px for body text

        // Check fine print font size
        const finePrint = document.querySelector(".fine-print")
        expect(finePrint).toHaveClass("text-xs") // 12px for fine print
      })
    })
  })

  describe("Print Media Queries", () => {
    it("should apply print-specific styles", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for print media query styles
        const printStyles = document.querySelector('style[data-print="true"]')
        expect(printStyles).toBeInTheDocument()

        // Verify print-specific classes are applied
        const printContainer = document.querySelector(".print-container")
        expect(printContainer).toHaveClass("print:block", "print:bg-white")

        // Check that screen-only elements are hidden in print
        const screenOnlyElements = document.querySelectorAll(".print:hidden")
        expect(screenOnlyElements.length).toBeGreaterThan(0)
      })
    })

    it("should hide navigation and UI elements in print mode", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        // Check that dialog controls are hidden in print
        const dialogHeader = document.querySelector(".dialog-header")
        expect(dialogHeader).toHaveClass("print:hidden")

        const dialogFooter = document.querySelector(".dialog-footer")
        expect(dialogFooter).toHaveClass("print:hidden")

        // Verify only permit content is visible in print
        const permitContent = document.querySelector(".permit-content")
        expect(permitContent).toHaveClass("print:block")
      })
    })

    it("should optimize colors for black and white printing", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for print color optimization
        const colorElements = document.querySelectorAll(".text-blue-600, .bg-blue-100")
        colorElements.forEach((element) => {
          expect(element).toHaveClass("print:text-black", "print:bg-white")
        })

        // Verify borders are print-friendly
        const borderedElements = document.querySelectorAll(".border-blue-200")
        borderedElements.forEach((element) => {
          expect(element).toHaveClass("print:border-gray-400")
        })
      })
    })
  })

  describe("Content Layout and Positioning", () => {
    it("should position header elements correctly on A4", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        // Check header layout
        const permitHeader = document.querySelector(".permit-header")
        expect(permitHeader).toBeInTheDocument()

        // Verify logo positioning
        const logo = document.querySelector(".permit-logo")
        expect(logo).toHaveClass("float-left", "mr-4")

        // Check title centering
        const title = screen.getByText(/WATER USE PERMIT/i)
        expect(title.parentElement).toHaveClass("text-center")

        // Verify permit number positioning
        const permitNumber = screen.getByText(/Permit No:/i)
        expect(permitNumber.parentElement).toHaveClass("text-right")
      })
    })

    it("should layout application details in proper grid format", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for grid layout
        const detailsGrid = document.querySelector(".details-grid")
        expect(detailsGrid).toHaveClass("grid", "grid-cols-2", "gap-4")

        // Verify field labels and values alignment
        const fieldLabels = document.querySelectorAll(".field-label")
        fieldLabels.forEach((label) => {
          expect(label).toHaveClass("font-semibold", "text-left")
        })

        const fieldValues = document.querySelectorAll(".field-value")
        fieldValues.forEach((value) => {
          expect(value).toHaveClass("text-left", "ml-2")
        })
      })
    })

    it("should position signature blocks correctly", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        // Check signature section layout
        const signatureSection = document.querySelector(".signature-section")
        expect(signatureSection).toBeInTheDocument()
        expect(signatureSection).toHaveClass("mt-8", "grid", "grid-cols-2", "gap-8")

        // Verify signature blocks
        const signatureBlocks = document.querySelectorAll(".signature-block")
        expect(signatureBlocks).toHaveLength(2)

        signatureBlocks.forEach((block) => {
          expect(block).toHaveClass("text-center", "border-t", "pt-2")
        })
      })
    })

    it("should handle footer positioning on A4 pages", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check footer positioning
        const footer = document.querySelector(".permit-footer")
        expect(footer).toBeInTheDocument()
        expect(footer).toHaveClass("mt-auto", "pt-4", "border-t")

        // Verify footer content layout
        const footerContent = footer?.querySelector(".footer-content")
        expect(footerContent).toHaveClass("flex", "justify-between", "text-xs")

        // Check for page numbering
        const pageNumber = footer?.querySelector(".page-number")
        expect(pageNumber).toBeInTheDocument()
      })
    })
  })

  describe("Print Quality and Optimization", () => {
    it("should optimize images for print resolution", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        // Check for high-resolution images
        const images = document.querySelectorAll("img")
        images.forEach((img) => {
          expect(img).toHaveClass("print:max-w-full", "print:h-auto")

          // Verify image quality attributes
          expect(img).toHaveAttribute("loading", "eager")
        })

        // Check for vector graphics preference
        const svgElements = document.querySelectorAll("svg")
        svgElements.forEach((svg) => {
          expect(svg).toHaveClass("print:w-auto", "print:h-auto")
        })
      })
    })

    it("should ensure text remains crisp at print resolution", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for print-optimized text rendering
        const textElements = document.querySelectorAll("p, span, div")
        textElements.forEach((element) => {
          const computedStyle = window.getComputedStyle(element)

          // Verify text rendering optimization
          expect(element).not.toHaveClass("antialiased") // Avoid antialiasing for print
        })

        // Check for proper font weights
        const headings = document.querySelectorAll("h1, h2, h3")
        headings.forEach((heading) => {
          expect(heading).toHaveClass("font-bold")
        })
      })
    })

    it("should handle table layouts for print", async () => {
      const applicationWithTable = {
        ...mockApplication,
        documents: [
          { id: "1", name: "ID Copy", type: "pdf", size: 1024, uploadedAt: new Date() },
          { id: "2", name: "Proof of Residence", type: "pdf", size: 2048, uploadedAt: new Date() },
        ],
      }

      render(<EnhancedPermitPrinter application={applicationWithTable} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for print-optimized tables
        const tables = document.querySelectorAll("table")
        tables.forEach((table) => {
          expect(table).toHaveClass("w-full", "border-collapse")

          // Verify table headers
          const headers = table.querySelectorAll("th")
          headers.forEach((header) => {
            expect(header).toHaveClass("border", "p-2", "font-semibold")
          })

          // Check table cells
          const cells = table.querySelectorAll("td")
          cells.forEach((cell) => {
            expect(cell).toHaveClass("border", "p-2")
          })
        })
      })
    })
  })

  describe("Browser Compatibility", () => {
    it("should work with different print drivers", async () => {
      // Mock different print scenarios
      const printScenarios = [
        { name: "Chrome", userAgent: "Chrome/91.0.4472.124" },
        { name: "Firefox", userAgent: "Firefox/89.0" },
        { name: "Safari", userAgent: "Safari/14.1.1" },
        { name: "Edge", userAgent: "Edg/91.0.864.59" },
      ]

      for (const scenario of printScenarios) {
        Object.defineProperty(navigator, "userAgent", {
          value: scenario.userAgent,
          writable: true,
        })

        render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

        const printButton = screen.getByText("Print Permit")
        await userEvent.click(printButton)

        await waitFor(() => {
          expect(screen.getByText(/WATER USE PERMIT/i)).toBeInTheDocument()
        })
      }
    })

    it("should handle different paper sizes gracefully", async () => {
      // Mock different paper size media queries
      const paperSizes = [
        { size: "A4", width: "210mm", height: "297mm" },
        { size: "Letter", width: "8.5in", height: "11in" },
        { size: "Legal", width: "8.5in", height: "14in" },
      ]

      for (const paper of paperSizes) {
        Object.defineProperty(window, "matchMedia", {
          value: vi.fn().mockImplementation((query) => ({
            matches: query.includes(paper.width),
            media: query,
          })),
        })

        render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

        await waitFor(() => {
          const printContainer = document.querySelector(".print-container")
          expect(printContainer).toBeInTheDocument()
        })
      }
    })

    it("should provide fallbacks for unsupported CSS features", async () => {
      // Mock older browser without CSS Grid support
      const originalSupports = CSS.supports
      CSS.supports = vi.fn().mockReturnValue(false)

      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Should fall back to flexbox or table layout
        const layoutContainer = document.querySelector(".layout-container")
        expect(layoutContainer).toHaveClass("flex", "flex-col")
      })

      CSS.supports = originalSupports
    })
  })

  describe("Performance Optimization", () => {
    it("should render print layout efficiently", async () => {
      const startTime = performance.now()

      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(screen.getByText(/WATER USE PERMIT/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 500ms)
      expect(renderTime).toBeLessThan(500)
    })

    it("should minimize reflows during print preparation", async () => {
      const reflowSpy = vi.spyOn(document.body, "offsetHeight", "get")

      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText(/WATER USE PERMIT/i)).toBeInTheDocument()
      })

      // Should minimize layout thrashing
      expect(reflowSpy).toHaveBeenCalledTimes(0)

      reflowSpy.mockRestore()
    })

    it("should handle large documents without performance degradation", async () => {
      const largeApplication = {
        ...mockApplication,
        comments: Array.from({ length: 100 }, (_, i) => ({
          id: `${i + 1}`,
          applicationId: "1",
          userId: `user${i}`,
          userName: `Reviewer ${i}`,
          userType: "technical_reviewer" as const,
          comment: `Comment ${i + 1}`,
          stage: 2,
          createdAt: new Date(),
          isInternal: false,
        })),
      }

      const startTime = performance.now()

      render(<EnhancedPermitPrinter application={largeApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Permit")
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(screen.getByText(/WATER USE PERMIT/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should handle large documents efficiently (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000)
    })
  })
})
