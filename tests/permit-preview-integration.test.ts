import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { PermitTemplate } from "@/components/permit-template"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import type { PermitApplication, User } from "@/types"

// Mock data for integration testing
const mockCompleteApplication: PermitApplication = {
  id: "APP-INTEGRATION-001",
  applicationNumber: "APP-2024-INT-001",
  applicantName: "Integration Test Mining Company (Pvt) Ltd",
  applicantId: "applicant-int-001",
  physicalAddress: "456 Integration Avenue, Bulawayo, Zimbabwe",
  postalAddress: "Private Bag 789, Bulawayo",
  landSize: 125.75,
  numberOfBoreholes: 8,
  waterAllocation: 50.5,
  intendedUse: "mining",
  gpsLatitude: -20.1569,
  gpsLongitude: 28.5833,
  status: "approved",
  submittedAt: new Date("2024-01-15"),
  approvedAt: new Date("2024-03-20"),
  permitNumber: "UMSCC-2024-INT-001",
  documents: [
    {
      id: "doc-001",
      applicationId: "APP-INTEGRATION-001",
      fileName: "site-plan.pdf",
      fileType: "application/pdf",
      fileSize: 2048000,
      uploadedAt: new Date("2024-01-16"),
      uploadedBy: "applicant-int-001",
      documentType: "site_plan",
    },
    {
      id: "doc-002",
      applicationId: "APP-INTEGRATION-001",
      fileName: "environmental-clearance.pdf",
      fileType: "application/pdf",
      fileSize: 1536000,
      uploadedAt: new Date("2024-01-17"),
      uploadedBy: "applicant-int-001",
      documentType: "environmental_clearance",
    },
  ],
  comments: [
    {
      id: "comment-001",
      applicationId: "APP-INTEGRATION-001",
      userId: "officer-001",
      userType: "permitting_officer",
      comment: "Technical review completed successfully",
      commentType: "technical_review",
      createdAt: new Date("2024-02-01"),
      isInternal: true,
    },
    {
      id: "comment-002",
      applicationId: "APP-INTEGRATION-001",
      userId: "supervisor-001",
      userType: "permit_supervisor",
      comment: "Application approved for permit issuance",
      commentType: "approval",
      createdAt: new Date("2024-03-20"),
      isInternal: true,
    },
  ],
  workflowStage: "permit_issued",
}

const mockPermitSupervisor: User = {
  id: "supervisor-001",
  username: "supervisor.integration",
  userType: "permit_supervisor",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-03-20"),
}

// Mock window and document functions
const mockWindowOpen = vi.fn()
const mockCreateObjectURL = vi.fn(() => "blob:integration-test-url")
const mockRevokeObjectURL = vi.fn()

describe("Permit Preview Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup window mocks
    Object.defineProperty(window, "open", {
      writable: true,
      value: mockWindowOpen.mockReturnValue({
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }),
    })

    // Setup URL mocks
    Object.defineProperty(URL, "createObjectURL", { value: mockCreateObjectURL })
    Object.defineProperty(URL, "revokeObjectURL", { value: mockRevokeObjectURL })

    // Setup document mocks
    Object.defineProperty(document, "createElement", {
      value: vi.fn(() => ({
        href: "",
        download: "",
        click: vi.fn(),
      })),
    })
    Object.defineProperty(document.body, "appendChild", { value: vi.fn() })
    Object.defineProperty(document.body, "removeChild", { value: vi.fn() })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("End-to-End Preview Workflow", () => {
    it("should complete full preview workflow from button click to content display", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Step 1: Click preview button
      const previewButton = screen.getByText("Preview Permit")
      expect(previewButton).toBeInTheDocument()
      await user.click(previewButton)

      // Step 2: Verify dialog opens
      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Step 3: Verify permit content is displayed
      await waitFor(() => {
        expect(screen.getByText("Form GW7B")).toBeInTheDocument()
        expect(screen.getByText("Integration Test Mining Company (Pvt) Ltd")).toBeInTheDocument()
        expect(screen.getByText("456 Integration Avenue, Bulawayo, Zimbabwe")).toBeInTheDocument()
        expect(screen.getByText("Private Bag 789, Bulawayo")).toBeInTheDocument()
      })

      // Step 4: Verify borehole details
      expect(screen.getByText("BH-01")).toBeInTheDocument()
      expect(screen.getByText("BH-08")).toBeInTheDocument()

      // Step 5: Verify action buttons are available
      expect(screen.getByText("Print")).toBeInTheDocument()
      expect(screen.getByText("Download")).toBeInTheDocument()
    })

    it("should handle complete print workflow", async () => {
      const user = userEvent.setup()
      const mockOnPrint = vi.fn()

      render(
        <PermitPreviewDialog
          application={mockCompleteApplication}
          currentUser={mockPermitSupervisor}
          onPrint={mockOnPrint}
        />,
      )

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // Execute print
      const printButton = screen.getByText("Print")
      await user.click(printButton)

      // Verify print process
      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank")
        expect(mockOnPrint).toHaveBeenCalled()
      })
    })

    it("should handle complete download workflow", async () => {
      const user = userEvent.setup()
      const mockOnDownload = vi.fn()

      render(
        <PermitPreviewDialog
          application={mockCompleteApplication}
          currentUser={mockPermitSupervisor}
          onDownload={mockOnDownload}
        />,
      )

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Execute download
      const downloadButton = screen.getByText("Download")
      await user.click(downloadButton)

      // Verify download process
      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()
        expect(mockOnDownload).toHaveBeenCalled()
      })
    })
  })

  describe("Data Integration and Consistency", () => {
    it("should display consistent data between permit generator and template", () => {
      const permitData = preparePermitData(mockCompleteApplication)

      // Render template directly
      const { container } = render(<PermitTemplate permitData={permitData} />)

      // Verify key data points
      expect(container.textContent).toContain(permitData.applicantName)
      expect(container.textContent).toContain(permitData.physicalAddress)
      expect(container.textContent).toContain(permitData.permitNumber)
      expect(container.textContent).toContain(permitData.landSize.toString())
      expect(container.textContent).toContain(permitData.numberOfBoreholes.toString())

      // Verify borehole data consistency
      permitData.boreholeDetails.forEach((borehole) => {
        expect(container.textContent).toContain(borehole.boreholeNumber)
        expect(container.textContent).toContain(borehole.allocatedAmount.toLocaleString())
      })
    })

    it("should maintain data integrity across preview dialog and template", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Verify all application data is present and consistent
        expect(screen.getByText("Integration Test Mining Company (Pvt) Ltd")).toBeInTheDocument()
        expect(screen.getByText("456 Integration Avenue, Bulawayo, Zimbabwe")).toBeInTheDocument()
        expect(screen.getByText("125.75 (ha)")).toBeInTheDocument()
        expect(screen.getByText("8")).toBeInTheDocument() // Number of boreholes
        expect(screen.getByText("mining")).toBeInTheDocument() // Intended use
      })
    })

    it("should calculate and display correct totals", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Verify total allocation calculation (50.5 ML = 50,500 m³)
        expect(screen.getByText("50,500")).toBeInTheDocument()
      })
    })
  })

  describe("Complex Application Scenarios", () => {
    it("should handle applications with many boreholes", async () => {
      const user = userEvent.setup()

      const manyBoreholeApp = {
        ...mockCompleteApplication,
        numberOfBoreholes: 15,
        waterAllocation: 100.0,
      }

      render(<PermitPreviewDialog application={manyBoreholeApp} currentUser={mockPermitSupervisor} />)

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Should display all boreholes
        expect(screen.getByText("BH-01")).toBeInTheDocument()
        expect(screen.getByText("BH-15")).toBeInTheDocument()

        // Should show correct total
        expect(screen.getByText("100,000")).toBeInTheDocument() // 100 ML = 100,000 m³
      })
    })

    it("should handle applications with minimal data", async () => {
      const user = userEvent.setup()

      const minimalApp = {
        ...mockCompleteApplication,
        postalAddress: undefined,
        numberOfBoreholes: 1,
        waterAllocation: 1.0,
      }

      render(<PermitPreviewDialog application={minimalApp} currentUser={mockPermitSupervisor} />)

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Should handle missing postal address
        expect(screen.getByText("N/A")).toBeInTheDocument()

        // Should show single borehole
        expect(screen.getByText("BH-01")).toBeInTheDocument()
        expect(screen.queryByText("BH-02")).not.toBeInTheDocument()

        // Should show correct small allocation
        expect(screen.getByText("1,000")).toBeInTheDocument() // 1 ML = 1,000 m³
      })
    })

    it("should handle applications with special characters in data", async () => {
      const user = userEvent.setup()

      const specialCharApp = {
        ...mockCompleteApplication,
        applicantName: "Test Company (Pvt) Ltd & Associates",
        physicalAddress: "123 Main St, Apt #4B, Harare - Zimbabwe",
        intendedUse: "irrigation & livestock",
      }

      render(<PermitPreviewDialog application={specialCharApp} currentUser={mockPermitSupervisor} />)

      // Open preview
      const previewButton = screen.getByText("Preview Permit")
      await user.click(previewButton)

      await waitFor(() => {
        // Should display special characters correctly
        expect(screen.getByText("Test Company (Pvt) Ltd & Associates")).toBeInTheDocument()
        expect(screen.getByText("123 Main St, Apt #4B, Harare - Zimbabwe")).toBeInTheDocument()
        expect(screen.getByText("irrigation & livestock")).toBeInTheDocument()
      })
    })
  })

  describe("User Experience Integration", () => {
    it("should provide smooth user interaction flow", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Step 1: Initial state
      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
      expect(screen.queryByText("Permit Preview")).not.toBeInTheDocument()

      // Step 2: Open dialog
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Step 3: Interact with content (scroll should work)
      const scrollArea = screen.getByText("Form GW7B").closest("[data-radix-scroll-area-viewport]")
      expect(scrollArea).toBeInTheDocument()

      // Step 4: Close dialog
      await user.keyboard("{Escape}")

      await waitFor(() => {
        expect(screen.queryByText("Permit Preview")).not.toBeInTheDocument()
      })

      // Step 5: Should return to initial state
      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
    })

    it("should handle multiple user interactions without conflicts", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Open dialog
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
        expect(screen.getByText("Download")).toBeInTheDocument()
      })

      // Try multiple actions in sequence
      await user.click(screen.getByText("Download"))
      await user.click(screen.getByText("Print"))

      // Should handle both actions without conflicts
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it("should maintain responsive behavior", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Open dialog
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        const dialog = screen.getByRole("dialog")
        expect(dialog).toBeInTheDocument()

        // Check for responsive classes
        expect(dialog.closest('[class*="max-w-4xl"]')).toBeInTheDocument()
        expect(dialog.closest('[class*="max-h-"]')).toBeInTheDocument()
      })
    })
  })

  describe("Error Recovery and Resilience", () => {
    it("should recover from temporary failures", async () => {
      const user = userEvent.setup()

      // Mock initial failure then success
      let callCount = 0
      mockWindowOpen.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          throw new Error("Temporary failure")
        }
        return {
          document: { write: vi.fn(), close: vi.fn() },
          focus: vi.fn(),
          print: vi.fn(),
          close: vi.fn(),
        }
      })

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Open dialog
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument()
      })

      // First print attempt (should fail)
      await user.click(screen.getByText("Print"))

      // Second print attempt (should succeed)
      await user.click(screen.getByText("Print"))

      expect(mockWindowOpen).toHaveBeenCalledTimes(2)
    })

    it("should handle corrupted application data gracefully", async () => {
      const user = userEvent.setup()

      const corruptedApp = {
        ...mockCompleteApplication,
        // @ts-ignore - Intentionally corrupt data for testing
        landSize: null,
        numberOfBoreholes: undefined,
        waterAllocation: "invalid",
      }

      expect(() => {
        render(<PermitPreviewDialog application={corruptedApp as any} currentUser={mockPermitSupervisor} />)
      }).not.toThrow()

      // Should still render preview button
      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
    })
  })

  describe("Performance Under Load", () => {
    it("should handle large datasets efficiently", async () => {
      const user = userEvent.setup()

      const largeDataApp = {
        ...mockCompleteApplication,
        numberOfBoreholes: 50,
        waterAllocation: 500.0,
        comments: Array.from({ length: 100 }, (_, i) => ({
          id: `comment-${i}`,
          applicationId: mockCompleteApplication.id,
          userId: `user-${i}`,
          userType: "permitting_officer" as const,
          comment: `Comment ${i} with detailed information about the application review process`,
          commentType: "general" as const,
          createdAt: new Date(),
          isInternal: false,
        })),
        documents: Array.from({ length: 20 }, (_, i) => ({
          id: `doc-${i}`,
          applicationId: mockCompleteApplication.id,
          fileName: `document-${i}.pdf`,
          fileType: "application/pdf",
          fileSize: 1024000,
          uploadedAt: new Date(),
          uploadedBy: "applicant",
          documentType: "other" as const,
        })),
      }

      const startTime = performance.now()

      render(<PermitPreviewDialog application={largeDataApp} currentUser={mockPermitSupervisor} />)

      // Open dialog
      await user.click(screen.getByText("Preview Permit"))

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000)
    })

    it("should handle rapid user interactions", async () => {
      const user = userEvent.setup()

      render(<PermitPreviewDialog application={mockCompleteApplication} currentUser={mockPermitSupervisor} />)

      // Rapidly open and close dialog multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByText("Preview Permit"))

        await waitFor(() => {
          expect(screen.getByText("Permit Preview")).toBeInTheDocument()
        })

        await user.keyboard("{Escape}")

        await waitFor(() => {
          expect(screen.queryByText("Permit Preview")).not.toBeInTheDocument()
        })
      }

      // Should handle all interactions without errors
      expect(screen.getByText("Preview Permit")).toBeInTheDocument()
    })
  })
})
