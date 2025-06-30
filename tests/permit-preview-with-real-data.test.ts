import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"
import { ApplicationsTable } from "@/components/applications-table"
import { preparePermitData } from "@/lib/enhanced-permit-generator"
import { createTestPermitApplications } from "@/scripts/create-test-permit-applications"
import { db } from "@/lib/database"
import type { User, PermitApplication } from "@/types"

// Mock window.open and URL.createObjectURL
const mockWindowOpen = vi.fn()
const mockCreateObjectURL = vi.fn()

Object.defineProperty(window, "open", {
  writable: true,
  value: mockWindowOpen,
})

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: mockCreateObjectURL,
})

describe("Permit Preview with Real Data", () => {
  let permittingOfficer: User
  let testApplications: PermitApplication[]
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(async () => {
    // Create comprehensive test data
    testApplications = await createTestPermitApplications()
    console.log(`Created ${testApplications.length} test applications for preview testing`)
  })

  beforeEach(async () => {
    user = userEvent.setup()

    // Get permitting officer user
    const users = await db.getUsers()
    permittingOfficer = users.find((u) => u.userType === "permitting_officer")!

    // Reset mocks
    mockWindowOpen.mockClear()
    mockCreateObjectURL.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Real Data Permit Preview Tests", () => {
    it("should preview domestic water permit with complete data", async () => {
      const domesticApp = testApplications.find((app) => app.applicantName === "Sarah Johnson")!

      render(
        <PermitPreviewDialog
          application={domesticApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Verify domestic permit details
      expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
      expect(screen.getByText("45 Riverside Drive, Borrowdale, Harare")).toBeInTheDocument()
      expect(screen.getByText("P.O. Box 2847, Harare")).toBeInTheDocument()
      expect(screen.getByText("1.2")).toBeInTheDocument() // Water allocation
      expect(screen.getByText("1")).toBeInTheDocument() // Number of boreholes
      expect(screen.getByText("Domestic water supply for residential property")).toBeInTheDocument()
    })

    it("should preview agricultural permit with multiple boreholes", async () => {
      const agriculturalApp = testApplications.find(
        (app) => app.applicantName === "Zimbabwe Agricultural Development Trust",
      )!

      render(
        <PermitPreviewDialog
          application={agriculturalApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Verify agricultural permit details
      expect(screen.getByText("Zimbabwe Agricultural Development Trust")).toBeInTheDocument()
      expect(screen.getByText("Farm 247, Mazowe District, Mashonaland Central")).toBeInTheDocument()
      expect(screen.getByText("45.8")).toBeInTheDocument() // Water allocation
      expect(screen.getByText("5")).toBeInTheDocument() // Number of boreholes
      expect(
        screen.getByText("Commercial tobacco and maize production with drip irrigation system"),
      ).toBeInTheDocument()
    })

    it("should preview industrial permit with complex requirements", async () => {
      const industrialApp = testApplications.find((app) => app.applicantName === "Harare Industrial Manufacturing Ltd")!

      render(
        <PermitPreviewDialog
          application={industrialApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Verify industrial permit details
      expect(screen.getByText("Harare Industrial Manufacturing Ltd")).toBeInTheDocument()
      expect(screen.getByText("Plot 15, Workington Industrial Area, Harare")).toBeInTheDocument()
      expect(screen.getByText("28.5")).toBeInTheDocument() // Water allocation
      expect(screen.getByText("3")).toBeInTheDocument() // Number of boreholes
      expect(screen.getByText("Manufacturing processes, cooling systems, and employee facilities")).toBeInTheDocument()
    })

    it("should preview bulk water municipal permit", async () => {
      const bulkWaterApp = testApplications.find((app) => app.applicantName === "Chitungwiza Municipality")!

      render(
        <PermitPreviewDialog
          application={bulkWaterApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Verify bulk water permit details
      expect(screen.getByText("Chitungwiza Municipality")).toBeInTheDocument()
      expect(screen.getByText("Civic Centre, Chitungwiza")).toBeInTheDocument()
      expect(screen.getByText("125")).toBeInTheDocument() // Water allocation
      expect(screen.getByText("8")).toBeInTheDocument() // Number of boreholes
      expect(
        screen.getByText("Municipal water supply for Chitungwiza urban area (population 356,000)"),
      ).toBeInTheDocument()
    })

    it("should preview institutional permit for university", async () => {
      const institutionApp = testApplications.find((app) => app.applicantName === "University of Zimbabwe")!

      render(
        <PermitPreviewDialog
          application={institutionApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Verify institutional permit details
      expect(screen.getByText("University of Zimbabwe")).toBeInTheDocument()
      expect(screen.getByText("Mount Pleasant Campus, Harare")).toBeInTheDocument()
      expect(screen.getByText("18.5")).toBeInTheDocument() // Water allocation
      expect(screen.getByText("4")).toBeInTheDocument() // Number of boreholes
      expect(
        screen.getByText(
          "University campus water supply including student accommodation, laboratories, and facilities",
        ),
      ).toBeInTheDocument()
    })

    it("should preview surface water storage permit", async () => {
      const surfaceWaterApp = testApplications.find((app) => app.applicantName === "Mazowe Citrus Estates")!

      render(
        <PermitPreviewDialog
          application={surfaceWaterApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Permit Preview")).toBeInTheDocument()
      })

      // Verify surface water permit details
      expect(screen.getByText("Mazowe Citrus Estates")).toBeInTheDocument()
      expect(screen.getByText("Mazowe Valley, Mashonaland Central")).toBeInTheDocument()
      expect(screen.getByText("85")).toBeInTheDocument() // Water allocation
      expect(screen.getByText("0")).toBeInTheDocument() // Number of boreholes (surface water)
      expect(screen.getByText("Citrus irrigation and frost protection system")).toBeInTheDocument()
    })
  })

  describe("Permit Template Data Processing", () => {
    it("should correctly process domestic permit data", () => {
      const domesticApp = testApplications.find((app) => app.applicantName === "Sarah Johnson")!

      const permitData = preparePermitData(domesticApp)

      expect(permitData.permitNumber).toBe(domesticApp.applicationId)
      expect(permitData.applicantName).toBe("Sarah Johnson")
      expect(permitData.physicalAddress).toBe("45 Riverside Drive, Borrowdale, Harare")
      expect(permitData.totalAllocatedAbstraction).toBe(1.2)
      expect(permitData.numberOfBoreholes).toBe(1)
      expect(permitData.intendedUse).toBe("Domestic water supply for residential property")
      expect(permitData.gpsCoordinates.latitude).toBe(-17.7669)
      expect(permitData.gpsCoordinates.longitude).toBe(31.0746)
    })

    it("should correctly process agricultural permit with multiple boreholes", () => {
      const agriculturalApp = testApplications.find(
        (app) => app.applicantName === "Zimbabwe Agricultural Development Trust",
      )!

      const permitData = preparePermitData(agriculturalApp)

      expect(permitData.permitNumber).toBe(agriculturalApp.applicationId)
      expect(permitData.applicantName).toBe("Zimbabwe Agricultural Development Trust")
      expect(permitData.totalAllocatedAbstraction).toBe(45.8)
      expect(permitData.numberOfBoreholes).toBe(5)
      expect(permitData.landSize).toBe(150.0)
      expect(permitData.boreholeDetails).toHaveLength(5)

      // Check borehole allocation distribution
      const totalBoreholeAllocation = permitData.boreholeDetails.reduce(
        (sum, borehole) => sum + borehole.allocatedAmount,
        0,
      )
      expect(totalBoreholeAllocation).toBe(45.8)
    })

    it("should correctly process industrial permit data", () => {
      const industrialApp = testApplications.find((app) => app.applicantName === "Harare Industrial Manufacturing Ltd")!

      const permitData = preparePermitData(industrialApp)

      expect(permitData.permitNumber).toBe(industrialApp.applicationId)
      expect(permitData.applicantName).toBe("Harare Industrial Manufacturing Ltd")
      expect(permitData.totalAllocatedAbstraction).toBe(28.5)
      expect(permitData.numberOfBoreholes).toBe(3)
      expect(permitData.permitType).toBe("provisional")
      expect(permitData.intendedUse).toBe("Manufacturing processes, cooling systems, and employee facilities")
    })

    it("should correctly process bulk water municipal permit", () => {
      const bulkWaterApp = testApplications.find((app) => app.applicantName === "Chitungwiza Municipality")!

      const permitData = preparePermitData(bulkWaterApp)

      expect(permitData.permitNumber).toBe(bulkWaterApp.applicationId)
      expect(permitData.applicantName).toBe("Chitungwiza Municipality")
      expect(permitData.totalAllocatedAbstraction).toBe(125.0)
      expect(permitData.numberOfBoreholes).toBe(8)
      expect(permitData.landSize).toBe(45.0)
      expect(permitData.validUntil).toBeDefined()

      // Bulk water should have longer validity period
      const validUntilDate = new Date(permitData.validUntil)
      const issueDate = new Date(permitData.issueDate)
      const yearsDifference = validUntilDate.getFullYear() - issueDate.getFullYear()
      expect(yearsDifference).toBe(15) // 15-year validity for bulk water
    })

    it("should correctly process surface water permit data", () => {
      const surfaceWaterApp = testApplications.find((app) => app.applicantName === "Mazowe Citrus Estates")!

      const permitData = preparePermitData(surfaceWaterApp)

      expect(permitData.permitNumber).toBe(surfaceWaterApp.applicationId)
      expect(permitData.applicantName).toBe("Mazowe Citrus Estates")
      expect(permitData.totalAllocatedAbstraction).toBe(85.0)
      expect(permitData.numberOfBoreholes).toBe(0) // Surface water, no boreholes
      expect(permitData.landSize).toBe(500.0)
      expect(permitData.intendedUse).toBe("Citrus irrigation and frost protection system")
    })
  })

  describe("Print Functionality with Real Data", () => {
    it("should successfully print domestic permit", async () => {
      const domesticApp = testApplications.find((app) => app.applicantName === "Sarah Johnson")!

      const onPrint = vi.fn()

      // Mock successful window.open
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }
      mockWindowOpen.mockReturnValue(mockPrintWindow)

      render(
        <PermitPreviewDialog
          application={domesticApp}
          currentUser={permittingOfficer}
          onPrint={onPrint}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(onPrint).toHaveBeenCalled()
      })

      // Verify print content includes permit data
      const printContent = mockPrintWindow.document.write.mock.calls[0][0]
      expect(printContent).toContain("Sarah Johnson")
      expect(printContent).toContain("45 Riverside Drive, Borrowdale, Harare")
      expect(printContent).toContain("1.2")
    })

    it("should successfully print agricultural permit with multiple boreholes", async () => {
      const agriculturalApp = testApplications.find(
        (app) => app.applicantName === "Zimbabwe Agricultural Development Trust",
      )!

      const onPrint = vi.fn()

      // Mock successful window.open
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }
      mockWindowOpen.mockReturnValue(mockPrintWindow)

      render(
        <PermitPreviewDialog
          application={agriculturalApp}
          currentUser={permittingOfficer}
          onPrint={onPrint}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank")
        expect(mockPrintWindow.document.write).toHaveBeenCalled()
        expect(onPrint).toHaveBeenCalled()
      })

      // Verify print content includes agricultural permit data
      const printContent = mockPrintWindow.document.write.mock.calls[0][0]
      expect(printContent).toContain("Zimbabwe Agricultural Development Trust")
      expect(printContent).toContain("Farm 247, Mazowe District")
      expect(printContent).toContain("45.8")
      expect(printContent).toContain("5") // Number of boreholes
    })

    it("should handle large permit data efficiently during print", async () => {
      const bulkWaterApp = testApplications.find((app) => app.applicantName === "Chitungwiza Municipality")!

      const onPrint = vi.fn()
      const startTime = performance.now()

      // Mock successful window.open
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      }
      mockWindowOpen.mockReturnValue(mockPrintWindow)

      render(
        <PermitPreviewDialog
          application={bulkWaterApp}
          currentUser={permittingOfficer}
          onPrint={onPrint}
          onDownload={vi.fn()}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const printButton = screen.getByRole("button", { name: /print/i })
      await user.click(printButton)

      await waitFor(() => {
        expect(onPrint).toHaveBeenCalled()
      })

      const endTime = performance.now()
      const printTime = endTime - startTime

      // Should handle large municipal permit data within 2 seconds
      expect(printTime).toBeLessThan(2000)
    })
  })

  describe("Download Functionality with Real Data", () => {
    it("should successfully download domestic permit as HTML", async () => {
      const domesticApp = testApplications.find((app) => app.applicantName === "Sarah Johnson")!

      const onDownload = vi.fn()

      // Mock successful blob creation
      mockCreateObjectURL.mockReturnValue("blob:mock-url")

      // Mock DOM manipulation
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      const mockCreateElement = vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
      const mockAppendChild = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
      const mockRemoveChild = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

      render(
        <PermitPreviewDialog
          application={domesticApp}
          currentUser={permittingOfficer}
          onPrint={vi.fn()}
          onDownload={onDownload}
        />,
      )

      const previewButton = screen.getByRole("button", { name: /preview permit/i })
      await user.click(previewButton)

      const downloadButton = screen.getByRole("button", { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(mockCreateElement).toHaveBeenCalledWith("a")
        expect(mockAnchor.download).toBe(`permit-${domesticApp.applicationId}.html`)
        expect(mockAnchor.click).toHaveBeenCalled()
        expect(onDownload).toHaveBeenCalled()
      })

      // Cleanup mocks
      mockCreateElement.mockRestore()
      mockAppendChild.mockRestore()
      mockRemoveChild.mockRestore()
    })

    it("should generate correct filename for different permit types", async () => {
      const testCases = [
        { app: testApplications.find((app) => app.applicantName === "Sarah Johnson")!, type: "domestic" },
        {
          app: testApplications.find((app) => app.applicantName === "Zimbabwe Agricultural Development Trust")!,
          type: "agricultural",
        },
        {
          app: testApplications.find((app) => app.applicantName === "Harare Industrial Manufacturing Ltd")!,
          type: "industrial",
        },
      ]

      for (const testCase of testCases) {
        const onDownload = vi.fn()
        mockCreateObjectURL.mockReturnValue("blob:mock-url")

        const mockAnchor = {
          href: "",
          download: "",
          click: vi.fn(),
        }
        const mockCreateElement = vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
        const mockAppendChild = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
        const mockRemoveChild = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

        render(
          <PermitPreviewDialog
            application={testCase.app}
            currentUser={permittingOfficer}
            onPrint={vi.fn()}
            onDownload={onDownload}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await user.click(previewButton)

        const downloadButton = screen.getByRole("button", { name: /download/i })
        await user.click(downloadButton)

        await waitFor(() => {
          expect(mockAnchor.download).toBe(`permit-${testCase.app.applicationId}.html`)
        })

        // Cleanup
        mockCreateElement.mockRestore()
        mockAppendChild.mockRestore()
        mockRemoveChild.mockRestore()
      }
    })
  })

  describe("Applications Table Integration", () => {
    it("should display all test applications in the table", async () => {
      render(<ApplicationsTable user={permittingOfficer} onView={vi.fn()} onEdit={vi.fn()} showBulkActions={false} />)

      await waitFor(() => {
        // Check that all test applications are displayed
        expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
        expect(screen.getByText("Zimbabwe Agricultural Development Trust")).toBeInTheDocument()
        expect(screen.getByText("Harare Industrial Manufacturing Ltd")).toBeInTheDocument()
        expect(screen.getByText("Chitungwiza Municipality")).toBeInTheDocument()
        expect(screen.getByText("University of Zimbabwe")).toBeInTheDocument()
        expect(screen.getByText("Mazowe Citrus Estates")).toBeInTheDocument()
      })

      // Check that all applications show approved status
      const approvedBadges = screen.getAllByText(/approved/i)
      expect(approvedBadges).toHaveLength(6)
    })

    it("should show preview buttons for all approved applications", async () => {
      const onView = vi.fn()

      render(<ApplicationsTable user={permittingOfficer} onView={onView} onEdit={vi.fn()} showBulkActions={false} />)

      await waitFor(() => {
        const viewButtons = screen.getAllByText("View")
        expect(viewButtons).toHaveLength(6) // All 6 test applications should have view buttons
      })
    })
  })

  describe("Performance with Real Data", () => {
    it("should handle multiple permit previews efficiently", async () => {
      const startTime = performance.now()

      // Test preview performance with different permit types
      for (const app of testApplications.slice(0, 3)) {
        // Test first 3 applications
        render(
          <PermitPreviewDialog
            application={app}
            currentUser={permittingOfficer}
            onPrint={vi.fn()}
            onDownload={vi.fn()}
          />,
        )

        const previewButton = screen.getByRole("button", { name: /preview permit/i })
        await user.click(previewButton)

        await waitFor(() => {
          expect(screen.getByText("Permit Preview")).toBeInTheDocument()
        })

        // Close dialog
        const closeButton = screen.getByRole("button", { name: /close/i }) || screen.getByLabelText(/close/i)
        if (closeButton) {
          await user.click(closeButton)
        }
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle multiple previews within 5 seconds
      expect(totalTime).toBeLessThan(5000)
    })

    it("should efficiently process large water allocations", async () => {
      const bulkWaterApp = testApplications.find((app) => app.applicantName === "Chitungwiza Municipality")! // 125 ML allocation

      const startTime = performance.now()

      const permitData = preparePermitData(bulkWaterApp)

      const endTime = performance.now()
      const processingTime = endTime - startTime

      // Should process large allocation data within 100ms
      expect(processingTime).toBeLessThan(100)
      expect(permitData.totalAllocatedAbstraction).toBe(125.0)
      expect(permitData.boreholeDetails).toHaveLength(8)
    })
  })

  describe("Data Integrity Validation", () => {
    it("should maintain data consistency across all test applications", () => {
      for (const app of testApplications) {
        expect(app.status).toBe("approved")
        expect(app.currentStage).toBe(4)
        expect(app.applicantName).toBeTruthy()
        expect(app.physicalAddress).toBeTruthy()
        expect(app.waterAllocation).toBeGreaterThan(0)
        expect(app.intendedUse).toBeTruthy()
        expect(app.workflowComments).toHaveLength(3) // All should have 3 workflow comments
        expect(app.documents.length).toBeGreaterThan(0) // All should have documents
      }
    })

    it("should have valid GPS coordinates for all applications", () => {
      for (const app of testApplications) {
        expect(app.gpsLatitude).toBeGreaterThan(-30) // Valid latitude for Zimbabwe
        expect(app.gpsLatitude).toBeLessThan(-15)
        expect(app.gpsLongitude).toBeGreaterThan(25) // Valid longitude for Zimbabwe
        expect(app.gpsLongitude).toBeLessThan(35)
      }
    })

    it("should have realistic water allocations for permit types", () => {
      const domesticApp = testApplications.find((app) => app.permitType === "urban")!
      const agriculturalApp = testApplications.find((app) => app.permitType === "irrigation")!
      const industrialApp = testApplications.find((app) => app.permitType === "industrial")!
      const bulkWaterApp = testApplications.find((app) => app.permitType === "bulk_water")!

      // Domestic should have smallest allocation
      expect(domesticApp.waterAllocation).toBeLessThan(5)

      // Agricultural should have moderate allocation
      expect(agriculturalApp.waterAllocation).toBeGreaterThan(10)
      expect(agriculturalApp.waterAllocation).toBeLessThan(100)

      // Industrial should have significant allocation
      expect(industrialApp.waterAllocation).toBeGreaterThan(10)
      expect(industrialApp.waterAllocation).toBeLessThan(50)

      // Bulk water should have largest allocation
      expect(bulkWaterApp.waterAllocation).toBeGreaterThan(100)
    })
  })
})
