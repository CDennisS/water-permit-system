export interface Application {
  id: string
  applicationId: string
  applicantName: string
  physicalAddress: string
  customerAccountNumber: string
  cellularNumber: string
  permitType: "urban" | "irrigation" | "industrial"
  waterSource: "ground_water" | "surface_water"
  waterAllocation: number
  landSize: number
  gpsLatitude: number
  gpsLongitude: number
  status: "draft" | "submitted" | "approved" | "rejected"
  currentStage: number
  createdAt: Date
  updatedAt: Date
  submittedAt: Date | null
  approvedAt: Date | null
  documents: Document[]
  comments: Comment[]
  intendedUse: string
}

export interface Document {
  id: string
  applicationId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  uploadedBy: string
  documentType: "id_copy" | "proof_of_residence" | "site_plan" | "environmental_impact" | "other"
}

export interface Comment {
  id: string
  applicationId: string
  userId: string
  userName: string
  userRole: string
  content: string
  stage: number
  createdAt: Date
  isRequired: boolean
}

export interface User {
  id: string
  username: string
  email: string
  role:
    | "permitting_officer"
    | "chairperson"
    | "catchment_manager"
    | "catchment_chairperson"
    | "permit_supervisor"
    | "ict"
  firstName: string
  lastName: string
  createdAt: Date
  lastLogin: Date | null
  isActive: boolean
}

export interface ActivityLog {
  id: string
  applicationId: string
  userId: string
  userName: string
  action: string
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  applicationId?: string
  subject: string
  content: string
  isRead: boolean
  createdAt: Date
  readAt: Date | null
}

export interface SystemConfig {
  maxFileSize: number
  allowedFileTypes: string[]
  workflowStages: WorkflowStage[]
  notificationSettings: NotificationSettings
}

export interface WorkflowStage {
  stage: number
  name: string
  description: string
  requiredRole: string
  isCommentRequired: boolean
  canApprove: boolean
  canReject: boolean
}

export interface NotificationSettings {
  emailEnabled: boolean
  smsEnabled: boolean
  inAppEnabled: boolean
  reminderInterval: number
}

export interface ReportFilter {
  startDate?: Date
  endDate?: Date
  status?: string[]
  permitType?: string[]
  waterSource?: string[]
  searchTerm?: string
}

export interface ExportOptions {
  format: "csv" | "excel" | "pdf" | "json"
  includeDocuments: boolean
  includeComments: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}
