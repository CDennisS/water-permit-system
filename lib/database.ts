import type { PermitApplication, User, WorkflowComment, ActivityLog, Message, Document } from "@/types"

/* -------------------------------------------------------------------------- */
/*                             In-memory database                             */
/*   In production replace with Supabase or another persistent datastore.     */
/* -------------------------------------------------------------------------- */

class MockDatabase {
  /* ──────────────────────────── core storage ────────────────────────────── */
  private applications: PermitApplication[] = []
  private users: User[] = [
    // Permitting Officers
    {
      id: "1",
      username: "john.officer",
      userType: "permitting_officer",
      password: "officer123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "7",
      username: "mary.permits",
      userType: "permitting_officer",
      password: "permits123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Chairpersons
    {
      id: "2",
      username: "peter.chair",
      userType: "chairperson",
      password: "chair123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "8",
      username: "grace.chairman",
      userType: "chairperson",
      password: "chairman123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Catchment Managers
    {
      id: "3",
      username: "james.catchment",
      userType: "catchment_manager",
      password: "catchment123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "9",
      username: "linda.manager",
      userType: "catchment_manager",
      password: "manager123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Catchment Chairpersons
    {
      id: "4",
      username: "robert.catchchair",
      userType: "catchment_chairperson",
      password: "catchchair123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Permit Supervisors
    {
      id: "5",
      username: "sarah.supervisor",
      userType: "permit_supervisor",
      password: "supervisor123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "10",
      username: "michael.super",
      userType: "permit_supervisor",
      password: "super123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ICT Users
    {
      id: "6",
      username: "umsccict2025",
      userType: "ict",
      password: "umsccict2025",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "11",
      username: "admin.ict",
      userType: "ict",
      password: "ictadmin123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Test Admin Account
    {
      id: "12",
      username: "testuser",
      userType: "permitting_officer",
      password: "test123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
  private comments: WorkflowComment[] = []
  private logs: ActivityLog[] = []
  private messages: Message[] = []
  private documents: Document[] = []

  private applicationCounter = 1

  // Initialize with mock data for testing
  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    // Mock applications for Upper Manyame Sub Catchment Council Chairman testing
    const mockApplications: PermitApplication[] = [
      // DRAFT APPLICATIONS (Stage 0) - 2 applications
      {
        id: "app_draft_001",
        applicationId: "DRAFT-001",
        applicantName: "Thomas Mutasa",
        physicalAddress: "45 Garden Road, Harare",
        postalAddress: "P.O. Box 445, Harare",
        customerAccountNumber: "ACC445",
        cellularNumber: "+263771234567",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Domestic use",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 1200,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-10"),
        submittedAt: undefined,
      },
      {
        id: "app_draft_002",
        applicationId: "DRAFT-002",
        applicantName: "Jennifer Chikwanha",
        physicalAddress: "78 Sunrise Avenue, Chitungwiza",
        postalAddress: "P.O. Box 778, Chitungwiza",
        customerAccountNumber: "ACC778",
        cellularNumber: "+263772345678",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Small scale irrigation",
        numberOfBoreholes: 0,
        landSize: 20,
        waterAllocation: 2000,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-08"),
        updatedAt: new Date("2024-03-09"),
        submittedAt: undefined,
      },

      // PENDING APPLICATIONS (Stage 1 - Permitting Officer Review) - 2 applications
      {
        id: "app_pending_001",
        applicationId: "MC2024-0001",
        applicantName: "John Mukamuri",
        physicalAddress: "123 Main Street, Harare",
        postalAddress: "P.O. Box 123, Harare",
        customerAccountNumber: "ACC001",
        cellularNumber: "+263771234567",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Irrigation for commercial farming",
        numberOfBoreholes: 2,
        landSize: 50,
        waterAllocation: 5000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
        submittedAt: new Date("2024-03-01"),
      },
      {
        id: "app_pending_002",
        applicationId: "MC2024-0002",
        applicantName: "Mary Chikwanha",
        physicalAddress: "456 Oak Avenue, Chitungwiza",
        postalAddress: "P.O. Box 456, Chitungwiza",
        customerAccountNumber: "ACC002",
        cellularNumber: "+263772345678",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Domestic and livestock watering",
        numberOfBoreholes: 0,
        landSize: 25,
        waterAllocation: 2500,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-02"),
        updatedAt: new Date("2024-03-02"),
        submittedAt: new Date("2024-03-02"),
      },

      // UNDER REVIEW APPLICATIONS (Stage 2 - Chairperson Review) - 2 applications
      {
        id: "app_review_001",
        applicationId: "MC2024-0003",
        applicantName: "Peter Moyo",
        physicalAddress: "789 Pine Road, Marondera",
        postalAddress: "P.O. Box 789, Marondera",
        customerAccountNumber: "ACC003",
        cellularNumber: "+263773456789",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Small scale irrigation",
        numberOfBoreholes: 1,
        landSize: 15,
        waterAllocation: 1500,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-02-15"),
      },
      {
        id: "app_review_002",
        applicationId: "MC2024-0004",
        applicantName: "Grace Nyamande",
        physicalAddress: "321 River View, Norton",
        postalAddress: "P.O. Box 321, Norton",
        customerAccountNumber: "ACC004",
        cellularNumber: "+263774567890",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Aquaculture farming",
        numberOfBoreholes: 0,
        landSize: 30,
        waterAllocation: 8000,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-25"),
        submittedAt: new Date("2024-02-10"),
      },

      // TECHNICAL REVIEW APPLICATIONS (Stage 3 - Catchment Manager Review) - 2 applications
      {
        id: "app_technical_001",
        applicationId: "MC2024-0005",
        applicantName: "James Sibanda",
        physicalAddress: "654 Hill View, Gweru",
        postalAddress: "P.O. Box 654, Gweru",
        customerAccountNumber: "ACC005",
        cellularNumber: "+263775678901",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Industrial processing",
        numberOfBoreholes: 3,
        landSize: 75,
        waterAllocation: 12000,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "technical_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-15"),
        submittedAt: new Date("2024-01-20"),
      },
      {
        id: "app_technical_002",
        applicationId: "MC2024-0006",
        applicantName: "Linda Madziva",
        physicalAddress: "258 Valley Road, Bulawayo",
        postalAddress: "P.O. Box 258, Bulawayo",
        customerAccountNumber: "ACC258",
        cellularNumber: "+263777890123",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Commercial farming",
        numberOfBoreholes: 0,
        landSize: 80,
        waterAllocation: 10000,
        gpsLatitude: -20.1594,
        gpsLongitude: 28.5906,
        status: "technical_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-28"),
        submittedAt: new Date("2024-02-01"),
      },

      // APPROVED APPLICATIONS (Stage 4 - Ready for Permit Printing) - 2 applications
      {
        id: "app_approved_001",
        applicationId: "MC2024-0007",
        applicantName: "Sarah Wilson",
        physicalAddress: "456 Oak Avenue, Chitungwiza",
        postalAddress: "P.O. Box 456, Chitungwiza",
        customerAccountNumber: "ACC014",
        cellularNumber: "+263772345678",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Domestic and livestock watering",
        numberOfBoreholes: 1,
        landSize: 25,
        waterAllocation: 2500,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-02-15"),
        submittedAt: new Date("2024-01-10"),
        approvedAt: new Date("2024-02-15"),
      },
      {
        id: "app_approved_002",
        applicationId: "MC2024-0008",
        applicantName: "Grace Mukamuri",
        physicalAddress: "321 River View, Norton",
        postalAddress: "P.O. Box 321, Norton",
        customerAccountNumber: "ACC021",
        cellularNumber: "+263774567890",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Small scale irrigation",
        numberOfBoreholes: 1,
        landSize: 15,
        waterAllocation: 1500,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-02-01"),
        approvedAt: new Date("2024-02-20"),
      },

      // REJECTED APPLICATIONS (Various stages of rejection) - 2 applications
      {
        id: "app_rejected_001",
        applicationId: "MC2024-0009",
        applicantName: "Michael Brown",
        physicalAddress: "789 Pine Road, Marondera",
        postalAddress: "P.O. Box 789, Marondera",
        customerAccountNumber: "ACC007",
        cellularNumber: "+263773456789",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Industrial processing",
        numberOfBoreholes: 0,
        landSize: 100,
        waterAllocation: 15000,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "rejected",
        currentStage: 3,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-10"),
        submittedAt: new Date("2024-01-20"),
      },
      {
        id: "app_rejected_002",
        applicationId: "MC2024-0010",
        applicantName: "David Madziva",
        physicalAddress: "147 Commercial Street, Bulawayo",
        postalAddress: "P.O. Box 147, Bulawayo",
        customerAccountNumber: "ACC012",
        cellularNumber: "+263777890123",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Commercial car wash",
        numberOfBoreholes: 2,
        landSize: 5,
        waterAllocation: 8000,
        gpsLatitude: -20.1594,
        gpsLongitude: 28.5906,
        status: "rejected",
        currentStage: 2,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-05"),
        submittedAt: new Date("2024-01-15"),
      },
    ]

    // Mock comments for the applications
    const mockComments: WorkflowComment[] = [
      // Comments for pending applications (Stage 1)
      {
        id: "comment_pending_001",
        applicationId: "app_pending_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Application received and under initial review. Checking documentation completeness.",
        stage: 1,
        createdAt: new Date("2024-03-01"),
        isRejectionReason: false,
      },
      {
        id: "comment_pending_002",
        applicationId: "app_pending_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Surface water extraction application under review. Assessing environmental impact requirements.",
        stage: 1,
        createdAt: new Date("2024-03-02"),
        isRejectionReason: false,
      },

      // Comments for under review applications (Stage 2)
      {
        id: "comment_review_001",
        applicationId: "app_review_001",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Initial review completed. All required documents submitted. Forwarding to chairperson for technical assessment.",
        stage: 1,
        createdAt: new Date("2024-02-16"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_002",
        applicationId: "app_review_001",
        userId: "2",
        userType: "chairperson",
        comment: "Technical review in progress. Assessing water allocation sustainability and environmental impact.",
        stage: 2,
        createdAt: new Date("2024-02-20"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_003",
        applicationId: "app_review_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Aquaculture application reviewed. Water quality requirements and discharge plans need assessment.",
        stage: 1,
        createdAt: new Date("2024-02-12"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_004",
        applicationId: "app_review_002",
        userId: "2",
        userType: "chairperson",
        comment: "Reviewing environmental impact of aquaculture operations on surface water quality.",
        stage: 2,
        createdAt: new Date("2024-02-25"),
        isRejectionReason: false,
      },

      // Comments for technical review applications (Stage 3)
      {
        id: "comment_technical_001",
        applicationId: "app_technical_001",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Industrial water extraction application reviewed. High volume allocation requires detailed assessment.",
        stage: 1,
        createdAt: new Date("2024-01-22"),
        isRejectionReason: false,
      },
      {
        id: "comment_technical_002",
        applicationId: "app_technical_001",
        userId: "2",
        userType: "chairperson",
        comment: "Technical assessment completed. Industrial use approved pending catchment manager final review.",
        stage: 2,
        createdAt: new Date("2024-02-05"),
        isRejectionReason: false,
      },
      {
        id: "comment_technical_003",
        applicationId: "app_technical_001",
        userId: "3",
        userType: "catchment_manager",
        comment: "Final technical review in progress. Assessing cumulative impact on catchment water resources.",
        stage: 3,
        createdAt: new Date("2024-02-15"),
        isRejectionReason: false,
      },

      // Comments for approved applications
      {
        id: "comment_approved_001",
        applicationId: "app_approved_001",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Application reviewed and found to be complete. All required documentation submitted. Recommended for technical review.",
        stage: 1,
        createdAt: new Date("2024-01-12"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_002",
        applicationId: "app_approved_001",
        userId: "2",
        userType: "chairperson",
        comment:
          "Technical review completed. Water allocation is within sustainable limits. Environmental impact is minimal. Recommended for approval.",
        stage: 2,
        createdAt: new Date("2024-01-25"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_003",
        applicationId: "app_approved_001",
        userId: "3",
        userType: "catchment_manager",
        comment: "Final review completed. All conditions met. Application approved for permit issuance.",
        stage: 3,
        createdAt: new Date("2024-02-10"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_004",
        applicationId: "app_approved_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Permit ready for printing and issuance. All fees paid and conditions satisfied.",
        stage: 4,
        createdAt: new Date("2024-02-15"),
        isRejectionReason: false,
      },

      // Comments for rejected applications
      {
        id: "comment_rejected_001",
        applicationId: "app_rejected_001",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Industrial water extraction application reviewed. High volume allocation requires detailed environmental assessment.",
        stage: 1,
        createdAt: new Date("2024-01-22"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_002",
        applicationId: "app_rejected_001",
        userId: "2",
        userType: "chairperson",
        comment: "Technical assessment indicates potential water quality concerns for downstream users.",
        stage: 2,
        createdAt: new Date("2024-01-30"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_003",
        applicationId: "app_rejected_001",
        userId: "3",
        userType: "catchment_manager",
        comment:
          "REJECTION: After comprehensive review, this application is rejected due to: 1) Insufficient environmental impact mitigation measures, 2) Potential contamination risk to surface water sources, 3) Lack of adequate water treatment facilities for industrial discharge. Applicant may resubmit with comprehensive environmental management plan.",
        stage: 3,
        createdAt: new Date("2024-02-10"),
        isRejectionReason: true,
      },
    ]

    // Mock activity logs
    const mockLogs: ActivityLog[] = [
      {
        id: "log_001",
        userId: "1",
        action: "Application created",
        applicationId: "app_draft_001",
        details: "Draft application created by Thomas Mutasa",
        timestamp: new Date("2024-03-10"),
      },
      {
        id: "log_002",
        userId: "1",
        action: "Application submitted",
        applicationId: "app_pending_001",
        details: "New water extraction application submitted by John Mukamuri",
        timestamp: new Date("2024-03-01"),
      },
      {
        id: "log_003",
        userId: "1",
        action: "Application reviewed",
        applicationId: "app_approved_001",
        details: "Application MC2024-0007 approved for permit issuance",
        timestamp: new Date("2024-02-15"),
      },
      {
        id: "log_004",
        userId: "3",
        action: "Application rejected",
        applicationId: "app_rejected_001",
        details: "Application MC2024-0009 rejected due to environmental concerns",
        timestamp: new Date("2024-02-10"),
      },
    ]

    // Add all mock data to arrays
    this.applications.push(...mockApplications)
    this.comments.push(...mockComments)
    this.logs.push(...mockLogs)
    this.applicationCounter = 11 // Update counter to avoid conflicts
  }

  /* ───────────────────────── Applications CRUD ──────────────────────────── */
  async createApplication(
    data: Omit<PermitApplication, "id" | "applicationId" | "createdAt" | "updatedAt">,
  ): Promise<PermitApplication> {
    const application: PermitApplication = {
      ...data,
      id: `app_${Date.now()}`,
      applicationId: `MC${new Date().getFullYear()}-${String(this.applicationCounter).padStart(4, "0")}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.applications.push(application)
    this.applicationCounter++
    return application
  }

  async getApplications(filters?: {
    status?: string
    userType?: string
    userId?: string
  }): Promise<PermitApplication[]> {
    let filtered = [...this.applications]

    if (filters?.status) filtered = filtered.filter((a) => a.status === filters.status)
    if (filters?.userId) filtered = filtered.filter((a) => a.assignedTo === filters.userId)
    // add more filters as required

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async getApplicationById(id: string) {
    return this.applications.find((a) => a.id === id) ?? null
  }

  async updateApplication(id: string, updates: Partial<PermitApplication>) {
    const idx = this.applications.findIndex((a) => a.id === id)
    if (idx === -1) return null
    this.applications[idx] = { ...this.applications[idx], ...updates, updatedAt: new Date() }
    return this.applications[idx]
  }

  async deleteApplication(id: string) {
    const idx = this.applications.findIndex((a) => a.id === id)
    if (idx === -1) return false
    this.applications.splice(idx, 1)
    return true
  }

  /* ─────────────────────────── Workflow comments ────────────────────────── */
  async addComment(comment: Omit<WorkflowComment, "id" | "createdAt">) {
    const newComment: WorkflowComment = { ...comment, id: `comment_${Date.now()}`, createdAt: new Date() }
    this.comments.push(newComment)
    return newComment
  }

  async getCommentsByApplication(applicationId: string) {
    return this.comments.filter((c) => c.applicationId === applicationId)
  }

  // ICT can edit any comment
  async updateComment(commentId: string, updates: Partial<WorkflowComment>, userType: string) {
    if (userType !== "ict") return null

    const idx = this.comments.findIndex((c) => c.id === commentId)
    if (idx === -1) return null

    this.comments[idx] = { ...this.comments[idx], ...updates }
    return this.comments[idx]
  }

  async deleteComment(commentId: string, userType: string) {
    if (userType !== "ict") return false

    const idx = this.comments.findIndex((c) => c.id === commentId)
    if (idx === -1) return false

    this.comments.splice(idx, 1)
    return true
  }

  /* ───────────────────────────── Activity log ───────────────────────────── */
  async addLog(log: Omit<ActivityLog, "id" | "timestamp">) {
    // Log all activities including ICT (ICT activities should be logged for audit purposes)
    const newLog: ActivityLog = { ...log, id: `log_${Date.now()}`, timestamp: new Date() }
    this.logs.push(newLog)
    return newLog
  }

  async getLogs(filters?: { userId?: string; applicationId?: string }) {
    let res = [...this.logs]
    if (filters?.userId) res = res.filter((l) => l.userId === filters.userId)
    if (filters?.applicationId) res = res.filter((l) => l.applicationId === filters.applicationId)
    return res.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // ICT can edit logs
  async updateLog(logId: string, updates: Partial<ActivityLog>, userType: string) {
    if (userType !== "ict") return null

    const idx = this.logs.findIndex((l) => l.id === logId)
    if (idx === -1) return null

    this.logs[idx] = { ...this.logs[idx], ...updates }
    return this.logs[idx]
  }

  async deleteLog(logId: string, userType: string) {
    if (userType !== "ict") return false

    const idx = this.logs.findIndex((l) => l.id === logId)
    if (idx === -1) return false

    this.logs.splice(idx, 1)
    return true
  }

  /* ────────────────────────────── Messaging ─────────────────────────────── */
  async sendMessage(message: Omit<Message, "id" | "createdAt">) {
    const newMsg: Message = { ...message, id: `msg_${Date.now()}`, createdAt: new Date() }
    this.messages.push(newMsg)
    return newMsg
  }

  async getMessages(userId: string, isPublic?: boolean) {
    return this.messages
      .filter((m) => (isPublic ? m.isPublic : !m.isPublic && (m.senderId === userId || m.receiverId === userId)))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async markMessageAsRead(messageId: string) {
    const idx = this.messages.findIndex((m) => m.id === messageId)
    if (idx !== -1) this.messages[idx].readAt = new Date()
  }

  /* ────────────────────────────── Users CRUD ────────────────────────────── */
  async getUsers() {
    return [...this.users]
  }

  async getUserByCredentials(username: string, password: string) {
    return this.users.find((u) => u.username === username && u.password === password) ?? null
  }

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">) {
    const newUser: User = {
      ...data,
      id: `user_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.push(newUser)
    return newUser
  }

  async updateUser(id: string, updates: Partial<User>) {
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx === -1) return null
    this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date() }
    return this.users[idx]
  }

  async deleteUser(id: string) {
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx === -1) return false
    this.users.splice(idx, 1)
    return true
  }

  /* ───────────────────────────── Documents CRUD ─────────────────────────── */
  async uploadDocument(doc: Omit<Document, "id" | "uploadedAt">) {
    const newDoc: Document = { ...doc, id: `doc_${Date.now()}`, uploadedAt: new Date() }
    this.documents.push(newDoc)
    return newDoc
  }

  async getDocumentsByApplication(applicationId: string) {
    return this.documents.filter((d) => d.applicationId === applicationId)
  }

  async deleteDocument(id: string) {
    const idx = this.documents.findIndex((d) => d.id === id)
    if (idx === -1) return false
    this.documents.splice(idx, 1)
    return true
  }

  // ICT can delete any document
  async forceDeleteDocument(id: string, userType: string) {
    if (userType !== "ict") return false
    return this.deleteDocument(id)
  }
}

export const db = new MockDatabase()
