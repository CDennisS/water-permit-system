import { db } from "@/lib/database"

/**
 * Creates comprehensive test permit applications for preview functionality testing
 */
export async function createTestPermitApplications() {
  console.log("🚀 Creating test permit applications...")

  // Get test users
  const users = await db.getUsers()
  const permittingOfficer = users.find((u) => u.userType === "permitting_officer")
  const chairperson = users.find((u) => u.userType === "chairperson")
  const catchmentManager = users.find((u) => u.userType === "catchment_manager")

  if (!permittingOfficer || !chairperson || !catchmentManager) {
    throw new Error("Required test users not found in database")
  }

  // Test Application 1: Simple Approved Domestic Use
  const domesticApp = await db.createApplication({
    applicantName: "Sarah Johnson",
    physicalAddress: "45 Riverside Drive, Borrowdale, Harare",
    postalAddress: "P.O. Box 2847, Harare",
    customerAccountNumber: "DOM001",
    cellularNumber: "+263771234567",
    numberOfBoreholes: 1,
    landSize: 2.5,
    gpsLatitude: -17.7669,
    gpsLongitude: 31.0746,
    waterSource: "ground_water",
    waterSourceDetails: "Single borehole for domestic water supply",
    permitType: "urban",
    intendedUse: "Domestic water supply for residential property",
    waterAllocation: 1.2,
    validityPeriod: 5,
    comments: "Standard domestic water permit application",
    status: "approved",
    currentStage: 4,
    workflowComments: [],
    documents: [],
  })

  // Add workflow comments for domestic application
  await db.addComment({
    applicationId: domesticApp.id,
    userId: permittingOfficer.id,
    userType: "permitting_officer",
    comment:
      "Application reviewed and found complete. All required documentation submitted. Water allocation is reasonable for domestic use.",
    stage: 1,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: domesticApp.id,
    userId: chairperson.id,
    userType: "chairperson",
    comment: "Technical review completed. Domestic water allocation approved. No environmental concerns identified.",
    stage: 2,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: domesticApp.id,
    userId: catchmentManager.id,
    userType: "catchment_manager",
    comment: "Final approval granted. Permit ready for issuance. Water allocation sustainable for catchment area.",
    stage: 3,
    isRejectionReason: false,
  })

  // Add documents for domestic application
  await db.uploadDocument({
    applicationId: domesticApp.id,
    fileName: "application_form_domestic.pdf",
    fileType: "application/pdf",
    fileSize: 245760,
    documentType: "application_form",
  })

  await db.uploadDocument({
    applicationId: domesticApp.id,
    fileName: "proof_of_residence.pdf",
    fileType: "application/pdf",
    fileSize: 180000,
    documentType: "proof_of_residence",
  })

  await db.uploadDocument({
    applicationId: domesticApp.id,
    fileName: "payment_receipt.pdf",
    fileType: "application/pdf",
    fileSize: 95000,
    documentType: "receipt",
  })

  console.log(`✅ Created domestic application: ${domesticApp.applicationId}`)

  // Test Application 2: Complex Approved Agricultural Use
  const agriculturalApp = await db.createApplication({
    applicantName: "Zimbabwe Agricultural Development Trust",
    physicalAddress: "Farm 247, Mazowe District, Mashonaland Central",
    postalAddress: "P.O. Box 1847, Bindura",
    customerAccountNumber: "AGR002",
    cellularNumber: "+263772345678",
    numberOfBoreholes: 5,
    landSize: 150.0,
    gpsLatitude: -17.3667,
    gpsLongitude: 31.3333,
    waterSource: "ground_water",
    waterSourceDetails: "Five production boreholes for large-scale irrigation system",
    permitType: "irrigation",
    intendedUse: "Commercial tobacco and maize production with drip irrigation system",
    waterAllocation: 45.8,
    validityPeriod: 10,
    comments: "Large-scale agricultural operation with water conservation measures implemented",
    status: "approved",
    currentStage: 4,
    workflowComments: [],
    documents: [],
  })

  // Add comprehensive workflow comments for agricultural application
  await db.addComment({
    applicationId: agriculturalApp.id,
    userId: permittingOfficer.id,
    userType: "permitting_officer",
    comment:
      "Large-scale agricultural application reviewed. All required documentation submitted including detailed irrigation plans, water conservation measures, and environmental impact assessment. Water allocation justified by crop water requirements and efficient irrigation technology.",
    stage: 1,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: agriculturalApp.id,
    userId: chairperson.id,
    userType: "chairperson",
    comment:
      "Technical review completed for agricultural operation. Water allocation of 45.8 ML/annum approved based on: 1) Detailed crop water requirements analysis, 2) Implementation of drip irrigation system (85% efficiency), 3) Water conservation and recycling measures, 4) Sustainable groundwater management plan. Environmental impact assessment shows minimal impact on local water resources.",
    stage: 2,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: agriculturalApp.id,
    userId: catchmentManager.id,
    userType: "catchment_manager",
    comment:
      "Final catchment assessment completed. Agricultural water allocation approved with conditions: 1) Annual water usage reporting required, 2) Groundwater level monitoring at all boreholes, 3) Implementation of water conservation measures as per submitted plan, 4) Environmental compliance monitoring. Permit approved for 10-year validity period with annual review requirements.",
    stage: 3,
    isRejectionReason: false,
  })

  // Add comprehensive documents for agricultural application
  await db.uploadDocument({
    applicationId: agriculturalApp.id,
    fileName: "agricultural_application_form.pdf",
    fileType: "application/pdf",
    fileSize: 512000,
    documentType: "application_form",
  })

  await db.uploadDocument({
    applicationId: agriculturalApp.id,
    fileName: "farm_site_plan.pdf",
    fileType: "application/pdf",
    fileSize: 1024000,
    documentType: "site_plan",
  })

  await db.uploadDocument({
    applicationId: agriculturalApp.id,
    fileName: "borehole_capacity_tests.pdf",
    fileType: "application/pdf",
    fileSize: 768000,
    documentType: "capacity_test",
  })

  await db.uploadDocument({
    applicationId: agriculturalApp.id,
    fileName: "water_quality_analysis.pdf",
    fileType: "application/pdf",
    fileSize: 345000,
    documentType: "water_quality_test",
  })

  await db.uploadDocument({
    applicationId: agriculturalApp.id,
    fileName: "environmental_impact_assessment.pdf",
    fileType: "application/pdf",
    fileSize: 2048000,
    documentType: "environmental_clearance",
  })

  await db.uploadDocument({
    applicationId: agriculturalApp.id,
    fileName: "irrigation_system_design.pdf",
    fileType: "application/pdf",
    fileSize: 1536000,
    documentType: "other",
  })

  console.log(`✅ Created agricultural application: ${agriculturalApp.applicationId}`)

  // Test Application 3: Industrial Approved Application
  const industrialApp = await db.createApplication({
    applicantName: "Harare Industrial Manufacturing Ltd",
    physicalAddress: "Plot 15, Workington Industrial Area, Harare",
    postalAddress: "P.O. Box 4521, Harare",
    customerAccountNumber: "IND003",
    cellularNumber: "+263773456789",
    numberOfBoreholes: 3,
    landSize: 25.0,
    gpsLatitude: -17.8731,
    gpsLongitude: 31.0408,
    waterSource: "ground_water",
    waterSourceDetails: "Three industrial boreholes with water treatment facility",
    permitType: "industrial",
    intendedUse: "Manufacturing processes, cooling systems, and employee facilities",
    waterAllocation: 28.5,
    validityPeriod: 7,
    comments: "Industrial water permit with comprehensive wastewater treatment and recycling systems",
    status: "approved",
    currentStage: 4,
    workflowComments: [],
    documents: [],
  })

  // Add industrial application workflow comments
  await db.addComment({
    applicationId: industrialApp.id,
    userId: permittingOfficer.id,
    userType: "permitting_officer",
    comment:
      "Industrial water extraction application reviewed. Comprehensive documentation submitted including water treatment plans, wastewater management system, and environmental compliance measures. Water allocation justified by manufacturing process requirements and includes recycling systems.",
    stage: 1,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: industrialApp.id,
    userId: chairperson.id,
    userType: "chairperson",
    comment:
      "Technical assessment completed for industrial application. Water allocation approved based on: 1) Detailed process water requirements, 2) Implementation of closed-loop cooling systems, 3) Wastewater treatment and recycling (60% water recovery), 4) Environmental management plan compliance. Industrial discharge permits obtained from EMA.",
    stage: 2,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: industrialApp.id,
    userId: catchmentManager.id,
    userType: "catchment_manager",
    comment:
      "Final industrial permit approval with strict conditions: 1) Monthly water usage and discharge monitoring, 2) Quarterly water quality testing, 3) Annual environmental compliance audit, 4) Implementation of water conservation targets (15% reduction over 3 years). Permit valid for 7 years with annual performance reviews.",
    stage: 3,
    isRejectionReason: false,
  })

  // Add industrial application documents
  await db.uploadDocument({
    applicationId: industrialApp.id,
    fileName: "industrial_application_form.pdf",
    fileType: "application/pdf",
    fileSize: 456000,
    documentType: "application_form",
  })

  await db.uploadDocument({
    applicationId: industrialApp.id,
    fileName: "industrial_site_layout.pdf",
    fileType: "application/pdf",
    fileSize: 890000,
    documentType: "site_plan",
  })

  await db.uploadDocument({
    applicationId: industrialApp.id,
    fileName: "wastewater_treatment_plan.pdf",
    fileType: "application/pdf",
    fileSize: 1200000,
    documentType: "environmental_clearance",
  })

  await db.uploadDocument({
    applicationId: industrialApp.id,
    fileName: "water_recycling_system.pdf",
    fileType: "application/pdf",
    fileSize: 678000,
    documentType: "other",
  })

  console.log(`✅ Created industrial application: ${industrialApp.applicationId}`)

  // Test Application 4: Bulk Water Supply Approved
  const bulkWaterApp = await db.createApplication({
    applicantName: "Chitungwiza Municipality",
    physicalAddress: "Civic Centre, Chitungwiza",
    postalAddress: "P.O. Box 1025, Chitungwiza",
    customerAccountNumber: "BULK004",
    cellularNumber: "+263774567890",
    numberOfBoreholes: 8,
    landSize: 45.0,
    gpsLatitude: -18.0145,
    gpsLongitude: 31.0789,
    waterSource: "ground_water",
    waterSourceDetails: "Eight high-capacity municipal boreholes for urban water supply",
    permitType: "bulk_water",
    intendedUse: "Municipal water supply for Chitungwiza urban area (population 356,000)",
    waterAllocation: 125.0,
    validityPeriod: 15,
    comments: "Municipal bulk water supply permit for urban population with comprehensive distribution network",
    status: "approved",
    currentStage: 4,
    workflowComments: [],
    documents: [],
  })

  // Add bulk water application workflow comments
  await db.addComment({
    applicationId: bulkWaterApp.id,
    userId: permittingOfficer.id,
    userType: "permitting_officer",
    comment:
      "Municipal bulk water supply application reviewed. Comprehensive urban water supply plan submitted with detailed population projections, infrastructure development plans, and water demand analysis. Application supports critical urban water security for 356,000 residents.",
    stage: 1,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: bulkWaterApp.id,
    userId: chairperson.id,
    userType: "chairperson",
    comment:
      "Technical review completed for municipal bulk water supply. Water allocation of 125 ML/annum approved based on: 1) Population water demand analysis (350L per capita per day), 2) Infrastructure capacity assessment, 3) Groundwater sustainability study, 4) Water loss reduction program (target 15% reduction). Critical infrastructure for urban water security.",
    stage: 2,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: bulkWaterApp.id,
    userId: catchmentManager.id,
    userType: "catchment_manager",
    comment:
      "Final approval for municipal bulk water supply with comprehensive monitoring requirements: 1) Monthly groundwater level monitoring at all boreholes, 2) Quarterly water quality testing and reporting, 3) Annual water audit and loss assessment, 4) Five-year infrastructure development review. Permit valid for 15 years with 5-year performance reviews. Critical for urban water security in Chitungwiza.",
    stage: 3,
    isRejectionReason: false,
  })

  // Add bulk water application documents
  await db.uploadDocument({
    applicationId: bulkWaterApp.id,
    fileName: "municipal_water_application.pdf",
    fileType: "application/pdf",
    fileSize: 1024000,
    documentType: "application_form",
  })

  await db.uploadDocument({
    applicationId: bulkWaterApp.id,
    fileName: "urban_water_master_plan.pdf",
    fileType: "application/pdf",
    fileSize: 3072000,
    documentType: "site_plan",
  })

  await db.uploadDocument({
    applicationId: bulkWaterApp.id,
    fileName: "groundwater_sustainability_study.pdf",
    fileType: "application/pdf",
    fileSize: 2048000,
    documentType: "environmental_clearance",
  })

  await db.uploadDocument({
    applicationId: bulkWaterApp.id,
    fileName: "population_water_demand_analysis.pdf",
    fileType: "application/pdf",
    fileSize: 890000,
    documentType: "other",
  })

  console.log(`✅ Created bulk water application: ${bulkWaterApp.applicationId}`)

  // Test Application 5: Institution Approved Application
  const institutionApp = await db.createApplication({
    applicantName: "University of Zimbabwe",
    physicalAddress: "Mount Pleasant Campus, Harare",
    postalAddress: "P.O. Box MP167, Mount Pleasant, Harare",
    customerAccountNumber: "INST005",
    cellularNumber: "+263775678901",
    numberOfBoreholes: 4,
    landSize: 180.0,
    gpsLatitude: -17.784,
    gpsLongitude: 31.0534,
    waterSource: "ground_water",
    waterSourceDetails: "Four campus boreholes for university water supply",
    permitType: "institution",
    intendedUse: "University campus water supply including student accommodation, laboratories, and facilities",
    waterAllocation: 18.5,
    validityPeriod: 10,
    comments: "Educational institution water permit for comprehensive campus water supply",
    status: "approved",
    currentStage: 4,
    workflowComments: [],
    documents: [],
  })

  // Add institution application workflow comments
  await db.addComment({
    applicationId: institutionApp.id,
    userId: permittingOfficer.id,
    userType: "permitting_officer",
    comment:
      "Educational institution water application reviewed. Comprehensive campus water supply plan submitted including student accommodation (15,000 students), academic facilities, research laboratories, and administrative buildings. Water conservation measures implemented across campus.",
    stage: 1,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: institutionApp.id,
    userId: chairperson.id,
    userType: "chairperson",
    comment:
      "Technical review completed for university water supply. Water allocation approved based on: 1) Campus population analysis (15,000 students, 3,000 staff), 2) Facility water requirements including laboratories, 3) Student accommodation water needs, 4) Water conservation and recycling programs. Educational institution priority status applied.",
    stage: 2,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: institutionApp.id,
    userId: catchmentManager.id,
    userType: "catchment_manager",
    comment:
      "Final approval for educational institution water supply. Permit conditions include: 1) Semester-based water usage reporting, 2) Annual water conservation program review, 3) Student education on water conservation, 4) Research collaboration on water management. 10-year permit with 3-year performance reviews supporting higher education development.",
    stage: 3,
    isRejectionReason: false,
  })

  // Add institution application documents
  await db.uploadDocument({
    applicationId: institutionApp.id,
    fileName: "university_water_application.pdf",
    fileType: "application/pdf",
    fileSize: 567000,
    documentType: "application_form",
  })

  await db.uploadDocument({
    applicationId: institutionApp.id,
    fileName: "campus_master_plan.pdf",
    fileType: "application/pdf",
    fileSize: 1456000,
    documentType: "site_plan",
  })

  await db.uploadDocument({
    applicationId: institutionApp.id,
    fileName: "water_conservation_program.pdf",
    fileType: "application/pdf",
    fileSize: 445000,
    documentType: "other",
  })

  console.log(`✅ Created institution application: ${institutionApp.applicationId}`)

  // Test Application 6: Surface Water Storage Approved
  const surfaceWaterApp = await db.createApplication({
    applicantName: "Mazowe Citrus Estates",
    physicalAddress: "Mazowe Valley, Mashonaland Central",
    postalAddress: "P.O. Box 234, Mazowe",
    customerAccountNumber: "SURF006",
    cellularNumber: "+263776789012",
    numberOfBoreholes: 0,
    landSize: 500.0,
    gpsLatitude: -17.5,
    gpsLongitude: 30.9667,
    waterSource: "surface_water",
    waterSourceDetails: "Dam construction on seasonal stream for irrigation water storage",
    permitType: "surface_water_storage",
    intendedUse: "Citrus irrigation and frost protection system",
    waterAllocation: 85.0,
    validityPeriod: 20,
    comments: "Surface water storage dam for large-scale citrus production with environmental flow requirements",
    status: "approved",
    currentStage: 4,
    workflowComments: [],
    documents: [],
  })

  // Add surface water application workflow comments
  await db.addComment({
    applicationId: surfaceWaterApp.id,
    userId: permittingOfficer.id,
    userType: "permitting_officer",
    comment:
      "Surface water storage application reviewed. Comprehensive dam construction and water storage plan submitted including environmental flow assessments, downstream impact analysis, and seasonal water availability studies. Critical for citrus production and export agriculture.",
    stage: 1,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: surfaceWaterApp.id,
    userId: chairperson.id,
    userType: "chairperson",
    comment:
      "Technical review completed for surface water storage dam. Water allocation approved with environmental conditions: 1) Minimum environmental flow maintenance (30% of natural flow), 2) Fish ladder construction for aquatic life migration, 3) Seasonal storage restrictions during drought periods, 4) Downstream user consultation and compensation agreements.",
    stage: 2,
    isRejectionReason: false,
  })

  await db.addComment({
    applicationId: surfaceWaterApp.id,
    userId: catchmentManager.id,
    userType: "catchment_manager",
    comment:
      "Final approval for surface water storage with comprehensive environmental and social conditions: 1) Environmental flow monitoring and compliance, 2) Annual aquatic ecosystem health assessment, 3) Downstream community water access agreements, 4) Dam safety inspections and maintenance. 20-year permit supporting agricultural export development with strict environmental compliance.",
    stage: 3,
    isRejectionReason: false,
  })

  // Add surface water application documents
  await db.uploadDocument({
    applicationId: surfaceWaterApp.id,
    fileName: "surface_water_application.pdf",
    fileType: "application/pdf",
    fileSize: 678000,
    documentType: "application_form",
  })

  await db.uploadDocument({
    applicationId: surfaceWaterApp.id,
    fileName: "dam_engineering_design.pdf",
    fileType: "application/pdf",
    fileSize: 2345000,
    documentType: "site_plan",
  })

  await db.uploadDocument({
    applicationId: surfaceWaterApp.id,
    fileName: "environmental_flow_assessment.pdf",
    fileType: "application/pdf",
    fileSize: 1567000,
    documentType: "environmental_clearance",
  })

  await db.uploadDocument({
    applicationId: surfaceWaterApp.id,
    fileName: "downstream_impact_study.pdf",
    fileType: "application/pdf",
    fileSize: 1234000,
    documentType: "other",
  })

  console.log(`✅ Created surface water application: ${surfaceWaterApp.applicationId}`)

  // Add activity logs for all applications
  const applications = [domesticApp, agriculturalApp, industrialApp, bulkWaterApp, institutionApp, surfaceWaterApp]

  for (const app of applications) {
    await db.addLog({
      userId: permittingOfficer.id,
      userType: "permitting_officer",
      action: "Application Created",
      details: `Test permit application ${app.applicationId} created for preview functionality testing`,
      applicationId: app.id,
    })

    await db.addLog({
      userId: permittingOfficer.id,
      userType: "permitting_officer",
      action: "Application Reviewed",
      details: `Initial review completed for application ${app.applicationId}`,
      applicationId: app.id,
    })

    await db.addLog({
      userId: chairperson.id,
      userType: "chairperson",
      action: "Technical Review Completed",
      details: `Technical assessment completed and approved for application ${app.applicationId}`,
      applicationId: app.id,
    })

    await db.addLog({
      userId: catchmentManager.id,
      userType: "catchment_manager",
      action: "Final Approval Granted",
      details: `Final catchment approval granted for application ${app.applicationId}`,
      applicationId: app.id,
    })

    await db.addLog({
      userId: permittingOfficer.id,
      userType: "permitting_officer",
      action: "Permit Ready for Preview",
      details: `Permit ${app.applicationId} approved and ready for preview and printing`,
      applicationId: app.id,
    })
  }

  console.log("\n🎉 Test permit applications created successfully!")
  console.log("📊 Summary:")
  console.log(`   • ${applications.length} approved applications created`)
  console.log(`   • ${applications.reduce((sum, app) => sum + app.documents.length, 0)} documents uploaded`)
  console.log(`   • ${applications.length * 3} workflow comments added`)
  console.log(`   • ${applications.length * 5} activity logs created`)
  console.log("\n✅ Ready for permit preview testing!")

  return applications
}

// Execute if run directly
if (require.main === module) {
  createTestPermitApplications()
    .then(() => {
      console.log("✅ Test data creation completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Error creating test data:", error)
      process.exit(1)
    })
}
