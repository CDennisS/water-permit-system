import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { PermitTemplate } from "@/components/permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { PermitApplication, User, PermitData } from "@/types"

// Mock console methods to capture errors
const mockConsoleError = vi.fn()
const mockConsoleWarn = vi.fn()
const mockConsoleLog = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  // Mock console methods
  vi.spyOn(console, "error").mockImplementation(mockConsoleError)
  vi.spyOn(console, "warn").mockImplementation(mockConsoleWarn)
  vi.spyOn(console, "log").mockImplementation(mockConsoleLog)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("Print Preview Comprehensive Parameter Tests", () => {
  // Test data variations
  const baseApplication: PermitApplication = {
    id: "1",
    applicationNumber: "APP001",
    applicantName: "John Doe",
    applicantAddress: "123 Main St, Harare",
    contactNumber: "+263771234567",
    emailAddress: "john@email.com",
    intendedUse: "Domestic",
    waterAllocation: 50,
    numberOfBoreholes: 1,
    gpsCoordinates: "-17.8252, 31.0335",
    status: "approved",
    submissionDate: new Date("2024-01-01"),
    lastModified: new Date("2024-01-15"),
    documents: [],
    comments: [],
    workflowStage: "approved",
    assignedTo: "permit_supervisor",
  }

  const baseUser: User = {
    id: "1",
    username: "admin",
    userType: "permitting_officer",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe("Application Status Parameter Tests", () => {
    const statusTests = [
      { status: "approved" as const, shouldShow: true, description: "approved applications" },
      { status: "permit_issued" as const, shouldShow: true, description: "permit issued applications" },
      { status: "draft" as const, shouldShow: false, description: "draft applications" },
      { status: "submitted" as const, shouldShow: false, description: "submitted applications" },
      { status: "under_review" as const, shouldShow: false, description: "under review applications" },
      { status: "rejected" as const, shouldShow: false, description: "rejected applications" },
    ]

    statusTests.forEach(({ status, shouldShow, description }) => {
      it(`should ${shouldShow ? "show" : "hide"} preview for ${description}`, () => {
        const application = { ...baseApplication, status }
        const { container } = render(<PermitPreviewDialog application={application} currentUser={baseUser} />)

        if (shouldShow) {
          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        } else {
          expect(container.firstChild).toBeNull()
        }
      })
    })
  })

  describe("User Type Parameter Tests", () => {
    const userTypeTests = [
      { userType: "applicant" as const, shouldShow: false, description: "applicants" },
      { userType: "permitting_officer" as const, shouldShow: true, description: "permitting officers" },
      { userType: "permit_supervisor" as const, shouldShow: true, description: "permit supervisors" },
      { userType: "catchment_manager" as const, shouldShow: true, description: "catchment managers" },
      { userType: "catchment_chairperson" as const, shouldShow: true, description: "catchment chairpersons" },
      { userType: "ict" as const, shouldShow: true, description: "ICT users" },
    ]

    userTypeTests.forEach(({ userType, shouldShow, description }) => {
      it(`should ${shouldShow ? "allow" : "deny"} preview access for ${description}`, () => {
        const user = { ...baseUser, userType }
        const { container } = render(<PermitPreviewDialog application={baseApplication} currentUser={user} />)

        if (shouldShow) {
          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        } else {
          expect(container.firstChild).toBeNull()
        }
      })
    })
  })

  describe("Application Data Parameter Tests", () => {
    it("should handle applications with minimal data", async () => {
      const minimalApplication = {
        ...baseApplication,
        applicantAddress: "Basic Address",
        contactNumber: "+263771234567",
        emailAddress: "test@email.com",
        numberOfBoreholes: 1,
        waterAllocation: 10,
        documents: [],
        comments: [],
      }

      const user = userEvent.setup()
      render(<PermitPreviewDialog application={minimalApplication} currentUser={baseUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })
    })

    it("should handle applications with maximum data", async () => {
      const maximalApplication = {
        ...baseApplication,
        applicantAddress:
          "Very Long Physical Address with Multiple Lines and Detailed Location Information That Spans Several Lines",
        contactNumber: "+263771234567, +263712345678, +263734567890",
        emailAddress: "very.long.email.address.with.multiple.domains@company.co.zw",
        numberOfBoreholes: 50,
        waterAllocation: 10000,
        documents: Array.from({ length: 20 }, (_, i) => ({
          id: `doc-${i}`,
          filename: `document-${i}.pdf`,
          uploadDate: new Date(),
          fileSize: 1024000,
          fileType: "application/pdf",
          uploadedBy: "applicant",
        })),
        comments: Array.from({ length: 100 }, (_, i) => ({
          id: `comment-${i}`,
          comment: `This is a very detailed comment number ${i} with extensive information about the application review process`,
          author: "reviewer",
          timestamp: new Date(),
          type: "review" as const,
        })),
      }

      const user = userEvent.setup()
      render(<PermitPreviewDialog application={maximalApplication} currentUser={baseUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })
    })

    it("should handle applications with special characters", async () => {
      const specialCharApplication = {
        ...baseApplication,
        applicantName: "José María Ñoño & Sons (Pty) Ltd.",
        applicantAddress: "123 Main St, Harare <script>alert('xss')</script>",
        intendedUse: "Domestic & Commercial Use (50/50 split)",
        gpsCoordinates: "-17.8252°S, 31.0335°E",
      }

      const user = userEvent.setup()
      render(<PermitPreviewDialog application={specialCharApplication} currentUser={baseUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        // Should not execute script tags
        expect(document.querySelector("script")).toBeNull()
      })
    })

    it("should handle applications with null/undefined optional fields", async () => {
      const incompleteApplication = {
        ...baseApplication,
        postalAddress: undefined,
        emailAddress: "",
        documents: [],
        comments: [],
      }

      const user = userEvent.setup()
      render(<PermitPreviewDialog application={incompleteApplication} currentUser={baseUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })
    })
  })

  describe("Borehole Parameter Tests", () => {
    const boreholeTests = [
      { count: 1, description: "single borehole" },
      { count: 5, description: "multiple boreholes" },
      { count: 25, description: "many boreholes" },
      { count: 100, description: "maximum boreholes" },
    ]

    boreholeTests.forEach(({ count, description }) => {
      it(`should handle applications with ${description} (${count})`, async () => {
        const application = {
          ...baseApplication,
          numberOfBoreholes: count,
          waterAllocation: count * 50,
        }

        const user = userEvent.setup()
        render(<PermitPreviewDialog application={application} currentUser={baseUser} />)

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await user.click(previewButton)

        await waitFor(() => {
          expect(screen.getByRole("dialog")).toBeInTheDocument()
        })
      })
    })
  })

  describe("Water Allocation Parameter Tests", () => {
    const allocationTests = [
      { allocation: 0.1, description: "minimal allocation" },
      { allocation: 50, description: "standard allocation" },
      { allocation: 1000, description: "large allocation" },
      { allocation: 50000, description: "maximum allocation" },
    ]

    allocationTests.forEach(({ allocation, description }) => {
      it(`should handle ${description} (${allocation} ML)`, async () => {
        const application = {
          ...baseApplication,
          waterAllocation: allocation,
        }

        const user = userEvent.setup()
        render(<PermitPreviewDialog application={application} currentUser={baseUser} />)

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await user.click(previewButton)

        await waitFor(() => {
          expect(screen.getByRole("dialog")).toBeInTheDocument()
        })
      })
    })
  })
})

describe("Print Preview Error Scenario Tests", () => {
  const mockApplication: PermitApplication = {
    id: "1",
    applicationNumber: "APP001",
    applicantName: "John Doe",
    applicantAddress: "123 Main St, Harare",
    contactNumber: "+263771234567",
    emailAddress: "john@email.com",
    intendedUse: "Domestic",
    waterAllocation: 50,
    numberOfBoreholes: 1,
    gpsCoordinates: "-17.8252, 31.0335",
    status: "approved",
    submissionDate: new Date(),
    lastModified: new Date(),
    documents: [],
    comments: [],
    workflowStage: "approved",
    assignedTo: "permit_supervisor",
  }

  const mockUser: User = {
    id: "1",
    username: "admin",
    userType: "permitting_officer",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe("DOM Manipulation Errors", () => {
    it("should handle missing permit template element", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return null
      vi.spyOn(document, "getElementById").mockReturnValue(null)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })
    })

    it("should handle corrupted template content", async () => {
      const user = userEvent.setup()

      // Mock getElementById to return element with corrupted content
      const corruptedElement = {
        innerHTML: "<div>Incomplete template <table><tr><td>Missing closing tags",
      }
      vi.spyOn(document, "getElementById").mockReturnValue(corruptedElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should still attempt to print even with corrupted content
      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalled()
      })
    })

    it("should handle DOM access exceptions", async () => {
      const user = userEvent.setup()

      // Mock getElementById to throw exception
      vi.spyOn(document, "getElementById").mockImplementation(() => {
        throw new Error("DOM access denied")
      })

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })
    })
  })

  describe("Window.open Errors", () => {
    it("should handle blocked popup windows", async () => {
      const user = userEvent.setup()

      // Mock window.open to return null (blocked)
      Object.defineProperty(window, "open", {
        writable: true,
        value: vi.fn(() => null),
      })

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(window.open).toHaveBeenCalled()
        // Should not crash when window.open returns null
      })
    })

    it("should handle window.open exceptions", async () => {
      const user = userEvent.setup()

      // Mock window.open to throw exception
      Object.defineProperty(window, "open", {
        writable: true,
        value: vi.fn(() => {
          throw new Error("Popup blocked by browser")
        }),
      })

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })
    })

    it("should handle print window document errors", async () => {
      const user = userEvent.setup()

      // Mock window.open with faulty document
      const mockPrintWindow = {
        document: {
          write: vi.fn(() => {
            throw new Error("Document write failed")
          }),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }

      Object.defineProperty(window, "open", {
        writable: true,
        value: vi.fn(() => mockPrintWindow),
      })

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })
    })
  })

  describe("Download Errors", () => {
    it("should handle Blob creation failures", async () => {
      const user = userEvent.setup()

      // Mock Blob constructor to throw error
      const originalBlob = global.Blob
      global.Blob = vi.fn().mockImplementation(() => {
        throw new Error("Blob creation failed")
      })

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Download failed:", expect.any(Error))
      })

      // Restore original Blob
      global.Blob = originalBlob
    })

    it("should handle URL.createObjectURL failures", async () => {
      const user = userEvent.setup()

      // Mock URL.createObjectURL to throw error
      Object.defineProperty(URL, "createObjectURL", {
        writable: true,
        value: vi.fn(() => {
          throw new Error("URL creation failed")
        }),
      })

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Download failed:", expect.any(Error))
      })
    })

    it("should handle DOM manipulation failures during download", async () => {
      const user = userEvent.setup()

      // Mock createElement to throw error
      vi.spyOn(document, "createElement").mockImplementation(() => {
        throw new Error("Element creation failed")
      })

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Download failed:", expect.any(Error))
      })
    })
  })

  describe("Data Processing Errors", () => {
    it("should handle permit data generation failures", async () => {
      const user = userEvent.setup()

      // Mock preparePermitData to throw error
      vi.mocked(preparePermitData).mockImplementation(() => {
        throw new Error("Permit data generation failed")
      })

      expect(() => {
        render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)
      }).toThrow("Permit data generation failed")
    })

    it("should handle invalid permit data", async () => {
      const user = userEvent.setup()

      // Mock preparePermitData to return invalid data
      vi.mocked(preparePermitData).mockReturnValue({
        permitNumber: "",
        applicantName: "",
        physicalAddress: "",
        numberOfBoreholes: 0,
        landSize: "",
        totalAllocatedAbstraction: 0,
        intendedUse: "",
        validUntil: "",
        issueDate: "",
        boreholeDetails: [],
      } as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })
    })

    it("should handle corrupted application data", async () => {
      const user = userEvent.setup()

      const corruptedApplication = {
        ...mockApplication,
        applicantName: null as any,
        waterAllocation: "invalid" as any,
        numberOfBoreholes: -1,
        gpsCoordinates: "invalid coordinates",
      }

      render(<PermitPreviewDialog application={corruptedApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })
    })
  })

  describe("Memory and Performance Errors", () => {
    it("should handle memory exhaustion during large data processing", async () => {
      const user = userEvent.setup()

      // Create extremely large application data
      const hugeApplication = {
        ...mockApplication,
        applicantName: "A".repeat(100000),
        applicantAddress: "B".repeat(100000),
        numberOfBoreholes: 10000,
        comments: Array.from({ length: 10000 }, (_, i) => ({
          id: `comment-${i}`,
          comment: "C".repeat(10000),
          author: "reviewer",
          timestamp: new Date(),
          type: "review" as const,
        })),
      }

      const startTime = performance.now()

      render(<PermitPreviewDialog application={hugeApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument()
        },
        { timeout: 10000 },
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should handle large data within reasonable time (less than 10 seconds)
      expect(renderTime).toBeLessThan(10000)
    })

    it("should handle rapid successive operations", async () => {
      const user = userEvent.setup()

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      const mockPrintWindow = {
        document: { write: vi.fn(), close: vi.fn() },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }

      Object.defineProperty(window, "open", {
        writable: true,
        value: vi.fn(() => mockPrintWindow),
      })

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })

      // Rapidly click print button multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(printButton)
      }

      // Should handle rapid clicks without crashing
      await waitFor(() => {
        expect(mockPrintWindow.print).toHaveBeenCalled()
      })
    })
  })

  describe("Network and Connectivity Errors", () => {
    it("should handle network disconnection during print", async () => {
      const user = userEvent.setup()

      // Simulate network error by making DOM operations fail
      vi.spyOn(document, "getElementById").mockImplementation(() => {
        throw new Error("Network timeout")
      })

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })
    })

    it("should handle slow network responses", async () => {
      const user = userEvent.setup()

      // Mock slow DOM operations
      vi.spyOn(document, "getElementById").mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ innerHTML: "<div>Slow content</div>" }), 5000)
        }) as any
      })

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should handle slow operations gracefully
      await waitFor(
        () => {
          expect(document.getElementById).toHaveBeenCalled()
        },
        { timeout: 6000 },
      )
    })
  })

  describe("Browser Compatibility Errors", () => {
    it("should handle unsupported browser features", async () => {
      const user = userEvent.setup()

      // Mock unsupported features
      delete (window as any).open
      delete (global as any).Blob
      delete (URL as any).createObjectURL

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      // Should handle missing browser features gracefully
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalled()
      })
    })

    it("should handle mobile browser limitations", async () => {
      const user = userEvent.setup()

      // Mock mobile browser environment
      Object.defineProperty(navigator, "userAgent", {
        writable: true,
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      })

      // Mock limited mobile print support
      Object.defineProperty(window, "open", {
        writable: true,
        value: vi.fn(() => {
          throw new Error("Print not supported on mobile")
        }),
      })

      const mockElement = { innerHTML: "<div>Test content</div>" }
      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

      render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Print failed:", expect.any(Error))
      })
    })
  })

  describe("Security and XSS Error Tests", () => {
    it("should handle malicious script injection attempts", async () => {
      const user = userEvent.setup()

      const maliciousApplication = {
        ...mockApplication,
        applicantName: "<script>alert('XSS')</script>",
        applicantAddress: "<img src=x onerror=alert('XSS')>",
        intendedUse: "javascript:alert('XSS')",
      }

      render(<PermitPreviewDialog application={maliciousApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Should not execute any scripts
      expect(document.querySelector("script")).toBeNull()
      expect(document.querySelector("img[onerror]")).toBeNull()
    })

    it("should handle SQL injection attempts in data", async () => {
      const user = userEvent.setup()

      const sqlInjectionApplication = {
        ...mockApplication,
        applicantName: "'; DROP TABLE applications; --",
        applicantAddress: "1' OR '1'='1",
        intendedUse: "UNION SELECT * FROM users",
      }

      render(<PermitPreviewDialog application={sqlInjectionApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Should display the data as text, not execute as SQL
      expect(screen.getByText("'; DROP TABLE applications; --")).toBeInTheDocument()
    })
  })
})

describe("Print Preview Template Error Tests", () => {
  const mockPermitData: PermitData = {
    permitNumber: "GW7B/2024/001",
    applicantName: "John Doe",
    physicalAddress: "123 Main St, Harare",
    postalAddress: "P.O. Box 123, Harare",
    numberOfBoreholes: 2,
    landSize: "10.5",
    totalAllocatedAbstraction: 50000,
    intendedUse: "Domestic",
    validUntil: "2029-01-15",
    issueDate: "2024-01-15",
    boreholeDetails: [
      {
        boreholeNumber: "BH001",
        gpsX: "31.0335",
        gpsY: "-17.8252",
        allocatedAmount: 25000,
        intendedUse: "Domestic",
        maxAbstractionRate: 25000,
        waterSampleFrequency: "3 months",
      },
    ],
  }

  describe("Template Rendering Errors", () => {
    it("should handle missing permit data fields", () => {
      const incompleteData = {
        permitNumber: "GW7B/2024/001",
        applicantName: "",
        physicalAddress: undefined,
        numberOfBoreholes: 0,
        boreholeDetails: [],
      } as any

      expect(() => {
        render(<PermitTemplate permitData={incompleteData} />)
      }).not.toThrow()
    })

    it("should handle null permit data", () => {
      expect(() => {
        render(<PermitTemplate permitData={null as any} />)
      }).toThrow()
    })

    it("should handle undefined permit data", () => {
      expect(() => {
        render(<PermitTemplate permitData={undefined as any} />)
      }).toThrow()
    })

    it("should handle corrupted borehole data", () => {
      const corruptedData = {
        ...mockPermitData,
        boreholeDetails: [
          {
            boreholeNumber: null,
            gpsX: undefined,
            gpsY: "invalid",
            allocatedAmount: "not a number",
            intendedUse: "",
            maxAbstractionRate: -1,
            waterSampleFrequency: null,
          },
        ],
      } as any

      expect(() => {
        render(<PermitTemplate permitData={corruptedData} />)
      }).not.toThrow()
    })

    it("should handle extremely large borehole arrays", () => {
      const largeData = {
        ...mockPermitData,
        numberOfBoreholes: 1000,
        boreholeDetails: Array.from({ length: 1000 }, (_, i) => ({
          boreholeNumber: `BH${String(i + 1).padStart(3, "0")}`,
          gpsX: "31.0335",
          gpsY: "-17.8252",
          allocatedAmount: 50,
          intendedUse: "Domestic",
          maxAbstractionRate: 50,
          waterSampleFrequency: "3 months",
        })),
      }

      const startTime = performance.now()

      expect(() => {
        render(<PermitTemplate permitData={largeData} />)
      }).not.toThrow()

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render large arrays within reasonable time
      expect(renderTime).toBeLessThan(5000)
    })
  })

  describe("Template Content Validation Errors", () => {
    it("should handle invalid date formats", () => {
      const invalidDateData = {
        ...mockPermitData,
        issueDate: "invalid date",
        validUntil: "not a date",
      }

      expect(() => {
        render(<PermitTemplate permitData={invalidDateData} />)
      }).not.toThrow()
    })

    it("should handle negative numbers", () => {
      const negativeData = {
        ...mockPermitData,
        numberOfBoreholes: -5,
        totalAllocatedAbstraction: -1000,
        boreholeDetails: [
          {
            boreholeNumber: "BH001",
            gpsX: "31.0335",
            gpsY: "-17.8252",
            allocatedAmount: -500,
            intendedUse: "Domestic",
            maxAbstractionRate: -100,
            waterSampleFrequency: "3 months",
          },
        ],
      }

      expect(() => {
        render(<PermitTemplate permitData={negativeData} />)
      }).not.toThrow()
    })

    it("should handle extremely long text fields", () => {
      const longTextData = {
        ...mockPermitData,
        applicantName: "A".repeat(10000),
        physicalAddress: "B".repeat(10000),
        postalAddress: "C".repeat(10000),
        intendedUse: "D".repeat(10000),
      }

      expect(() => {
        render(<PermitTemplate permitData={longTextData} />)
      }).not.toThrow()
    })
  })
})

describe("Print Preview Stress Tests", () => {
  const mockApplication: PermitApplication = {
    id: "1",
    applicationNumber: "APP001",
    applicantName: "John Doe",
    applicantAddress: "123 Main St, Harare",
    contactNumber: "+263771234567",
    emailAddress: "john@email.com",
    intendedUse: "Domestic",
    waterAllocation: 50,
    numberOfBoreholes: 1,
    gpsCoordinates: "-17.8252, 31.0335",
    status: "approved",
    submissionDate: new Date(),
    lastModified: new Date(),
    documents: [],
    comments: [],
    workflowStage: "approved",
    assignedTo: "permit_supervisor",
  }

  const mockUser: User = {
    id: "1",
    username: "admin",
    userType: "permitting_officer",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it("should handle multiple concurrent dialog opens", async () => {
    const user = userEvent.setup()

    const promises = []

    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      promises.push(user.click(previewButton))

      unmount()
    }

    await Promise.all(promises)

    // Should not crash with concurrent operations
    expect(true).toBe(true)
  })

  it("should handle rapid component mounting/unmounting", () => {
    const startTime = performance.now()

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)
      unmount()
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Should handle rapid mounting/unmounting within reasonable time
    expect(totalTime).toBeLessThan(5000)
  })

  it("should handle extreme data sizes", async () => {
    const user = userEvent.setup()

    const extremeApplication = {
      ...mockApplication,
      applicantName: "X".repeat(1000000), // 1MB of text
      applicantAddress: "Y".repeat(1000000),
      numberOfBoreholes: 10000,
      documents: Array.from({ length: 1000 }, (_, i) => ({
        id: `doc-${i}`,
        filename: `document-${i}.pdf`,
        uploadDate: new Date(),
        fileSize: 1024000,
        fileType: "application/pdf",
        uploadedBy: "applicant",
      })),
    }

    const startTime = performance.now()

    render(<PermitPreviewDialog application={extremeApplication} currentUser={mockUser} />)

    const previewButton = screen.getByRole("button", { name: /preview permit/i })
    await user.click(previewButton)

    await waitFor(
      () => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      },
      { timeout: 15000 },
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should handle extreme data within 15 seconds
    expect(renderTime).toBeLessThan(15000)
  })

  it("should handle memory pressure scenarios", () => {
    const components = []

    // Create many components to simulate memory pressure
    for (let i = 0; i < 1000; i++) {
      const { container } = render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)
      components.push(container)
    }

    // Should not crash under memory pressure
    expect(components.length).toBe(1000)

    // Clean up
    components.forEach((component) => {
      if (component.parentNode) {
        component.parentNode.removeChild(component)
      }
    })
  })

  it("should handle continuous operations over time", async () => {
    const user = userEvent.setup()

    const mockElement = { innerHTML: "<div>Test content</div>" }
    vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

    const mockPrintWindow = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }

    Object.defineProperty(window, "open", {
      writable: true,
      value: vi.fn(() => mockPrintWindow),
    })

    render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

    const previewButton = screen.getByRole("button", { name: /preview permit/i })
    await user.click(previewButton)

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    const printButton = screen.getByRole("button", { name: /print/i })

    // Perform continuous operations
    for (let i = 0; i < 50; i++) {
      await user.click(printButton)
      await new Promise((resolve) => setTimeout(resolve, 10)) // Small delay
    }

    // Should handle continuous operations without degradation
    expect(mockPrintWindow.print).toHaveBeenCalledTimes(50)
  })
})

describe("Print Preview Performance Benchmarks", () => {
  const mockApplication: PermitApplication = {
    id: "1",
    applicationNumber: "APP001",
    applicantName: "John Doe",
    applicantAddress: "123 Main St, Harare",
    contactNumber: "+263771234567",
    emailAddress: "john@email.com",
    intendedUse: "Domestic",
    waterAllocation: 50,
    numberOfBoreholes: 1,
    gpsCoordinates: "-17.8252, 31.0335",
    status: "approved",
    submissionDate: new Date(),
    lastModified: new Date(),
    documents: [],
    comments: [],
    workflowStage: "approved",
    assignedTo: "permit_supervisor",
  }

  const mockUser: User = {
    id: "1",
    username: "admin",
    userType: "permitting_officer",
    password: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it("should render component within 100ms", () => {
    const startTime = performance.now()

    render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

    const endTime = performance.now()
    const renderTime = endTime - startTime

    expect(renderTime).toBeLessThan(100)
  })

  it("should open dialog within 200ms", async () => {
    const user = userEvent.setup()

    render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

    const previewButton = screen.getByRole("button", { name: /preview permit/i })

    const startTime = performance.now()
    await user.click(previewButton)

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    const endTime = performance.now()
    const clickTime = endTime - startTime

    expect(clickTime).toBeLessThan(200)
  })

  it("should handle print preparation within 500ms", async () => {
    const user = userEvent.setup()

    const mockElement = { innerHTML: "<div>Test content</div>" }
    vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

    const mockPrintWindow = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }

    Object.defineProperty(window, "open", {
      writable: true,
      value: vi.fn(() => mockPrintWindow),
    })

    render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

    const previewButton = screen.getByRole("button", { name: /preview permit/i })
    await user.click(previewButton)

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    const printButton = screen.getByRole("button", { name: /print/i })

    const startTime = performance.now()
    await user.click(printButton)

    await waitFor(() => {
      expect(mockPrintWindow.print).toHaveBeenCalled()
    })

    const endTime = performance.now()
    const printTime = endTime - startTime

    expect(printTime).toBeLessThan(500)
  })

  it("should handle download generation within 300ms", async () => {
    const user = userEvent.setup()

    const mockElement = { innerHTML: "<div>Test content</div>" }
    vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    }
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: vi.fn(() => "blob:mock-url"),
    })

    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn(),
    })

    render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

    const previewButton = screen.getByRole("button", { name: /preview permit/i })
    await user.click(previewButton)

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    const downloadButton = screen.getByRole("button", { name: /download/i })

    const startTime = performance.now()
    await user.click(downloadButton)

    await waitFor(() => {
      expect(mockAnchor.click).toHaveBeenCalled()
    })

    const endTime = performance.now()
    const downloadTime = endTime - startTime

    expect(downloadTime).toBeLessThan(300)
  })

  it("should handle large data sets efficiently", async () => {
    const user = userEvent.setup()

    const largeApplication = {
      ...mockApplication,
      numberOfBoreholes: 100,
      waterAllocation: 5000,
      documents: Array.from({ length: 100 }, (_, i) => ({
        id: `doc-${i}`,
        filename: `document-${i}.pdf`,
        uploadDate: new Date(),
        fileSize: 1024000,
        fileType: "application/pdf",
        uploadedBy: "applicant",
      })),
      comments: Array.from({ length: 200 }, (_, i) => ({
        id: `comment-${i}`,
        comment: `Detailed comment ${i} with extensive information`,
        author: "reviewer",
        timestamp: new Date(),
        type: "review" as const,
      })),
    }

    const startTime = performance.now()

    render(<PermitPreviewDialog application={largeApplication} currentUser={mockUser} />)

    const previewButton = screen.getByRole("button", { name: /preview permit/i })
    await user.click(previewButton)

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Should handle large data within 2 seconds
    expect(totalTime).toBeLessThan(2000)
  })

  it("should maintain performance under repeated operations", async () => {
    const user = userEvent.setup()

    const mockElement = { innerHTML: "<div>Test content</div>" }
    vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any)

    const mockPrintWindow = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    }

    Object.defineProperty(window, "open", {
      writable: true,
      value: vi.fn(() => mockPrintWindow),
    })

    render(<PermitPreviewDialog application={mockApplication} currentUser={mockUser} />)

    const previewButton = screen.getByRole("button", { name: /preview permit/i })
    await user.click(previewButton)

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    const printButton = screen.getByRole("button", { name: /print/i })

    const times = []

    // Perform 20 print operations and measure each
    for (let i = 0; i < 20; i++) {
      const startTime = performance.now()
      await user.click(printButton)
      await waitFor(() => {
        expect(mockPrintWindow.print).toHaveBeenCalledTimes(i + 1)
      })
      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    // Performance should not degrade significantly
    const firstTime = times[0]
    const lastTime = times[times.length - 1]
    const degradation = lastTime / firstTime

    // Should not degrade more than 50%
    expect(degradation).toBeLessThan(1.5)
  })
})
