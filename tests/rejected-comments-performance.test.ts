import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CommentsPrinter } from "@/components/comments-printer"
import { db } from "@/lib/database"
import type { PermitApplication, User, WorkflowComment } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getCommentsByApplication: vi.fn(),
  },
}))

describe("Rejected Comments Printing Performance Tests", () => {
  let rejectedApplication: PermitApplication
  let permittingOfficer: User

  beforeEach(() => {
    vi.clearAllMocks()

    rejectedApplication = {
      id: "perf-rejected-1",
      applicationId: "PERF-REJ-2024-001",
      applicantName: "Performance Test Applicant",
      physicalAddress: "123 Performance Street, Test City",
      postalAddress: "P.O. Box 999, Test City",
      customerAccountNumber: "PERF-12345",
      cellularNumber: "+263771234567",
      numberOfBoreholes: 5,
      landSize: 15.0,
      waterAllocation: 3000,
      intendedUse: "Large Scale Agricultural",
      permitType: "bulk_water",
      waterSource: "river",
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "rejected",
      currentStage: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      rejectedAt: new Date(),
      documents: [],
      workflowComments: [],
    }

    permittingOfficer = {
      id: "perf-po-1",
      username: "perf_officer",
      userType: "permitting_officer",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  it("should handle large number of comments efficiently", async () => {
    // Generate 100 comments with various rejection reasons
    const largeCommentSet: WorkflowComment[] = []

    for (let i = 1; i <= 100; i++) {
      largeCommentSet.push({
        id: `perf-comment-${i}`,
        applicationId: "perf-rejected-1",
        userId: `user-${(i % 4) + 1}`,
        userType: ["permitting_officer", "chairperson", "catchment_manager", "catchment_chairperson"][i % 4] as any,
        comment: `Performance test comment ${i}. This is a detailed comment that simulates real-world comment length and complexity. It includes technical details, policy considerations, and specific recommendations for the application review process.`,
        stage: (i % 4) + 1,
        isRejectionReason: i % 10 === 0, // Every 10th comment is a rejection reason
        createdAt: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000), // Spread over 100 days
      })
    }

    vi.mocked(db.getCommentsByApplication).mockResolvedValue(largeCommentSet)

    const startTime = performance.now()

    render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

    const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
    fireEvent.click(previewButton)

    await waitFor(
      () => {
        expect(screen.getByText("Comments and Review History")).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should render within 2 seconds even with 100 comments
    expect(renderTime).toBeLessThan(2000)

    // Verify all rejection reasons are highlighted
    const rejectionBadges = screen.getAllByText("REJECTION REASON")
    expect(rejectionBadges).toHaveLength(10) // Every 10th comment
  })

  it("should generate large print content efficiently", async () => {
    // Generate 50 detailed comments
    const mediumCommentSet: WorkflowComment[] = Array.from({ length: 50 }, (_, i) => ({
      id: `med-comment-${i + 1}`,
      applicationId: "perf-rejected-1",
      userId: `user-${(i % 4) + 1}`,
      userType: ["permitting_officer", "chairperson", "catchment_manager", "catchment_chairperson"][i % 4] as any,
      comment: `Detailed comment ${i + 1}: ${Array(100).fill("This is a very long comment with extensive technical details and comprehensive review notes. ").join("")}`,
      stage: (i % 4) + 1,
      isRejectionReason: i === 49, // Last comment is rejection
      createdAt: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000),
    }))

    vi.mocked(db.getCommentsByApplication).mockResolvedValue(mediumCommentSet)

    const mockPrintWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
    }
    vi.spyOn(window, "open").mockReturnValue(mockPrintWindow)

    render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

    const startTime = performance.now()

    const printButton = screen.getByRole("button", { name: /Print Comments/ })
    fireEvent.click(printButton)

    await waitFor(() => {
      expect(mockPrintWindow.document.write).toHaveBeenCalled()
    })

    const endTime = performance.now()
    const printTime = endTime - startTime

    // Should generate print content within 1 second
    expect(printTime).toBeLessThan(1000)

    // Verify print content includes all comments
    const printContent = mockPrintWindow.document.write.mock.calls[0][0]
    expect(printContent).toContain("Detailed comment 1:")
    expect(printContent).toContain("Detailed comment 50:")
    expect(printContent).toContain("REJECTION REASON")
  })

  it("should handle memory efficiently with repeated operations", async () => {
    const comments: WorkflowComment[] = Array.from({ length: 20 }, (_, i) => ({
      id: `mem-comment-${i + 1}`,
      applicationId: "perf-rejected-1",
      userId: "user-1",
      userType: "permitting_officer",
      comment: `Memory test comment ${i + 1}`,
      stage: 1,
      isRejectionReason: i === 19,
      createdAt: new Date(),
    }))

    vi.mocked(db.getCommentsByApplication).mockResolvedValue(comments)

    // Measure initial memory usage
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

    // Render and unmount multiple times
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

      const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Comments and Review History")).toBeInTheDocument()
      })

      unmount()
    }

    // Measure final memory usage
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory

    // Memory increase should be minimal (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
  })

  it("should handle concurrent print operations", async () => {
    const comments: WorkflowComment[] = [
      {
        id: "concurrent-comment-1",
        applicationId: "perf-rejected-1",
        userId: "user-1",
        userType: "catchment_chairperson",
        comment: "Concurrent test rejection reason",
        stage: 4,
        isRejectionReason: true,
        createdAt: new Date(),
      },
    ]

    vi.mocked(db.getCommentsByApplication).mockResolvedValue(comments)

    const mockPrintWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      print: vi.fn(),
    }
    vi.spyOn(window, "open").mockReturnValue(mockPrintWindow)

    render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

    // Simulate multiple rapid print requests
    const printPromises = []
    for (let i = 0; i < 5; i++) {
      const printButton = screen.getByRole("button", { name: /Print Comments/ })
      printPromises.push(
        new Promise<void>((resolve) => {
          fireEvent.click(printButton)
          setTimeout(resolve, 100)
        }),
      )
    }

    await Promise.all(printPromises)

    // Should handle all print requests without errors
    expect(mockPrintWindow.document.write).toHaveBeenCalledTimes(5)
    expect(mockPrintWindow.print).toHaveBeenCalledTimes(5)
  })

  it("should optimize download generation for large content", async () => {
    // Generate very large comment content
    const largeComment = Array(1000)
      .fill(
        "This is a very detailed technical assessment with extensive documentation and comprehensive review notes that spans multiple paragraphs and includes detailed technical specifications. ",
      )
      .join("")

    const largeComments: WorkflowComment[] = [
      {
        id: "large-content-comment",
        applicationId: "perf-rejected-1",
        userId: "user-1",
        userType: "catchment_chairperson",
        comment: largeComment,
        stage: 4,
        isRejectionReason: true,
        createdAt: new Date(),
      },
    ]

    vi.mocked(db.getCommentsByApplication).mockResolvedValue(largeComments)

    // Mock blob creation
    const mockBlob = new Blob()
    const mockUrl = "blob:mock-url"
    vi.spyOn(window, "Blob").mockImplementation(() => mockBlob)
    vi.spyOn(URL, "createObjectURL").mockReturnValue(mockUrl)

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    }
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as any)
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as any)

    render(<CommentsPrinter application={rejectedApplication} user={permittingOfficer} />)

    const previewButton = screen.getByRole("button", { name: /Preview Comments/ })
    fireEvent.click(previewButton)

    await waitFor(() => {
      const downloadButton = screen.getByRole("button", { name: /Download/ })

      const startTime = performance.now()
      fireEvent.click(downloadButton)
      const endTime = performance.now()

      const downloadTime = endTime - startTime

      // Should generate download within 500ms even with large content
      expect(downloadTime).toBeLessThan(500)
    })

    expect(window.Blob).toHaveBeenCalled()
    expect(mockAnchor.click).toHaveBeenCalled()
  })
})
