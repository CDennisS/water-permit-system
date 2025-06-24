export interface Application {
  id: string
  applicationId: string
  applicantName: string
  applicationDate: Date
  status: string
  assignedTo?: string
}

export interface User {
  id: string
  name: string
  email: string
  userType: string
}

export interface WorkflowComment {
  id: string
  applicationId: string
  userId: string
  userType: string
  stage: number
  comment: string
  isRejectionReason: boolean
  createdAt: Date
  updatedAt: Date
}

export class Database {
  applications: Application[] = []
  users: User[] = []
  workflowComments: WorkflowComment[] = []

  constructor() {
    // Sample Applications
    this.applications = [
      {
        id: "app-001",
        applicationId: "MC2024-0009",
        applicantName: "EcoFarms Ltd",
        applicationDate: new Date("2024-01-05"),
        status: "Under Review",
        assignedTo: "user-po-001",
      },
      {
        id: "app-002",
        applicationId: "MC2024-0013",
        applicantName: "AgriGrow Corp",
        applicationDate: new Date("2023-12-20"),
        status: "Rejected",
        assignedTo: "user-cm-001",
      },
      {
        id: "app-003",
        applicationId: "MC2024-0014",
        applicantName: "AquaSolutions Inc",
        applicationDate: new Date("2024-01-10"),
        status: "Approved",
        assignedTo: "user-cchair-001",
      },
    ]

    // Sample Users
    this.users = [
      {
        id: "user-po-001",
        name: "Jane Permitting",
        email: "jane.permitting@example.com",
        userType: "permitting_officer",
      },
      {
        id: "user-chair-001",
        name: "Bob Chairperson",
        email: "bob.chairperson@example.com",
        userType: "chairperson",
      },
      {
        id: "user-cm-001",
        name: "Alice Catchment",
        email: "alice.catchment@example.com",
        userType: "catchment_manager",
      },
      {
        id: "user-cchair-001",
        name: "Charlie CatchmentChair",
        email: "charlie.catchmentchair@example.com",
        userType: "catchment_chairperson",
      },
    ]

    // Seed sample comments for demonstration
    this.seedSampleComments()
  }

  async seedSampleComments() {
    // Add sample comments for MC2024-0013 (rejected application)
    const rejectedApp = this.applications.find((app) => app.applicationId === "MC2024-0013")
    if (rejectedApp) {
      // Clear existing comments first
      this.workflowComments = this.workflowComments.filter((c) => c.applicationId !== rejectedApp.id)

      // Stage 1: Permitting Officer
      this.workflowComments.push({
        id: "comment-001",
        applicationId: rejectedApp.id,
        userId: "user-po-001",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Initial review completed. Application documentation is complete and meets basic requirements. Water allocation request of 50 ML/annum appears reasonable for the intended agricultural use. GPS coordinates verified and fall within our jurisdiction. Forwarding to Chairperson for technical review.",
        isRejectionReason: false,
        createdAt: new Date("2024-01-15T10:30:00"),
        updatedAt: new Date("2024-01-15T10:30:00"),
      })

      // Stage 2: Chairperson
      this.workflowComments.push({
        id: "comment-002",
        applicationId: rejectedApp.id,
        userId: "user-chair-001",
        userType: "chairperson",
        comment:
          "Technical review completed. The proposed borehole locations are acceptable and the intended use aligns with catchment management objectives. Water allocation of 50 ML/annum is within sustainable limits for this area. Environmental impact appears minimal. Recommending approval and forwarding to Catchment Manager for final assessment.",
        isRejectionReason: false,
        stage: 2,
        createdAt: new Date("2024-01-16T14:15:00"),
        updatedAt: new Date("2024-01-16T14:15:00"),
      })

      // Stage 3: Catchment Manager (Rejection)
      this.workflowComments.push({
        id: "comment-003",
        applicationId: rejectedApp.id,
        userId: "user-cm-001",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "After detailed hydrological assessment, I must reject this application. The proposed extraction site is located within 500 meters of a protected wetland area, which violates our environmental protection guidelines. Additionally, recent groundwater studies indicate declining water table levels in this specific area, making additional extraction unsustainable. The cumulative impact of existing permits in this sub-catchment has already reached 85% of sustainable yield capacity. Recommend applicant to consider alternative sites at least 1km away from sensitive ecological areas.",
        isRejectionReason: true,
        createdAt: new Date("2024-01-18T09:45:00"),
        updatedAt: new Date("2024-01-18T09:45:00"),
      })
    }

    // Add sample comments for MC2024-0014 (approved application)
    const approvedApp = this.applications.find((app) => app.applicationId === "MC2024-0014")
    if (approvedApp) {
      // Clear existing comments first
      this.workflowComments = this.workflowComments.filter((c) => c.applicationId !== approvedApp.id)

      // Stage 1: Permitting Officer
      this.workflowComments.push({
        id: "comment-004",
        applicationId: approvedApp.id,
        userId: "user-po-001",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Application review completed successfully. All required documentation provided and verified. Applicant has demonstrated clear need for domestic water supply. Proposed extraction rate of 25 ML/annum is reasonable for household use. Site inspection confirms suitable location away from sensitive areas. Recommending for approval.",
        isRejectionReason: false,
        createdAt: new Date("2024-01-10T11:20:00"),
        updatedAt: new Date("2024-01-10T11:20:00"),
      })

      // Stage 2: Chairperson
      this.workflowComments.push({
        id: "comment-005",
        applicationId: approvedApp.id,
        userId: "user-chair-001",
        userType: "chairperson",
        stage: 2,
        comment:
          "Technical assessment confirms suitability of proposed borehole location. Geological survey indicates adequate groundwater availability. No conflicts with existing water rights in the area. Environmental impact assessment shows minimal ecological disruption. Water allocation of 25 ML/annum approved for domestic use. Forwarding to Catchment Manager with positive recommendation.",
        isRejectionReason: false,
        createdAt: new Date("2024-01-12T15:30:00"),
        updatedAt: new Date("2024-01-12T15:30:00"),
      })

      // Stage 3: Catchment Manager
      this.workflowComments.push({
        id: "comment-006",
        applicationId: approvedApp.id,
        userId: "user-cm-001",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "Comprehensive catchment assessment completed. The proposed extraction falls well within sustainable yield parameters for this sub-catchment. Current allocation in this area is only at 45% capacity, allowing for additional sustainable extraction. Hydrological modeling confirms no adverse impact on downstream users or ecological flows. Water quality testing indicates excellent groundwater quality suitable for domestic use. Strongly recommend approval. Forwarding to Catchment Chairperson for final authorization.",
        isRejectionReason: false,
        createdAt: new Date("2024-01-14T13:10:00"),
        updatedAt: new Date("2024-01-14T13:10:00"),
      })

      // Stage 4: Catchment Chairperson
      this.workflowComments.push({
        id: "comment-007",
        applicationId: approvedApp.id,
        userId: "user-cchair-001",
        userType: "catchment_chairperson",
        stage: 4,
        comment:
          "Final review completed. All technical, environmental, and regulatory requirements have been satisfied. The application demonstrates responsible water use planning and aligns with our catchment management strategy. Water allocation of 25 ML/annum approved for domestic use with standard conditions. Permit authorized for issuance with validity period of 5 years, subject to annual compliance monitoring.",
        isRejectionReason: false,
        createdAt: new Date("2024-01-16T16:45:00"),
        updatedAt: new Date("2024-01-16T16:45:00"),
      })
    }

    // Add sample comments for MC2024-0009 (under review)
    const underReviewApp = this.applications.find((app) => app.applicationId === "MC2024-0009")
    if (underReviewApp) {
      // Clear existing comments first
      this.workflowComments = this.workflowComments.filter((c) => c.applicationId !== underReviewApp.id)

      // Stage 1: Permitting Officer
      this.workflowComments.push({
        id: "comment-008",
        applicationId: underReviewApp.id,
        userId: "user-po-001",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Initial application review in progress. Documentation appears complete, however, requesting additional clarification on intended irrigation schedule and crop rotation plans. Water allocation of 75 ML/annum for commercial agriculture requires detailed justification. Site visit scheduled for next week to verify proposed borehole locations and assess local water table conditions.",
        isRejectionReason: false,
        createdAt: new Date("2024-01-20T09:15:00"),
        updatedAt: new Date("2024-01-20T09:15:00"),
      })

      // Stage 2: Chairperson
      this.workflowComments.push({
        id: "comment-009",
        applicationId: underReviewApp.id,
        userId: "user-chair-001",
        userType: "chairperson",
        stage: 2,
        comment:
          "Preliminary technical review indicates potential concerns with the high water allocation request. The proposed 75 ML/annum for 15 hectares of irrigation may exceed optimal water use efficiency standards. Requesting detailed irrigation system specifications and water conservation measures. Environmental impact assessment required due to proximity to seasonal wetlands. Awaiting additional documentation before proceeding.",
        isRejectionReason: false,
        createdAt: new Date("2024-01-22T14:20:00"),
        updatedAt: new Date("2024-01-22T14:20:00"),
      })
    }
  }
}
