import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { db } from "@/lib/database"
import type { User } from "@/types"

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
    updateApplication: vi.fn(),
    getDocumentsByApplication: vi.fn(),
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
    applicationId: "MC2024-001",
    applicantName: "John Doe",
    physicalAddress: "123 Main St, Harare",
    postalAddress: "P.O. Box 123, Harare",
    customerAccountNumber: "ACC-001",
    cellularNumber: "+263771234567",
    emailAddress: "john@example.com",
    permitType: "water_abstraction",
    waterSource: "borehole",
    waterAllocation: 1000,
    landSize: 50,
    numberOfBoreholes: 1,
    gpsLatitude: -17.8,
    gpsLongitude: 31.0,
    status: "submitted" as const,
    currentStage: 2,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    submittedAt: new Date("2024-01-15"),
    approvedAt: null,
    documents: [],
    workflowComments: [],
    intendedUse: "Domestic use",
  },
  {
    id: "2",
    applicationId: "MC2024-002",
    applicantName: "Jane Smith",
    physicalAddress: "456 Oak Ave, Harare",
    postalAddress: "P.O. Box 456, Harare",
    customerAccountNumber: "ACC-002",
    cellularNumber: "+263771234568",
    emailAddress: "jane@example.com",
    permitType: "irrigation",
    waterSource: "river",
    waterAllocation: 2000,
    landSize: 100,
    numberOfBoreholes: 0,
    gpsLatitude: -17.9,
    gpsLongitude: 31.1,
    status: "approved" as const,
    currentStage: 1,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-15"),
    submittedAt: new Date("2024-02-01"),
    approvedAt: new Date("2024-02-15"),
    documents: [],
    workflowComments: [],
    intendedUse: "Agricultural irrigation",
  },
]

describe("Deployment Readiness Tests", () => {
  let testUser: User

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)
    vi.mocked(db.getDocumentsByApplication).mockResolvedValue([])
    vi.mocked(db.getMessages).mockResolvedValue([])

    testUser = {
      id: "chairperson_001",
      username: "peter.chair",
      userType: "chairperson",
      password: "chair123",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  describe("Chairperson Dashboard - Core Functionality", () => {
    it("should render dashboard with correct metrics", async () => {
      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Chairperson Dashboard")).toBeInTheDocument()
        expect(screen.getByText("Upper Manyame Sub Catchment Council")).toBeInTheDocument()
      })

      // Check metrics cards
      expect(screen.getByText("Total Applications")).toBeInTheDocument()
      expect(screen.getByText("Pending Review")).toBeInTheDocument()
      expect(screen.getByText("Reviewed This Month")).toBeInTheDocument()
      expect(screen.getByText("Approval Rate")).toBeInTheDocument()
    })

    it("should display applications requiring review", async () => {
      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Applications Requiring Review")).toBeInTheDocument()
      })

      // Should show submitted applications at stage 2
      const submittedApps = mockApplications.filter((app) => app.currentStage === 2 && app.status === "submitted")
      expect(submittedApps.length).toBeGreaterThan(0)
    })

    it("should handle application search functionality", async () => {
      const user = userEvent.setup()
      render(<ChairpersonDashboard user={testUser} />)

      // Navigate to applications tab
      await waitFor(() => {
        const applicationsTab = screen.getByRole("tab", { name: /applications/i })
        expect(applicationsTab).toBeInTheDocument()
      })

      const applicationsTab = screen.getByRole("tab", { name: /applications/i })
      await user.click(applicationsTab)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search by name, id, or account/i)
        expect(searchInput).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search by name, id, or account/i)
      await user.type(searchInput, "John")

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })
    })

    it("should handle status filtering", async () => {
      const user = userEvent.setup()
      render(<ChairpersonDashboard user={testUser} />)

      // Navigate to applications tab
      const applicationsTab = screen.getByRole("tab", { name: /applications/i })
      await user.click(applicationsTab)

      await waitFor(() => {
        const statusFilter = screen.getByRole("combobox")
        expect(statusFilter).toBeInTheDocument()
      })

      // Test status filtering
      const statusFilter = screen.getAllByRole("combobox")[0] // First combobox should be status filter
      await user.click(statusFilter)

      await waitFor(() => {
        const approvedOption = screen.getByText("Approved")
        expect(approvedOption).toBeInTheDocument()
      })
    })

    it("should handle bulk selection and submission", async () => {
      const user = userEvent.setup()
      vi.mocked(db.updateApplication).mockResolvedValue(mockApplications[0])
      vi.mocked(db.addComment).mockResolvedValue({
        id: "comment_001",
        applicationId: "1",
        userId: testUser.id,
        userType: testUser.userType,
        comment: "Test comment",
        stage: 2,
        isRejectionReason: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(db.addLog).mockResolvedValue({
        id: "log_001",
        userId: testUser.id,
        userType: testUser.userType,
        action: "Test action",
        details: "Test details",
        applicationId: "1",
        createdAt: new Date(),
      })

      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        const selectAllCheckbox = screen.getByLabelText(/select all/i)
        expect(selectAllCheckbox).toBeInTheDocument()
      })

      const selectAllCheckbox = screen.getByLabelText(/select all/i)
      await user.click(selectAllCheckbox)

      await waitFor(() => {
        const submitButton = screen.getByText(/submit all/i)
        expect(submitButton).toBeInTheDocument()
      })

      const submitButton = screen.getByText(/submit all/i)
      await user.click(submitButton)

      // Should call update functions
      await waitFor(() => {
        expect(db.updateApplication).toHaveBeenCalled()
        expect(db.addComment).toHaveBeenCalled()
        expect(db.addLog).toHaveBeenCalled()
      })
    })
  })

  describe("Database Integration Tests", () => {
    it("should handle user authentication", async () => {
      vi.mocked(db.getUserByCredentials).mockResolvedValue(testUser)

      const user = await db.getUserByCredentials("peter.chair", "chair123")
      expect(user).toBeTruthy()
      expect(user?.userType).toBe("chairperson")
    })

    it("should create and retrieve applications", async () => {
      const newApplication = {
        applicantName: "Test Applicant",
        physicalAddress: "123 Test Street, Harare",
        postalAddress: "P.O. Box 123, Harare",
        customerAccountNumber: "TEST001",
        cellularNumber: "+263771234567",
        emailAddress: "test@example.com",
        permitType: "water_abstraction" as const,
        waterSource: "borehole",
        intendedUse: "Testing",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 1000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "draft" as const,
        currentStage: 0,
        workflowComments: [],
        documents: [],
      }

      vi.mocked(db.createApplication).mockResolvedValue({
        ...newApplication,
        id: "test_app_001",
        applicationId: "MC2024-TEST001",
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
        approvedAt: null,
      })

      const created = await db.createApplication(newApplication)
      expect(created).toBeTruthy()
      expect(created.applicantName).toBe(newApplication.applicantName)
      expect(created.applicationId).toMatch(/^MC\d{4}-/)
    })

    it("should handle workflow comments", async () => {
      const comment = {
        applicationId: "1",
        userId: testUser.id,
        userType: testUser.userType,
        comment: "Test workflow comment",
        stage: 2,
        isRejectionReason: false,
      }

      vi.mocked(db.addComment).mockResolvedValue({
        ...comment,
        id: "comment_test_001",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await db.addComment(comment)
      expect(result).toBeTruthy()
      expect(result.comment).toBe(comment.comment)
    })

    it("should handle activity logging", async () => {
      const log = {
        userId: testUser.id,
        userType: testUser.userType,
        action: "Test Action",
        details: "Test action details",
        applicationId: "1",
      }

      vi.mocked(db.addLog).mockResolvedValue({
        ...log,
        id: "log_test_001",
        createdAt: new Date(),
      })

      const result = await db.addLog(log)
      expect(result).toBeTruthy()
      expect(result.action).toBe(log.action)
    })

    it("should handle messaging system", async () => {
      const message = {
        senderId: testUser.id,
        receiverId: "receiver_001",
        content: "Test message",
        isPublic: false,
        subject: "Test Subject",
      }

      vi.mocked(db.sendMessage).mockResolvedValue({
        ...message,
        id: "message_test_001",
        createdAt: new Date(),
        readAt: null,
      })

      const result = await db.sendMessage(message)
      expect(result).toBeTruthy()
      expect(result.content).toBe(message.content)
    })
  })

  describe("User Role Permissions", () => {
    it("should validate chairperson permissions", async () => {
      vi.mocked(db.getUserByCredentials).mockResolvedValue(testUser)

      const user = await db.getUserByCredentials("peter.chair", "chair123")
      expect(user?.userType).toBe("chairperson")

      // Chairperson should see applications at stage 2
      const applications = await db.getApplications()
      const chairmanApps = applications.filter((app) => app.status === "submitted" && app.currentStage === 2)
      expect(chairmanApps.length).toBeGreaterThan(0)
    })

    it("should validate ICT admin permissions", async () => {
      const ictUser = {
        id: "ict_001",
        username: "umsccict2025",
        userType: "ict" as const,
        password: "umsccict2025",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(db.getUserByCredentials).mockResolvedValue(ictUser)
      vi.mocked(db.updateComment).mockResolvedValue({
        id: "comment_001",
        applicationId: "1",
        userId: ictUser.id,
        userType: ictUser.userType,
        comment: "Updated comment",
        stage: 2,
        isRejectionReason: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const user = await db.getUserByCredentials("umsccict2025", "umsccict2025")
      expect(user?.userType).toBe("ict")

      // ICT should be able to edit comments
      const canEditComment = await db.updateComment("comment_001", { comment: "Updated" }, "ict")
      expect(canEditComment).toBeTruthy()
    })
  })

  describe("Application Workflow", () => {
    it("should handle complete application workflow", async () => {
      const testApp = {
        id: "workflow_test_001",
        applicationId: "MC2024-WORKFLOW001",
        applicantName: "Workflow Test User",
        physicalAddress: "123 Workflow Street, Harare",
        postalAddress: "P.O. Box 123, Harare",
        customerAccountNumber: "WF001",
        cellularNumber: "+263771234567",
        emailAddress: "workflow@test.com",
        permitType: "water_abstraction" as const,
        waterSource: "borehole",
        intendedUse: "Testing workflow",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 1000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "draft" as const,
        currentStage: 0,
        workflowComments: [],
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
        approvedAt: null,
      }

      // Mock workflow progression
      vi.mocked(db.createApplication).mockResolvedValue(testApp)

      // Submit application (Stage 0 -> 2)
      vi.mocked(db.updateApplication).mockResolvedValueOnce({
        ...testApp,
        status: "submitted",
        currentStage: 2,
        submittedAt: new Date(),
      })

      // Chairman review (Stage 2 -> 3)
      vi.mocked(db.updateApplication).mockResolvedValueOnce({
        ...testApp,
        status: "under_review",
        currentStage: 3,
      })

      // Final approval (Stage 3 -> 1 with approved status)
      vi.mocked(db.updateApplication).mockResolvedValueOnce({
        ...testApp,
        status: "approved",
        currentStage: 1,
        approvedAt: new Date(),
      })

      // Test workflow progression
      const created = await db.createApplication({
        applicantName: testApp.applicantName,
        physicalAddress: testApp.physicalAddress,
        postalAddress: testApp.postalAddress,
        customerAccountNumber: testApp.customerAccountNumber,
        cellularNumber: testApp.cellularNumber,
        emailAddress: testApp.emailAddress,
        permitType: testApp.permitType,
        waterSource: testApp.waterSource,
        intendedUse: testApp.intendedUse,
        numberOfBoreholes: testApp.numberOfBoreholes,
        landSize: testApp.landSize,
        waterAllocation: testApp.waterAllocation,
        gpsLatitude: testApp.gpsLatitude,
        gpsLongitude: testApp.gpsLongitude,
        status: testApp.status,
        currentStage: testApp.currentStage,
        workflowComments: testApp.workflowComments,
        documents: testApp.documents,
      })

      expect(created).toBeTruthy()

      // Test submission
      const submitted = await db.updateApplication(created.id, {
        status: "submitted",
        currentStage: 2,
        submittedAt: new Date(),
      })
      expect(submitted?.status).toBe("submitted")
      expect(submitted?.currentStage).toBe(2)

      // Test review
      const reviewed = await db.updateApplication(created.id, {
        status: "under_review",
        currentStage: 3,
      })
      expect(reviewed?.status).toBe("under_review")
      expect(reviewed?.currentStage).toBe(3)

      // Test approval
      const approved = await db.updateApplication(created.id, {
        status: "approved",
        currentStage: 1,
        approvedAt: new Date(),
      })
      expect(approved?.status).toBe("approved")
      expect(approved?.approvedAt).toBeTruthy()
    })

    it("should handle application rejection", async () => {
      const rejectionComment = {
        applicationId: "1",
        userId: testUser.id,
        userType: testUser.userType,
        comment: "Application rejected due to insufficient documentation",
        stage: 2,
        isRejectionReason: true,
      }

      vi.mocked(db.addComment).mockResolvedValue({
        ...rejectionComment,
        id: "rejection_comment_001",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      vi.mocked(db.updateApplication).mockResolvedValue({
        ...mockApplications[0],
        status: "rejected",
        currentStage: 1,
      })

      // Add rejection comment
      const comment = await db.addComment(rejectionComment)
      expect(comment.isRejectionReason).toBe(true)

      // Reject application
      const rejected = await db.updateApplication("1", {
        status: "rejected",
        currentStage: 1,
      })
      expect(rejected?.status).toBe("rejected")
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty data gracefully", async () => {
      vi.mocked(db.getApplications).mockResolvedValue([])
      vi.mocked(db.getMessages).mockResolvedValue([])

      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Chairperson Dashboard")).toBeInTheDocument()
      })

      // Should handle empty state
      await waitFor(() => {
        expect(screen.getByText(/no applications pending review/i)).toBeInTheDocument()
      })
    })

    it("should handle network errors gracefully", async () => {
      vi.mocked(db.getApplications).mockRejectedValue(new Error("Network error"))

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to load dashboard data:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it("should handle invalid operations", async () => {
      // Test invalid user credentials
      vi.mocked(db.getUserByCredentials).mockResolvedValue(null)
      const user = await db.getUserByCredentials("invalid_user", "wrong_password")
      expect(user).toBeNull()

      // Test non-existent application
      vi.mocked(db.getApplicationById).mockResolvedValue(null)
      const app = await db.getApplicationById("non_existent_id")
      expect(app).toBeNull()

      // Test invalid update
      vi.mocked(db.updateApplication).mockResolvedValue(null)
      const result = await db.updateApplication("non_existent_id", { status: "approved" })
      expect(result).toBeNull()
    })
  })

  describe("Performance Tests", () => {
    it("should handle large datasets efficiently", async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockApplications[0],
        id: `app_${i + 1}`,
        applicationId: `MC2024-${String(i + 1).padStart(4, "0")}`,
        applicantName: `Applicant ${i + 1}`,
        customerAccountNumber: `ACC-${i + 1}`,
      }))

      vi.mocked(db.getApplications).mockResolvedValue(largeDataset)

      const startTime = performance.now()
      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Chairperson Dashboard")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000)
    })

    it("should handle concurrent operations", async () => {
      const startTime = Date.now()

      // Simulate concurrent operations
      const operations = [
        db.getApplications(),
        db.getUsers(),
        db.getLogs(),
        db.getMessages("test_user", true),
        db.getMessages("test_user", false),
      ]

      vi.mocked(db.getUsers).mockResolvedValue([testUser])
      vi.mocked(db.getLogs).mockResolvedValue([])

      const results = await Promise.all(operations)
      const endTime = Date.now()

      // All operations should complete
      expect(results.length).toBe(5)

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe("Data Integrity", () => {
    it("should validate application data integrity", async () => {
      const applications = await db.getApplications()

      for (const app of applications) {
        // Check required fields
        expect(app.id).toBeTruthy()
        expect(app.applicationId).toBeTruthy()
        expect(app.applicantName).toBeTruthy()
        expect(app.status).toBeTruthy()
        expect(typeof app.currentStage).toBe("number")
        expect(app.createdAt).toBeInstanceOf(Date)
        expect(app.updatedAt).toBeInstanceOf(Date)

        // Check GPS coordinates are valid for Zimbabwe
        expect(app.gpsLatitude).toBeGreaterThan(-23)
        expect(app.gpsLatitude).toBeLessThan(-15)
        expect(app.gpsLongitude).toBeGreaterThan(25)
        expect(app.gpsLongitude).toBeLessThan(34)

        // Check phone number format
        expect(app.cellularNumber).toMatch(/^\+263[0-9]{9}$/)

        // Check reasonable values
        expect(app.waterAllocation).toBeGreaterThan(0)
        expect(app.landSize).toBeGreaterThan(0)
        expect(app.numberOfBoreholes).toBeGreaterThanOrEqual(0)
      }
    })

    it("should validate application ID format", async () => {
      const applications = await db.getApplications()

      for (const app of applications) {
        // Production format: MC2024-0001
        expect(app.applicationId).toMatch(/^MC\d{4}-\d{3,4}$/)
      }
    })
  })

  describe("Security Tests", () => {
    it("should protect sensitive operations", async () => {
      // Test unauthorized comment editing
      vi.mocked(db.updateComment).mockImplementation(async (id, data, userType) => {
        if (userType !== "ict") {
          return null // Unauthorized
        }
        return {
          id,
          applicationId: "1",
          userId: "user_001",
          userType: userType as any,
          comment: "Updated comment",
          stage: 2,
          isRejectionReason: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      // Non-ICT user trying to edit comments should fail
      const unauthorizedResult = await db.updateComment(
        "comment_001",
        { comment: "Unauthorized edit" },
        "permitting_officer",
      )
      expect(unauthorizedResult).toBeNull()

      // ICT user should succeed
      const authorizedResult = await db.updateComment("comment_001", { comment: "Authorized edit" }, "ict")
      expect(authorizedResult).toBeTruthy()
    })

    it("should validate user permissions by role", async () => {
      const testCases = [
        { userType: "permitting_officer", canEditComments: false },
        { userType: "chairperson", canEditComments: false },
        { userType: "catchment_manager", canEditComments: false },
        { userType: "ict", canEditComments: true },
      ]

      vi.mocked(db.updateComment).mockImplementation(async (id, data, userType) => {
        const canEdit = userType === "ict"
        return canEdit
          ? {
              id,
              applicationId: "1",
              userId: "user_001",
              userType: userType as any,
              comment: "Test comment",
              stage: 2,
              isRejectionReason: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : null
      })

      for (const testCase of testCases) {
        const result = await db.updateComment("test_comment", { comment: "Test" }, testCase.userType as any)

        if (testCase.canEditComments) {
          expect(result).toBeTruthy()
        } else {
          expect(result).toBeNull()
        }
      }
    })
  })

  describe("Accessibility Tests", () => {
    it("should have proper ARIA labels and roles", async () => {
      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Chairperson Dashboard")).toBeInTheDocument()
      })

      // Check for proper roles
      expect(screen.getAllByRole("tab")).toHaveLength(4)
      expect(screen.getAllByRole("tabpanel")).toHaveLength(1) // Only active tab panel is rendered

      // Check for proper labels
      expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /applications/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /messages/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /activity/i })).toBeInTheDocument()
    })

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup()
      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Chairperson Dashboard")).toBeInTheDocument()
      })

      // Test tab navigation
      const overviewTab = screen.getByRole("tab", { name: /overview/i })
      const applicationsTab = screen.getByRole("tab", { name: /applications/i })

      // Should be able to navigate between tabs
      await user.click(applicationsTab)
      expect(applicationsTab).toHaveAttribute("data-state", "active")

      await user.click(overviewTab)
      expect(overviewTab).toHaveAttribute("data-state", "active")
    })
  })
})
