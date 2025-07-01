export interface Application {
  id: string
  applicationId: string
  applicantName: string
  physicalAddress: string
  postalAddress?: string
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
  submittedAt?: Date | null
  approvedAt?: Date | null
  documents: Document[]
  comments: Comment[]
  intendedUse: string
  boreholes?: Borehole[]
}

export interface Borehole {
  id: string
  name: string
  depth: number
  diameter: number
  yieldRate: number
  staticWaterLevel: number
  pumpingWaterLevel: number
  coordinates: {
    latitude: number
    longitude: number
  }
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: Date
}

export interface Comment {
  id: string
  content: string
  author: string
  role: string
  stage: number
  createdAt: Date
}

export interface User {
  id: string
  name: string
  email: string
  role:
    | "permitting_officer"
    | "chairperson"
    | "catchment_manager"
    | "catchment_chairperson"
    | "permit_supervisor"
    | "ict"
  department?: string
}

export interface PermitData {
  permitNumber: string
  applicationId: string
  applicantName: string
  physicalAddress: string
  postalAddress?: string
  cellularNumber: string
  permitType: string
  waterAllocation: number
  landSize: number
  gpsLatitude: number
  gpsLongitude: number
  intendedUse: string
  issueDate: string
  expiryDate: string
  boreholes?: Borehole[]
}
