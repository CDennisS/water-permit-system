import type { PermitApplication, User, WorkflowComment, ActivityLog, Message, Document } from "@/types"

/* -------------------------------------------------------------------------- */
/* In-memory database – swap for Supabase or another store in production.     */
/* -------------------------------------------------------------------------- */

class MockDatabase {
  /* ───────────────────────────── Storage ──────────────────────────────── */
  private applications: PermitApplication[] = []
  private users: User[] = []
  private comments: WorkflowComment[] = []
  private logs: ActivityLog[] = []
  private messages: Message[] = []
  private documents: Document[] = []

  private applicationCounter = 1

  constructor() {
    this.seedUsers()
    this.seedSampleApplications()
  }

  /* ---------------------------------------------------------------------- */
  /*                                  SEED                                  */
  /* ---------------------------------------------------------------------- */

  private seedUsers() {
    const baseDate = new Date()
    this.users = [
      {
        id: "1",
        username: "admin",
        userType: "permitting_officer",
        password: "admin",
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: "2",
        username: "chair",
        userType: "chairperson",
        password: "admin",
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: "3",
        username: "cmgr",
        userType: "catchment_manager",
        password: "admin",
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: "4",
        username: "cchair",
        userType: "catchment_chairperson",
        password: "admin",
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: "5",
        username: "psup",
        userType: "permit_supervisor",
        password: "admin",
        createdAt: baseDate,
        updatedAt: baseDate,
      },
      {
        id: "6",
        username: "umsccict2025",
        userType: "ict",
        password: "umsccict2025",
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]
  }

  private seedSampleApplications() {
    const now = new Date()
    const sample: PermitApplication[] = [
      {
        id: "app_1",
        applicationId: "MC2024-0001",
        applicantName: "John Smith",
        customerAccountNumber: "ACC001234",
        cellularNumber: "0712345678",
        physicalAddress: "123 Main St, Harare",
        postalAddress: "PO Box 1234, Harare",
        permitType: "borehole",
        intendedUse: "Domestic water supply",
        landSize: 0.5,
        numberOfBoreholes: 1,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        waterSource: "Groundwater",
        waterAllocation: 2.5,
        validityPeriod: 5,
        status: "approved",
        currentStage: 6,
        createdBy: "1",
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
        approvedAt: now,
      },
      {
        id: "app_2",
        applicationId: "MC2024-0002",
        applicantName: "Mary Johnson",
        customerAccountNumber: "ACC005678",
        cellularNumber: "0723456789",
        physicalAddress: "456 Oak Ave, Bulawayo",
        postalAddress: "PO Box 5678, Bulawayo",
        permitType: "surface_water",
        intendedUse: "Commercial irrigation",
        landSize: 15,
        numberOfBoreholes: 0,
        gpsLatitude: -20.1504,
        gpsLongitude: 28.5906,
        waterSource: "Seasonal river",
        waterAllocation: 45,
        validityPeriod: 10,
        status: "under_review",
        currentStage: 4,
        createdBy: "1",
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
      },
      // add three more to make five total
      {
        id: "app_3",
        applicationId: "MC2024-0003",
        applicantName: "Robert Wilson",
        customerAccountNumber: "ACC009876",
        cellularNumber: "0734567890",
        physicalAddress: "789 Pine Rd, Mutare",
        postalAddress: "PO Box 9876, Mutare",
        permitType: "borehole",
        intendedUse: "Industrial supply",
        landSize: 2.0,
        numberOfBoreholes: 3,
        gpsLatitude: -18.9707,
        gpsLongitude: 32.6731,
        waterSource: "Deep aquifer",
        waterAllocation: 12,
        validityPeriod: 7,
        status: "submitted",
        currentStage: 2,
        createdBy: "1",
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
      },
      {
        id: "app_4",
        applicationId: "MC2024-0004",
        applicantName: "Sarah Davis",
        customerAccountNumber: "ACC004321",
        cellularNumber: "0745678901",
        physicalAddress: "321 Cedar St, Gweru",
        postalAddress: "PO Box 4321, Gweru",
        permitType: "surface_water",
        intendedUse: "Municipal expansion",
        landSize: 0.8,
        numberOfBoreholes: 0,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        waterSource: "Reservoir",
        waterAllocation: 25,
        validityPeriod: 15,
        status: "rejected",
        currentStage: 5,
        createdBy: "1",
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
      },
      {
        id: "app_5",
        applicationId: "MC2024-0005",
        applicantName: "Michael Brown",
        customerAccountNumber: "ACC007890",
        cellularNumber: "0756789012",
        physicalAddress: "654 Birch Ln, Masvingo",
        postalAddress: "PO Box 7890, Masvingo",
        permitType: "borehole",
        intendedUse: "Crop irrigation",
        landSize: 8.5,
        numberOfBoreholes: 2,
        gpsLatitude: -20.0637,
        gpsLongitude: 30.8267,
        waterSource: "Intermediate aquifer",
        waterAllocation: 18.5,
        validityPeriod: 8,
        status: "unsubmitted",
        currentStage: 1,
        createdBy: "1",
        createdAt: now,
        updatedAt: now,
      },
    ]

    this.applications = sample
    this.applicationCounter = sample.length + 1
  }

  /* ---------------------------------------------------------------------- */
  /*                            APPLICATION CRUD                            */
  /* ---------------------------------------------------------------------- */

  async createApplication(
    data: Omit<PermitApplication, "id" | "applicationId" | "createdAt" | "updatedAt">,
  ): Promise<PermitApplication> {
    const application: PermitApplication = {
      ...data,
      id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      applicationId: `MC${new Date().getFullYear()}-${String(this.applicationCounter++).padStart(4, "0")}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.applications.push(application)
    return application
  }

  async getApplications(filters?: { status?: string }): Promise<PermitApplication[]> {
    let filtered = [...this.applications]
    if (filters?.status) filtered = filtered.filter((a) => a.status === filters.status)
    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async getApplicationById(id: string) {
    return this.applications.find((a) => a.id === id) ?? null
  }

  /* ––– additional CRUD (comments, logs, messages, docs) omitted for brevity ––– */
}

/* -------------------------------------------------------------------------- */
/*                               SINGLETON EXPORT                             */
/* -------------------------------------------------------------------------- */

export const db = new MockDatabase()
