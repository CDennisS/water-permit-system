export interface User {
  id: string
  username: string
  userType:
    | "permitting_officer"
    | "chairperson"
    | "catchment_manager"
    | "catchment_chairperson"
    | "permit_supervisor"
    | "ict"
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface PermitApplication {
  id: string
  applicationId: string
  applicantName: string
  physicalAddress: string
  postalAddress?: string
  customerAccountNumber?: string
  cellularNumber?: string
  permitType: string
  waterSource: string
  intendedUse: string
  numberOfBoreholes: number
  landSize: number
  waterAllocation: number
  gpsLatitude: number
  gpsLongitude: number
  status: "draft" | "pending" | "under_review" | "technical_review" | "approved" | "rejected" | "permit_issued"
  currentStage: number
  workflowComments: string[]
  documents?: Document[]
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
  approvedAt?: Date
  assignedTo?: string
  permitNumber?: string
}

export interface WorkflowComment {
  id: string
  applicationId: string
  userId: string
  userType: string
  comment: string
  stage: number
  createdAt: Date
  isRejectionReason: boolean
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  applicationId?: string
  details: string
  timestamp: Date
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  subject: string
  content: string
  applicationId?: string
  isPublic: boolean
  createdAt: Date
  readAt?: Date
}

export interface Document {
  id: string
  applicationId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
}

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
  boreholeDetails: BoreholeDetail[]
  issueDate: string
  gpsCoordinates: {
    latitude: string
    longitude: string
  }
  catchment: string
  subCatchment: string
  permitType: string
}

export interface BoreholeDetail {
  boreholeNumber: string
  allocatedAmount: number
  gpsX: string
  gpsY: string
  intendedUse: string
  maxAbstractionRate?: number
  waterSampleFrequency?: string
}
