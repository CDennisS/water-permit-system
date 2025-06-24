export interface User {
  id: string
  username: string
  userType: "admin" | "permitting_officer" | "applicant"
  createdAt: Date
  updatedAt: Date
}

export interface Application {
  id: string
  applicantId: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  status: "draft" | "submitted" | "approved" | "rejected"
  currentStage: number
  approvedAt?: Date
}

export const users: User[] = [
  {
    id: "1",
    username: "admin",
    userType: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    username: "applicant1",
    userType: "applicant",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    username: "applicant2",
    userType: "applicant",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const applications: Application[] = [
  {
    id: "1",
    applicantId: "2",
    name: "Application 1",
    description: "This is application 1",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "submitted",
    currentStage: 0,
  },
  {
    id: "2",
    applicantId: "2",
    name: "Application 2",
    description: "This is application 2",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "draft",
    currentStage: 0,
  },
  {
    id: "3",
    applicantId: "3",
    name: "Application 3",
    description: "This is application 3",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "submitted",
    currentStage: 0,
  },
]

// Update the first application to be approved
applications[0] = {
  ...applications[0],
  status: "approved",
  currentStage: 1,
  approvedAt: new Date("2024-01-15"),
}

// Add a permitting officer user for testing
const testPermittingOfficer: User = {
  id: "test-po-1",
  username: "test_officer",
  userType: "permitting_officer",
  createdAt: new Date(),
  updatedAt: new Date(),
}

users.push(testPermittingOfficer)
