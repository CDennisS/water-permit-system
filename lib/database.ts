import type { PermitApplication, User, WorkflowComment, ActivityLog, Message, Document } from "@/types"

/* -------------------------------------------------------------------------- */
/*                             In-memory database                             */
/*   In production replace with Supabase or another persistent datastore.     */
/* -------------------------------------------------------------------------- */

class MockDatabase {
  /* ──────────────────────────── core storage ────────────────────────────── */
  private applications: PermitApplication[] = []
  private users: User[] = [
    {
      id: "1",
      username: "admin",
      userType: "permitting_officer",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      username: "admin",
      userType: "chairperson",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      username: "admin",
      userType: "catchment_manager",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      username: "admin",
      userType: "catchment_chairperson",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      username: "admin",
      userType: "permit_supervisor",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      username: "umsccict2025",
      userType: "ict",
      password: "umsccict2025",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
  private comments: WorkflowComment[] = []
  private logs: ActivityLog[] = []
  private messages: Message[] = []
  private documents: Document[] = []

  private applicationCounter = 1

  constructor() {
    // Add sample applications for testing
    this.seedSampleData()
  }

  private seedSampleData() {
    const sampleApplications: PermitApplication[] = [
      {
        id: "app_1",
        applicationId: "MC2024-0001",
        applicantName: "John Smith",
        customerAccountNumber: "ACC001234",
        cellularNumber: "0712345678",
        physicalAddress: "123 Main Street, Harare",
        postalAddress: "P.O. Box 1234, Harare",
        permitType: "borehole",
        intendedUse: "Domestic water supply for residential property",
        landSize: 0.5,
        numberOfBoreholes: 1,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        waterSource: "Groundwater from shallow aquifer",
        waterAllocation: 2.5,
        validityPeriod: 5,
        status: "approved",
        currentStage: 6,
        createdBy: "1",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-01-16"),
        approvedAt: new Date("2024-02-20"),
      },
      {
        id: "app_2",
        applicationId: "MC2024-0002",
        applicantName: "Mary Johnson",
        customerAccountNumber: "ACC005678",
        cellularNumber: "0723456789",
        physicalAddress: "456 Oak Avenue, Bulawayo",
        postalAddress: "P.O. Box 5678, Bulawayo",
        permitType: "surface_water",
        intendedUse: "Irrigation for commercial farming operations",
        landSize: 15.0,
        numberOfBoreholes: 0,
        gpsLatitude: -20.1504,
        gpsLongitude: 28.5906,
        waterSource: "Seasonal river with dam construction",
        waterAllocation: 45.0,
        validityPeriod: 10,
        status: "under_review",
        currentStage: 4,
        createdBy: "1",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-15"),
        submittedAt: new Date("2024-02-02"),
      },
      {
        id: "app_3",
        applicationId: "MC2024-0003",
        applicantName: "Robert Wilson",
        customerAccountNumber: "ACC009876",
        cellularNumber: "0734567890",
        physicalAddress: "789 Pine Road, Mutare",
        postalAddress: "P.O. Box 9876, Mutare",
        permitType: "borehole",
        intendedUse: "Industrial water supply for manufacturing",
        landSize: 2.0,
        numberOfBoreholes: 3,
        gpsLatitude: -18.9707,
        gpsLongitude: 32.6731,
        waterSource: "Deep groundwater aquifer system",
        waterAllocation: 12.0,
        validityPeriod: 7,
        status: "submitted",
        currentStage: 2,
        createdBy: "1",
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-12"),
        submittedAt: new Date("2024-02-12"),
      },
      {
        id: "app_4",
        applicationId: "MC2024-0004",
        applicantName: "Sarah Davis",
        customerAccountNumber: "ACC004321",
        cellularNumber: "0745678901",
        physicalAddress: "321 Cedar Street, Gweru",
        postalAddress: "P.O. Box 4321, Gweru",
        permitType: "surface_water",
        intendedUse: "Municipal water supply expansion",
        landSize: 0.8,
        numberOfBoreholes: 0,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        waterSource: "Municipal reservoir and treatment plant",
        waterAllocation: 25.0,
        validityPeriod: 15,
        status: "rejected",
        currentStage: 5,
        createdBy: "1",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-25"),
        submittedAt: new Date("2024-01-21"),
      },
      {
        id: "app_5",
        applicationId: "MC2024-0005",
        applicantName: "Michael Brown",
        customerAccountNumber: "ACC007890",
        cellularNumber: "0756789012",
        physicalAddress: "654 Birch Lane, Masvingo",
        postalAddress: "P.O. Box 7890, Masvingo",
        permitType: "borehole",
        intendedUse: "Agricultural irrigation for crop production",
        landSize: 8.5,
        numberOfBoreholes: 2,
        gpsLatitude: -20.0637,
        gpsLongitude: 30.8267,
        waterSource: "Intermediate groundwater aquifer",
        waterAllocation: 18.5,
        validityPeriod: 8,
        status: "unsubmitted",
        currentStage: 1,
        createdBy: "1",
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-02-20"),
      },
    ]

    this.applications = sampleApplications
    this.applicationCounter = 6
  }

  /* ───────────────────────── Applications CRUD ──────────────────────────── */
  async createApplication(
    data: Omit<PermitApplication, "id" | "applicationId" | "createdAt" | "updatedAt">,
  ): Promise<PermitApplication> {
    console.log("Database: Creating application with data:", data) // Add debugging

    const application: PermitApplication = {
      ...data,
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      applicationId: `MC${new Date().getFullYear()}-${String(this.applicationCounter++).padStart(4, "0")}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Database: Created application object:", application) // Add debugging
    this.applications.push(application)
    console.log("Database: Total applications now:", this.applications.length) // Add debugging
    console.log(
      "Database: All applications:",
      this.applications.map((app) => ({
        id: app.applicationId,
        status: app.status,
        createdBy: app.createdBy,
        applicantName: app.applicantName,
      })),
    ) // Add debugging

    return application
  }

  async getApplications(filters?: {
    status?: string
    userType?: string
    userId?: string
  }): Promise<PermitApplication[]> {
    let filtered = [...this.applications]

    if (filters?.status) filtered = filtered.filter((a) => a.status === filters.status)
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
