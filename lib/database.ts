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

  // Constructor - no mock data initialization
  constructor() {
    // Start with clean slate - no mock applications
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
