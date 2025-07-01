export type UserType =
  | "permitting_officer"
  | "chairperson"
  | "catchment_manager"
  | "catchment_chairperson"
  | "permit_supervisor"
  | "ict"

export interface User {
  id: string
  username: string
  password: string
  userType: UserType
  createdAt: Date
  lastLogin?: Date
  isActive: boolean
}

export interface Application {
  id: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantAddress: string
  businessName: string
  businessType: string
  businessAddress: string
  permitType: string
  description: string
  status: "pending" | "under_review" | "approved" | "rejected"
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  comments?: string
  documents: Document[]
  catchmentArea?: string
  estimatedCost?: number
  validityPeriod?: string
  conditions?: string[]
}

export interface Document {
  id: string
  applicationId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  uploadedBy: string
  url: string
}

export interface Comment {
  id: string
  applicationId: string
  userId: string
  userType: UserType
  content: string
  createdAt: Date
  isInternal: boolean
}

export interface ActivityLog {
  id: string
  userId: string
  userType: UserType
  action: string
  details: string
  timestamp: Date
  applicationId?: string
}

export interface Message {
  id: string
  senderId: string
  receiverId?: string
  subject?: string
  content: string
  createdAt: Date
  readAt?: Date
  isPublic: boolean
  applicationId?: string
  messageType?: "system" | "user" | "notification"
}

export interface DashboardStats {
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  underReviewApplications: number
  recentApplications: Application[]
}

export interface ReportData {
  applications: Application[]
  period: string
  totalCount: number
  statusBreakdown: Record<string, number>
  typeBreakdown: Record<string, number>
  monthlyTrends: Array<{
    month: string
    count: number
  }>
}
