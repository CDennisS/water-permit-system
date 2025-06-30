import type { PermitApplication, User, WorkflowComment, ActivityLog, Message, Document } from "@/types"

/* -------------------------------------------------------------------------- */
/*                             In-memory database                             */
/*   In production replace with Supabase or another persistent datastore.     */
/* -------------------------------------------------------------------------- */

class MockDatabase {
  /* ──────────────────────────── core storage ────────────────────────────── */
  private applications: PermitApplication[] = []
  private users: User[] = [
    // Permitting Officers
    {
      id: "1",
      username: "john.officer",
      userType: "permitting_officer",
      password: "officer123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "7",
      username: "mary.permits",
      userType: "permitting_officer",
      password: "permits123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Chairpersons
    {
      id: "2",
      username: "peter.chair",
      userType: "chairperson",
      password: "chair123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "8",
      username: "grace.chairman",
      userType: "chairperson",
      password: "chairman123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Catchment Managers
    {
      id: "3",
      username: "james.catchment",
      userType: "catchment_manager",
      password: "catchment123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "9",
      username: "linda.manager",
      userType: "catchment_manager",
      password: "manager123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Catchment Chairpersons
    {
      id: "4",
      username: "robert.catchchair",
      userType: "catchment_chairperson",
      password: "catchchair123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Permit Supervisors
    {
      id: "5",
      username: "sarah.supervisor",
      userType: "permit_supervisor",
      password: "supervisor123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "10",
      username: "michael.super",
      userType: "permit_supervisor",
      password: "super123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ICT Users
    {
      id: "6",
      username: "umsccict2025",
      userType: "ict",
      password: "umsccict2025",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "11",
      username: "admin.ict",
      userType: "ict",
      password: "ictadmin123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Test Admin Account
    {
      id: "12",
      username: "testuser",
      userType: "permitting_officer",
      password: "test123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
  private comments: WorkflowComment[] = []
  private logs: ActivityLog[] = []
  private messages: Message[] = []
  private documents: Document[] = []

  private applicationCounter = 1

  // Add mock data for permitting officer testing
  private initializePermittingOfficerMockData() {
    // Mock applications for testing
    const mockApplications: PermitApplication[] = [
      // DRAFT APPLICATIONS (4) - Unsubmitted applications for testing
      {
        id: "app_draft_001",
        applicationId: "DRAFT-001",
        applicantName: "Thomas Mutasa",
        physicalAddress: "45 Garden Road, Harare",
        postalAddress: "P.O. Box 445, Harare",
        customerAccountNumber: "ACC445",
        cellularNumber: "+263771234567",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Domestic use",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 1200,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-10"),
        submittedAt: undefined,
      },
      {
        id: "app_draft_002",
        applicationId: "DRAFT-002",
        applicantName: "Jennifer Chikwanha",
        physicalAddress: "78 Sunrise Avenue, Chitungwiza",
        postalAddress: "P.O. Box 778, Chitungwiza",
        customerAccountNumber: "ACC778",
        cellularNumber: "+263772345678",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Small scale irrigation",
        numberOfBoreholes: 0,
        landSize: 20,
        waterAllocation: 2000,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-08"),
        updatedAt: new Date("2024-03-09"),
        submittedAt: undefined,
      },
      {
        id: "app_draft_003",
        applicationId: "DRAFT-003",
        applicantName: "Patrick Nyamande",
        physicalAddress: "12 Industrial Road, Gweru",
        postalAddress: "P.O. Box 112, Gweru",
        customerAccountNumber: "ACC112",
        cellularNumber: "+263773456789",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Commercial farming",
        numberOfBoreholes: 3,
        landSize: 75,
        waterAllocation: 8000,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-03-07"),
        submittedAt: undefined,
      },
      {
        id: "app_draft_004",
        applicationId: "DRAFT-004",
        applicantName: "Susan Moyo",
        physicalAddress: "67 Valley Drive, Mutare",
        postalAddress: "P.O. Box 567, Mutare",
        customerAccountNumber: "ACC567",
        cellularNumber: "+263774567890",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Livestock watering",
        numberOfBoreholes: 0,
        landSize: 30,
        waterAllocation: 3500,
        gpsLatitude: -18.9707,
        gpsLongitude: 32.6731,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-12"),
        updatedAt: new Date("2024-03-12"),
        submittedAt: undefined,
      },

      // PENDING APPLICATIONS (4) - Stage 1: Permitting Officer Review
      {
        id: "app_pending_001",
        applicationId: "MC2024-0001",
        applicantName: "John Mukamuri",
        physicalAddress: "123 Main Street, Harare",
        postalAddress: "P.O. Box 123, Harare",
        customerAccountNumber: "ACC001",
        cellularNumber: "+263771234567",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Irrigation for commercial farming",
        numberOfBoreholes: 2,
        landSize: 50,
        waterAllocation: 5000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
        submittedAt: new Date("2024-03-01"),
      },
      {
        id: "app_pending_002",
        applicationId: "MC2024-0002",
        applicantName: "Mary Chikwanha",
        physicalAddress: "456 Oak Avenue, Chitungwiza",
        postalAddress: "P.O. Box 456, Chitungwiza",
        customerAccountNumber: "ACC002",
        cellularNumber: "+263772345678",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Domestic and livestock watering",
        numberOfBoreholes: 0,
        landSize: 25,
        waterAllocation: 2500,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-02"),
        updatedAt: new Date("2024-03-02"),
        submittedAt: new Date("2024-03-02"),
      },
      {
        id: "app_pending_003",
        applicationId: "MC2024-0003",
        applicantName: "Robert Chigumba",
        physicalAddress: "89 Farm Road, Masvingo",
        postalAddress: "P.O. Box 189, Masvingo",
        customerAccountNumber: "ACC189",
        cellularNumber: "+263775678901",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Horticulture production",
        numberOfBoreholes: 1,
        landSize: 40,
        waterAllocation: 4500,
        gpsLatitude: -20.0637,
        gpsLongitude: 30.8956,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-02-28"),
        updatedAt: new Date("2024-02-28"),
        submittedAt: new Date("2024-02-28"),
      },
      {
        id: "app_pending_004",
        applicationId: "MC2024-0004",
        applicantName: "Elizabeth Banda",
        physicalAddress: "234 River Street, Kadoma",
        postalAddress: "P.O. Box 234, Kadoma",
        customerAccountNumber: "ACC234",
        cellularNumber: "+263776789012",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Small scale mining operations",
        numberOfBoreholes: 0,
        landSize: 15,
        waterAllocation: 2000,
        gpsLatitude: -18.3328,
        gpsLongitude: 29.9154,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-02-25"),
        updatedAt: new Date("2024-02-25"),
        submittedAt: new Date("2024-02-25"),
      },

      // UNDER REVIEW APPLICATIONS (4) - Stage 2: Chairperson Review
      {
        id: "app_review_001",
        applicationId: "MC2024-0005",
        applicantName: "James Mpofu",
        physicalAddress: "345 Highland Avenue, Bulawayo",
        postalAddress: "P.O. Box 345, Bulawayo",
        customerAccountNumber: "ACC345",
        cellularNumber: "+263777890123",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Commercial poultry farming",
        numberOfBoreholes: 2,
        landSize: 35,
        waterAllocation: 4000,
        gpsLatitude: -20.1594,
        gpsLongitude: 28.5906,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-02-22"),
        submittedAt: new Date("2024-02-20"),
      },
      {
        id: "app_review_002",
        applicationId: "MC2024-0006",
        applicantName: "Grace Sibanda",
        physicalAddress: "678 Market Street, Gwanda",
        postalAddress: "P.O. Box 678, Gwanda",
        customerAccountNumber: "ACC678",
        cellularNumber: "+263778901234",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Irrigation for vegetable production",
        numberOfBoreholes: 0,
        landSize: 20,
        waterAllocation: 2800,
        gpsLatitude: -20.9364,
        gpsLongitude: 29.0094,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-18"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-02-18"),
      },
      {
        id: "app_review_003",
        applicationId: "MC2024-0008",
        applicantName: "Peter Ncube",
        physicalAddress: "901 Church Road, Kwekwe",
        postalAddress: "P.O. Box 901, Kwekwe",
        customerAccountNumber: "ACC901",
        cellularNumber: "+263779012345",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Dairy farming operations",
        numberOfBoreholes: 1,
        landSize: 60,
        waterAllocation: 6500,
        gpsLatitude: -18.9167,
        gpsLongitude: 29.8167,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-17"),
        submittedAt: new Date("2024-02-15"),
      },
      {
        id: "app_review_004",
        applicationId: "MC2024-0009",
        applicantName: "Margaret Dube",
        physicalAddress: "123 School Lane, Chiredzi",
        postalAddress: "P.O. Box 123, Chiredzi",
        customerAccountNumber: "ACC123",
        cellularNumber: "+263770123456",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Sugarcane irrigation",
        numberOfBoreholes: 0,
        landSize: 100,
        waterAllocation: 12000,
        gpsLatitude: -21.0504,
        gpsLongitude: 31.6704,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-12"),
        updatedAt: new Date("2024-02-14"),
        submittedAt: new Date("2024-02-12"),
      },

      // FINAL REVIEW APPLICATIONS (4) - Stage 3: Catchment Manager Review
      {
        id: "app_final_001",
        applicationId: "MC2024-0010",
        applicantName: "David Mutasa",
        physicalAddress: "456 Forest Drive, Chipinge",
        postalAddress: "P.O. Box 456, Chipinge",
        customerAccountNumber: "ACC456",
        cellularNumber: "+263771234567",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Tea plantation irrigation",
        numberOfBoreholes: 3,
        landSize: 80,
        waterAllocation: 9000,
        gpsLatitude: -20.1881,
        gpsLongitude: 32.6236,
        status: "final_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-02-08"),
        updatedAt: new Date("2024-02-10"),
        submittedAt: new Date("2024-02-08"),
      },
      {
        id: "app_final_002",
        applicationId: "MC2024-0011",
        applicantName: "Joyce Makoni",
        physicalAddress: "789 Valley Road, Rusape",
        postalAddress: "P.O. Box 789, Rusape",
        customerAccountNumber: "ACC789",
        cellularNumber: "+263772345678",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Fish farming operations",
        numberOfBoreholes: 0,
        landSize: 25,
        waterAllocation: 3000,
        gpsLatitude: -18.5269,
        gpsLongitude: 32.1256,
        status: "final_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-02-05"),
        updatedAt: new Date("2024-02-07"),
        submittedAt: new Date("2024-02-05"),
      },
      {
        id: "app_final_003",
        applicationId: "MC2024-0013",
        applicantName: "Simon Chinyoka",
        physicalAddress: "321 Mine Road, Shurugwi",
        postalAddress: "P.O. Box 321, Shurugwi",
        customerAccountNumber: "ACC321",
        cellularNumber: "+263773456789",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Chrome mining operations",
        numberOfBoreholes: 2,
        landSize: 45,
        waterAllocation: 5500,
        gpsLatitude: -19.6667,
        gpsLongitude: 30.0167,
        status: "final_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-03"),
        submittedAt: new Date("2024-02-01"),
      },
      {
        id: "app_final_004",
        applicationId: "MC2024-0015",
        applicantName: "Patience Mukamuri",
        physicalAddress: "654 Township Road, Gokwe",
        postalAddress: "P.O. Box 654, Gokwe",
        customerAccountNumber: "ACC654",
        cellularNumber: "+263774567890",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Cotton farming irrigation",
        numberOfBoreholes: 0,
        landSize: 90,
        waterAllocation: 10000,
        gpsLatitude: -18.2044,
        gpsLongitude: 28.9344,
        status: "final_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-01-28"),
        updatedAt: new Date("2024-01-30"),
        submittedAt: new Date("2024-01-28"),
      },

      // APPROVED APPLICATIONS (4) - Ready for permit printing
      {
        id: "app_approved_001",
        applicationId: "MC2024-0014",
        applicantName: "Sarah Wilson",
        physicalAddress: "456 Oak Avenue, Chitungwiza",
        postalAddress: "P.O. Box 456, Chitungwiza",
        customerAccountNumber: "ACC014",
        cellularNumber: "+263772345678",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Domestic and livestock watering",
        numberOfBoreholes: 1,
        landSize: 25,
        waterAllocation: 2500,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-02-15"),
        submittedAt: new Date("2024-01-10"),
        approvedAt: new Date("2024-02-15"),
      },
      {
        id: "app_approved_002",
        applicationId: "MC2024-0021",
        applicantName: "Grace Mukamuri",
        physicalAddress: "321 River View, Norton",
        postalAddress: "P.O. Box 321, Norton",
        customerAccountNumber: "ACC021",
        cellularNumber: "+263774567890",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Small scale irrigation",
        numberOfBoreholes: 1,
        landSize: 15,
        waterAllocation: 1500,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-02-01"),
        approvedAt: new Date("2024-02-20"),
      },
      {
        id: "app_approved_003",
        applicationId: "MC2024-0016",
        applicantName: "Charles Mujuru",
        physicalAddress: "987 Commercial Avenue, Marondera",
        postalAddress: "P.O. Box 987, Marondera",
        customerAccountNumber: "ACC987",
        cellularNumber: "+263775678901",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Flower farming for export",
        numberOfBoreholes: 2,
        landSize: 30,
        waterAllocation: 3500,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-02-18"),
        submittedAt: new Date("2024-01-25"),
        approvedAt: new Date("2024-02-18"),
      },
      {
        id: "app_approved_004",
        applicationId: "MC2024-0017",
        applicantName: "Tendai Nyamande",
        physicalAddress: "147 Industrial Park, Gweru",
        postalAddress: "P.O. Box 147, Gweru",
        customerAccountNumber: "ACC147",
        cellularNumber: "+263776789012",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Textile manufacturing",
        numberOfBoreholes: 0,
        landSize: 10,
        waterAllocation: 1800,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-12"),
        submittedAt: new Date("2024-01-20"),
        approvedAt: new Date("2024-02-12"),
      },

      // REJECTED APPLICATIONS (4) - For testing rejected comments printing
      {
        id: "app_rejected_001",
        applicationId: "MC2024-0007",
        applicantName: "Michael Brown",
        physicalAddress: "789 Pine Road, Marondera",
        postalAddress: "P.O. Box 789, Marondera",
        customerAccountNumber: "ACC007",
        cellularNumber: "+263773456789",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Industrial processing",
        numberOfBoreholes: 0,
        landSize: 100,
        waterAllocation: 15000,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "rejected",
        currentStage: 3,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-10"),
        submittedAt: new Date("2024-01-20"),
      },
      {
        id: "app_rejected_002",
        applicationId: "MC2024-0012",
        applicantName: "David Madziva",
        physicalAddress: "147 Commercial Street, Bulawayo",
        postalAddress: "P.O. Box 147, Bulawayo",
        customerAccountNumber: "ACC012",
        cellularNumber: "+263777890123",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Commercial car wash",
        numberOfBoreholes: 2,
        landSize: 5,
        waterAllocation: 8000,
        gpsLatitude: -20.1594,
        gpsLongitude: 28.5906,
        status: "rejected",
        currentStage: 2,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-05"),
        submittedAt: new Date("2024-01-15"),
      },
      {
        id: "app_rejected_003",
        applicationId: "MC2024-0018",
        applicantName: "Francis Chigumba",
        physicalAddress: "258 Mining Road, Bindura",
        postalAddress: "P.O. Box 258, Bindura",
        customerAccountNumber: "ACC258",
        cellularNumber: "+263778901234",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Gold mining operations",
        numberOfBoreholes: 4,
        landSize: 200,
        waterAllocation: 25000,
        gpsLatitude: -17.3019,
        gpsLongitude: 31.3275,
        status: "rejected",
        currentStage: 3,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-02-08"),
        submittedAt: new Date("2024-01-12"),
      },
      {
        id: "app_rejected_004",
        applicationId: "MC2024-0019",
        applicantName: "Stella Moyo",
        physicalAddress: "369 Factory Street, Redcliff",
        postalAddress: "P.O. Box 369, Redcliff",
        customerAccountNumber: "ACC369",
        cellularNumber: "+263779012345",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Steel production facility",
        numberOfBoreholes: 0,
        landSize: 50,
        waterAllocation: 18000,
        gpsLatitude: -19.0333,
        gpsLongitude: 29.7833,
        status: "rejected",
        currentStage: 1,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-08"),
        updatedAt: new Date("2024-01-25"),
        submittedAt: new Date("2024-01-08"),
      },
    ]

    // Mock comments for the applications
    const mockComments: WorkflowComment[] = [
      // Comments for pending applications (Stage 1)
      {
        id: "comment_pending_001",
        applicationId: "app_pending_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Application received and under initial review. Checking documentation completeness.",
        stage: 1,
        createdAt: new Date("2024-03-01"),
        isRejectionReason: false,
      },
      {
        id: "comment_pending_002",
        applicationId: "app_pending_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Surface water extraction application under review. Assessing environmental impact requirements.",
        stage: 1,
        createdAt: new Date("2024-03-02"),
        isRejectionReason: false,
      },
      {
        id: "comment_pending_003",
        applicationId: "app_pending_003",
        userId: "7",
        userType: "permitting_officer",
        comment: "Horticulture application received. Reviewing water allocation requirements for proposed land size.",
        stage: 1,
        createdAt: new Date("2024-02-28"),
        isRejectionReason: false,
      },
      {
        id: "comment_pending_004",
        applicationId: "app_pending_004",
        userId: "7",
        userType: "permitting_officer",
        comment: "Mining operation water extraction under review. Checking compliance with environmental regulations.",
        stage: 1,
        createdAt: new Date("2024-02-25"),
        isRejectionReason: false,
      },

      // Comments for under review applications (Stage 2)
      {
        id: "comment_review_001",
        applicationId: "app_review_001",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Initial review completed. Documentation adequate. Forwarding to chairperson for technical assessment.",
        stage: 1,
        createdAt: new Date("2024-02-21"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_002",
        applicationId: "app_review_001",
        userId: "2",
        userType: "chairperson",
        comment: "Technical review in progress. Poultry farming water requirements being assessed for sustainability.",
        stage: 2,
        createdAt: new Date("2024-02-22"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_003",
        applicationId: "app_review_002",
        userId: "7",
        userType: "permitting_officer",
        comment: "Vegetable production irrigation application reviewed. All documentation in order.",
        stage: 1,
        createdAt: new Date("2024-02-19"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_004",
        applicationId: "app_review_002",
        userId: "8",
        userType: "chairperson",
        comment:
          "Surface water allocation for vegetable irrigation under technical review. Assessing downstream impact.",
        stage: 2,
        createdAt: new Date("2024-02-20"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_005",
        applicationId: "app_review_003",
        userId: "1",
        userType: "permitting_officer",
        comment: "Dairy farming operation reviewed. Water allocation appropriate for livestock numbers.",
        stage: 1,
        createdAt: new Date("2024-02-16"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_006",
        applicationId: "app_review_003",
        userId: "2",
        userType: "chairperson",
        comment: "Dairy farming water extraction under technical evaluation. Checking groundwater sustainability.",
        stage: 2,
        createdAt: new Date("2024-02-17"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_007",
        applicationId: "app_review_004",
        userId: "7",
        userType: "permitting_officer",
        comment:
          "Large scale sugarcane irrigation application under review. High water allocation requires detailed assessment.",
        stage: 1,
        createdAt: new Date("2024-02-13"),
        isRejectionReason: false,
      },
      {
        id: "comment_review_008",
        applicationId: "app_review_004",
        userId: "8",
        userType: "chairperson",
        comment:
          "Sugarcane irrigation project under technical review. Assessing water availability and environmental impact.",
        stage: 2,
        createdAt: new Date("2024-02-14"),
        isRejectionReason: false,
      },

      // Comments for final review applications (Stage 3)
      {
        id: "comment_final_001",
        applicationId: "app_final_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Tea plantation irrigation application reviewed and approved at initial stage.",
        stage: 1,
        createdAt: new Date("2024-02-08"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_002",
        applicationId: "app_final_001",
        userId: "2",
        userType: "chairperson",
        comment:
          "Technical review completed. Tea plantation water allocation sustainable. Recommended for final approval.",
        stage: 2,
        createdAt: new Date("2024-02-09"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_003",
        applicationId: "app_final_001",
        userId: "3",
        userType: "catchment_manager",
        comment: "Final review in progress. Assessing cumulative impact on catchment water resources.",
        stage: 3,
        createdAt: new Date("2024-02-10"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_004",
        applicationId: "app_final_002",
        userId: "7",
        userType: "permitting_officer",
        comment: "Fish farming operation reviewed. Water circulation system adequate for proposed operations.",
        stage: 1,
        createdAt: new Date("2024-02-05"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_005",
        applicationId: "app_final_002",
        userId: "8",
        userType: "chairperson",
        comment: "Aquaculture project technically sound. Water quality management plan approved.",
        stage: 2,
        createdAt: new Date("2024-02-06"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_006",
        applicationId: "app_final_002",
        userId: "9",
        userType: "catchment_manager",
        comment: "Fish farming project under final catchment assessment. Reviewing water return quality standards.",
        stage: 3,
        createdAt: new Date("2024-02-07"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_007",
        applicationId: "app_final_003",
        userId: "1",
        userType: "permitting_officer",
        comment: "Chrome mining water extraction reviewed. Industrial water treatment plan adequate.",
        stage: 1,
        createdAt: new Date("2024-02-01"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_008",
        applicationId: "app_final_003",
        userId: "2",
        userType: "chairperson",
        comment: "Mining operation water use approved at technical level. Environmental safeguards in place.",
        stage: 2,
        createdAt: new Date("2024-02-02"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_009",
        applicationId: "app_final_003",
        userId: "3",
        userType: "catchment_manager",
        comment: "Mining water extraction under final review. Assessing long-term groundwater impact.",
        stage: 3,
        createdAt: new Date("2024-02-03"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_010",
        applicationId: "app_final_004",
        userId: "7",
        userType: "permitting_officer",
        comment:
          "Cotton farming irrigation application reviewed. Large scale operation requires careful water management.",
        stage: 1,
        createdAt: new Date("2024-01-28"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_011",
        applicationId: "app_final_004",
        userId: "8",
        userType: "chairperson",
        comment: "Cotton irrigation project technically approved. Water efficiency measures implemented.",
        stage: 2,
        createdAt: new Date("2024-01-29"),
        isRejectionReason: false,
      },
      {
        id: "comment_final_012",
        applicationId: "app_final_004",
        userId: "9",
        userType: "catchment_manager",
        comment: "Large scale cotton irrigation under final catchment review. Evaluating regional water balance.",
        stage: 3,
        createdAt: new Date("2024-01-30"),
        isRejectionReason: false,
      },

      // Comments for approved applications (full workflow)
      {
        id: "comment_approved_001",
        applicationId: "app_approved_001",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Application reviewed and found to be complete. All required documentation submitted. Recommended for technical review.",
        stage: 1,
        createdAt: new Date("2024-01-12"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_002",
        applicationId: "app_approved_001",
        userId: "2",
        userType: "chairperson",
        comment:
          "Technical review completed. Water allocation is within sustainable limits. Environmental impact is minimal. Recommended for approval.",
        stage: 2,
        createdAt: new Date("2024-01-25"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_003",
        applicationId: "app_approved_001",
        userId: "3",
        userType: "catchment_manager",
        comment: "Final review completed. All conditions met. Application approved for permit issuance.",
        stage: 3,
        createdAt: new Date("2024-02-10"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_004",
        applicationId: "app_approved_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Permit ready for printing and issuance. All fees paid and conditions satisfied.",
        stage: 4,
        createdAt: new Date("2024-02-15"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_005",
        applicationId: "app_approved_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Small scale irrigation application reviewed. Documentation complete and water allocation reasonable.",
        stage: 1,
        createdAt: new Date("2024-02-03"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_006",
        applicationId: "app_approved_002",
        userId: "2",
        userType: "chairperson",
        comment: "Irrigation project approved. Water allocation sustainable for proposed land size.",
        stage: 2,
        createdAt: new Date("2024-02-10"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_007",
        applicationId: "app_approved_002",
        userId: "3",
        userType: "catchment_manager",
        comment: "Final approval granted. Permit ready for issuance.",
        stage: 3,
        createdAt: new Date("2024-02-18"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_008",
        applicationId: "app_approved_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Permit approved and ready for printing. All requirements satisfied.",
        stage: 4,
        createdAt: new Date("2024-02-20"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_009",
        applicationId: "app_approved_003",
        userId: "7",
        userType: "permitting_officer",
        comment: "Flower farming export operation reviewed. Water quality requirements for export standards met.",
        stage: 1,
        createdAt: new Date("2024-01-26"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_010",
        applicationId: "app_approved_003",
        userId: "8",
        userType: "chairperson",
        comment: "Export flower farming approved. High-value crop justifies water allocation.",
        stage: 2,
        createdAt: new Date("2024-02-05"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_011",
        applicationId: "app_approved_003",
        userId: "9",
        userType: "catchment_manager",
        comment: "Flower farming operation approved. Water use efficient and sustainable.",
        stage: 3,
        createdAt: new Date("2024-02-15"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_012",
        applicationId: "app_approved_003",
        userId: "7",
        userType: "permitting_officer",
        comment: "Export flower farming permit ready for issuance. All conditions met.",
        stage: 4,
        createdAt: new Date("2024-02-18"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_013",
        applicationId: "app_approved_004",
        userId: "1",
        userType: "permitting_officer",
        comment: "Textile manufacturing water use reviewed. Industrial water treatment adequate.",
        stage: 1,
        createdAt: new Date("2024-01-22"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_014",
        applicationId: "app_approved_004",
        userId: "2",
        userType: "chairperson",
        comment: "Textile manufacturing approved. Water recycling system meets environmental standards.",
        stage: 2,
        createdAt: new Date("2024-01-30"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_015",
        applicationId: "app_approved_004",
        userId: "3",
        userType: "catchment_manager",
        comment: "Industrial water use approved. Effluent treatment meets discharge standards.",
        stage: 3,
        createdAt: new Date("2024-02-08"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_016",
        applicationId: "app_approved_004",
        userId: "1",
        userType: "permitting_officer",
        comment: "Textile manufacturing permit approved and ready for printing.",
        stage: 4,
        createdAt: new Date("2024-02-12"),
        isRejectionReason: false,
      },

      // Comments for rejected applications (with detailed rejection reasons)
      {
        id: "comment_rejected_001",
        applicationId: "app_rejected_001",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Industrial water extraction application reviewed. High volume allocation requires detailed environmental assessment.",
        stage: 1,
        createdAt: new Date("2024-01-22"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_002",
        applicationId: "app_rejected_001",
        userId: "2",
        userType: "chairperson",
        comment: "Technical assessment indicates potential water quality concerns for downstream users.",
        stage: 2,
        createdAt: new Date("2024-01-30"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_003",
        applicationId: "app_rejected_001",
        userId: "3",
        userType: "catchment_manager",
        comment:
          "REJECTION: After comprehensive review, this application is rejected due to: 1) Insufficient environmental impact mitigation measures, 2) Potential contamination risk to surface water sources, 3) Lack of adequate water treatment facilities for industrial discharge. Applicant may resubmit with comprehensive environmental management plan.",
        stage: 3,
        createdAt: new Date("2024-02-10"),
        isRejectionReason: true,
      },
      {
        id: "comment_rejected_004",
        applicationId: "app_rejected_002",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "Commercial car wash application reviewed. High water allocation for small land area raises sustainability concerns.",
        stage: 1,
        createdAt: new Date("2024-01-17"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_005",
        applicationId: "app_rejected_002",
        userId: "2",
        userType: "chairperson",
        comment:
          "REJECTION: Water allocation of 8000 m³/annum for 5-hectare commercial car wash exceeds reasonable use guidelines. Water recycling and conservation measures not adequately addressed. Application rejected pending revised water management plan with recycling systems.",
        stage: 2,
        createdAt: new Date("2024-02-05"),
        isRejectionReason: true,
      },
      {
        id: "comment_rejected_006",
        applicationId: "app_rejected_003",
        userId: "7",
        userType: "permitting_officer",
        comment:
          "Gold mining operation water extraction reviewed. Extremely high water allocation raises environmental concerns.",
        stage: 1,
        createdAt: new Date("2024-01-14"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_007",
        applicationId: "app_rejected_003",
        userId: "8",
        userType: "chairperson",
        comment:
          "Mining operation technical review completed. Water treatment and environmental safeguards inadequate.",
        stage: 2,
        createdAt: new Date("2024-01-25"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_008",
        applicationId: "app_rejected_003",
        userId: "9",
        userType: "catchment_manager",
        comment:
          "REJECTION: Gold mining water extraction rejected due to: 1) Excessive water allocation (25,000 m³/annum) unsustainable for catchment, 2) Inadequate mine water treatment facilities, 3) High risk of groundwater contamination, 4) No water recycling plan. Resubmit with reduced allocation and comprehensive environmental management.",
        stage: 3,
        createdAt: new Date("2024-02-08"),
        isRejectionReason: true,
      },
      {
        id: "comment_rejected_009",
        applicationId: "app_rejected_004",
        userId: "1",
        userType: "permitting_officer",
        comment:
          "REJECTION: Steel production facility water extraction rejected at initial review due to: 1) Insufficient environmental impact assessment, 2) No water recycling plan for industrial processes, 3) Potential for heavy metal contamination of water sources. Application requires comprehensive revision before resubmission.",
        stage: 1,
        createdAt: new Date("2024-01-25"),
        isRejectionReason: true,
      },
    ]

    // Mock activity logs
    const mockLogs: ActivityLog[] = [
      // Draft application logs
      {
        id: "log_001",
        userId: "1",
        action: "Application created",
        applicationId: "app_draft_001",
        details: "Draft application created by Thomas Mutasa",
        timestamp: new Date("2024-03-10"),
      },
      {
        id: "log_002",
        userId: "1",
        action: "Draft updated",
        applicationId: "app_draft_002",
        details: "Draft application updated by Jennifer Chikwanha",
        timestamp: new Date("2024-03-09"),
      },
      {
        id: "log_003",
        userId: "7",
        action: "Application created",
        applicationId: "app_draft_003",
        details: "Draft application created by Patrick Nyamande",
        timestamp: new Date("2024-03-05"),
      },
      {
        id: "log_004",
        userId: "7",
        action: "Application created",
        applicationId: "app_draft_004",
        details: "Draft application created by Susan Moyo",
        timestamp: new Date("2024-03-12"),
      },

      // Pending application logs
      {
        id: "log_005",
        userId: "1",
        action: "Application submitted",
        applicationId: "app_pending_001",
        details: "New water extraction application submitted by John Mukamuri",
        timestamp: new Date("2024-03-01"),
      },
      {
        id: "log_006",
        userId: "1",
        action: "Application submitted",
        applicationId: "app_pending_002",
        details: "Surface water extraction application submitted by Mary Chikwanha",
        timestamp: new Date("2024-03-02"),
      },
      {
        id: "log_007",
        userId: "7",
        action: "Application submitted",
        applicationId: "app_pending_003",
        details: "Horticulture water extraction application submitted by Robert Chigumba",
        timestamp: new Date("2024-02-28"),
      },
      {
        id: "log_008",
        userId: "7",
        action: "Application submitted",
        applicationId: "app_pending_004",
        details: "Mining operation water extraction application submitted by Elizabeth Banda",
        timestamp: new Date("2024-02-25"),
      },

      // Under review application logs
      {
        id: "log_009",
        userId: "2",
        action: "Application forwarded",
        applicationId: "app_review_001",
        details: "Poultry farming application forwarded to chairperson review",
        timestamp: new Date("2024-02-22"),
      },
      {
        id: "log_010",
        userId: "8",
        action: "Application forwarded",
        applicationId: "app_review_002",
        details: "Vegetable irrigation application forwarded to chairperson review",
        timestamp: new Date("2024-02-20"),
      },
      {
        id: "log_011",
        userId: "2",
        action: "Application forwarded",
        applicationId: "app_review_003",
        details: "Dairy farming application forwarded to chairperson review",
        timestamp: new Date("2024-02-17"),
      },
      {
        id: "log_012",
        userId: "8",
        action: "Application forwarded",
        applicationId: "app_review_004",
        details: "Sugarcane irrigation application forwarded to chairperson review",
        timestamp: new Date("2024-02-14"),
      },

      // Final review application logs
      {
        id: "log_013",
        userId: "3",
        action: "Application forwarded",
        applicationId: "app_final_001",
        details: "Tea plantation application forwarded to catchment manager review",
        timestamp: new Date("2024-02-10"),
      },
      {
        id: "log_014",
        userId: "9",
        action: "Application forwarded",
        applicationId: "app_final_002",
        details: "Fish farming application forwarded to catchment manager review",
        timestamp: new Date("2024-02-07"),
      },
      {
        id: "log_015",
        userId: "3",
        action: "Application forwarded",
        applicationId: "app_final_003",
        details: "Chrome mining application forwarded to catchment manager review",
        timestamp: new Date("2024-02-03"),
      },
      {
        id: "log_016",
        userId: "9",
        action: "Application forwarded",
        applicationId: "app_final_004",
        details: "Cotton farming application forwarded to catchment manager review",
        timestamp: new Date("2024-01-30"),
      },

      // Approved application logs
      {
        id: "log_017",
        userId: "1",
        action: "Application approved",
        applicationId: "app_approved_001",
        details: "Application MC2024-0014 approved for permit issuance",
        timestamp: new Date("2024-02-15"),
      },
      {
        id: "log_018",
        userId: "1",
        action: "Application approved",
        applicationId: "app_approved_002",
        details: "Application MC2024-0021 approved for permit issuance",
        timestamp: new Date("2024-02-20"),
      },
      {
        id: "log_019",
        userId: "7",
        action: "Application approved",
        applicationId: "app_approved_003",
        details: "Application MC2024-0016 approved for permit issuance",
        timestamp: new Date("2024-02-18"),
      },
      {
        id: "log_020",
        userId: "1",
        action: "Application approved",
        applicationId: "app_approved_004",
        details: "Application MC2024-0017 approved for permit issuance",
        timestamp: new Date("2024-02-12"),
      },

      // Rejected application logs
      {
        id: "log_021",
        userId: "3",
        action: "Application rejected",
        applicationId: "app_rejected_001",
        details: "Application MC2024-0007 rejected due to environmental concerns",
        timestamp: new Date("2024-02-10"),
      },
      {
        id: "log_022",
        userId: "2",
        action: "Application rejected",
        applicationId: "app_rejected_002",
        details: "Application MC2024-0012 rejected due to excessive water allocation",
        timestamp: new Date("2024-02-05"),
      },
      {
        id: "log_023",
        userId: "9",
        action: "Application rejected",
        applicationId: "app_rejected_003",
        details: "Application MC2024-0018 rejected due to environmental and sustainability concerns",
        timestamp: new Date("2024-02-08"),
      },
      {
        id: "log_024",
        userId: "1",
        action: "Application rejected",
        applicationId: "app_rejected_004",
        details: "Application MC2024-0019 rejected at initial review due to inadequate environmental assessment",
        timestamp: new Date("2024-01-25"),
      },
    ]

    // Mock documents
    const mockDocuments: Document[] = [
      // Documents for approved applications
      {
        id: "doc_001",
        applicationId: "app_approved_001",
        fileName: "application_form.pdf",
        fileType: "application/pdf",
        fileSize: 245760,
        uploadedAt: new Date("2024-01-10"),
      },
      {
        id: "doc_002",
        applicationId: "app_approved_001",
        fileName: "site_plan.pdf",
        fileType: "application/pdf",
        fileSize: 512000,
        uploadedAt: new Date("2024-01-10"),
      },
      {
        id: "doc_003",
        applicationId: "app_approved_002",
        fileName: "irrigation_plan.pdf",
        fileType: "application/pdf",
        fileSize: 380000,
        uploadedAt: new Date("2024-02-01"),
      },
      {
        id: "doc_004",
        applicationId: "app_approved_003",
        fileName: "export_license.pdf",
        fileType: "application/pdf",
        fileSize: 290000,
        uploadedAt: new Date("2024-01-25"),
      },
      {
        id: "doc_005",
        applicationId: "app_approved_004",
        fileName: "industrial_plan.pdf",
        fileType: "application/pdf",
        fileSize: 450000,
        uploadedAt: new Date("2024-01-20"),
      },

      // Documents for rejected applications
      {
        id: "doc_006",
        applicationId: "app_rejected_001",
        fileName: "environmental_impact.pdf",
        fileType: "application/pdf",
        fileSize: 1024000,
        uploadedAt: new Date("2024-01-20"),
      },
      {
        id: "doc_007",
        applicationId: "app_rejected_002",
        fileName: "business_plan.pdf",
        fileType: "application/pdf",
        fileSize: 320000,
        uploadedAt: new Date("2024-01-15"),
      },
      {
        id: "doc_008",
        applicationId: "app_rejected_003",
        fileName: "mining_license.pdf",
        fileType: "application/pdf",
        fileSize: 680000,
        uploadedAt: new Date("2024-01-12"),
      },

      // Documents for draft applications
      {
        id: "doc_009",
        applicationId: "app_draft_001",
        fileName: "draft_application.pdf",
        fileType: "application/pdf",
        fileSize: 180000,
        uploadedAt: new Date("2024-03-10"),
      },
      {
        id: "doc_010",
        applicationId: "app_draft_003",
        fileName: "farm_layout.pdf",
        fileType: "application/pdf",
        fileSize: 420000,
        uploadedAt: new Date("2024-03-05"),
      },

      // Documents for applications under review
      {
        id: "doc_011",
        applicationId: "app_review_001",
        fileName: "poultry_farm_plan.pdf",
        fileType: "application/pdf",
        fileSize: 350000,
        uploadedAt: new Date("2024-02-20"),
      },
      {
        id: "doc_012",
        applicationId: "app_review_002",
        fileName: "vegetable_production_plan.pdf",
        fileType: "application/pdf",
        fileSize: 280000,
        uploadedAt: new Date("2024-02-18"),
      },
      {
        id: "doc_013",
        applicationId: "app_final_001",
        fileName: "tea_plantation_layout.pdf",
        fileType: "application/pdf",
        fileSize: 520000,
        uploadedAt: new Date("2024-02-08"),
      },
      {
        id: "doc_014",
        applicationId: "app_final_002",
        fileName: "aquaculture_design.pdf",
        fileType: "application/pdf",
        fileSize: 390000,
        uploadedAt: new Date("2024-02-05"),
      },
    ]

    // Add all mock data to arrays
    this.applications.push(...mockApplications)
    this.comments.push(...mockComments)
    this.logs.push(...mockLogs)
    this.documents.push(...mockDocuments)
    this.applicationCounter = 50 // Update counter to avoid conflicts with new applications
  }

  constructor() {
    this.initializePermittingOfficerMockData()
  }

  /* ───────────────────────── Applications CRUD ──────────────────────────── */
  async createApplication(
    data: Omit<PermitApplication, "id" | "applicationId" | "createdAt" | "updatedAt">,
  ): Promise<PermitApplication> {
    const application: PermitApplication = {
      ...data,
      id: `app_${Date.now()}`,
      applicationId: `MC${new Date().getFullYear()}-${this.applicationCounter++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.applications.push(application)
    return application
  }

  async getApplications(filters?: {
    status?: string
    userType?: string
    userId?: string
  }): Promise<PermitApplication[]> {
    let filtered = [...this.applications]

    if (filters?.status) filtered = filtered.filter((a) => a.status === filters.status)
    // add more filters as required

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async getApplicationById(id: string) {
    return this.applications.find((a) => a.id === id) ?? null
  }

  async updateApplication(id: string, updates: Partial<PermitApplication>) {
    const idx = this.applications.findIndex((a) => a.id === id)
    if (idx === -1) return null
    this.applications[idx] = { ...this.applications[idx], ...updates, updatedAt: new Date() }
    return this.applications[idx]
  }

  async deleteApplication(id: string) {
    const idx = this.applications.findIndex((a) => a.id === id)
    if (idx === -1) return false
    this.applications.splice(idx, 1)
    return true
  }

  /* ─────────────────────────── Workflow comments ────────────────────────── */
  async addComment(comment: Omit<WorkflowComment, "id" | "createdAt">) {
    const newComment: WorkflowComment = { ...comment, id: `comment_${Date.now()}`, createdAt: new Date() }
    this.comments.push(newComment)
    return newComment
  }

  async getCommentsByApplication(applicationId: string) {
    return this.comments.filter((c) => c.applicationId === applicationId)
  }

  // ICT can edit any comment
  async updateComment(commentId: string, updates: Partial<WorkflowComment>, userType: string) {
    if (userType !== "ict") return null

    const idx = this.comments.findIndex((c) => c.id === commentId)
    if (idx === -1) return null

    this.comments[idx] = { ...this.comments[idx], ...updates }
    return this.comments[idx]
  }

  async deleteComment(commentId: string, userType: string) {
    if (userType !== "ict") return false

    const idx = this.comments.findIndex((c) => c.id === commentId)
    if (idx === -1) return false

    this.comments.splice(idx, 1)
    return true
  }

  /* ───────────────────────────── Activity log ───────────────────────────── */
  async addLog(log: Omit<ActivityLog, "id" | "timestamp">) {
    // Log all activities including ICT (ICT activities should be logged for audit purposes)
    const newLog: ActivityLog = { ...log, id: `log_${Date.now()}`, timestamp: new Date() }
    this.logs.push(newLog)
    return newLog
  }

  async getLogs(filters?: { userId?: string; applicationId?: string }) {
    let res = [...this.logs]
    if (filters?.userId) res = res.filter((l) => l.userId === filters.userId)
    if (filters?.applicationId) res = res.filter((l) => l.applicationId === filters.applicationId)
    return res.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // ICT can edit logs
  async updateLog(logId: string, updates: Partial<ActivityLog>, userType: string) {
    if (userType !== "ict") return null

    const idx = this.logs.findIndex((l) => l.id === logId)
    if (idx === -1) return null

    this.logs[idx] = { ...this.logs[idx], ...updates }
    return this.logs[idx]
  }

  async deleteLog(logId: string, userType: string) {
    if (userType !== "ict") return false

    const idx = this.logs.findIndex((l) => l.id === logId)
    if (idx === -1) return false

    this.logs.splice(idx, 1)
    return true
  }

  /* ────────────────────────────── Messaging ─────────────────────────────── */
  async sendMessage(message: Omit<Message, "id" | "createdAt">) {
    const newMsg: Message = { ...message, id: `msg_${Date.now()}`, createdAt: new Date() }
    this.messages.push(newMsg)
    return newMsg
  }

  async getMessages(userId: string, isPublic?: boolean) {
    return this.messages
      .filter((m) => (isPublic ? m.isPublic : !m.isPublic && (m.senderId === userId || m.receiverId === userId)))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async markMessageAsRead(messageId: string) {
    const idx = this.messages.findIndex((m) => m.id === messageId)
    if (idx !== -1) this.messages[idx].readAt = new Date()
  }

  /* ────────────────────────────── Users CRUD ────────────────────────────── */
  async getUsers() {
    return [...this.users]
  }

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">) {
    const newUser: User = {
      ...data,
      id: `user_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.push(newUser)
    return newUser
  }

  async updateUser(id: string, updates: Partial<User>) {
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx === -1) return null
    this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date() }
    return this.users[idx]
  }

  async deleteUser(id: string) {
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx === -1) return false
    this.users.splice(idx, 1)
    return true
  }

  /* ───────────────────────────── Documents CRUD ─────────────────────────── */
  async uploadDocument(doc: Omit<Document, "id" | "uploadedAt">) {
    const newDoc: Document = { ...doc, id: `doc_${Date.now()}`, uploadedAt: new Date() }
    this.documents.push(newDoc)
    return newDoc
  }

  async getDocumentsByApplication(applicationId: string) {
    return this.documents.filter((d) => d.applicationId === applicationId)
  }

  async deleteDocument(id: string) {
    const idx = this.documents.findIndex((d) => d.id === id)
    if (idx === -1) return false
    this.documents.splice(idx, 1)
    return true
  }

  // ICT can delete any document
  async forceDeleteDocument(id: string, userType: string) {
    if (userType !== "ict") return false
    return this.deleteDocument(id)
  }
}

export const db = new MockDatabase()
