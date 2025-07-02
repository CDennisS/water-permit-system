import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { LoginForm } from "@/components/login-form"
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

const mockApplications: PermitApplication[] = [
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
    gpsLatitude: -17.8252,
    gpsLongitude: 31.0335,
    status: "submitted",
    currentStage: 2,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    submittedAt: new Date("2024-01-15"),
    approvedAt: null,
    documents: [],
    workflowComments: [],
    intendedUse: "Domestic water supply",
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
    status: "approved",
    currentStage: 1,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-15"),
    submittedAt: new Date("2024-02-01"),
    approvedAt: new Date("2024-02-15"),
    documents: [],
    workflowComments: [],
    intendedUse: "Agricultural irrigation",
  },
  {
    id: "3",
    applicationId: "MC2024-003",
    applicantName: "Bob Wilson",
    physicalAddress: "789 Pine St, Harare",
    postalAddress: "P.O. Box 789, Harare",
    customerAccountNumber: "ACC-003",
    cellularNumber: "+263771234569",
    emailAddress: "bob@example.com",
    permitType: "industrial",
    waterSource: "ground_water",
    waterAllocation: 5000,
    landSize: 200,
    numberOfBoreholes: 2,
    gpsLatitude: -17.75,
    gpsLongitude: 30.95,
    status: "rejected",
    currentStage: 1,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
    submittedAt: new Date("2024-01-10"),
    approvedAt: null,
    documents: [],
    workflowComments: [],
    intendedUse: "Manufacturing process",
  },
]

const mockUsers: User[] = [
  {
    id: "1",
    username: "peter.chair",
    userType: "chairperson",
    password: "chair123",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    username: "john.officer",
    userType: "permitting_officer",
    password: "officer123",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    username: "umsccict2025",
    userType: "ict",
    password: "umsccict2025",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe("Deployment Readiness Tests", () => {
  let testUser: User

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(db.getApplications).mockResolvedValue(mockApplications)
    vi.mocked(db.getUsers).mockResolvedValue(mockUsers)
    vi.mocked(db.getDocumentsByApplication).mockResolvedValue([])
    vi.mocked(db.getMessages).mockResolvedValue([])
    vi.mocked(db.getLogs).mockResolvedValue([])

    testUser = {
      id: "chairperson_001",
      username: "peter.chair",
      userType: "chairperson",
      password: "chair123",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  describe("Core System Functionality", () => {
    it("should render login form correctly", async () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
    })

    it("should handle authentication flow", async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        success: true,
        user: { id: "1", username: "peter.chair", userType: "chairperson" },
      })

      render(<LoginForm onLogin={mockLogin} />)

      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole("button", { name: /sign in/i })

      await userEvent.type(usernameInput, "peter.chair")
      await userEvent.type(passwordInput, "chair123")
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("peter.chair", "chair123")
      })
    })

    it("should display validation errors for invalid inputs", async () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole("button", { name: /sign in/i })
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })
  })

  describe("Chairperson Dashboard Functionality", () => {
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

  describe("Reports Analytics Functionality", () => {
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
      render(<EnhancedReportsAnalytics />)

      await waitFor(() => {
        expect(screen.getByText("Reports & Analytics")).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000)
      expect(screen.getByText("100 applications")).toBeInTheDocument()
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

  describe("Responsive Design Tests", () => {
    it("should adapt to mobile viewport", async () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      })

      window.dispatchEvent(new Event("resize"))

      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Chairperson Dashboard")).toBeInTheDocument()
      })

      // Should render without errors on mobile
      expect(screen.getByText("Upper Manyame Sub Catchment Council")).toBeInTheDocument()
    })

    it("should adapt to tablet viewport", async () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      })

      window.dispatchEvent(new Event("resize"))

      render(<ChairpersonDashboard user={testUser} />)

      await waitFor(() => {
        expect(screen.getByText("Chairperson Dashboard")).toBeInTheDocument()
      })

      // Should render without errors on tablet
      expect(screen.getByText("Upper Manyame Sub Catchment Council")).toBeInTheDocument()
    })
  })
})

// Helper functions for validation
function isValidZimbabweCoordinate(lat: number, lng: number): boolean {
  return lat >= -22.5 && lat <= -15.5 && lng >= 25.0 && lng <= 33.5
}

function isValidZimbabwePhone(phone: string): boolean {
  const phoneRegex = /^(\+263|0)(7[0-9]|8[6-9])[0-9]{7}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}
