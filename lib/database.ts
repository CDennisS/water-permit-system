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

  // Add comprehensive mock data for all user types and testing scenarios
  private initializeMockData() {
    // Comprehensive mock applications covering all workflow stages and user types
    const mockApplications: PermitApplication[] = [
      // DRAFT APPLICATIONS (Not yet submitted - for "Applications pending submission" section)
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
        submittedAt: undefined, // Not submitted yet
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
        submittedAt: undefined, // Not submitted yet
      },
      {
        id: "app_draft_003",
        applicationId: "DRAFT-003",
        applicantName: "Moses Nyamande",
        physicalAddress: "123 Valley View, Norton",
        postalAddress: "P.O. Box 123, Norton",
        customerAccountNumber: "ACC123",
        cellularNumber: "+263773456789",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Livestock watering",
        numberOfBoreholes: 2,
        landSize: 35,
        waterAllocation: 3500,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-03-07"),
        submittedAt: undefined, // Not submitted yet
      },
      {
        id: "app_draft_004",
        applicationId: "DRAFT-004",
        applicantName: "Ruth Mapfumo",
        physicalAddress: "567 Hill Top, Marondera",
        postalAddress: "P.O. Box 567, Marondera",
        customerAccountNumber: "ACC567",
        cellularNumber: "+263774567890",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Poultry farming",
        numberOfBoreholes: 1,
        landSize: 15,
        waterAllocation: 1800,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-12"),
        updatedAt: new Date("2024-03-12"),
        submittedAt: undefined, // Not submitted yet
      },
      {
        id: "app_draft_005",
        applicationId: "DRAFT-005",
        applicantName: "Charles Sibanda",
        physicalAddress: "890 River Side, Gweru",
        postalAddress: "P.O. Box 890, Gweru",
        customerAccountNumber: "ACC890",
        cellularNumber: "+263775678901",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Aquaculture",
        numberOfBoreholes: 0,
        landSize: 25,
        waterAllocation: 4000,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-06"),
        updatedAt: new Date("2024-03-11"),
        submittedAt: undefined, // Not submitted yet
      },

      // PENDING APPLICATIONS (Stage 1 - Permitting Officer Review)
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
        applicationId: "MC2024-0031",
        applicantName: "Elizabeth Mapfumo",
        physicalAddress: "369 Sunrise Close, Kadoma",
        postalAddress: "P.O. Box 369, Kadoma",
        customerAccountNumber: "ACC030",
        cellularNumber: "+263779012345",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Poultry farming",
        numberOfBoreholes: 1,
        landSize: 20,
        waterAllocation: 3000,
        gpsLatitude: -18.3328,
        gpsLongitude: 29.9153,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-03-05"),
        submittedAt: new Date("2024-03-05"),
      },

      // UNDER REVIEW APPLICATIONS (Stage 2 - Chairperson Review)
      {
        id: "app_review_001",
        applicationId: "MC2024-0003",
        applicantName: "Peter Moyo",
        physicalAddress: "789 Pine Road, Marondera",
        postalAddress: "P.O. Box 789, Marondera",
        customerAccountNumber: "ACC003",
        cellularNumber: "+263773456789",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Small scale irrigation",
        numberOfBoreholes: 1,
        landSize: 15,
        waterAllocation: 1500,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-02-15"),
      },
      {
        id: "app_review_002",
        applicationId: "MC2024-0004",
        applicantName: "Grace Nyamande",
        physicalAddress: "321 River View, Norton",
        postalAddress: "P.O. Box 321, Norton",
        customerAccountNumber: "ACC004",
        cellularNumber: "+263774567890",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Aquaculture farming",
        numberOfBoreholes: 0,
        landSize: 30,
        waterAllocation: 8000,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-25"),
        submittedAt: new Date("2024-02-10"),
      },
      {
        id: "app_review_003",
        applicationId: "MC2024-0032",
        applicantName: "Andrew Chigumira",
        physicalAddress: "147 Mountain View, Mutare",
        postalAddress: "P.O. Box 147, Mutare",
        customerAccountNumber: "ACC147",
        cellularNumber: "+263776789012",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Horticulture",
        numberOfBoreholes: 2,
        landSize: 40,
        waterAllocation: 4500,
        gpsLatitude: -18.9707,
        gpsLongitude: 32.6731,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-03-01"),
        submittedAt: new Date("2024-02-20"),
      },

      // TECHNICAL REVIEW APPLICATIONS (Stage 3 - Catchment Manager Review)
      {
        id: "app_technical_001",
        applicationId: "MC2024-0005",
        applicantName: "James Sibanda",
        physicalAddress: "654 Hill View, Gweru",
        postalAddress: "P.O. Box 654, Gweru",
        customerAccountNumber: "ACC005",
        cellularNumber: "+263775678901",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Industrial processing",
        numberOfBoreholes: 3,
        landSize: 75,
        waterAllocation: 12000,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "technical_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-15"),
        submittedAt: new Date("2024-01-20"),
      },
      {
        id: "app_technical_002",
        applicationId: "MC2024-0033",
        applicantName: "Linda Madziva",
        physicalAddress: "258 Valley Road, Bulawayo",
        postalAddress: "P.O. Box 258, Bulawayo",
        customerAccountNumber: "ACC258",
        cellularNumber: "+263777890123",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Commercial farming",
        numberOfBoreholes: 0,
        landSize: 80,
        waterAllocation: 10000,
        gpsLatitude: -20.1594,
        gpsLongitude: 28.5906,
        status: "technical_review",
        currentStage: 3,
        workflowComments: [],
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-28"),
        submittedAt: new Date("2024-02-01"),
      },

      // APPROVED APPLICATIONS (Stage 4 - Ready for Permit Printing)
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
        applicationId: "MC2024-0025",
        applicantName: "Robert Chigumira",
        physicalAddress: "987 Valley Road, Mutare",
        postalAddress: "P.O. Box 987, Mutare",
        customerAccountNumber: "ACC025",
        cellularNumber: "+263776789012",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Horticulture farming",
        numberOfBoreholes: 0,
        landSize: 40,
        waterAllocation: 6000,
        gpsLatitude: -18.9707,
        gpsLongitude: 32.6731,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-02-28"),
        submittedAt: new Date("2024-01-25"),
        approvedAt: new Date("2024-02-28"),
      },
      {
        id: "app_approved_004",
        applicationId: "MC2024-0034",
        applicantName: "Patricia Zvobgo",
        physicalAddress: "741 Garden Close, Kwekwe",
        postalAddress: "P.O. Box 741, Kwekwe",
        customerAccountNumber: "ACC741",
        cellularNumber: "+263778901234",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Dairy farming",
        numberOfBoreholes: 2,
        landSize: 60,
        waterAllocation: 7500,
        gpsLatitude: -18.9167,
        gpsLongitude: 29.8167,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-30"),
        updatedAt: new Date("2024-03-05"),
        submittedAt: new Date("2024-01-30"),
        approvedAt: new Date("2024-03-05"),
      },
      {
        id: "app_approved_005",
        applicationId: "MC2024-0040",
        applicantName: "Emmanuel Mpofu",
        physicalAddress: "852 Industrial Park, Bulawayo",
        postalAddress: "P.O. Box 852, Bulawayo",
        customerAccountNumber: "ACC852",
        cellularNumber: "+263779012345",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Commercial farming",
        numberOfBoreholes: 3,
        landSize: 120,
        waterAllocation: 15000,
        gpsLatitude: -20.1594,
        gpsLongitude: 28.5906,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-03-01"),
        submittedAt: new Date("2024-01-15"),
        approvedAt: new Date("2024-03-01"),
      },

      // REJECTED APPLICATIONS (Various stages of rejection)
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
        applicantName: "Patricia Zvobgo",
        physicalAddress: "258 Garden Avenue, Kwekwe",
        postalAddress: "P.O. Box 258, Kwekwe",
        customerAccountNumber: "ACC018",
        cellularNumber: "+263778901234",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Mining operations",
        numberOfBoreholes: 0,
        landSize: 200,
        waterAllocation: 25000,
        gpsLatitude: -18.9167,
        gpsLongitude: 29.8167,
        status: "rejected",
        currentStage: 1,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-05"),
        updatedAt: new Date("2024-02-12"),
        submittedAt: new Date("2024-02-05"),
      },
      {
        id: "app_rejected_004",
        applicationId: "MC2024-0035",
        applicantName: "Stephen Mukamuri",
        physicalAddress: "852 Industrial Road, Harare",
        postalAddress: "P.O. Box 852, Harare",
        customerAccountNumber: "ACC852",
        cellularNumber: "+263779012345",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Manufacturing",
        numberOfBoreholes: 4,
        landSize: 120,
        waterAllocation: 18000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "rejected",
        currentStage: 2,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-28"),
        updatedAt: new Date("2024-02-18"),
        submittedAt: new Date("2024-01-28"),
      },
      {
        id: "app_rejected_005",
        applicationId: "MC2024-0041",
        applicantName: "Tendai Mapfumo",
        physicalAddress: "963 Hillside Drive, Gweru",
        postalAddress: "P.O. Box 963, Gweru",
        customerAccountNumber: "ACC963",
        cellularNumber: "+263770123456",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Brick making",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 5000,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "rejected",
        currentStage: 1,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-02-10"),
      },

      // ADDITIONAL SUBMITTED APPLICATIONS FOR COMPREHENSIVE TESTING
      {
        id: "app_submitted_001",
        applicationId: "MC2024-0036",
        applicantName: "Margaret Chigumira",
        physicalAddress: "963 Hillside Avenue, Masvingo",
        postalAddress: "P.O. Box 963, Masvingo",
        customerAccountNumber: "ACC963",
        cellularNumber: "+263770123456",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Fish farming",
        numberOfBoreholes: 0,
        landSize: 45,
        waterAllocation: 9000,
        gpsLatitude: -20.0637,
        gpsLongitude: 30.8956,
        status: "submitted",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-08"),
        updatedAt: new Date("2024-03-08"),
        submittedAt: new Date("2024-03-08"),
      },
      // RECENT APPLICATIONS FOR TESTING (assigned to specific users)
      {
        id: "app_test_001",
        applicationId: "MC2024-0050",
        applicantName: "Test Applicant One",
        physicalAddress: "123 Test Street, Harare",
        postalAddress: "P.O. Box 123, Harare",
        customerAccountNumber: "TEST001",
        cellularNumber: "+263771111111",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Testing purposes",
        numberOfBoreholes: 1,
        landSize: 10,
        waterAllocation: 1000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        assignedTo: "12", // testuser
        createdAt: new Date("2024-03-15"),
        updatedAt: new Date("2024-03-15"),
        submittedAt: new Date("2024-03-15"),
      },
      {
        id: "app_test_002",
        applicationId: "MC2024-0051",
        applicantName: "Test Applicant Two",
        physicalAddress: "456 Test Avenue, Chitungwiza",
        postalAddress: "P.O. Box 456, Chitungwiza",
        customerAccountNumber: "TEST002",
        cellularNumber: "+263772222222",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Agricultural testing",
        numberOfBoreholes: 0,
        landSize: 20,
        waterAllocation: 2000,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        assignedTo: "12", // testuser
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-14"),
        submittedAt: new Date("2024-03-10"),
        approvedAt: new Date("2024-03-14"),
      },
      {
        id: "app_test_003",
        applicationId: "MC2024-0052",
        applicantName: "Test Applicant Three",
        physicalAddress: "789 Test Road, Norton",
        postalAddress: "P.O. Box 789, Norton",
        customerAccountNumber: "TEST003",
        cellularNumber: "+263773333333",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Industrial testing",
        numberOfBoreholes: 2,
        landSize: 50,
        waterAllocation: 5000,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        status: "rejected",
        currentStage: 2,
        workflowComments: [],
        assignedTo: "12", // testuser
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-03-12"),
        submittedAt: new Date("2024-03-05"),
      },
      {
        id: "app_test_004",
        applicationId: "DRAFT-TEST-001",
        applicantName: "Test Draft Applicant",
        physicalAddress: "321 Draft Street, Marondera",
        postalAddress: "P.O. Box 321, Marondera",
        customerAccountNumber: "DRAFT001",
        cellularNumber: "+263774444444",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Draft testing",
        numberOfBoreholes: 1,
        landSize: 15,
        waterAllocation: 1500,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "draft",
        currentStage: 0,
        workflowComments: [],
        assignedTo: "12", // testuser
        createdAt: new Date("2024-03-16"),
        updatedAt: new Date("2024-03-16"),
        submittedAt: undefined,
      },
      {
        id: "app_test_005",
        applicationId: "MC2024-0053",
        applicantName: "Test Review Applicant",
        physicalAddress: "654 Review Avenue, Gweru",
        postalAddress: "P.O. Box 654, Gweru",
        customerAccountNumber: "REVIEW001",
        cellularNumber: "+263775555555",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Review testing",
        numberOfBoreholes: 0,
        landSize: 30,
        waterAllocation: 3000,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "under_review",
        currentStage: 2,
        workflowComments: [],
        assignedTo: "12", // testuser
        createdAt: new Date("2024-03-08"),
        updatedAt: new Date("2024-03-13"),
        submittedAt: new Date("2024-03-08"),
      },
    ]

    // ADDITIONAL COMPREHENSIVE MOCK DATA FOR PERMITTING OFFICERS
    const additionalMockApplications: PermitApplication[] = [
      // UNSUBMITTED APPLICATIONS (For bulk submission testing)
      {
        id: "app_unsubmitted_001",
        applicationId: "UNSUB-001",
        applicantName: "David Mpofu",
        physicalAddress: "15 Industrial Road, Gweru",
        postalAddress: "P.O. Box 1500, Gweru",
        customerAccountNumber: "ACC1500",
        cellularNumber: "+263771500001",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Manufacturing - Textile Production",
        numberOfBoreholes: 2,
        landSize: 45,
        waterAllocation: 4500,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "unsubmitted",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-18"),
        updatedAt: new Date("2024-03-18"),
        submittedAt: undefined,
      },
      {
        id: "app_unsubmitted_002",
        applicationId: "UNSUB-002",
        applicantName: "Patricia Nyamande",
        physicalAddress: "78 Farm Road, Marondera",
        postalAddress: "P.O. Box 780, Marondera",
        customerAccountNumber: "ACC780",
        cellularNumber: "+263771500002",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Large Scale Irrigation - Tobacco",
        numberOfBoreholes: 0,
        landSize: 120,
        waterAllocation: 12000,
        gpsLatitude: -18.1851,
        gpsLongitude: 31.5514,
        status: "unsubmitted",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-17"),
        updatedAt: new Date("2024-03-19"),
        submittedAt: undefined,
      },
      {
        id: "app_unsubmitted_003",
        applicationId: "UNSUB-003",
        applicantName: "Michael Chigumira",
        physicalAddress: "234 Valley View, Norton",
        postalAddress: "P.O. Box 2340, Norton",
        customerAccountNumber: "ACC2340",
        cellularNumber: "+263771500003",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Poultry Farming - Commercial",
        numberOfBoreholes: 3,
        landSize: 35,
        waterAllocation: 3500,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        status: "unsubmitted",
        currentStage: 0,
        workflowComments: [],
        createdAt: new Date("2024-03-16"),
        updatedAt: new Date("2024-03-18"),
        submittedAt: undefined,
      },

      // PENDING APPROVAL APPLICATIONS (Stage 1 - Permitting Officer Review)
      {
        id: "app_pending_new_001",
        applicationId: "MC2024-0055",
        applicantName: "Elizabeth Mapfumo",
        physicalAddress: "567 Commercial Avenue, Kadoma",
        postalAddress: "P.O. Box 5670, Kadoma",
        customerAccountNumber: "ACC5670",
        cellularNumber: "+263771500004",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Hotel and Conference Center",
        numberOfBoreholes: 2,
        landSize: 15,
        waterAllocation: 2800,
        gpsLatitude: -18.3328,
        gpsLongitude: 29.9153,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-03-20"),
        submittedAt: new Date("2024-03-20"),
      },
      {
        id: "app_pending_new_002",
        applicationId: "MC2024-0056",
        applicantName: "Joseph Sibanda",
        physicalAddress: "890 Mining Road, Chegutu",
        postalAddress: "P.O. Box 8900, Chegutu",
        customerAccountNumber: "ACC8900",
        cellularNumber: "+263771500005",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Aquaculture - Fish Farming",
        numberOfBoreholes: 0,
        landSize: 25,
        waterAllocation: 5000,
        gpsLatitude: -18.1333,
        gpsLongitude: 30.1333,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-19"),
        updatedAt: new Date("2024-03-19"),
        submittedAt: new Date("2024-03-19"),
      },
      {
        id: "app_pending_new_003",
        applicationId: "MC2024-0057",
        applicantName: "Grace Mukamuri",
        physicalAddress: "123 Residential Close, Chitungwiza",
        postalAddress: "P.O. Box 1230, Chitungwiza",
        customerAccountNumber: "ACC1230",
        cellularNumber: "+263771500006",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Domestic Use - Large Household",
        numberOfBoreholes: 1,
        landSize: 5,
        waterAllocation: 800,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "pending",
        currentStage: 1,
        workflowComments: [],
        createdAt: new Date("2024-03-21"),
        updatedAt: new Date("2024-03-21"),
        submittedAt: new Date("2024-03-21"),
      },

      // APPROVED APPLICATIONS (Ready for Permit Printing)
      {
        id: "app_approved_new_001",
        applicationId: "MC2024-0058",
        applicantName: "Robert Chikwanha",
        physicalAddress: "456 Agricultural Road, Bindura",
        postalAddress: "P.O. Box 4560, Bindura",
        customerAccountNumber: "ACC4560",
        cellularNumber: "+263771500007",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Small Scale Irrigation - Vegetables",
        numberOfBoreholes: 1,
        landSize: 20,
        waterAllocation: 2000,
        gpsLatitude: -17.3019,
        gpsLongitude: 31.3275,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-25"),
        updatedAt: new Date("2024-03-15"),
        submittedAt: new Date("2024-02-25"),
        approvedAt: new Date("2024-03-15"),
      },
      {
        id: "app_approved_new_002",
        applicationId: "MC2024-0059",
        applicantName: "Linda Nyamande",
        physicalAddress: "789 School Road, Mutare",
        postalAddress: "P.O. Box 7890, Mutare",
        customerAccountNumber: "ACC7890",
        cellularNumber: "+263771500008",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Educational Institution - Secondary School",
        numberOfBoreholes: 0,
        landSize: 10,
        waterAllocation: 1500,
        gpsLatitude: -18.9707,
        gpsLongitude: 32.6731,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-03-12"),
        submittedAt: new Date("2024-02-20"),
        approvedAt: new Date("2024-03-12"),
      },
      {
        id: "app_approved_new_003",
        applicationId: "MC2024-0060",
        applicantName: "Andrew Madziva",
        physicalAddress: "321 Industrial Park, Bulawayo",
        postalAddress: "P.O. Box 3210, Bulawayo",
        customerAccountNumber: "ACC3210",
        cellularNumber: "+263771500009",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Food Processing - Dairy Products",
        numberOfBoreholes: 2,
        landSize: 30,
        waterAllocation: 4000,
        gpsLatitude: -20.1594,
        gpsLongitude: 28.5906,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-03-10"),
        submittedAt: new Date("2024-02-15"),
        approvedAt: new Date("2024-03-10"),
      },
      {
        id: "app_approved_new_004",
        applicationId: "MC2024-0061",
        applicantName: "Margaret Zvobgo",
        physicalAddress: "654 Hospital Road, Gweru",
        postalAddress: "P.O. Box 6540, Gweru",
        customerAccountNumber: "ACC6540",
        cellularNumber: "+263771500010",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Healthcare Facility - Private Clinic",
        numberOfBoreholes: 1,
        landSize: 8,
        waterAllocation: 1200,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        status: "approved",
        currentStage: 4,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-28"),
        updatedAt: new Date("2024-03-18"),
        submittedAt: new Date("2024-02-28"),
        approvedAt: new Date("2024-03-18"),
      },

      // REJECTED APPLICATIONS (With detailed rejection comments for printing)
      {
        id: "app_rejected_new_001",
        applicationId: "MC2024-0062",
        applicantName: "Charles Mapfumo",
        physicalAddress: "987 Mining Avenue, Kadoma",
        postalAddress: "P.O. Box 9870, Kadoma",
        customerAccountNumber: "ACC9870",
        cellularNumber: "+263771500011",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Gold Mining Operations",
        numberOfBoreholes: 0,
        landSize: 150,
        waterAllocation: 20000,
        gpsLatitude: -18.3328,
        gpsLongitude: 29.9153,
        status: "rejected",
        currentStage: 2,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-03-05"),
        submittedAt: new Date("2024-02-10"),
      },
      {
        id: "app_rejected_new_002",
        applicationId: "MC2024-0063",
        applicantName: "Stephen Chigumira",
        physicalAddress: "147 Commercial Street, Harare",
        postalAddress: "P.O. Box 1470, Harare",
        customerAccountNumber: "ACC1470",
        cellularNumber: "+263771500012",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Car Wash and Service Station",
        numberOfBoreholes: 3,
        landSize: 3,
        waterAllocation: 6000,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "rejected",
        currentStage: 1,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-18"),
        updatedAt: new Date("2024-03-08"),
        submittedAt: new Date("2024-02-18"),
      },
      {
        id: "app_rejected_new_003",
        applicationId: "MC2024-0064",
        applicantName: "Tendai Mukamuri",
        physicalAddress: "258 Factory Road, Chitungwiza",
        postalAddress: "P.O. Box 2580, Chitungwiza",
        customerAccountNumber: "ACC2580",
        cellularNumber: "+263771500013",
        permitType: "water_extraction",
        waterSource: "surface_water",
        intendedUse: "Brick Manufacturing",
        numberOfBoreholes: 0,
        landSize: 12,
        waterAllocation: 8000,
        gpsLatitude: -18.0145,
        gpsLongitude: 31.0789,
        status: "rejected",
        currentStage: 3,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-02-05"),
        updatedAt: new Date("2024-03-01"),
        submittedAt: new Date("2024-02-05"),
      },
      {
        id: "app_rejected_new_004",
        applicationId: "MC2024-0065",
        applicantName: "Emmanuel Sibanda",
        physicalAddress: "369 Industrial Zone, Kwekwe",
        postalAddress: "P.O. Box 3690, Kwekwe",
        customerAccountNumber: "ACC3690",
        cellularNumber: "+263771500014",
        permitType: "water_extraction",
        waterSource: "borehole",
        intendedUse: "Chemical Manufacturing",
        numberOfBoreholes: 4,
        landSize: 80,
        waterAllocation: 15000,
        gpsLatitude: -18.9167,
        gpsLongitude: 29.8167,
        status: "rejected",
        currentStage: 2,
        workflowComments: [],
        documents: [],
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-01-25"),
      },
    ]

    // Add comprehensive comments for the new applications
    const additionalMockComments: WorkflowComment[] = [
      // Comments for pending applications
      {
        id: "comment_pending_new_001",
        applicationId: "app_pending_new_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Hotel and conference center application received. Reviewing water allocation requirements for commercial hospitality use. Checking compliance with tourism development guidelines.",
        stage: 1,
        createdAt: new Date("2024-03-20"),
        isRejectionReason: false,
      },
      {
        id: "comment_pending_new_002",
        applicationId: "app_pending_new_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Aquaculture application under review. Surface water extraction for fish farming requires environmental impact assessment. Checking downstream water quality implications.",
        stage: 1,
        createdAt: new Date("2024-03-19"),
        isRejectionReason: false,
      },
      {
        id: "comment_pending_new_003",
        applicationId: "app_pending_new_003",
        userId: "1",
        userType: "permitting_officer",
        comment: "Domestic use application for large household. Water allocation appears reasonable for intended use. Documentation complete.",
        stage: 1,
        createdAt: new Date("2024-03-21"),
        isRejectionReason: false,
      },

      // Comments for approved applications (complete workflow)
      {
        id: "comment_approved_new_001_stage1",
        applicationId: "app_approved_new_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Small scale irrigation application reviewed. Documentation complete. Water allocation of 2,000 m³/annum is reasonable for 20-hectare vegetable farming operation. Environmental impact minimal. Recommended for technical review.",
        stage: 1,
        createdAt: new Date("2024-02-27"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_new_001_stage2",
        applicationId: "app_approved_new_001",
        userId: "2",
        userType: "chairperson",
        comment: "Technical review completed. Irrigation project aligns with agricultural development goals. Water source sustainable. Soil analysis indicates good drainage. Recommended for catchment manager approval.",
        stage: 2,
        createdAt: new Date("2024-03-05"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_new_001_stage3",
        applicationId: "app_approved_new_001",
        userId: "3",
        userType: "catchment_manager",
        comment: "Catchment assessment completed. Water allocation within sustainable limits for Bindura sub-catchment. No conflicts with existing water users. Environmental conditions satisfied. Application approved for permit issuance.",
        stage: 3,
        createdAt: new Date("2024-03-12"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_new_001_stage4",
        applicationId: "app_approved_new_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Final approval received. All conditions met. Permit ready for printing and issuance. Validity period: 5 years from issue date.",
        stage: 4,
        createdAt: new Date("2024-03-15"),
        isRejectionReason: false,
      },

      // Comments for second approved application
      {
        id: "comment_approved_new_002_stage1",
        applicationId: "app_approved_new_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Educational institution water extraction application reviewed. Secondary school with 800 students requires adequate water supply. Surface water extraction from approved source. Documentation complete.",
        stage: 1,
        createdAt: new Date("2024-02-22"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_new_002_stage2",
        applicationId: "app_approved_new_002",
        userId: "2",
        userType: "chairperson",
        comment: "Educational facility water supply approved. Critical infrastructure for community development. Water allocation of 1,500 m³/annum appropriate for institutional use. Environmental impact assessment satisfactory.",
        stage: 2,
        createdAt: new Date("2024-03-01"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_new_002_stage3",
        applicationId: "app_approved_new_002",
        userId: "3",
        userType: "catchment_manager",
        comment: "Final approval granted for educational institution. Water allocation sustainable. Contributes to community development objectives. Permit approved for immediate issuance.",
        stage: 3,
        createdAt: new Date("2024-03-08"),
        isRejectionReason: false,
      },
      {
        id: "comment_approved_new_002_stage4",
        applicationId: "app_approved_new_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "Educational institution permit approved and ready for printing. Special conditions: Monthly water usage reporting required. Permit valid for 10 years.",
        stage: 4,
        createdAt: new Date("2024-03-12"),
        isRejectionReason: false,
      },

      // Detailed rejection comments for printing
      {
        id: "comment_rejected_new_001_stage1",
        applicationId: "app_rejected_new_001",
        userId: "1",
        userType: "permitting_officer",
        comment: "Gold mining operation water extraction application received. High volume surface water extraction (20,000 m³/annum) requires comprehensive environmental assessment. Initial documentation review indicates potential environmental concerns.",
        stage: 1,
        createdAt: new Date("2024-02-12"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_new_001_stage2",
        applicationId: "app_rejected_new_001",
        userId: "2",
        userType: "chairperson",
        comment: "REJECTION: After comprehensive technical review, this gold mining water extraction application is REJECTED for the following reasons:\n\n1. ENVIRONMENTAL IMPACT CONCERNS:\n   - Insufficient environmental impact assessment for mining operations\n   - No adequate water treatment plan for mining discharge\n   - Potential contamination risk to downstream water users\n   - Missing rehabilitation plan for post-mining water resources\n\n2. WATER ALLOCATION ISSUES:\n   - Requested 20,000 m³/annum exceeds sustainable limits for the catchment area\n   - No water recycling or conservation measures proposed\n   - Potential conflict with existing agricultural water users downstream\n\n3. DOCUMENTATION DEFICIENCIES:\n   - Missing detailed mining operation plan\n   - Inadequate water quality monitoring proposal\n   - No emergency response plan for water contamination incidents\n   - Missing community consultation documentation\n\n4. REGULATORY COMPLIANCE:\n   - Environmental clearance certificate not provided\n   - Mining license documentation incomplete\n   - No compliance plan with water quality standards\n\nRECOMMENDATIONS FOR RESUBMISSION:\nApplicant may resubmit with:\n- Comprehensive environmental impact assessment by certified consultant\n- Detailed water treatment and recycling plan\n- Reduced water allocation request (maximum 8,000 m³/annum)\n- Complete environmental clearance documentation\n- Community consultation report\n- Emergency response and monitoring plan\n\nApplication rejected on: March 5, 2024\nReview conducted by: Upper Manyame Sub Catchment Council Chairman\nNext review: Available upon resubmission with required documentation",
        stage: 2,
        createdAt: new Date("2024-03-05"),
        isRejectionReason: true,
      },

      {
        id: "comment_rejected_new_002_stage1",
        applicationId: "app_rejected_new_002",
        userId: "1",
        userType: "permitting_officer",
        comment: "REJECTION: Car wash and service station water extraction application REJECTED at initial review stage for the following critical issues:\n\n1. EXCESSIVE WATER ALLOCATION:\n   - Requested 6,000 m³/annum for 3-hectare site is unreasonable\n   - Standard car wash operations require maximum 2,000 m³/annum\n   - No justification provided for excessive water demand\n\n2. MISSING WATER CONSERVATION MEASURES:\n   - No water recycling system proposed\n   - Missing water treatment and reuse plan\n   - No water-efficient equipment specifications\n   - Absence of water conservation strategy\n\n3. ENVIRONMENTAL CONCERNS:\n   - No wastewater treatment plan provided\n   - Missing discharge management strategy\n   - Potential groundwater contamination from chemicals\n   - No environmental impact mitigation measures\n\n4. DOCUMENTATION DEFICIENCIES:\n   - Incomplete business operation plan\n   - Missing local authority approvals\n   - No water quality monitoring proposal\n   - Inadequate site drainage plan\n\n5. LAND USE COMPATIBILITY:\n   - High water consumption inappropriate for small commercial site\n   - Potential conflicts with neighboring water users\n   - No demonstration of water use efficiency\n\nREQUIREMENTS FOR RESUBMISSION:\n- Reduce water allocation request to maximum 2,000 m³/annum\n- Provide comprehensive water recycling system design\n- Submit wastewater treatment and discharge plan\n- Include water-efficient equipment specifications\n- Provide environmental impact assessment\n- Submit local authority development approvals\n- Include water conservation and monitoring plan\n\nApplication rejected on: March 8, 2024\nReview conducted by: Permitting Officer\nResubmission deadline: Within 90 days with required modifications",
        stage: 1,
        createdAt: new Date("2024-03-08"),
        isRejectionReason: true,
      },

      {
        id: "comment_rejected_new_003_stage1",
        applicationId: "app_rejected_new_003",
        userId: "1",
        userType: "permitting_officer",
        comment: "Brick manufacturing surface water extraction application under initial review. High water allocation for manufacturing process requires detailed assessment.",
        stage: 1,
        createdAt: new Date("2024-02-07"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_new_003_stage2",
        applicationId: "app_rejected_new_003",
        userId: "2",
        userType: "chairperson",
        comment: "Technical review indicates concerns with water allocation and environmental impact. Brick manufacturing operations require comprehensive water management plan.",
        stage: 2,
        createdAt: new Date("2024-02-15"),
        isRejectionReason: false,
      },
      {
        id: "comment_rejected_new_003_stage3",
        applicationId: "app_rejected_new_003",
        userId: "3",
        userType: "catchment_manager",
        comment: \"REJECTION: After final catchment assessment, this brick manufacturing water extraction application is REJECTED for the following reasons:\n\n1. WATER ALLOCATION CONCERNS:\n   - Requested 8,000 m³/annum exceeds sustainable limits for 12-hectare site\n   - Surface water extraction conflicts with downstream agricultural users\n   - No demonstration of water use efficiency in brick production\n\n2. ENVIRONMENTAL IMPACT ISSUES:\n   - Inadequate assessment of surface water quality impact\n   - Missing sediment control measures for clay extraction\n   - No plan for managing industrial runoff\n   - Potential impact on aquatic ecosystem downstream\n\n3. TECHNICAL DEFICIENCIES:\n   - No water recycling system in production process\n   - Missing water treatment plan for process water\n   - Inadequate drainage and containment systems\n   - No monitoring plan for water quality parameters\n\n4. REGULATORY COMPLIANCE:\n   - Environmental clearance documentation incomplete\n   - Missing industrial operation permits\n\
   - No compliance plan with discharge standards\n\nRECOMMENDATIONS:\n- Reduce water allocation to maximum 4,000 m³/annum\n- Implement closed-loop water recycling system\n- Provide comprehensive environmental management plan\n- Submit detailed water treatment and monitoring proposal\n- Obtain all required environmental and industrial permits\n\nApplication rejected on: March 1, 2024\nFinal review by: Catchment Manager\nResubmission allowed with required modifications within 120 days",
    stage: 3,
    createdAt: new Date("2024-03-01"),
    isRejectionReason: true,
  },

  {
    id: \"comment_rejected_new_004_stage1",
    applicationId: "app_rejected_new_004",
    userId: "1",
    userType: \"permitting_officer",
    comment: \"Chemical manufacturing water extraction application received. High-risk industrial operation requires comprehensive safety and environmental assessment.",
    stage: 1,
    createdAt: new Date("2024-01-27"),
    isRejectionReason: false,
  },
  {
    id: \"comment_rejected_new_004_stage2",
    applicationId: "app_rejected_new_004",
    userId: "2",
    userType: "chairperson",\
    comment: \"REJECTION: Chemical manufacturing water extraction application REJECTED after technical review for the following critical safety and environmental concerns:\n\n1. HIGH-RISK INDUSTRIAL OPERATION:\n   - Chemical manufacturing poses significant contamination risk\n   - Insufficient safety measures for hazardous material handling\n   - No emergency response plan for chemical spills or leaks\n   - Missing hazardous waste management strategy\n\n2. ENVIRONMENTAL PROTECTION ISSUES:\n   - Inadequate environmental impact assessment for chemical operations\n   - No groundwater protection measures specified\n   - Missing air quality impact assessment\n   - Insufficient wastewater treatment specifications\n\n3. WATER ALLOCATION AND SAFETY:\n   - Requested 15,000 m³/annum poses risk to water resource quality\n   - No demonstration of water treatment capability for chemical processes\n   - Missing water quality monitoring and testing protocols\n   - No contingency plan for water contamination incidents\n\n4. REGULATORY AND DOCUMENTATION GAPS:\n   - Environmental clearance certificate not provided\n   - Missing industrial operation license\n   - No compliance plan with chemical safety regulations\n   - Inadequate community consultation documentation\n   - Missing detailed chemical process descriptions\n\n5. TECHNICAL SPECIFICATIONS:\n   - No closed-loop water system design\n   - Missing chemical containment systems\n   - Inadequate water treatment technology specifications\n   - No water recycling and reuse plan\n\nCRITICAL REQUIREMENTS FOR RESUBMISSION:\n- Comprehensive environmental and safety impact assessment by certified consultants\n- Detailed chemical process and safety management plan\n- Advanced wastewater treatment system design\n- Emergency response and contamination prevention plan\n- Complete environmental and industrial operation permits\n- Community consultation and acceptance documentation\n- Reduced water allocation request with full recycling system\n- Independent safety audit and certification\n\nApplication rejected on: February 20, 2024\nReview conducted by: Upper Manyame Sub Catchment Council Chairman\nNote: Resubmission requires pre-approval consultation with environmental authorities",
    stage: 2,
    createdAt: new Date("2024-02-20"),
    isRejectionReason: true,
  },
]
    \
    // Additional activity logs for new mock applications
    const additionalMockLogs: ActivityLog[] = [
      // Logs for unsubmitted applications
      {
        id: "log_unsubmitted_001",
        userId: "1",
        action: "Draft application created",
        applicationId: "app_unsubmitted_001",
        details: "Manufacturing water extraction application created by David Mpofu - Textile Production",
        timestamp: new Date("2024-03-18"),
      },
      {
        id: "log_unsubmitted_002",
        userId: "1",
        action: "Draft application created",
        applicationId: "app_unsubmitted_002",
        details: "Large scale irrigation application created by Patricia Nyamande - Tobacco Farming",
        timestamp: new Date("2024-03-17"),
      },
      {
        id: "log_unsubmitted_003",
        userId: "1",
        action: "Draft application created",
        applicationId: "app_unsubmitted_003",
        details: "Commercial poultry farming application created by Michael Chigumira",
        timestamp: new Date("2024-03-16"),
      },

      // Logs for pending applications
      {
        id: "log_pending_new_001",
        userId: "1",
        action: "Application submitted",
        applicationId: "app_pending_new_001",
        details: "Hotel and conference center water extraction application submitted by Elizabeth Mapfumo",
        timestamp: new Date("2024-03-20"),
      },
      {
        id: "log_pending_new_002",
        userId: "1",
        action: "Application submitted",
        applicationId: "app_pending_new_002",
        details: "Aquaculture fish farming application submitted by Joseph Sibanda",
        timestamp: new Date("2024-03-19"),
      },
      {
        id: "log_pending_new_003",
        userId: "1",
        action: "Application submitted",
        applicationId: "app_pending_new_003",
        details: "Domestic use application submitted by Grace Mukamuri",
        timestamp: new Date("2024-03-21"),
      },

      // Logs for approved applications
      {
        id: "log_approved_new_001",
        userId: "1",
        action: "Application approved",
        applicationId: "app_approved_new_001",
        details: "Small scale irrigation application MC2024-0058 approved for permit issuance",
        timestamp: new Date("2024-03-15"),
      },
      {
        id: "log_approved_new_002",
        userId: "1",
        action: "Application approved",
        applicationId: "app_approved_new_002",
        details: "Educational institution application MC2024-0059 approved for permit issuance",
        timestamp: new Date("2024-03-12"),
      },
      {
        id: "log_approved_new_003",
        userId: "1",
        action: "Application approved",
        applicationId: "app_approved_new_003",
        details: "Food processing application MC2024-0060 approved for permit issuance",
        timestamp: new Date("2024-03-10"),
      },
      {
        id: "log_approved_new_004",
        userId: "1",
        action: "Application approved",
        applicationId: "app_approved_new_004",
        details: "Healthcare facility application MC2024-0061 approved for permit issuance",
        timestamp: new Date("2024-03-18"),
      },

      // Logs for rejected applications
      {
        id: "log_rejected_new_001",
        userId: "2",
        action: "Application rejected",
        applicationId: "app_rejected_new_001",
        details: "Gold mining operation application MC2024-0062 rejected due to environmental concerns",
        timestamp: new Date("2024-03-05"),
      },
      {
        id: "log_rejected_new_002",
        userId: "1",
        action: "Application rejected",
        applicationId: "app_rejected_new_002",
        details:
          "Car wash application MC2024-0063 rejected due to excessive water allocation and missing conservation measures",
        timestamp: new Date("2024-03-08"),
      },
      {
        id: "log_rejected_new_003",
        userId: "3",
        action: "Application rejected",
        applicationId: "app_rejected_new_003",
        details: "Brick manufacturing application MC2024-0064 rejected due to environmental impact concerns",
        timestamp: new Date("2024-03-01"),
      },
      {
        id: "log_rejected_new_004",
        userId: "2",
        action: "Application rejected",
        applicationId: "app_rejected_new_004",
        details: "Chemical manufacturing application MC2024-0065 rejected due to safety and environmental risks",
        timestamp: new Date("2024-02-20"),
      },
    ]

    // Add the additional logs to the existing array
    this.logs.push(...additionalMockLogs)
    // Add the additional applications and comments to the existing arrays
    this.applications.push(...additionalMockApplications)
    this.comments.push(...additionalMockComments)

    // Update counter to avoid conflicts with new applications
    this.applicationCounter = 66 // Updated to account for new applications up to MC2024-0065
  }

  constructor() {
    this.initializeMockData()
  }

  /* ─────────────────────────────── users ──────────────────────────────── */
  async findUser(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username)
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id)
  }

  async createUser(user: User): Promise<User> {
    this.users.push(user)
    return user
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex((user) => user.id === id)
    if (userIndex === -1) {
      return undefined
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updates, updatedAt: new Date() }
    return this.users[userIndex]
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex((user) => user.id === id)
    if (userIndex === -1) {
      return false
    }

    this.users.splice(userIndex, 1)
    return true
  }

  async listUsers(): Promise<User[]> {
    return this.users
  }

  /* ──────────────────────── application CRUD ────────────────────────────── */
  async getApplication(id: string): Promise<PermitApplication | undefined> {
    return this.applications.find((application) => application.id === id)
  }

  async getApplicationByApplicationId(applicationId: string): Promise<PermitApplication | undefined> {
    return this.applications.find((application) => application.applicationId === applicationId)
  }

  async listApplications(): Promise<PermitApplication[]> {
    return this.applications
  }

  async listApplicationsByStatus(status: PermitApplication["status"]): Promise<PermitApplication[]> {
    return this.applications.filter((application) => application.status === status)
  }

  async listApplicationsByAssignedUser(userId: string): Promise<PermitApplication[]> {
    return this.applications.filter((application) => application.assignedTo === userId)
  }

  async createApplication(
    application: Omit<PermitApplication, "id" | "applicationId" | "createdAt" | "updatedAt">,
  ): Promise<PermitApplication> {
    const newApplication: PermitApplication = {
      id: `app_${this.applicationCounter++}`,
      applicationId: `MC2024-${String(this.applicationCounter).padStart(4, "0")}`,
      ...application,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.applications.push(newApplication)
    return newApplication
  }

  async updateApplication(id: string, updates: Partial<PermitApplication>): Promise<PermitApplication | undefined> {
    const applicationIndex = this.applications.findIndex((application) => application.id === id)
    if (applicationIndex === -1) {
      return undefined
    }

    this.applications[applicationIndex] = { ...this.applications[applicationIndex], ...updates, updatedAt: new Date() }
    return this.applications[applicationIndex]
  }

  async deleteApplication(id: string): Promise<boolean> {
    const applicationIndex = this.applications.findIndex((application) => application.id === id)
    if (applicationIndex === -1) {
      return false
    }

    this.applications.splice(applicationIndex, 1)
    return true
  }

  /* ──────────────────────── workflow comments CRUD ───────────────────────── */
  async getComment(id: string): Promise<WorkflowComment | undefined> {
    return this.comments.find((comment) => comment.id === id)
  }

  async listComments(applicationId: string): Promise<WorkflowComment[]> {
    return this.comments.filter((comment) => comment.applicationId === applicationId)
  }

  async createComment(comment: Omit<WorkflowComment, "id" | "createdAt">): Promise<WorkflowComment> {
    const newComment: WorkflowComment = {
      id: `comment_${this.comments.length + 1}`,
      ...comment,
      createdAt: new Date(),
    }

    this.comments.push(newComment)
    return newComment
  }

  async updateComment(id: string, updates: Partial<WorkflowComment>): Promise<WorkflowComment | undefined> {
    const commentIndex = this.comments.findIndex((comment) => comment.id === id)
    if (commentIndex === -1) {
      return undefined
    }

    this.comments[commentIndex] = { ...this.comments[commentIndex], ...updates }
    return this.comments[commentIndex]
  }

  async deleteComment(id: string): Promise<boolean> {
    const commentIndex = this.comments.findIndex((comment) => comment.id === id)
    if (commentIndex === -1) {
      return false
    }

    this.comments.splice(commentIndex, 1)
    return true
  }

  /* ────────────────────────── activity logs CRUD ─────────────────────────── */
  async getLog(id: string): Promise<ActivityLog | undefined> {
    return this.logs.find((log) => log.id === id)
  }

  async listLogs(applicationId: string): Promise<ActivityLog[]> {
    return this.logs.filter((log) => log.applicationId === applicationId)
  }

  async createLog(log: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog> {
    const newLog: ActivityLog = {
      id: `log_${this.logs.length + 1}`,
      ...log,
      createdAt: new Date(),
    }

    this.logs.push(newLog)
    return newLog
  }

  async updateLog(id: string, updates: Partial<ActivityLog>): Promise<ActivityLog | undefined> {
    const logIndex = this.logs.findIndex((log) => log.id === id)
    if (logIndex === -1) {
      return undefined
    }

    this.logs[logIndex] = { ...this.logs[logIndex], ...updates }
    return this.logs[logIndex]
  }

  async deleteLog(id: string): Promise<boolean> {
    const logIndex = this.logs.findIndex((log) => log.id === id)
    if (logIndex === -1) {
      return false
    }

    this.logs.splice(logIndex, 1)
    return true
  }

  /* ────────────────────────────── messages CRUD ───────────────────────────── */
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.find((message) => message.id === id)
  }

  async listMessages(userId: string): Promise<Message[]> {
    return this.messages.filter((message) => message.userId === userId)
  }

  async createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const newMessage: Message = {
      id: `message_${this.messages.length + 1}`,
      ...message,
      createdAt: new Date(),
    }

    this.messages.push(newMessage)
    return newMessage
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const messageIndex = this.messages.findIndex((message) => message.id === id)
    if (messageIndex === -1) {
      return undefined
    }

    this.messages[messageIndex] = { ...this.messages[messageIndex], ...updates }
    return this.messages[messageIndex]
  }

  async deleteMessage(id: string): Promise<boolean> {
    const messageIndex = this.messages.findIndex((message) => message.id === id)
    if (messageIndex === -1) {
      return false
    }

    this.messages.splice(messageIndex, 1)
    return true
  }

  /* ────────────────────────────── documents CRUD ───────────────────────────── */
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.find((document) => document.id === id)
  }

  async listDocuments(applicationId: string): Promise<Document[]> {
    return this.documents.filter((document) => document.applicationId === applicationId)
  }

  async createDocument(document: Omit<Document, "id" | "createdAt">): Promise<Document> {
    const newDocument: Document = {
      id: `document_${this.documents.length + 1}`,
      ...document,
      createdAt: new Date(),
    }

    this.documents.push(newDocument)
    return newDocument
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const documentIndex = this.documents.findIndex((document) => document.id === id)
    if (documentIndex === -1) {
      return undefined
    }

    this.documents[documentIndex] = { ...this.documents[documentIndex], ...updates }
    return this.documents[documentIndex]
  }

  async deleteDocument(id: string): Promise<boolean> {
    const documentIndex = this.documents.findIndex((document) => document.id === id)
    if (documentIndex === -1) {
      return false
    }

    this.documents.splice(documentIndex, 1)
    return true
  }
}

const mockDatabase = new MockDatabase()
export default mockDatabase
