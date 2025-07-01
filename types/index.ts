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
  | "chairperson"
  | "catchment_manager"
  | "catchment_chairperson"
  | "permit_supervisor"
  | "ict"

export interface PermitApplication {
  id: string
  applicationId: string
  applicantName: string
  physicalAddress: string
  postalAddress?: string
  customerAccountNumber: string
  cellularNumber: string
  permitType: string
  waterSource: string
  intendedUse: string
  numberOfBoreholes: number
  landSize: number
  waterAllocation: number
  gpsLatitude: number
  gpsLongitude: number
  status: ApplicationStatus
  currentStage: number
  workflowComments: WorkflowComment[]
  documents?: Document[]
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
  approvedAt?: Date
  assignedTo?: string
}

export type ApplicationStatus =
  | "draft"
  | "pending"
  | "submitted"
  | "under_review"
  | "technical_review"
  | "approved"
  | "rejected"
  | "permit_issued"

export interface WorkflowComment {
  id: string
  applicationId: string
  userId: string
  userType: UserType
  comment: string
  stage: number
  createdAt: Date
  isRejectionReason: boolean
}

export interface Document {
  id: string
  applicationId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
}

export interface ActivityLog {
  id: string
  userId: string
  userType?: UserType
  action: string
  details: string
  timestamp: Date
  applicationId?: string
}

export interface Message {
  id: string
  senderId: string
  receiverId?: string
  content: string
  isPublic: boolean
  createdAt: Date
  readAt?: Date
  applicationId?: string
  subject?: string
}

export type MessageType =
  | "general"
  | "application_update"
  | "approval_notification"
  | "rejection_notification"
  | "clarification_request"
  | "system_notification"

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
