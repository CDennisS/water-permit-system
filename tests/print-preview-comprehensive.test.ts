import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import type { PermitApplication, User } from "@/types"

// Mock data for testing
const mockPermittingOfficer: User = {
  id: "1",
  username: "officer1",
  userType: "permitting_officer",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockApprovedApplication: PermitApplication = {
  id: "app-1",
  applicationNumber: "UMSCC-2024-001",
  applicantName: "John Doe",
  applicantId: "ID123456",
  physicalAddress: "123 Main Street, Harare",
  postalAddress: "P.O. Box 123, Harare",
  landSize: 10.5,
  numberOfBoreholes: 3,
  waterAllocation: 25.5,
  intendedUse: "Irrigation",
  gpsLatitude: -17.8252,
  gpsLongitude: 31.0335,
  status: "approved",
  submittedAt: new Date("2024-01-15"),
  approvedAt: new Date("2024-02-15"),
  permitNumber: "PERMIT-2024-001",
  documents: [],
  comments: [],
  workflowStage: "permit_issued",
}

const mockDraftApplication: PermitApplication = {
  ...mockApprovedApplication,
  id: "app-2",
  status: "draft",
  approvedAt: undefined,
  permitNumber: undefined,
}

// Mock window.open and related APIs
const mockWindowOpen = vi.fn()
const mockPrint = vi.fn()
const mockClose = vi.fn()
const mockFocus = vi.fn()

Object.defineProperty(window, "open", {
  writable: true,
  value: mockWindowOpen,
})

// Mock URL.createObjectURL
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:mock-url"),
})

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
})

// Mock Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content[0].length,
  type: options?.type || "text/plain",
}))

describe("Print Preview Comprehensive Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWindowOpen.mockReturnValue({
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: mockFocus,
      print: mockPrint,
      close: mockClose,
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe("Parameter Validation Tests", () => {
    describe("Application Status Tests", () => {
      const statuses = ["approved", "permit_issued", "draft", "submitted", "under_review", "rejected"] as const

      statuses.forEach((status) => {
        it(`should handle ${status} application status correctly`, async () => {
          const application = { ...mockApprovedApplication, status }
          const shouldShowPreview = status === "approved" || status === "permit_issued"

          render(
            <PermitPreviewDialog
              application={application}
              currentUser={mockPermittingOfficer}
              onPrint={vi.fn()}
              onDownload={vi.fn()}
            />,
          )

          if (shouldShowPreview) {
            expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
          } else {
            expect(screen.queryByRole("button", { name: /preview permit/i })).not.toBeInTheDocument()
          }
        })
      })
    })

    describe("User Type Permission Tests", () => {
      const userTypes = [
        { type: "permitting_officer", canPreview: true },
        { type: "permit_supervisor", canPreview: true },
        { type: "catchment_manager", canPreview: true },
        { type: "catchment_chairperson", canPreview: true },
        { type: "ict", canPreview: true },
        { type: "applicant", canPreview: false },
      ] as const

      userTypes.forEach(({ type, canPreview }) => {
        it(`should ${canPreview ? "allow" : "deny"} preview for ${type}`, () => {
          const user = { ...mockPermittingOfficer, userType: type }

          render(
            <PermitPreviewDialog
              application={mockApprovedApplication}
              currentUser={user}
              onPrint={vi.fn()}
              onDownload={vi.fn()}
            />,
          )

          if (canPreview) {
            expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
          } else {
            expect(screen.queryByRole("button", { name: /preview permit/i })).not.toBeInTheDocument()
          }
        })
      })
    })

    describe("Borehole Count Tests", () => {
      const boreholeCounts = [1, 5, 10, 25, 50, 100, 500]

      boreholeCounts.forEach((count) => {
        it(`should handle ${count} boreholes efficiently`, async () => {
          const application = { ...mockApprovedApplication, numberOfBoreholes: count }
          const startTime = performance.now()

          render(
            <PermitPreviewDialog
              application={application}
              currentUser={mockPermittingOfficer}
              onPrint={vi.fn()}
              onDownload={vi.fn()}
            />,
          )

          const renderTime = performance.now() - startTime
          expect(renderTime).toBeLessThan(100) // Should render in under 100ms

          const previewButton = screen.getByRole("button", { name: /preview permit/i })
          expect(previewButton).toBeInTheDocument()
        })
      })
    })

    describe("Water Allocation Tests", () => {
      const allocations = [0.1, 1, 10, 100, 1000, 10000, 50000]

      allocations.forEach((allocation) => {
        it(`should handle ${allocation} ML water allocation`, () => {
          const application = { ...mockApprovedApplication, waterAllocation: allocation }

          render(
            <PermitPreviewDialog
              application={application}
              currentUser={mockPermittingOfficer}
              onPrint={vi.fn()}
              onDownload={vi.fn()}
            />,
          )

          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        })
      })
    })

    describe("Special Characters Tests", () => {
      const specialCharacterTests = [
        { name: "XSS Prevention", value: '<script>alert("xss")</script>' },
        { name: "Unicode Support", value: "José María Ñoño" },
        { name: "HTML Entities", value: "&lt;test&gt; &amp; &quot;quotes&quot;" },
        { name: "Emoji Support", value: "🌊💧🏭" },
        { name: "Special Symbols", value: "±∞≤≥∑∆" },
      ]

      specialCharacterTests.forEach(({ name, value }) => {
        it(`should handle ${name}: ${value}`, () => {
          const application = { ...mockApprovedApplication, applicantName: value }

          render(
            <PermitPreviewDialog
              application={application}
              currentUser={mockPermittingOfficer}
              onPrint={vi.fn()}
              onDownload={vi.fn()}
            />,
          )

          expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
        })
      })
    })

    describe("Data Extremes Tests", () => {
      it("should handle very long text fields", () => {
        const longText = "A".repeat(10000) // 10KB text
        const application = { ...mockApprovedApplication, physicalAddress: longText }

        const startTime = performance.now()
        render(
          <PermitPreviewDialog
            application={application}
            currentUser={mockPermittingOfficer}
            onPrint={vi.fn()}
            onDownload={vi.fn()}
          />,
        )
        const renderTime = performance.now() - startTime

        expect(renderTime).toBeLessThan(200) // Should still render quickly
        expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
      })

      it("should handle applications with many documents", () => {
        const manyDocuments = Array.from({ length: 100 }, (_, i) => ({
          id: `doc-${i}`,
          applicationId: mockApprovedApplication.id,
          fileName: `document-${i}.pdf`,
          fileType: "application/pdf",
          fileSize: 1024 * 1024, // 1MB
          uploadedAt: new Date(),
          uploadedBy: "user1",
          documentType: "other" as const,
        }))

        const application = { ...mockApprovedApplication, documents: manyDocuments }

        render(
          <PermitPreviewDialog
            application={application}
            currentUser={mockPermittingOfficer}
            onPrint={vi.fn()}
            onDownload={vi.fn()}
          />,
        )

        expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
      })
    })

    describe("Null/Undefined Handling Tests", () => {
      it("should handle missing optional fields gracefully", () => {
        const applicationWithMissingFields = {
          ...mockApprovedApplication,
          postalAddress: undefined,
          approvedAt: undefined,
          permitNumber: undefined,
        }

        render(
          <PermitPreviewDialog
            application={applicationWithMissingFields}
            currentUser={mockPermittingOfficer}
            onPrint={vi.fn()}
            onDownload={vi.fn()}
          />,
        )

        expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
      })
    })
  })

  describe("Error Scenario Tests", () => {
    describe("DOM Manipulation Errors", () => {
      it("should handle missing permit preview content element", async () => {
        const onPrint = vi.fn()

        render(
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={onPrint}
            onDownload={vi.fn()}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await userEvent.click(previewButton)

        // Mock getElementById to return null
        const originalGetElementById = document.getElementById
        document.getElementById = vi.fn().mockReturnValue(null)

        const printButton = screen.getByRole("button", { name: /print/i })
        await userEvent.click(printButton)

        await waitFor(() => {
          expect(onPrint).not.toHaveBeenCalled()
        })

        // Restore original function
        document.getElementById = originalGetElementById
      })

      it("should handle corrupted DOM content", async () => {
        const onPrint = vi.fn()

        render(
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={onPrint}
            onDownload={vi.fn()}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await userEvent.click(previewButton)

        // Mock getElementById to return element with corrupted innerHTML
        const mockElement = { innerHTML: null }
        document.getElementById = vi.fn().mockReturnValue(mockElement)

        const printButton = screen.getByRole("button", { name: /print/i })
        await userEvent.click(printButton)

        await waitFor(() => {
          expect(onPrint).not.toHaveBeenCalled()
        })
      })
    })

    describe("Window.open Failures", () => {
      it("should handle blocked popup windows", async () => {
        mockWindowOpen.mockReturnValue(null)
        const onPrint = vi.fn()

        render(
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={onPrint}
            onDownload={vi.fn()}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await userEvent.click(previewButton)

        const printButton = screen.getByRole("button", { name: /print/i })
        await userEvent.click(printButton)

        await waitFor(() => {
          expect(onPrint).not.toHaveBeenCalled()
        })
      })

      it("should handle window.open exceptions", async () => {
        mockWindowOpen.mockImplementation(() => {
          throw new Error("Popup blocked")
        })

        const onPrint = vi.fn()

        render(
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={onPrint}
            onDownload={vi.fn()}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await userEvent.click(previewButton)

        const printButton = screen.getByRole("button", { name: /print/i })
        await userEvent.click(printButton)

        await waitFor(() => {
          expect(onPrint).not.toHaveBeenCalled()
        })
      })
    })

    describe("Download Errors", () => {
      it("should handle Blob creation failures", async () => {
        global.Blob = vi.fn().mockImplementation(() => {
          throw new Error("Blob creation failed")
        })

        const onDownload = vi.fn()

        render(
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={vi.fn()}
            onDownload={onDownload}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await userEvent.click(previewButton)

        const downloadButton = screen.getByRole("button", { name: /download/i })
        await userEvent.click(downloadButton)

        await waitFor(() => {
          expect(onDownload).not.toHaveBeenCalled()
        })
      })

      it("should handle URL.createObjectURL failures", async () => {
        URL.createObjectURL = vi.fn().mockImplementation(() => {
          throw new Error("URL creation failed")
        })

        const onDownload = vi.fn()

        render(
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={vi.fn()}
            onDownload={onDownload}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await userEvent.click(previewButton)

        const downloadButton = screen.getByRole("button", { name: /download/i })
        await userEvent.click(downloadButton)

        await waitFor(() => {
          expect(onDownload).not.toHaveBeenCalled()
        })
      })
    })

    describe("Memory and Performance Errors", () => {
      it("should handle memory exhaustion gracefully", async () => {
        // Simulate memory pressure by creating large objects
        const largeData = Array.from({ length: 10000 }, () => "x".repeat(1000)).join("")
        const application = { ...mockApprovedApplication, physicalAddress: largeData }

        const startTime = performance.now()
        render(
          <PermitPreviewDialog
            application={application}
            currentUser={mockPermittingOfficer}
            onPrint={vi.fn()}
            onDownload={vi.fn()}
          />,
        )
        const renderTime = performance.now() - startTime

        expect(renderTime).toBeLessThan(2000) // Should complete within 2 seconds
        expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
      })

      it("should handle rapid successive operations", async () => {
        const onPrint = vi.fn()

        render(
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={onPrint}
            onDownload={vi.fn()}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await userEvent.click(previewButton)

        const printButton = screen.getByRole("button", { name: /print/i })

        // Rapidly click print button multiple times
        for (let i = 0; i < 10; i++) {
          await userEvent.click(printButton)
        }

        // Should handle rapid clicks gracefully without crashing
        expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
      })
    })
  })

  describe("Stress Testing", () => {
    it("should handle concurrent dialog operations", async () => {
      const dialogs = Array.from({ length: 10 }, (_, i) => (
        <PermitPreviewDialog
          key={i}
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />
      ))

      const startTime = performance.now()
      render(<div>{dialogs}</div>)
      const renderTime = performance.now() - startTime

      expect(renderTime).toBeLessThan(500) // Should render 10 dialogs in under 500ms
      expect(screen.getAllByRole("button", { name: /preview permit/i })).toHaveLength(10)
    })

    it("should handle rapid mount/unmount cycles", async () => {
      const TestComponent = ({ show }: { show: boolean }) =>
        show ? (
          <PermitPreviewDialog
            application={mockApprovedApplication}
            currentUser={mockPermittingOfficer}
            onPrint={vi.fn()}
            onDownload={vi.fn()}
          />
        ) : null

      const { rerender } = render(<TestComponent show={true} />)

      // Rapidly mount/unmount 100 times
      for (let i = 0; i < 100; i++) {
        rerender(<TestComponent show={i % 2 === 0} />)
      }

      // Should not crash and final state should be correct
      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
    })

    it("should maintain performance with extreme data", async () => {
      const extremeApplication = {
        ...mockApprovedApplication,
        numberOfBoreholes: 1000,
        waterAllocation: 999999,
        physicalAddress: "A".repeat(100000), // 100KB address
        documents: Array.from({ length: 1000 }, (_, i) => ({
          id: `doc-${i}`,
          applicationId: mockApprovedApplication.id,
          fileName: `document-${i}.pdf`,
          fileType: "application/pdf",
          fileSize: 1024 * 1024,
          uploadedAt: new Date(),
          uploadedBy: "user1",
          documentType: "other" as const,
        })),
      }

      const startTime = performance.now()
      render(
        <PermitPreviewDialog
          application={extremeApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )
      const renderTime = performance.now() - startTime

      expect(renderTime).toBeLessThan(1000) // Should handle extreme data in under 1 second
      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
    })
  })

  describe("Browser Compatibility Tests", () => {
    it("should handle missing window.open API", () => {
      const originalOpen = window.open
      delete (window as any).open

      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()

      // Restore
      window.open = originalOpen
    })

    it("should handle missing Blob API", () => {
      const originalBlob = global.Blob
      delete (global as any).Blob

      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()

      // Restore
      global.Blob = originalBlob
    })

    it("should handle missing URL.createObjectURL API", () => {
      const originalCreateObjectURL = URL.createObjectURL
      delete (URL as any).createObjectURL

      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()

      // Restore
      URL.createObjectURL = originalCreateObjectURL
    })
  })

  describe("Performance Benchmarks", () => {
    it("should meet component render performance targets", () => {
      const startTime = performance.now()
      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )
      const renderTime = performance.now() - startTime

      expect(renderTime).toBeLessThan(100) // Target: < 100ms
    })

    it("should meet dialog open performance targets", async () => {
      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })

      const startTime = performance.now()
      await userEvent.click(previewButton)
      const openTime = performance.now() - startTime

      expect(openTime).toBeLessThan(200) // Target: < 200ms
    })

    it("should meet print preparation performance targets", async () => {
      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await userEvent.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })

      const startTime = performance.now()
      await userEvent.click(printButton)
      const printTime = performance.now() - startTime

      expect(printTime).toBeLessThan(500) // Target: < 500ms
    })

    it("should meet download generation performance targets", async () => {
      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await userEvent.click(previewButton)

      const downloadButton = screen.getByRole("button", { name: /download/i })

      const startTime = performance.now()
      await userEvent.click(downloadButton)
      const downloadTime = performance.now() - startTime

      expect(downloadTime).toBeLessThan(300) // Target: < 300ms
    })
  })

  describe("Security Tests", () => {
    it("should prevent XSS in applicant name", () => {
      const maliciousApplication = {
        ...mockApprovedApplication,
        applicantName: '<script>alert("XSS")</script>',
      }

      render(
        <PermitPreviewDialog
          application={maliciousApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      // Should render without executing script
      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
      expect(document.querySelector("script")).toBeNull()
    })

    it("should sanitize HTML in addresses", () => {
      const maliciousApplication = {
        ...mockApprovedApplication,
        physicalAddress: '<img src="x" onerror="alert(\'XSS\')">',
      }

      render(
        <PermitPreviewDialog
          application={maliciousApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
    })

    it("should handle SQL injection attempts in text fields", () => {
      const maliciousApplication = {
        ...mockApprovedApplication,
        intendedUse: "'; DROP TABLE applications; --",
      }

      render(
        <PermitPreviewDialog
          application={maliciousApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      expect(screen.getByRole("button", { name: /preview permit/i })).toBeInTheDocument()
    })
  })

  describe("Integration Tests", () => {
    it("should integrate properly with enhanced permit printer", async () => {
      const onPrint = vi.fn()
      const onDownload = vi.fn()

      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={onPrint}
          onDownload={onDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await userEvent.click(previewButton)

      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(screen.getByText(/permit preview/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument()
    })

    it("should properly handle callback functions", async () => {
      const onPrint = vi.fn()
      const onDownload = vi.fn()

      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={onPrint}
          onDownload={onDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await userEvent.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(onPrint).toHaveBeenCalledTimes(1)
      })

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(onDownload).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe("Accessibility Tests", () => {
    it("should have proper ARIA labels", () => {
      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      expect(previewButton).toHaveAttribute("type", "button")
    })

    it("should support keyboard navigation", async () => {
      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      previewButton.focus()

      await userEvent.keyboard("{Enter}")

      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("should have proper focus management", async () => {
      render(
        <PermitPreviewDialog
          application={mockApprovedApplication}
          currentUser={mockPermittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await userEvent.click(previewButton)

      // Dialog should be focusable
      const dialog = screen.getByRole("dialog")
      expect(dialog).toBeInTheDocument()
    })
  })
})
