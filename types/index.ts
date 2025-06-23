export interface User {
  id: string
  username: string
  userType: UserType
  password?: string // Optional for security, only used during creation/updates
  createdAt: Date
  updatedAt: Date
}

export interface PermitApplication {
  id: string
  applicationId: string
  applicantName: string
  physicalAddress: string
  postalAddress: string
  customerAccountNumber: string
  cellularNumber: string
  numberOfBoreholes: number
  landSize: number
  gpsLatitude: number
  gpsLongitude: number
  waterSource: string
  waterSourceDetails: string
  permitType: string
  intendedUse: string
  waterAllocation: number
  validityPeriod: number
  comments: string
  status: "unsubmitted" | "submitted" | "under_review" | "approved" | "rejected"
  currentStage: number
  documents: Document[]
  workflowComments: WorkflowComment[]
  createdBy?: string // Make sure this field exists
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
  approvedAt?: Date
}

export type UserType =
  | "permitting_officer"
  | "chairperson"
  | "catchment_manager"
  | "catchment_chairperson"
  | "permit_supervisor"
  | "ict"

export interface WorkflowComment {
  id: string
  applicationId: string
  userId: string
  userType: UserType
  stage: number
  comment: string
  action: "approve" | "reject" | "request_changes" | "comment"
  createdAt: Date
}

export interface ActivityLog {
  id: string
  userId: string
  userType: UserType
  action: string
  details: string
  applicationId?: string
  timestamp: Date
}

export interface Message {
  id: string
  senderId: string
  receiverId?: string
  subject: string
  content: string
  isPublic: boolean
  applicationId?: string
  createdAt: Date
  readAt?: Date
}

export interface Document {
  id: string
  applicationId: string
  fileName: string
  fileType: string
  fileSize: number
  documentType: string
  uploadedAt: Date
}
