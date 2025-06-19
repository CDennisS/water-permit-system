import { createServerClient } from "./supabase"
import type { PermitApplication, User, WorkflowComment, ActivityLog, Message, Document } from "@/types"
import { MonitoringService } from "./monitoring"

export class ProductionDatabase {
  private static client = createServerClient()

  /* ───────────────────────── Applications CRUD ──────────────────────────── */
  static async createApplication(
    data: Omit<PermitApplication, "id" | "applicationId" | "createdAt" | "updatedAt">,
  ): Promise<PermitApplication> {
    try {
      // Generate application ID
      const year = new Date().getFullYear()
      const { data: lastApp } = await this.client
        .from("applications")
        .select("application_id")
        .like("application_id", `MC${year}-%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      let counter = 1
      if (lastApp) {
        const match = lastApp.application_id.match(/MC\d{4}-(\d+)/)
        if (match) {
          counter = Number.parseInt(match[1]) + 1
        }
      }

      const applicationId = `MC${year}-${counter}`

      const { data: application, error } = await this.client
        .from("applications")
        .insert({
          application_id: applicationId,
          applicant_name: data.applicantName,
          physical_address: data.physicalAddress,
          postal_address: data.postalAddress,
          customer_account_number: data.customerAccountNumber,
          cellular_number: data.cellularNumber,
          number_of_boreholes: data.numberOfBoreholes,
          land_size: data.landSize,
          gps_latitude: data.gpsLatitude,
          gps_longitude: data.gpsLongitude,
          water_source: data.waterSource,
          water_source_details: data.waterSourceDetails,
          permit_type: data.permitType,
          intended_use: data.intendedUse,
          water_allocation: data.waterAllocation,
          validity_period: data.validityPeriod,
          comments: data.comments,
          status: data.status,
          current_stage: data.currentStage,
        })
        .select()
        .single()

      if (error) throw error

      return this.mapApplicationFromDB(application)
    } catch (error) {
      MonitoringService.recordError(error as Error, "createApplication")
      throw error
    }
  }

  static async getApplications(filters?: {
    status?: string
    userType?: string
    userId?: string
  }): Promise<PermitApplication[]> {
    try {
      let query = this.client.from("applications").select("*")

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      const { data: applications, error } = await query.order("updated_at", { ascending: false })

      if (error) throw error

      return applications.map(this.mapApplicationFromDB)
    } catch (error) {
      MonitoringService.recordError(error as Error, "getApplications")
      throw error
    }
  }

  static async getApplicationById(id: string): Promise<PermitApplication | null> {
    try {
      const { data: application, error } = await this.client.from("applications").select("*").eq("id", id).single()

      if (error) return null

      return this.mapApplicationFromDB(application)
    } catch (error) {
      MonitoringService.recordError(error as Error, "getApplicationById")
      return null
    }
  }

  static async updateApplication(id: string, updates: Partial<PermitApplication>): Promise<PermitApplication | null> {
    try {
      const dbUpdates: any = {}

      // Map frontend fields to database fields
      if (updates.applicantName) dbUpdates.applicant_name = updates.applicantName
      if (updates.physicalAddress) dbUpdates.physical_address = updates.physicalAddress
      if (updates.postalAddress) dbUpdates.postal_address = updates.postalAddress
      if (updates.customerAccountNumber) dbUpdates.customer_account_number = updates.customerAccountNumber
      if (updates.cellularNumber) dbUpdates.cellular_number = updates.cellularNumber
      if (updates.numberOfBoreholes) dbUpdates.number_of_boreholes = updates.numberOfBoreholes
      if (updates.landSize) dbUpdates.land_size = updates.landSize
      if (updates.gpsLatitude) dbUpdates.gps_latitude = updates.gpsLatitude
      if (updates.gpsLongitude) dbUpdates.gps_longitude = updates.gpsLongitude
      if (updates.waterSource) dbUpdates.water_source = updates.waterSource
      if (updates.waterSourceDetails) dbUpdates.water_source_details = updates.waterSourceDetails
      if (updates.permitType) dbUpdates.permit_type = updates.permitType
      if (updates.intendedUse) dbUpdates.intended_use = updates.intendedUse
      if (updates.waterAllocation) dbUpdates.water_allocation = updates.waterAllocation
      if (updates.validityPeriod) dbUpdates.validity_period = updates.validityPeriod
      if (updates.comments) dbUpdates.comments = updates.comments
      if (updates.status) dbUpdates.status = updates.status
      if (updates.currentStage) dbUpdates.current_stage = updates.currentStage
      if (updates.submittedAt) dbUpdates.submitted_at = updates.submittedAt.toISOString()
      if (updates.approvedAt) dbUpdates.approved_at = updates.approvedAt.toISOString()
      if (updates.rejectedAt) dbUpdates.rejected_at = updates.rejectedAt.toISOString()

      const { data: application, error } = await this.client
        .from("applications")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return this.mapApplicationFromDB(application)
    } catch (error) {
      MonitoringService.recordError(error as Error, "updateApplication")
      return null
    }
  }

  static async deleteApplication(id: string): Promise<boolean> {
    try {
      const { error } = await this.client.from("applications").delete().eq("id", id)

      return !error
    } catch (error) {
      MonitoringService.recordError(error as Error, "deleteApplication")
      return false
    }
  }

  /* ─────────────────────────── Workflow comments ────────────────────────── */
  static async addComment(comment: Omit<WorkflowComment, "id" | "createdAt">): Promise<WorkflowComment> {
    try {
      const { data: newComment, error } = await this.client
        .from("workflow_comments")
        .insert({
          application_id: comment.applicationId,
          user_id: comment.userId,
          user_type: comment.userType,
          comment: comment.comment,
          stage: comment.stage,
          is_rejection_reason: comment.isRejectionReason,
        })
        .select()
        .single()

      if (error) throw error

      return this.mapCommentFromDB(newComment)
    } catch (error) {
      MonitoringService.recordError(error as Error, "addComment")
      throw error
    }
  }

  static async getCommentsByApplication(applicationId: string): Promise<WorkflowComment[]> {
    try {
      const { data: comments, error } = await this.client
        .from("workflow_comments")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true })

      if (error) throw error

      return comments.map(this.mapCommentFromDB)
    } catch (error) {
      MonitoringService.recordError(error as Error, "getCommentsByApplication")
      return []
    }
  }

  static async updateComment(
    commentId: string,
    updates: Partial<WorkflowComment>,
    userType: string,
  ): Promise<WorkflowComment | null> {
    if (userType !== "ict") return null

    try {
      const { data: comment, error } = await this.client
        .from("workflow_comments")
        .update({ comment: updates.comment })
        .eq("id", commentId)
        .select()
        .single()

      if (error) throw error

      return this.mapCommentFromDB(comment)
    } catch (error) {
      MonitoringService.recordError(error as Error, "updateComment")
      return null
    }
  }

  static async deleteComment(commentId: string, userType: string): Promise<boolean> {
    if (userType !== "ict") return false

    try {
      const { error } = await this.client.from("workflow_comments").delete().eq("id", commentId)

      return !error
    } catch (error) {
      MonitoringService.recordError(error as Error, "deleteComment")
      return false
    }
  }

  /* ───────────────────────────── Activity log ───────────────────────────── */
  static async addLog(log: Omit<ActivityLog, "id" | "timestamp">): Promise<ActivityLog> {
    try {
      const { data: newLog, error } = await this.client
        .from("activity_logs")
        .insert({
          user_id: log.userId,
          user_type: log.userType,
          action: log.action,
          details: log.details,
          application_id: log.applicationId,
          ip_address: log.ipAddress,
          user_agent: log.userAgent,
        })
        .select()
        .single()

      if (error) throw error

      return this.mapLogFromDB(newLog)
    } catch (error) {
      MonitoringService.recordError(error as Error, "addLog")
      throw error
    }
  }

  static async getLogs(filters?: { userId?: string; applicationId?: string }): Promise<ActivityLog[]> {
    try {
      let query = this.client.from("activity_logs").select("*")

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId)
      }
      if (filters?.applicationId) {
        query = query.eq("application_id", filters.applicationId)
      }

      const { data: logs, error } = await query.order("timestamp", { ascending: false })

      if (error) throw error

      return logs.map(this.mapLogFromDB)
    } catch (error) {
      MonitoringService.recordError(error as Error, "getLogs")
      return []
    }
  }

  static async updateLog(logId: string, updates: Partial<ActivityLog>, userType: string): Promise<ActivityLog | null> {
    if (userType !== "ict") return null

    try {
      const { data: log, error } = await this.client
        .from("activity_logs")
        .update({
          action: updates.action,
          details: updates.details,
        })
        .eq("id", logId)
        .select()
        .single()

      if (error) throw error

      return this.mapLogFromDB(log)
    } catch (error) {
      MonitoringService.recordError(error as Error, "updateLog")
      return null
    }
  }

  static async deleteLog(logId: string, userType: string): Promise<boolean> {
    if (userType !== "ict") return false

    try {
      const { error } = await this.client.from("activity_logs").delete().eq("id", logId)

      return !error
    } catch (error) {
      MonitoringService.recordError(error as Error, "deleteLog")
      return false
    }
  }

  /* ────────────────────────────── Users CRUD ────────────────────────────── */
  static async getUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await this.client
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      return users.map(this.mapUserFromDB)
    } catch (error) {
      MonitoringService.recordError(error as Error, "getUsers")
      return []
    }
  }

  static async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    try {
      const { data: user, error } = await this.client
        .from("users")
        .insert({
          username: data.username,
          email: data.email || `${data.username}@umscc.co.zw`,
          password_hash: data.password, // This should be hashed before calling this method
          user_type: data.userType,
        })
        .select()
        .single()

      if (error) throw error

      return this.mapUserFromDB(user)
    } catch (error) {
      MonitoringService.recordError(error as Error, "createUser")
      throw error
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const dbUpdates: any = {}
      if (updates.username) dbUpdates.username = updates.username
      if (updates.email) dbUpdates.email = updates.email
      if (updates.password) dbUpdates.password_hash = updates.password // Should be hashed
      if (updates.userType) dbUpdates.user_type = updates.userType

      const { data: user, error } = await this.client.from("users").update(dbUpdates).eq("id", id).select().single()

      if (error) throw error

      return this.mapUserFromDB(user)
    } catch (error) {
      MonitoringService.recordError(error as Error, "updateUser")
      return null
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await this.client.from("users").update({ is_active: false }).eq("id", id)

      return !error
    } catch (error) {
      MonitoringService.recordError(error as Error, "deleteUser")
      return false
    }
  }

  /* ───────────────────────────── Documents CRUD ─────────────────────────── */
  static async uploadDocument(doc: Omit<Document, "id" | "uploadedAt">): Promise<Document> {
    try {
      const { data: document, error } = await this.client
        .from("documents")
        .insert({
          application_id: doc.applicationId,
          file_name: doc.fileName,
          file_type: doc.fileType,
          file_size: doc.fileSize,
          document_type: doc.documentType,
          file_url: doc.fileUrl || "",
        })
        .select()
        .single()

      if (error) throw error

      return this.mapDocumentFromDB(document)
    } catch (error) {
      MonitoringService.recordError(error as Error, "uploadDocument")
      throw error
    }
  }

  static async getDocumentsByApplication(applicationId: string): Promise<Document[]> {
    try {
      const { data: documents, error } = await this.client
        .from("documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("uploaded_at", { ascending: false })

      if (error) throw error

      return documents.map(this.mapDocumentFromDB)
    } catch (error) {
      MonitoringService.recordError(error as Error, "getDocumentsByApplication")
      return []
    }
  }

  static async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await this.client.from("documents").delete().eq("id", id)

      return !error
    } catch (error) {
      MonitoringService.recordError(error as Error, "deleteDocument")
      return false
    }
  }

  /* ────────────────────────────── Messaging ─────────────────────────────── */
  static async sendMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message> {
    try {
      const { data: newMessage, error } = await this.client
        .from("messages")
        .insert({
          sender_id: message.senderId,
          receiver_id: message.receiverId,
          subject: message.subject,
          message: message.message,
          is_public: message.isPublic,
        })
        .select()
        .single()

      if (error) throw error

      return this.mapMessageFromDB(newMessage)
    } catch (error) {
      MonitoringService.recordError(error as Error, "sendMessage")
      throw error
    }
  }

  static async getMessages(userId: string, isPublic?: boolean): Promise<Message[]> {
    try {
      let query = this.client.from("messages").select("*")

      if (isPublic) {
        query = query.eq("is_public", true)
      } else {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      }

      const { data: messages, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      return messages.map(this.mapMessageFromDB)
    } catch (error) {
      MonitoringService.recordError(error as Error, "getMessages")
      return []
    }
  }

  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await this.client.from("messages").update({ read_at: new Date().toISOString() }).eq("id", messageId)
    } catch (error) {
      MonitoringService.recordError(error as Error, "markMessageAsRead")
    }
  }

  /* ─────────────────────────── Mapping functions ────────────────────────── */
  private static mapApplicationFromDB(dbApp: any): PermitApplication {
    return {
      id: dbApp.id,
      applicationId: dbApp.application_id,
      applicantName: dbApp.applicant_name,
      physicalAddress: dbApp.physical_address,
      postalAddress: dbApp.postal_address,
      customerAccountNumber: dbApp.customer_account_number,
      cellularNumber: dbApp.cellular_number,
      numberOfBoreholes: dbApp.number_of_boreholes,
      landSize: dbApp.land_size,
      gpsLatitude: dbApp.gps_latitude,
      gpsLongitude: dbApp.gps_longitude,
      waterSource: dbApp.water_source,
      waterSourceDetails: dbApp.water_source_details,
      permitType: dbApp.permit_type,
      intendedUse: dbApp.intended_use,
      waterAllocation: dbApp.water_allocation,
      validityPeriod: dbApp.validity_period,
      comments: dbApp.comments,
      status: dbApp.status,
      currentStage: dbApp.current_stage,
      documents: [],
      workflowComments: [],
      createdAt: new Date(dbApp.created_at),
      updatedAt: new Date(dbApp.updated_at),
      submittedAt: dbApp.submitted_at ? new Date(dbApp.submitted_at) : undefined,
      approvedAt: dbApp.approved_at ? new Date(dbApp.approved_at) : undefined,
      rejectedAt: dbApp.rejected_at ? new Date(dbApp.rejected_at) : undefined,
    }
  }

  private static mapCommentFromDB(dbComment: any): WorkflowComment {
    return {
      id: dbComment.id,
      applicationId: dbComment.application_id,
      userId: dbComment.user_id,
      userType: dbComment.user_type,
      comment: dbComment.comment,
      stage: dbComment.stage,
      isRejectionReason: dbComment.is_rejection_reason,
      createdAt: new Date(dbComment.created_at),
    }
  }

  private static mapLogFromDB(dbLog: any): ActivityLog {
    return {
      id: dbLog.id,
      userId: dbLog.user_id,
      userType: dbLog.user_type,
      action: dbLog.action,
      details: dbLog.details,
      applicationId: dbLog.application_id,
      ipAddress: dbLog.ip_address,
      userAgent: dbLog.user_agent,
      timestamp: new Date(dbLog.timestamp),
    }
  }

  private static mapUserFromDB(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      userType: dbUser.user_type,
      password: "", // Never return password
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    }
  }

  private static mapDocumentFromDB(dbDoc: any): Document {
    return {
      id: dbDoc.id,
      applicationId: dbDoc.application_id,
      fileName: dbDoc.file_name,
      fileType: dbDoc.file_type,
      fileSize: dbDoc.file_size,
      documentType: dbDoc.document_type,
      fileUrl: dbDoc.file_url,
      uploadedAt: new Date(dbDoc.uploaded_at),
    }
  }

  private static mapMessageFromDB(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      senderId: dbMessage.sender_id,
      receiverId: dbMessage.receiver_id,
      subject: dbMessage.subject,
      message: dbMessage.message,
      isPublic: dbMessage.is_public,
      readAt: dbMessage.read_at ? new Date(dbMessage.read_at) : undefined,
      createdAt: new Date(dbMessage.created_at),
    }
  }
}
