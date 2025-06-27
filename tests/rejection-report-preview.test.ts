import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CommentsPrinter } from "@/components/comments-printer"
import { db } from "@/lib/database"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
    getComments: vi.fn(),
    updateApplication: vi.fn(),
  },
}))

// Mock window.print
const mockPrint = vi.fn()
Object.defineProperty(window, "print", {
  value: mockPrint,
  writable: true,
})

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "mock-blob-url")
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

const mockRejectedApplication = {
  id: "1",
  applicationId: "APP-2024-001",
  applicantName: "John Doe",
  physicalAddress: "123 Main Street, Harare",
  customerAccountNumber: "ACC-001",
  cellularNumber: "+263771234567",
  permitType: "urban" as const,
  waterSource: "ground_water" as const,
  waterAllocation: 100,
  landSize: 50,
  gpsLatitude: -17.8292,
  gpsLongitude: 31.0522,
  status: "rejected" as const,
  currentStage: 3,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-25"),
  submittedAt: new Date("2024-01-15"),
  approvedAt: null,
  documents: [],
  comments: [
    {
      id: "1",
      applicationId: "1",
      userId: "reviewer1",
      userName: "Technical Reviewer",
      userType: "technical_reviewer" as const,
      comment:
        "Water allocation exceeds sustainable limits for this area. Recommend reducing to 75 cubic meters per month.",
      stage: 2,
      createdAt: new Date("2024-01-20"),
      isInternal: false,
    },
    {
      id: "2",
      applicationId: "1",
      userId: "manager1",
      userName: "Catchment Manager",
      userType: "catchment_manager" as const,
      comment: "Environmental impact assessment required. Current proposal does not meet conservation standards.",
      stage: 3,
      createdAt: new Date("2024-01-22"),
      isInternal: false,
    },
    {
      id: "3",
      applicationId: "1",
      userId: "officer1",
      userName: "Permitting Officer",
      userType: "permitting_officer" as const,
      comment:
        "Application rejected due to technical and environmental concerns. Please address all reviewer comments and resubmit.",
      stage: 3,
      createdAt: new Date("2024-01-25"),
      isInternal: false,
    },
  ],
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

describe("Rejection Report Preview Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue([mockRejectedApplication])
    vi.mocked(db.getComments).mockResolvedValue(mockRejectedApplication.comments)
  })

  describe("Rejection Report Content Generation", () => {
    it("should generate comprehensive rejection report with all required sections", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText("Print Rejection Report")).toBeInTheDocument()
      })

      // Click print button to generate preview
      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for report header
        expect(screen.getByText("WATER PERMIT APPLICATION REJECTION REPORT")).toBeInTheDocument()

        // Check for application details section
        expect(screen.getByText("APPLICATION DETAILS")).toBeInTheDocument()
        expect(screen.getByText("Application ID:")).toBeInTheDocument()
        expect(screen.getByText("APP-2024-001")).toBeInTheDocument()
        expect(screen.getByText("Applicant Name:")).toBeInTheDocument()
        expect(screen.getByText("John Doe")).toBeInTheDocument()

        // Check for rejection details
        expect(screen.getByText("REJECTION DETAILS")).toBeInTheDocument()
        expect(screen.getByText("Status:")).toBeInTheDocument()
        expect(screen.getByText("REJECTED")).toBeInTheDocument()
        expect(screen.getByText("Rejection Date:")).toBeInTheDocument()

        // Check for reviewer comments section
        expect(screen.getByText("REVIEWER COMMENTS")).toBeInTheDocument()
        expect(screen.getByText("Technical Reviewer")).toBeInTheDocument()
        expect(screen.getByText("Water allocation exceeds sustainable limits")).toBeInTheDocument()
        expect(screen.getByText("Catchment Manager")).toBeInTheDocument()
        expect(screen.getByText("Environmental impact assessment required")).toBeInTheDocument()

        // Check for recommendations section
        expect(screen.getByText("RECOMMENDATIONS FOR RESUBMISSION")).toBeInTheDocument()
      })
    })

    it("should include proper formatting and styling for print", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for print-specific styling
        const printContent = document.querySelector(".print-content")
        expect(printContent).toBeInTheDocument()

        // Verify CSS classes for print formatting
        expect(printContent).toHaveClass("bg-white", "p-8", "max-w-4xl", "mx-auto")

        // Check for proper section spacing
        const sections = document.querySelectorAll(".mb-6")
        expect(sections.length).toBeGreaterThan(0)

        // Verify header styling
        const mainHeader = screen.getByText("WATER PERMIT APPLICATION REJECTION REPORT")
        expect(mainHeader).toHaveClass("text-2xl", "font-bold", "text-center", "mb-6")
      })
    })

    it("should generate downloadable HTML report", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const downloadButton = screen.getByText("Download Report")
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled()

        // Verify blob creation with HTML content
        const blobCall = mockCreateObjectURL.mock.calls[0][0]
        expect(blobCall).toBeInstanceOf(Blob)
        expect(blobCall.type).toBe("text/html")
      })

      // Verify cleanup
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("mock-blob-url")
    })

    it("should handle applications with no comments gracefully", async () => {
      const applicationWithoutComments = {
        ...mockRejectedApplication,
        comments: [],
      }

      render(<CommentsPrinter application={applicationWithoutComments} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(screen.getByText("WATER PERMIT APPLICATION REJECTION REPORT")).toBeInTheDocument()
        expect(screen.getByText("No reviewer comments available")).toBeInTheDocument()
      })
    })

    it("should include proper timestamps and formatting", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for formatted dates
        expect(screen.getByText(/January 25, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/January 20, 2024/)).toBeInTheDocument()
        expect(screen.getByText(/January 22, 2024/)).toBeInTheDocument()

        // Check for proper time formatting
        const timeElements = document.querySelectorAll(".text-sm.text-gray-600")
        expect(timeElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Report Preview Functionality", () => {
    it("should show preview before printing", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const previewButton = screen.getByText("Preview Report")
      await userEvent.click(previewButton)

      await waitFor(() => {
        // Check for preview modal/dialog
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByText("Report Preview")).toBeInTheDocument()

        // Verify preview content
        expect(screen.getByText("WATER PERMIT APPLICATION REJECTION REPORT")).toBeInTheDocument()
        expect(screen.getByText("APP-2024-001")).toBeInTheDocument()

        // Check for preview controls
        expect(screen.getByText("Print")).toBeInTheDocument()
        expect(screen.getByText("Download")).toBeInTheDocument()
        expect(screen.getByText("Close")).toBeInTheDocument()
      })
    })

    it("should allow editing report content in preview", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const previewButton = screen.getByText("Preview Report")
      await userEvent.click(previewButton)

      await waitFor(() => {
        const editButton = screen.getByText("Edit Report")
        expect(editButton).toBeInTheDocument()
      })

      const editButton = screen.getByText("Edit Report")
      await userEvent.click(editButton)

      await waitFor(() => {
        // Check for editable fields
        const additionalCommentsTextarea = screen.getByLabelText("Additional Comments")
        expect(additionalCommentsTextarea).toBeInTheDocument()

        const recommendationsTextarea = screen.getByLabelText("Recommendations")
        expect(recommendationsTextarea).toBeInTheDocument()
      })
    })

    it("should validate report content before generation", async () => {
      const incompleteApplication = {
        ...mockRejectedApplication,
        applicantName: "",
        applicationId: "",
      }

      render(<CommentsPrinter application={incompleteApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(screen.getByText("Error: Missing required application information")).toBeInTheDocument()
      })
    })
  })

  describe("User Permission Validation", () => {
    it("should only allow authorized users to generate rejection reports", async () => {
      const unauthorizedUser = {
        ...mockUser,
        userType: "applicant" as const,
      }

      render(<CommentsPrinter application={mockRejectedApplication} user={unauthorizedUser} />)

      await waitFor(() => {
        expect(screen.queryByText("Print Rejection Report")).not.toBeInTheDocument()
        expect(screen.getByText("You do not have permission to generate rejection reports")).toBeInTheDocument()
      })
    })

    it("should allow permitting officers to generate reports", async () => {
      const permittingOfficer = {
        ...mockUser,
        userType: "permitting_officer" as const,
      }

      render(<CommentsPrinter application={mockRejectedApplication} user={permittingOfficer} />)

      await waitFor(() => {
        expect(screen.getByText("Print Rejection Report")).toBeInTheDocument()
      })
    })

    it("should allow catchment managers to generate reports", async () => {
      const catchmentManager = {
        ...mockUser,
        userType: "catchment_manager" as const,
      }

      render(<CommentsPrinter application={mockRejectedApplication} user={catchmentManager} />)

      await waitFor(() => {
        expect(screen.getByText("Print Rejection Report")).toBeInTheDocument()
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle print failures gracefully", async () => {
      mockPrint.mockImplementation(() => {
        throw new Error("Print failed")
      })

      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(screen.getByText("Print failed. Please try again.")).toBeInTheDocument()
      })
    })

    it("should handle download failures gracefully", async () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error("Blob creation failed")
      })

      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const downloadButton = screen.getByText("Download Report")
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText("Download failed. Please try again.")).toBeInTheDocument()
      })
    })

    it("should handle network errors when loading comments", async () => {
      vi.mocked(db.getComments).mockRejectedValue(new Error("Network error"))

      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      await waitFor(() => {
        expect(screen.getByText("Error loading comments. Please refresh and try again.")).toBeInTheDocument()
      })
    })
  })

  describe("Performance and Optimization", () => {
    it("should generate reports efficiently for large comment sets", async () => {
      const largeCommentSet = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        applicationId: "1",
        userId: `user${i}`,
        userName: `Reviewer ${i}`,
        userType: "technical_reviewer" as const,
        comment: `This is comment number ${i + 1} with detailed feedback about the application.`,
        stage: 2,
        createdAt: new Date(`2024-01-${(i % 30) + 1}`),
        isInternal: false,
      }))

      const applicationWithManyComments = {
        ...mockRejectedApplication,
        comments: largeCommentSet,
      }

      const startTime = performance.now()
      render(<CommentsPrinter application={applicationWithManyComments} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        expect(screen.getByText("WATER PERMIT APPLICATION REJECTION REPORT")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000)
    })

    it("should handle concurrent report generation requests", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      const downloadButton = screen.getByText("Download Report")

      // Trigger multiple operations simultaneously
      await Promise.all([userEvent.click(printButton), userEvent.click(downloadButton)])

      await waitFor(() => {
        // Should handle both operations without conflicts
        expect(screen.getByText("WATER PERMIT APPLICATION REJECTION REPORT")).toBeInTheDocument()
      })
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      // Check for proper button labels
      expect(screen.getByLabelText("Print rejection report")).toBeInTheDocument()
      expect(screen.getByLabelText("Download rejection report")).toBeInTheDocument()
      expect(screen.getByLabelText("Preview rejection report")).toBeInTheDocument()

      // Check for proper roles
      expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument()
    })

    it("should be keyboard navigable", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")

      // Focus should be manageable via keyboard
      printButton.focus()
      expect(document.activeElement).toBe(printButton)

      // Should respond to Enter key
      fireEvent.keyDown(printButton, { key: "Enter", code: "Enter" })

      await waitFor(() => {
        expect(screen.getByText("WATER PERMIT APPLICATION REJECTION REPORT")).toBeInTheDocument()
      })
    })

    it("should provide screen reader friendly content", async () => {
      render(<CommentsPrinter application={mockRejectedApplication} user={mockUser} />)

      const printButton = screen.getByText("Print Rejection Report")
      await userEvent.click(printButton)

      await waitFor(() => {
        // Check for proper heading structure
        const mainHeading = screen.getByRole("heading", { level: 1 })
        expect(mainHeading).toHaveTextContent("WATER PERMIT APPLICATION REJECTION REPORT")

        const subHeadings = screen.getAllByRole("heading", { level: 2 })
        expect(subHeadings.length).toBeGreaterThan(0)

        // Check for proper list structure for comments
        const commentsList = screen.getByRole("list")
        expect(commentsList).toBeInTheDocument()
      })
    })
  })
})
