import type { PermitApplication, User, WorkflowComment, ActivityLog, Message, Document } from "@/types"

/* -------------------------------------------------------------------------- */
/*                             In-memory database                             */
/*   In production replace with Supabase or another persistent datastore.     */
/* -------------------------------------------------------------------------- */

class MockDatabase {
  /* ──────────────────────────── core storage ────────────────────────────── */
  private applications: PermitApplication[] = []
  private users: User[] = [
    {
      id: "1",
      username: "admin",
      userType: "permitting_officer",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      username: "admin",
      userType: "chairperson",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      username: "admin",
      userType: "catchment_manager",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      username: "admin",
      userType: "catchment_chairperson",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      username: "admin",
      userType: "permit_supervisor",
      password: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      username: "umsccict2025",
      userType: "ict",
      password: "umsccict2025",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
  private comments: WorkflowComment[] = []
  private logs: ActivityLog[] = []
  private messages: Message[] = []
  private documents: Document[] = []

  private applicationCounter = 1

  constructor() {
    // Add sample applications for testing
    this.seedSampleData()
  }

  private seedSampleData() {
    const sampleApplications: PermitApplication[] = [
      // EXISTING APPROVED APPLICATION (Stage 6 - Completed)
      {
        id: "app_1",
        applicationId: "MC2024-0001",
        applicantName: "John Smith",
        customerAccountNumber: "ACC001234",
        cellularNumber: "0712345678",
        physicalAddress: "123 Main Street, Harare",
        postalAddress: "P.O. Box 1234, Harare",
        permitType: "borehole",
        intendedUse: "Domestic water supply for residential property",
        landSize: 0.5,
        numberOfBoreholes: 1,
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        waterSource: "Groundwater from shallow aquifer",
        waterSourceDetails: "Single borehole at 45m depth with yield of 2.5ML/year",
        waterAllocation: 2.5,
        validityPeriod: 5,
        comments: "Standard residential application with all required documentation",
        status: "approved",
        currentStage: 6,
        createdBy: "1",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-20"),
        submittedAt: new Date("2024-01-16"),
        approvedAt: new Date("2024-02-20"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 4 - PENDING CATCHMENT CHAIRPERSON DECISION #1 (Borehole)
      {
        id: "app_2",
        applicationId: "MC2024-0002",
        applicantName: "Mary Johnson",
        customerAccountNumber: "ACC005678",
        cellularNumber: "0723456789",
        physicalAddress: "456 Oak Avenue, Bulawayo",
        postalAddress: "P.O. Box 5678, Bulawayo",
        permitType: "borehole",
        intendedUse: "Commercial farming irrigation operations",
        landSize: 15.0,
        numberOfBoreholes: 2,
        gpsLatitude: -20.1504,
        gpsLongitude: 28.5906,
        waterSource: "Deep groundwater aquifer system",
        waterSourceDetails: "Two boreholes at 65m and 80m depth with combined yield of 25ML/year for crop irrigation",
        waterAllocation: 25.0,
        validityPeriod: 10,
        comments: "Commercial farming operation requiring technical assessment",
        status: "under_review",
        currentStage: 4, // CATCHMENT CHAIRPERSON STAGE
        createdBy: "1",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-03-05"),
        submittedAt: new Date("2024-02-02"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 4 - PENDING CATCHMENT CHAIRPERSON DECISION #2 (Surface Water)
      {
        id: "app_3",
        applicationId: "MC2024-0003",
        applicantName: "Robert Wilson",
        customerAccountNumber: "ACC009876",
        cellularNumber: "0734567890",
        physicalAddress: "789 Pine Road, Mutare",
        postalAddress: "P.O. Box 9876, Mutare",
        permitType: "surface_water",
        intendedUse: "Industrial water supply for manufacturing",
        landSize: 2.0,
        numberOfBoreholes: 0,
        gpsLatitude: -18.9707,
        gpsLongitude: 32.6731,
        waterSource: "Seasonal river with abstraction point",
        waterSourceDetails: "River abstraction with treatment facility for industrial manufacturing processes",
        waterAllocation: 35.0,
        validityPeriod: 7,
        comments: "Industrial application requiring environmental compliance assessment",
        status: "under_review",
        currentStage: 4, // CATCHMENT CHAIRPERSON STAGE
        createdBy: "1",
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-03-08"),
        submittedAt: new Date("2024-02-12"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 4 - PENDING CATCHMENT CHAIRPERSON DECISION #3 (Municipal)
      {
        id: "app_4",
        applicationId: "MC2024-0004",
        applicantName: "Sarah Davis",
        customerAccountNumber: "ACC004321",
        cellularNumber: "0745678901",
        physicalAddress: "321 Cedar Street, Gweru",
        postalAddress: "P.O. Box 4321, Gweru",
        permitType: "surface_water",
        intendedUse: "Municipal water supply expansion",
        landSize: 0.8,
        numberOfBoreholes: 0,
        gpsLatitude: -19.4543,
        gpsLongitude: 29.8154,
        waterSource: "Municipal reservoir and treatment plant",
        waterSourceDetails: "Expansion of existing municipal water treatment facility with river abstraction",
        waterAllocation: 45.0,
        validityPeriod: 15,
        comments: "Municipal expansion project with high priority status",
        status: "under_review",
        currentStage: 4, // CATCHMENT CHAIRPERSON STAGE
        createdBy: "1",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-03-10"),
        submittedAt: new Date("2024-01-21"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 4 - PENDING CATCHMENT CHAIRPERSON DECISION #4 (Commercial)
      {
        id: "app_5",
        applicationId: "MC2024-0005",
        applicantName: "Michael Brown",
        customerAccountNumber: "ACC007890",
        cellularNumber: "0756789012",
        physicalAddress: "654 Birch Lane, Masvingo",
        postalAddress: "P.O. Box 7890, Masvingo",
        permitType: "borehole",
        intendedUse: "Commercial bottled water production",
        landSize: 1.2,
        numberOfBoreholes: 4,
        gpsLatitude: -20.0637,
        gpsLongitude: 30.8267,
        waterSource: "High-quality groundwater aquifer",
        waterSourceDetails: "Four production boreholes with water quality suitable for bottling operations",
        waterAllocation: 55.0,
        validityPeriod: 12,
        comments: "Commercial bottled water facility requiring sustainability assessment",
        status: "under_review",
        currentStage: 4, // CATCHMENT CHAIRPERSON STAGE
        createdBy: "1",
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-03-12"),
        submittedAt: new Date("2024-02-21"),
        documents: [],
        workflowComments: [],
      },

      // APPROVED BY CATCHMENT CHAIRPERSON (for testing permit printing)
      {
        id: "app_6",
        applicationId: "MC2024-0006",
        applicantName: "Jennifer Martinez",
        customerAccountNumber: "ACC012345",
        cellularNumber: "0767890123",
        physicalAddress: "987 Maple Drive, Chinhoyi",
        postalAddress: "P.O. Box 12345, Chinhoyi",
        permitType: "borehole",
        intendedUse: "Agricultural irrigation for crop production",
        landSize: 8.5,
        numberOfBoreholes: 2,
        gpsLatitude: -17.3667,
        gpsLongitude: 30.1833,
        waterSource: "Intermediate groundwater aquifer",
        waterSourceDetails: "Two boreholes at 65m and 70m depth for crop irrigation with drip system",
        waterAllocation: 18.5,
        validityPeriod: 8,
        comments: "Agricultural irrigation with water-efficient drip system",
        status: "approved",
        currentStage: 5, // COMPLETED
        createdBy: "1",
        createdAt: new Date("2024-02-25"),
        updatedAt: new Date("2024-03-15"),
        submittedAt: new Date("2024-02-26"),
        approvedAt: new Date("2024-03-15"),
        documents: [],
        workflowComments: [],
      },

      // REJECTED BY CATCHMENT CHAIRPERSON (for testing rejection notice printing)
      {
        id: "app_7",
        applicationId: "MC2024-0007",
        applicantName: "David Thompson",
        customerAccountNumber: "ACC098765",
        cellularNumber: "0778901234",
        physicalAddress: "147 Elm Street, Kadoma",
        postalAddress: "P.O. Box 98765, Kadoma",
        permitType: "surface_water",
        intendedUse: "Mining operations water supply",
        landSize: 5.0,
        numberOfBoreholes: 0,
        gpsLatitude: -18.3333,
        gpsLongitude: 29.9167,
        waterSource: "Seasonal river near mining site",
        waterSourceDetails: "River abstraction for mining operations with water recycling system",
        waterAllocation: 75.0,
        validityPeriod: 5,
        comments: "Mining operation with environmental compliance requirements",
        status: "rejected",
        currentStage: 5, // COMPLETED
        createdBy: "1",
        createdAt: new Date("2024-02-28"),
        updatedAt: new Date("2024-03-18"),
        submittedAt: new Date("2024-02-28"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 3 - PENDING CATCHMENT MANAGER REVIEW (for comparison)
      {
        id: "app_8",
        applicationId: "MC2024-0008",
        applicantName: "Lisa Anderson",
        customerAccountNumber: "ACC054321",
        cellularNumber: "0789012345",
        physicalAddress: "258 Willow Street, Kwekwe",
        postalAddress: "P.O. Box 54321, Kwekwe",
        permitType: "borehole",
        intendedUse: "Residential water supply",
        landSize: 0.3,
        numberOfBoreholes: 1,
        gpsLatitude: -18.9167,
        gpsLongitude: 29.8167,
        waterSource: "Shallow groundwater aquifer",
        waterSourceDetails: "Single borehole at 35m depth for residential use",
        waterAllocation: 3.0,
        validityPeriod: 5,
        comments: "Standard residential application",
        status: "under_review",
        currentStage: 3, // CATCHMENT MANAGER STAGE
        createdBy: "1",
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-05"),
        submittedAt: new Date("2024-03-02"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 2 - PENDING SUB CATCHMENT CHAIRPERSON REVIEW #1
      {
        id: "app_9",
        applicationId: "MC2024-0009",
        applicantName: "Patricia Williams",
        customerAccountNumber: "ACC111222",
        cellularNumber: "0791234567",
        physicalAddress: "159 Acacia Road, Norton",
        postalAddress: "P.O. Box 111222, Norton",
        permitType: "borehole",
        intendedUse: "Small-scale commercial farming",
        landSize: 3.5,
        numberOfBoreholes: 1,
        gpsLatitude: -17.8833,
        gpsLongitude: 30.7,
        waterSource: "Shallow groundwater aquifer",
        waterSourceDetails: "Single borehole at 40m depth for small-scale farming operations",
        waterAllocation: 8.0,
        validityPeriod: 6,
        comments: "Small-scale farming operation with sustainable practices",
        status: "under_review",
        currentStage: 2, // SUB CATCHMENT CHAIRPERSON STAGE
        createdBy: "1",
        createdAt: new Date("2024-03-15"),
        updatedAt: new Date("2024-03-16"),
        submittedAt: new Date("2024-03-16"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 2 - PENDING SUB CATCHMENT CHAIRPERSON REVIEW #2
      {
        id: "app_10",
        applicationId: "MC2024-0010",
        applicantName: "James Rodriguez",
        customerAccountNumber: "ACC333444",
        cellularNumber: "0702345678",
        physicalAddress: "267 Baobab Street, Chegutu",
        postalAddress: "P.O. Box 333444, Chegutu",
        permitType: "surface_water",
        intendedUse: "Fish farming operations",
        landSize: 2.8,
        numberOfBoreholes: 0,
        gpsLatitude: -18.1333,
        gpsLongitude: 30.15,
        waterSource: "Seasonal stream with pond construction",
        waterSourceDetails: "Stream diversion for fish pond construction and aquaculture operations",
        waterAllocation: 15.0,
        validityPeriod: 8,
        comments: "Aquaculture project with environmental considerations",
        status: "under_review",
        currentStage: 2, // SUB CATCHMENT CHAIRPERSON STAGE
        createdBy: "1",
        createdAt: new Date("2024-03-18"),
        updatedAt: new Date("2024-03-19"),
        submittedAt: new Date("2024-03-19"),
        documents: [],
        workflowComments: [],
      },

      // STAGE 2 - PENDING SUB CATCHMENT CHAIRPERSON REVIEW #3
      {
        id: "app_11",
        applicationId: "MC2024-0011",
        applicantName: "Grace Mukamuri",
        customerAccountNumber: "ACC555666",
        cellularNumber: "0713456789",
        physicalAddress: "384 Msasa Drive, Chitungwiza",
        postalAddress: "P.O. Box 555666, Chitungwiza",
        permitType: "borehole",
        intendedUse: "Community water supply project",
        landSize: 0.2,
        numberOfBoreholes: 1,
        gpsLatitude: -18.0167,
        gpsLongitude: 31.0833,
        waterSource: "Community borehole system",
        waterSourceDetails: "Community borehole with distribution network for residential area",
        waterAllocation: 12.0,
        validityPeriod: 10,
        comments: "Community development project for water access",
        status: "under_review",
        currentStage: 2, // SUB CATCHMENT CHAIRPERSON STAGE
        createdBy: "1",
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-03-21"),
        submittedAt: new Date("2024-03-21"),
        documents: [],
        workflowComments: [],
      },

      // APPROVED BY SUB CATCHMENT CHAIRPERSON (now at Stage 3)
      {
        id: "app_12",
        applicationId: "MC2024-0012",
        applicantName: "Thomas Chikwanha",
        customerAccountNumber: "ACC777888",
        cellularNumber: "0724567890",
        physicalAddress: "492 Flame Lily Avenue, Ruwa",
        postalAddress: "P.O. Box 777888, Ruwa",
        permitType: "borehole",
        intendedUse: "Horticultural farming operations",
        landSize: 4.2,
        numberOfBoreholes: 2,
        gpsLatitude: -17.89,
        gpsLongitude: 31.2444,
        waterSource: "Intermediate groundwater aquifer",
        waterSourceDetails: "Two boreholes for greenhouse and open field horticulture",
        waterAllocation: 20.0,
        validityPeriod: 7,
        comments: "Horticultural project with modern irrigation systems",
        status: "under_review",
        currentStage: 3, // MOVED TO CATCHMENT MANAGER
        createdBy: "1",
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-25"),
        submittedAt: new Date("2024-03-11"),
        documents: [],
        workflowComments: [],
      },

      // REJECTED BY SUB CATCHMENT CHAIRPERSON
      {
        id: "app_13",
        applicationId: "MC2024-0013",
        applicantName: "Susan Moyo",
        customerAccountNumber: "ACC999000",
        cellularNumber: "0735678901",
        physicalAddress: "156 Jacaranda Close, Borrowdale",
        postalAddress: "P.O. Box 999000, Borrowdale",
        permitType: "surface_water",
        intendedUse: "Recreational facility water features",
        landSize: 1.5,
        numberOfBoreholes: 0,
        gpsLatitude: -17.8047,
        gpsLongitude: 31.0492,
        waterSource: "Ornamental pond and fountain system",
        waterSourceDetails: "Water features for recreational facility including ponds and fountains",
        waterAllocation: 25.0,
        validityPeriod: 5,
        comments: "Recreational water features for commercial facility",
        status: "rejected",
        currentStage: 5, // COMPLETED - REJECTED
        createdBy: "1",
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-03-22"),
        submittedAt: new Date("2024-03-06"),
        documents: [],
        workflowComments: [],
      },

      // FULLY APPROVED APPLICATION (for permit printing test)
      {
        id: "app_14",
        applicationId: "MC2024-0014",
        applicantName: "Peter Ndlovu",
        customerAccountNumber: "ACC123789",
        cellularNumber: "0746789012",
        physicalAddress: "678 Mukwa Street, Mbare",
        postalAddress: "P.O. Box 123789, Mbare",
        permitType: "borehole",
        intendedUse: "Small business water supply",
        landSize: 0.1,
        numberOfBoreholes: 1,
        gpsLatitude: -17.8667,
        gpsLongitude: 31.0333,
        waterSource: "Shallow borehole for business use",
        waterSourceDetails: "Single borehole for small manufacturing business water supply",
        waterAllocation: 5.0,
        validityPeriod: 5,
        comments: "Small business water supply application",
        status: "approved",
        currentStage: 6, // FULLY COMPLETED
        createdBy: "1",
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-03-28"),
        submittedAt: new Date("2024-02-16"),
        approvedAt: new Date("2024-03-28"),
        documents: [],
        workflowComments: [],
      },
    ]

    // Add comprehensive sample comments for all stages
    const sampleComments: WorkflowComment[] = [
      // Comments for MC2024-0002 (Mary Johnson - Commercial Farming) - STAGE 4 PENDING
      {
        id: "comment_1",
        applicationId: "app_2",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Commercial farming application reviewed. All required documents submitted including land ownership certificates, environmental clearance, and borehole completion certificates. Water allocation calculation verified against farming requirements. Application meets all regulatory requirements for Stage 1 approval.",
        action: "approve",
        createdAt: new Date("2024-02-03"),
      },
      {
        id: "comment_2",
        applicationId: "app_2",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Commercial farming operation with significant water allocation reviewed. Business plan and farming operations appear sustainable. Environmental impact assessment provided. Recommend technical feasibility assessment by Catchment Manager for aquifer sustainability evaluation.",
        action: "approve",
        createdAt: new Date("2024-02-15"),
      },
      {
        id: "comment_3",
        applicationId: "app_2",
        userId: "3",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "Technical assessment completed. Aquifer capacity analysis shows sustainable yield for requested allocation. Groundwater monitoring plan approved. Environmental compliance measures adequate. Water conservation practices with drip irrigation system commendable. Recommend approval for final decision.",
        action: "approve",
        createdAt: new Date("2024-03-05"),
      },

      // Comments for MC2024-0003 (Robert Wilson - Industrial) - STAGE 4 PENDING
      {
        id: "comment_4",
        applicationId: "app_3",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Industrial water supply application for manufacturing facility. All documentation in order including industrial licenses, environmental impact assessment, and water treatment facility plans. Water allocation justified by production requirements. Wastewater treatment and recycling plans provided.",
        action: "approve",
        createdAt: new Date("2024-02-13"),
      },
      {
        id: "comment_5",
        applicationId: "app_3",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Industrial application with substantial water allocation reviewed. Manufacturing facility environmental compliance documentation adequate. Water recycling and treatment systems planned. Forward to Catchment Manager for detailed technical assessment of river abstraction impact.",
        action: "approve",
        createdAt: new Date("2024-02-25"),
      },
      {
        id: "comment_6",
        applicationId: "app_3",
        userId: "3",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "River flow analysis completed. Seasonal abstraction plan acceptable with proposed storage facilities. Environmental monitoring protocols established. Industrial wastewater treatment meets discharge standards. Water recycling efficiency targets set at 70%. Technical assessment satisfactory - recommend for final approval.",
        action: "approve",
        createdAt: new Date("2024-03-08"),
      },

      // Comments for MC2024-0004 (Sarah Davis - Municipal) - STAGE 4 PENDING
      {
        id: "comment_7",
        applicationId: "app_4",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Municipal water supply expansion application. High priority project due to population growth. All municipal documentation provided including council resolutions, population projections, and infrastructure plans. Environmental assessments completed. Water allocation justified by demographic studies.",
        action: "approve",
        createdAt: new Date("2024-01-22"),
      },
      {
        id: "comment_8",
        applicationId: "app_4",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Municipal expansion project approved for technical review. Critical infrastructure development with high community impact. Population growth projections support increased allocation. Requires comprehensive technical assessment of treatment capacity and distribution network.",
        action: "approve",
        createdAt: new Date("2024-02-10"),
      },
      {
        id: "comment_9",
        applicationId: "app_4",
        userId: "3",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "Municipal infrastructure assessment completed. Treatment plant expansion plans technically sound. River abstraction impact modeling shows acceptable environmental effects. Water quality monitoring systems adequate. Distribution network capacity verified. Strong recommendation for approval given community benefit.",
        action: "approve",
        createdAt: new Date("2024-03-10"),
      },

      // Comments for MC2024-0005 (Michael Brown - Commercial Bottling) - STAGE 4 PENDING
      {
        id: "comment_10",
        applicationId: "app_5",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Commercial bottled water production application. High water allocation requested for bottling operations. All business licenses and water quality certificates provided. Borehole completion certificates for all four production wells submitted. Quality control and testing protocols documented.",
        action: "approve",
        createdAt: new Date("2024-02-22"),
      },
      {
        id: "comment_11",
        applicationId: "app_5",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Commercial bottling operation with significant water allocation. Business case demonstrates market demand and economic viability. Water quality standards exceed bottling requirements. Critical technical assessment needed for long-term aquifer sustainability and production capacity.",
        action: "approve",
        createdAt: new Date("2024-03-05"),
      },
      {
        id: "comment_12",
        applicationId: "app_5",
        userId: "3",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "Comprehensive aquifer assessment completed. Four-borehole system shows excellent water quality and sustainable yield. Groundwater recharge analysis indicates long-term viability. Water quality monitoring and testing protocols exceed industry standards. Production sustainability verified - recommend approval with monitoring conditions.",
        action: "approve",
        createdAt: new Date("2024-03-12"),
      },

      // Comments for MC2024-0006 (Jennifer Martinez - Agricultural) - APPROVED
      {
        id: "comment_13",
        applicationId: "app_6",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Agricultural irrigation application with water-efficient drip system. All agricultural permits and land ownership documents verified. Crop production plan and irrigation schedule provided. Water conservation measures demonstrate responsible usage practices.",
        action: "approve",
        createdAt: new Date("2024-02-27"),
      },
      {
        id: "comment_14",
        applicationId: "app_6",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Agricultural application with excellent water conservation practices. Drip irrigation system efficiency rated at 85%. Crop rotation and soil management plans support sustainable farming. Recommend technical review for aquifer capacity and allocation optimization.",
        action: "approve",
        createdAt: new Date("2024-03-08"),
      },
      {
        id: "comment_15",
        applicationId: "app_6",
        userId: "3",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "Technical assessment shows sustainable aquifer yield for requested allocation. Water conservation measures exemplary with drip irrigation and soil moisture monitoring. Environmental impact minimal with proper agricultural practices. Strong recommendation for approval.",
        action: "approve",
        createdAt: new Date("2024-03-12"),
      },
      {
        id: "comment_16",
        applicationId: "app_6",
        userId: "4",
        userType: "catchment_chairperson",
        stage: 4,
        comment:
          "Final review completed. Agricultural operation demonstrates excellent water conservation practices and sustainable farming methods. All technical assessments positive. Environmental compliance exemplary. Application approved for permit issuance.",
        action: "approve",
        createdAt: new Date("2024-03-15"),
      },

      // Comments for MC2024-0007 (David Thompson - Mining) - REJECTED
      {
        id: "comment_17",
        applicationId: "app_7",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Mining operations water supply application. All mining licenses and environmental clearances provided. Water recycling system planned for operations. High water allocation requested for mineral processing and dust suppression.",
        action: "approve",
        createdAt: new Date("2024-03-01"),
      },
      {
        id: "comment_18",
        applicationId: "app_7",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Mining operation with substantial water requirements. Environmental compliance documentation provided. Water recycling plans show 60% efficiency target. Requires detailed technical assessment of environmental impact and water source sustainability.",
        action: "approve",
        createdAt: new Date("2024-03-10"),
      },
      {
        id: "comment_19",
        applicationId: "app_7",
        userId: "3",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "Technical assessment reveals concerns about seasonal river flow capacity during dry periods. Mining operations would significantly impact downstream water availability for existing users. Water recycling efficiency below recommended standards. Environmental impact assessment shows potential risks to aquatic ecosystems. Recommend approval with strict conditions and enhanced monitoring.",
        action: "approve",
        createdAt: new Date("2024-03-15"),
      },
      {
        id: "comment_20",
        applicationId: "app_7",
        userId: "4",
        userType: "catchment_chairperson",
        stage: 4,
        comment:
          "After comprehensive review of all technical assessments and environmental impact studies, this application is rejected. Primary concerns: 1) Excessive water allocation would severely impact downstream users during dry seasons, 2) Proposed water recycling efficiency of 60% is insufficient for mining operations of this scale, 3) Environmental impact on seasonal river ecosystem is unacceptable, 4) Alternative water sources not adequately explored. Applicant may resubmit with enhanced water conservation measures, alternative water sources, and improved environmental mitigation strategies.",
        action: "reject",
        isRejectionReason: true,
        createdAt: new Date("2024-03-18"),
      },

      // Comments for MC2024-0009 (Patricia Williams - Small-scale farming) - STAGE 2 PENDING
      {
        id: "comment_21",
        applicationId: "app_9",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Small-scale commercial farming application reviewed. All documentation in order including land ownership certificates and farming business plan. Water allocation appropriate for proposed crop production. Environmental clearance provided.",
        action: "approve",
        createdAt: new Date("2024-03-16"),
      },

      // Comments for MC2024-0010 (James Rodriguez - Fish farming) - STAGE 2 PENDING
      {
        id: "comment_22",
        applicationId: "app_10",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Aquaculture project application with stream diversion for fish farming. Environmental impact assessment provided. Fish farming license and business plan submitted. Water allocation calculated for pond construction and fish production requirements.",
        action: "approve",
        createdAt: new Date("2024-03-19"),
      },

      // Comments for MC2024-0011 (Grace Mukamuri - Community project) - STAGE 2 PENDING
      {
        id: "comment_23",
        applicationId: "app_11",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Community water supply project for residential area. Community committee documentation and resolutions provided. Borehole siting and technical specifications appropriate. Water allocation justified by population served. Strong community development impact.",
        action: "approve",
        createdAt: new Date("2024-03-21"),
      },

      // Comments for MC2024-0012 (Thomas Chikwanha - Horticultural) - APPROVED BY CHAIRPERSON
      {
        id: "comment_24",
        applicationId: "app_12",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Horticultural farming operation with modern greenhouse and irrigation systems. All agricultural permits and business documentation provided. Water-efficient irrigation technology planned. Environmental compliance measures adequate.",
        action: "approve",
        createdAt: new Date("2024-03-11"),
      },
      {
        id: "comment_25",
        applicationId: "app_12",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Horticultural project with excellent business case and modern farming practices. Greenhouse operations with controlled environment agriculture show strong economic viability. Water-efficient irrigation systems demonstrate responsible resource use. Recommend technical assessment for sustainable water allocation.",
        action: "approve",
        createdAt: new Date("2024-03-25"),
      },

      // Comments for MC2024-0013 (Susan Moyo - Recreational) - REJECTED BY CHAIRPERSON
      {
        id: "comment_26",
        applicationId: "app_13",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Recreational facility water features application including ornamental ponds and fountains. Business license and facility plans provided. Water allocation requested for aesthetic and recreational purposes.",
        action: "approve",
        createdAt: new Date("2024-03-06"),
      },
      {
        id: "comment_27",
        applicationId: "app_13",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "After careful review of this recreational water features application, I must reject this request. Primary concerns: 1) The requested 25ML allocation for ornamental purposes is excessive and not justified given current water scarcity concerns, 2) Recreational water features are considered non-essential use during periods of water stress, 3) No water recycling or conservation measures proposed for the facility, 4) Alternative landscaping options using drought-resistant plants not explored, 5) The business case does not demonstrate sufficient community benefit to justify the large water allocation. The applicant may resubmit with significantly reduced water allocation, comprehensive water recycling systems, and drought-resistant landscaping alternatives.",
        action: "reject",
        isRejectionReason: true,
        createdAt: new Date("2024-03-22"),
      },

      // Comments for MC2024-0014 (Peter Ndlovu - Small business) - FULLY APPROVED
      {
        id: "comment_28",
        applicationId: "app_14",
        userId: "1",
        userType: "permitting_officer",
        stage: 1,
        comment:
          "Small business water supply application for manufacturing operations. All business licenses and documentation provided. Water allocation appropriate for small-scale manufacturing. Environmental compliance measures adequate.",
        action: "approve",
        createdAt: new Date("2024-02-16"),
      },
      {
        id: "comment_29",
        applicationId: "app_14",
        userId: "2",
        userType: "chairperson",
        stage: 2,
        comment:
          "Small business application with reasonable water allocation for manufacturing. Business case shows local employment creation and economic benefit. Water usage appropriate for scale of operations. Recommend technical assessment.",
        action: "approve",
        createdAt: new Date("2024-02-28"),
      },
      {
        id: "comment_30",
        applicationId: "app_14",
        userId: "3",
        userType: "catchment_manager",
        stage: 3,
        comment:
          "Technical assessment completed for small business water supply. Borehole specifications appropriate for requested yield. No environmental concerns identified. Water allocation sustainable for local aquifer. Recommend approval.",
        action: "approve",
        createdAt: new Date("2024-03-15"),
      },
      {
        id: "comment_31",
        applicationId: "app_14",
        userId: "4",
        userType: "catchment_chairperson",
        stage: 4,
        comment:
          "Small business water supply application approved. All technical assessments positive. Local economic benefit with job creation. Environmental compliance adequate. Permit approved for issuance.",
        action: "approve",
        createdAt: new Date("2024-03-28"),
      },
    ]

    // Add sample documents for testing
    const sampleDocuments: Document[] = [
      // Documents for MC2024-0002 (Mary Johnson)
      {
        id: "doc_1",
        applicationId: "app_2",
        fileName: "GW7B_Application_Form_Johnson.pdf",
        fileType: "pdf",
        fileSize: 245760,
        documentType: "application_form",
        uploadedAt: new Date("2024-02-01"),
      },
      {
        id: "doc_2",
        applicationId: "app_2",
        fileName: "Environmental_Clearance_Certificate.pdf",
        fileType: "pdf",
        fileSize: 189440,
        documentType: "environmental_clearance",
        uploadedAt: new Date("2024-02-01"),
      },
      {
        id: "doc_3",
        applicationId: "app_2",
        fileName: "Site_Plan_Dam_Construction.pdf",
        fileType: "pdf",
        fileSize: 512000,
        documentType: "site_plan",
        uploadedAt: new Date("2024-02-01"),
      },

      // Documents for MC2024-0003 (Robert Wilson)
      {
        id: "doc_4",
        applicationId: "app_3",
        fileName: "GW7B_Application_Wilson_Industrial.pdf",
        fileType: "pdf",
        fileSize: 198720,
        documentType: "application_form",
        uploadedAt: new Date("2024-02-10"),
      },
      {
        id: "doc_5",
        applicationId: "app_3",
        fileName: "Borehole_Completion_Certificate_BH1.pdf",
        fileType: "pdf",
        fileSize: 156800,
        documentType: "borehole_completion",
        uploadedAt: new Date("2024-02-10"),
      },
      {
        id: "doc_6",
        applicationId: "app_3",
        fileName: "Borehole_Completion_Certificate_BH2.pdf",
        fileType: "pdf",
        fileSize: 162304,
        documentType: "borehole_completion",
        uploadedAt: new Date("2024-02-10"),
      },
      {
        id: "doc_7",
        applicationId: "app_3",
        fileName: "Borehole_Completion_Certificate_BH3.pdf",
        fileType: "pdf",
        fileSize: 158976,
        documentType: "borehole_completion",
        uploadedAt: new Date("2024-02-10"),
      },
    ]

    this.applications = sampleApplications
    this.comments = sampleComments
    this.documents = sampleDocuments
    this.applicationCounter = 15
  }

  /* ───────────────────────── Applications CRUD ──────────────────────────── */
  async createApplication(
    data: Omit<PermitApplication, "id" | "applicationId" | "createdAt" | "updatedAt">,
  ): Promise<PermitApplication> {
    console.log("Database: Creating application with data:", data) // Add debugging

    const application: PermitApplication = {
      ...data,
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      applicationId: `MC${new Date().getFullYear()}-${String(this.applicationCounter++).padStart(4, "0")}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Database: Created application object:", application) // Add debugging
    this.applications.push(application)
    console.log("Database: Total applications now:", this.applications.length) // Add debugging
    console.log(
      "Database: All applications:",
      this.applications.map((app) => ({
        id: app.applicationId,
        status: app.status,
        createdBy: app.createdBy,
        applicantName: app.applicantName,
      })),
    ) // Add debugging

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
