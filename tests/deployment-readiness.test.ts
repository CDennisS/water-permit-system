import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EnhancedReportsAnalytics } from "@/components/enhanced-reports-analytics"
import { db } from "@/lib/database"
import type { User, PermitApplication } from "@/types"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
    getUserByCredentials: vi.fn(),
    createApplication: vi.fn(),
    getApplicationById: vi.fn(),
    addComment: vi.fn(),
    getCommentsByApplication: vi.fn(),
    addLog: vi.fn(),
    getLogs: vi.fn(),
    sendMessage: vi.fn(),
    getMessages: vi.fn(),
    updateComment: vi.fn(),
    deleteLog: vi.fn(),
    getUsers: vi.fn(),
  },
}))

// Mock recharts for testing
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}))

const mockApplications = [
  {
    id: "1",
    applicationId: "APP-2024-001",
    applicantName: "John Doe",
    physicalAddress: "123 Main St",
    customerAccountNumber: "ACC-001",
    cellularNumber: "+263771234567",
    permitType: "urban",
    waterSource: "ground_water",
    waterAllocation: 100,
    landSize: 50,
    gpsLatitude: -17.8,
    gpsLongitude: 31.0,
    status: "approved" as const,
    currentStage: 4,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    submittedAt: new Date("2024-01-15"),
    approvedAt: new Date("2024-01-20"),
    documents: [],
    comments: [],
    intendedUse: "Domestic use",
  },
  {
    id: "2",
    applicationId: "APP-2024-002",
    applicantName: "Jane Smith",
    physicalAddress: "456 Oak Ave",
    customerAccountNumber: "ACC-002",
    cellularNumber: "+263771234568",
    permitType: "irrigation",
    waterSource: "surface_water",
    waterAllocation: 200,
    landSize: 100,
    gpsLatitude: -17.9,
    gpsLongitude: 31.1,
    status: "submitted" as const,
    currentStage: 2,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    submittedAt: new Date("2024-02-01"),
    approvedAt: null,
    documents: [],
    comments: [],
    intendedUse: "Agricultural irrigation",
  },
  {
    id: "3",
    applicationId: "APP-2024-003",
    applicantName: "Bob Johnson",
    physicalAddress: "789 Pine St",
    customerAccountNumber: "ACC-003",
    cellularNumber: "+263771234569",
    permitType: "industrial",
    waterSource: "ground_water",
    waterAllocation: 500,
    landSize: 200,
    gpsLatitude: -17.7,
    gpsLongitude: 30.9,
    status: "rejected" as const,
    currentStage: 3,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
    submittedAt: new Date("2024-01-10"),
    approvedAt: null,
    documents: [],
    comments: [],
    intendedUse: "Manufacturing process",
  },
]

describe("Deployment Readiness Tests", () => {
  let testUser: User
  let testApplication: PermitApplication

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)

    // Setup test user
    testUser = {
      id: "test_user_deploy",
      username: "deploy.test",
      userType: "permitting_officer",
      password: "deploy123",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Setup test application
    testApplication = {
      id: "test_app_deploy",
      applicationId: "DEPLOY-TEST-001",
      applicantName: "Deployment Test User",
      physicalAddress: "123 Test Street, Harare",
      postalAddress: "P.O. Box 123, Harare",
      customerAccountNumber: "TEST001",
      cellularNumber: "+263771234567",
      emailAddress: "test@deploy.com",
      permitType: "water_abstraction",
      waterSource: "borehole",
      intendedUse: "Testing deployment",
      numberOfBoreholes: 1,
      landSize: 10,
      waterAllocation: 1000,
      gpsLatitude: -17.8252,
      gpsLongitude: 31.0335,
      status: "draft",
      currentStage: 0,
      workflowComments: [],
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  describe("Enhanced Reports Analytics - Core Functionality", () => {
    it("should load and display applications correctly", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should show correct statistics
      expect(screen.getByText("3 applications")).toBeInTheDocument()
      expect(screen.getByText("33%")).toBeInTheDocument() // 1 approved out of 3 = 33%
    })

    it("should handle search filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test search functionality
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "John")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })

      // Clear search
      await user.clear(searchInput)
      await waitFor(() => {
        expect(screen.getByText("3 applications")).toBeInTheDocument()
      })
    })

    it("should handle date filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test date filtering
      const startDateInput = screen.getByLabelText("Start Date")
      await user.type(startDateInput, "2024-01-20")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })
    })

    it("should handle permit type filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test permit type filtering
      const permitTypeSelect = screen.getByRole("combobox")
      await user.click(permitTypeSelect)

      const urbanOption = screen.getByText("Urban")
      await user.click(urbanOption)

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })
    })

    it("should handle joint filtering correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "APP-2024")

      const startDateInput = screen.getByLabelText("Start Date")
      await user.type(startDateInput, "2024-01-01")

      const endDateInput = screen.getByLabelText("End Date")
      await user.type(endDateInput, "2024-01-31")

      await waitFor(() => {
        // Should show applications that match all criteria
        expect(screen.getByText("2 applications")).toBeInTheDocument()
      })
    })

    it("should clear all filters correctly", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply some filters
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "John")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })

      // Clear all filters
      const clearButton = screen.getByText("Clear All")
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText("3 applications")).toBeInTheDocument()
        expect(searchInput).toHaveValue("")
      })
    })

    it("should export reports correctly", async () => {
      const user = userEvent.setup()

      // Mock URL.createObjectURL and related functions
      const mockCreateObjectURL = vi.fn(() => "mock-url")
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      // Mock document.createElement and appendChild
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      }
      const mockCreateElement = vi.fn(() => mockAnchor)
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()

      document.createElement = mockCreateElement
      document.body.appendChild = mockAppendChild
      document.body.removeChild = mockRemoveChild

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test export functionality
      const exportButton = screen.getByText("Export Report")
      await user.click(exportButton)

      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe("Database Operations", () => {
    it("should handle user authentication", async () => {
      const user = await db.getUserByCredentials("peter.chair", "chair123")
      expect(user).toBeTruthy()
      expect(user?.userType).toBe("chairperson")
    })

    it("should create and retrieve applications", async () => {
      const created = await db.createApplication({
        applicantName: testApplication.applicantName,
        physicalAddress: testApplication.physicalAddress,
        postalAddress: testApplication.postalAddress,
        customerAccountNumber: testApplication.customerAccountNumber,
        cellularNumber: testApplication.cellularNumber,
        emailAddress: testApplication.emailAddress,
        permitType: testApplication.permitType,
        waterSource: testApplication.waterSource,
        intendedUse: testApplication.intendedUse,
        numberOfBoreholes: testApplication.numberOfBoreholes,
        landSize: testApplication.landSize,
        waterAllocation: testApplication.waterAllocation,
        gpsLatitude: testApplication.gpsLatitude,
        gpsLongitude: testApplication.gpsLongitude,
        status: testApplication.status,
        currentStage: testApplication.currentStage,
        workflowComments: testApplication.workflowComments,
        documents: testApplication.documents || [],
      })

      expect(created).toBeTruthy()
      expect(created.applicantName).toBe(testApplication.applicantName)
      expect(created.applicationId).toMatch(/^MC\d{4}-\d{4}$/)

      const retrieved = await db.getApplicationById(created.id)
      expect(retrieved).toBeTruthy()
      expect(retrieved?.id).toBe(created.id)
    })

    it("should handle workflow comments", async () => {
      const comment = await db.addComment({
        applicationId: "app_submitted_001",
        userId: "test_user",
        userType: "chairperson",
        comment: "Deployment test comment",
        stage: 2,
        isRejectionReason: false,
      })

      expect(comment).toBeTruthy()
      expect(comment.comment).toBe("Deployment test comment")

      const comments = await db.getCommentsByApplication("app_submitted_001")
      expect(comments.length).toBeGreaterThan(0)
    })

    it("should handle activity logging", async () => {
      const log = await db.addLog({
        userId: "test_user",
        userType: "permitting_officer",
        action: "Deployment test",
        details: "Testing deployment logging functionality",
        applicationId: "app_submitted_001",
      })

      expect(log).toBeTruthy()
      expect(log.action).toBe("Deployment test")

      const logs = await db.getLogs({ userId: "test_user" })
      expect(logs.length).toBeGreaterThan(0)
    })

    it("should handle messaging system", async () => {
      const message = await db.sendMessage({
        senderId: "test_sender",
        receiverId: "test_receiver",
        content: "Deployment test message",
        isPublic: false,
        subject: "Test Message",
      })

      expect(message).toBeTruthy()
      expect(message.content).toBe("Deployment test message")

      const messages = await db.getMessages("test_receiver", false)
      expect(messages.length).toBeGreaterThan(0)
    })
  })

  describe("User Role Permissions", () => {
    it("should validate permitting officer permissions", async () => {
      const user = await db.getUserByCredentials("john.officer", "officer123")
      expect(user?.userType).toBe("permitting_officer")

      // Permitting officers should be able to create applications
      const applications = await db.getApplications()
      expect(applications.length).toBeGreaterThan(0)
    })

    it("should validate chairman permissions", async () => {
      const user = await db.getUserByCredentials("peter.chair", "chair123")
      expect(user?.userType).toBe("chairperson")

      // Chairman should see applications at stage 2
      const applications = await db.getApplications()
      const chairmanApps = applications.filter((app) => app.status === "submitted" && app.currentStage === 2)
      expect(chairmanApps.length).toBeGreaterThan(0)
    })

    it("should validate catchment manager permissions", async () => {
      const user = await db.getUserByCredentials("james.catchment", "catchment123")
      expect(user?.userType).toBe("catchment_manager")

      // Catchment manager should see applications at stage 3
      const applications = await db.getApplications()
      const managerApps = applications.filter((app) => app.currentStage === 3)
      expect(managerApps.length).toBeGreaterThan(0)
    })

    it("should validate ICT admin permissions", async () => {
      const user = await db.getUserByCredentials("umsccict2025", "umsccict2025")
      expect(user?.userType).toBe("ict")

      // ICT should be able to edit comments and logs
      const canEditComment = await db.updateComment("comment_001", { comment: "Updated" }, "ict")
      expect(canEditComment).toBeTruthy()
    })
  })

  describe("Application Workflow", () => {
    it("should handle complete application workflow", async () => {
      // Create application
      const app = await db.createApplication({
        applicantName: "Workflow Test",
        physicalAddress: "123 Workflow St",
        postalAddress: "P.O. Box 123",
        customerAccountNumber: "WF001",
        cellularNumber: "+263771234567",
        emailAddress: "workflow@test.com",
        permitType: "water_abstraction",
        waterSource: "borehole",
        intendedUse: "Testing workflow",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 1000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        documents: [],
      })

      // Submit application (Stage 0 -> 2)
      const submitted = await db.updateApplication(app.id, {
        status: "submitted",
        currentStage: 2,
        submittedAt: new Date(),
      })
      expect(submitted?.status).toBe("submitted")
      expect(submitted?.currentStage).toBe(2)

      // Chairman review (Stage 2 -> 3)
      const reviewed = await db.updateApplication(app.id, {
        status: "under_review",
        currentStage: 3,
      })
      expect(reviewed?.status).toBe("under_review")
      expect(reviewed?.currentStage).toBe(3)

      // Catchment manager review (Stage 3 -> 4)
      const technical = await db.updateApplication(app.id, {
        status: "technical_review",
        currentStage: 4,
      })
      expect(technical?.status).toBe("technical_review")
      expect(technical?.currentStage).toBe(4)

      // Final approval (Stage 4 -> 1 with approved status)
      const approved = await db.updateApplication(app.id, {
        status: "approved",
        currentStage: 1,
        approvedAt: new Date(),
      })
      expect(approved?.status).toBe("approved")
      expect(approved?.approvedAt).toBeTruthy()
    })

    it("should handle application rejection", async () => {
      const app = await db.createApplication({
        applicantName: "Rejection Test",
        physicalAddress: "123 Reject St",
        postalAddress: "P.O. Box 123",
        customerAccountNumber: "REJ001",
        cellularNumber: "+263771234567",
        emailAddress: "reject@test.com",
        permitType: "water_abstraction",
        waterSource: "borehole",
        intendedUse: "Testing rejection",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 1000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "submitted",
        currentStage: 2,
        workflowComments: [],
        documents: [],
      })

      // Add rejection comment
      await db.addComment({
        applicationId: app.id,
        userId: "test_chairman",
        userType: "chairperson",
        comment: "Application rejected due to insufficient documentation",
        stage: 2,
        isRejectionReason: true,
      })

      // Reject application
      const rejected = await db.updateApplication(app.id, {
        status: "rejected",
        currentStage: 1,
      })
      expect(rejected?.status).toBe("rejected")

      // Verify rejection comment exists
      const comments = await db.getCommentsByApplication(app.id)
      const rejectionComment = comments.find((c) => c.isRejectionReason)
      expect(rejectionComment).toBeTruthy()
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty data gracefully", async () => {
      vi.mocked(db.getApplications).mockResolvedValue([])

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      expect(screen.getByText("0 applications")).toBeInTheDocument()
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle network errors gracefully", async () => {
      vi.mocked(db.getApplications).mockRejectedValue(new Error("Network error"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Error Loading Analytics Data")).toBeInTheDocument()
      })

      expect(screen.getByText("Failed to load applications. Please try again.")).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should handle malformed data gracefully", async () => {
      const malformedData = [
        {
          id: "1",
          applicationId: null,
          applicantName: undefined,
          permitType: "",
          status: "approved" as const,
          createdAt: new Date(),
          waterAllocation: null,
          landSize: undefined,
        },
      ]

      vi.mocked(db.getApplications).mockResolvedValue(malformedData as any)

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should handle null/undefined values gracefully
      expect(screen.getByText("1 applications")).toBeInTheDocument()
    })
  })

  describe("Performance and Scalability", () => {
    it("should handle large datasets efficiently", async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        applicationId: `APP-2024-${String(i + 1).padStart(4, "0")}`,
        applicantName: `Applicant ${i + 1}`,
        physicalAddress: `Address ${i + 1}`,
        customerAccountNumber: `ACC-${i + 1}`,
        cellularNumber: `+263${Math.floor(Math.random() * 1000000000)}`,
        permitType: ["urban", "irrigation", "industrial"][i % 3],
        waterSource: ["ground_water", "surface_water"][i % 2],
        waterAllocation: Math.floor(Math.random() * 500) + 50,
        landSize: Math.floor(Math.random() * 200) + 10,
        gpsLatitude: -17.8 + Math.random() * 0.2,
        gpsLongitude: 31.0 + Math.random() * 0.2,
        status: ["approved", "submitted", "rejected"][i % 3] as const,
        currentStage: Math.floor(Math.random() * 4) + 1,
        createdAt: new Date(2024, 0, 1 + (i % 365)),
        updatedAt: new Date(2024, 0, 1 + (i % 365)),
        submittedAt: new Date(2024, 0, 1 + (i % 365)),
        approvedAt: i % 3 === 0 ? new Date(2024, 0, 1 + (i % 365)) : null,
        documents: [],
        comments: [],
        intendedUse: `Use case ${i + 1}`,
      }))

      vi.mocked(db.getApplications).mockResolvedValue(largeDataset as any)

      const startTime = performance.now()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000)
      expect(screen.getByText("1000 applications")).toBeInTheDocument()
    })

    it("should handle rapid filter changes efficiently", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")

      // Simulate rapid typing
      const startTime = performance.now()
      await user.type(searchInput, "test")
      await user.clear(searchInput)
      await user.type(searchInput, "john")
      await user.clear(searchInput)
      const endTime = performance.now()

      const operationTime = endTime - startTime

      // Should handle rapid changes efficiently
      expect(operationTime).toBeLessThan(1000)
      expect(screen.getByText("3 applications")).toBeInTheDocument()
    })
  })

  describe("Browser Compatibility", () => {
    it("should work without modern JavaScript features", async () => {
      // Mock older browser environment
      const originalURL = global.URL
      delete (global as any).URL

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Should still render basic functionality
      expect(screen.getByText("3 applications")).toBeInTheDocument()

      // Restore URL
      global.URL = originalURL
    })

    it("should handle touch events for mobile", async () => {
      // Mock touch events
      const mockTouchEvent = new Event("touchstart")

      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const permitTypeSelect = screen.getByRole("combobox")
      fireEvent(permitTypeSelect, mockTouchEvent)

      // Should not crash on touch events
      expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", async () => {
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Check for proper form labels
      expect(screen.getByLabelText("Search Applications")).toBeInTheDocument()
      expect(screen.getByLabelText("Start Date")).toBeInTheDocument()
      expect(screen.getByLabelText("End Date")).toBeInTheDocument()
      expect(screen.getByLabelText("Permit Type")).toBeInTheDocument()

      // Check for proper roles
      expect(screen.getByRole("combobox")).toBeInTheDocument()
      expect(screen.getAllByRole("button")).toHaveLength(3) // Clear All, Refresh, Export
    })

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Test keyboard navigation
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.tab()

      // Should be able to focus on form elements
      expect(document.activeElement).toBe(searchInput)
    })
  })

  describe("Data Integrity", () => {
    it("should maintain data consistency during filtering", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply filter
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      await user.type(searchInput, "John")

      await waitFor(() => {
        expect(screen.getByText("1 applications")).toBeInTheDocument()
      })

      // Check that statistics are consistent with filtered data
      expect(screen.getByText("100%")).toBeInTheDocument() // 1 approved out of 1 = 100%
    })

    it("should handle concurrent filter operations", async () => {
      const user = userEvent.setup()
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      // Apply multiple filters simultaneously
      const searchInput = screen.getByPlaceholderText("Search by name, ID, type...")
      const startDateInput = screen.getByLabelText("Start Date")

      await Promise.all([user.type(searchInput, "APP"), user.type(startDateInput, "2024-01-01")])

      await waitFor(() => {
        // Should handle concurrent operations without data corruption
        expect(screen.getByText(/applications/)).toBeInTheDocument()
      })
    })

    it("should maintain referential integrity", async () => {
      const applications = await db.getApplications()

      for (const app of applications) {
        // Check that all applications have required fields
        expect(app.id).toBeTruthy()
        expect(app.applicationId).toBeTruthy()
        expect(app.applicantName).toBeTruthy()
        expect(app.status).toBeTruthy()
        expect(app.currentStage).toBeGreaterThanOrEqual(0)
        expect(app.createdAt).toBeInstanceOf(Date)
        expect(app.updatedAt).toBeInstanceOf(Date)

        // Check GPS coordinates are valid
        expect(app.gpsLatitude).toBeGreaterThan(-90)
        expect(app.gpsLatitude).toBeLessThan(90)
        expect(app.gpsLongitude).toBeGreaterThan(-180)
        expect(app.gpsLongitude).toBeLessThan(180)

        // Check water allocation is positive
        expect(app.waterAllocation).toBeGreaterThan(0)
        expect(app.landSize).toBeGreaterThan(0)
        expect(app.numberOfBoreholes).toBeGreaterThanOrEqual(0)
      }
    })

    it("should validate application ID format", async () => {
      const applications = await db.getApplications()

      for (const app of applications) {
        if (app.applicationId.startsWith("MC")) {
          // Production format: MC2024-0001
          expect(app.applicationId).toMatch(/^MC\d{4}-\d{4}$/)
        } else {
          // Draft format: DRAFT-001
          expect(app.applicationId).toMatch(/^DRAFT-\d{3}$/)
        }
      }
    })

    it("should validate user data integrity", async () => {
      const users = await db.getUsers()

      for (const user of users) {
        expect(user.id).toBeTruthy()
        expect(user.username).toBeTruthy()
        expect(user.userType).toBeTruthy()
        expect([
          "applicant",
          "permitting_officer",
          "chairperson",
          "catchment_manager",
          "catchment_chairperson",
          "permit_supervisor",
          "ict",
        ]).toContain(user.userType)
        expect(user.createdAt).toBeInstanceOf(Date)
        expect(user.updatedAt).toBeInstanceOf(Date)
      }
    })
  })

  describe("Performance Tests", () => {
    it("should handle multiple concurrent operations", async () => {
      const startTime = Date.now()

      // Simulate concurrent operations
      const operations = [
        db.getApplications(),
        db.getUsers(),
        db.getLogs(),
        db.getMessages("test_user", true),
        db.getMessages("test_user", false),
      ]

      const results = await Promise.all(operations)
      const endTime = Date.now()

      // All operations should complete
      expect(results.length).toBe(5)
      results.forEach((result) => expect(result).toBeTruthy())

      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it("should handle large data sets efficiently", async () => {
      const startTime = Date.now()

      // Get all applications and process them
      const applications = await db.getApplications()
      const processedApps = applications.map((app) => ({
        id: app.id,
        status: app.status,
        stage: app.currentStage,
        applicant: app.applicantName,
      }))

      const endTime = Date.now()

      expect(processedApps.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe("Error Handling", () => {
    it("should handle invalid user credentials gracefully", async () => {
      const user = await db.getUserByCredentials("invalid_user", "wrong_password")
      expect(user).toBeNull()
    })

    it("should handle non-existent application queries", async () => {
      const app = await db.getApplicationById("non_existent_id")
      expect(app).toBeNull()
    })

    it("should handle invalid update operations", async () => {
      const result = await db.updateApplication("non_existent_id", { status: "approved" })
      expect(result).toBeNull()
    })

    it("should handle unauthorized operations", async () => {
      // Non-ICT user trying to edit comments
      const result = await db.updateComment("comment_001", { comment: "Unauthorized edit" }, "permitting_officer")
      expect(result).toBeNull()

      // Non-ICT user trying to delete logs
      const deleteResult = await db.deleteLog("log_001", "chairperson")
      expect(deleteResult).toBe(false)
    })
  })

  describe("Security Tests", () => {
    it("should protect sensitive operations", async () => {
      // Only ICT should be able to edit system data
      const users = await db.getUsers()
      const ictUsers = users.filter((u) => u.userType === "ict")
      expect(ictUsers.length).toBeGreaterThan(0)

      // Verify ICT users exist and have proper credentials
      for (const ictUser of ictUsers) {
        expect(ictUser.username).toBeTruthy()
        expect(ictUser.password).toBeTruthy()
      }
    })

    it("should validate user permissions by role", async () => {
      const testCases = [
        { userType: "permitting_officer", canCreateApps: true, canEditComments: false },
        { userType: "chairperson", canCreateApps: false, canEditComments: false },
        { userType: "catchment_manager", canCreateApps: false, canEditComments: false },
        { userType: "ict", canCreateApps: true, canEditComments: true },
      ]

      for (const testCase of testCases) {
        if (testCase.canEditComments) {
          const result = await db.updateComment("test_comment", { comment: "Test" }, testCase.userType)
          expect(result).toBeTruthy()
        } else {
          const result = await db.updateComment("test_comment", { comment: "Test" }, testCase.userType)
          expect(result).toBeNull()
        }
      }
    })
  })
})
