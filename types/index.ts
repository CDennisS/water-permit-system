export interface User {
  id: string
  username: string
  userType: UserType
  password?: string // Optional for security, only used during creation/updates
  createdAt: Date
  updatedAt: Date
}

export type UserType =
  | "applicant"
  | "permitting_officer"
  | "permit_supervisor"
  | "catchment_manager"
  | "catchment_chairperson"
  | "ict"

export interface PermitApplication {
  id: string
  applicationNumber: string
  applicantName: string
  applicantId: string
  physicalAddress: string
  postalAddress?: string
  landSize: number
  numberOfBoreholes: number
  waterAllocation: number // in ML
  intendedUse: string
  gpsLatitude: number
  gpsLongitude: number
  status: ApplicationStatus
  submittedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  permitNumber?: string
  documents: ApplicationDocument[]
  comments: ApplicationComment[]
  workflowStage: WorkflowStage
}

export type ApplicationStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "permit_issued"

export type WorkflowStage =
  | "application_submitted"
  | "technical_review"
  | "supervisor_review"
  | "manager_approval"
  | "chairperson_approval"
  | "permit_issued"
  | "rejected"

export interface ApplicationDocument {
  id: string
  applicationId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  uploadedBy: string
  documentType: DocumentType
}

export type DocumentType =
  | "application_form"
  | "site_plan"
  | "water_impact_assessment"
  | "environmental_clearance"
  | "proof_of_ownership"
  | "other"

export interface ApplicationComment {
  id: string
  applicationId: string
  userId: string
  userType: UserType
  comment: string
  commentType: CommentType
  createdAt: Date
  isInternal: boolean
}

export type CommentType = "general" | "technical_review" | "approval" | "rejection" | "clarification_request"

export interface PermitData {
  permitNumber: string
  applicantName: string
  physicalAddress: string
  postalAddress?: string
  landSize: number
  numberOfBoreholes: number
  totalAllocatedAbstraction: number
  intendedUse: string
  validUntil: string
  issueDate: string
  boreholeDetails: BoreholeDetail[]
  gpsCoordinates: {
    latitude: number
    longitude: number
  }
  catchment: string
  subCatchment: string
  permitType: "temporary" | "provisional"
}

export interface BoreholeDetail {
  boreholeNumber: string
  allocatedAmount: number
  gpsX: string
  gpsY: string
  intendedUse: string
  maxAbstractionRate: number
  waterSampleFrequency: string
}

export interface ActivityLog {
  id: string
  userId: string
  userType: UserType
  action: string
  description: string
  timestamp: Date
  applicationId?: string
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  subject: string
  content: string
  sentAt: Date
  readAt?: Date
  applicationId?: string
  messageType: MessageType
}

export type MessageType =
  | "general"
  | "application_update"
  | "approval_notification"
  | "rejection_notification"
  | "clarification_request"
  | "system_notification"
