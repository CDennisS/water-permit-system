export interface User {
  id: string
  name: string
  email: string
  userType:
    | "applicant"
    | "permitting_officer"
    | "permit_supervisor"
    | "catchment_manager"
    | "catchment_chairperson"
    | "ict"
  createdAt: Date
  updatedAt: Date
}

export interface PermitApplication {
  id: string
  applicantName: string
  applicantEmail: string
  physicalAddress: string
  postalAddress?: string
  landSize: number
  numberOfBoreholes: number
  waterAllocation: number // in ML
  intendedUse: string
  gpsLatitude: number
  gpsLongitude: number
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "permit_issued"
  permitNumber?: string
  submittedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
  createdAt: Date
  updatedAt: Date
  documents: Document[]
  comments: Comment[]
}

export interface Document {
  id: string
  applicationId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  uploadedBy: string
}

export interface Comment {
  id: string
  applicationId: string
  userId: string
  userName: string
  content: string
  createdAt: Date
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
  issueDate: string
  gpsCoordinates: {
    latitude: number
    longitude: number
  }
  catchment: string
  subCatchment: string
  permitType: string
  boreholeDetails: BoreholeDetail[]
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

export interface Message {
  id: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  subject: string
  content: string
  isRead: boolean
  createdAt: Date
  applicationId?: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  applicationId?: string
  createdAt: Date
}
