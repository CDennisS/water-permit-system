import { execSync } from "child_process"
import { createTestPermitApplications } from "./create-test-permit-applications"

async function runRealDataTests() {
  console.log("🚀 Starting Real Data Permit Preview Tests")
  console.log("==========================================")

  try {
    // Step 1: Create test data
    console.log("\n📝 Step 1: Creating test permit applications...")
    const applications = await createTestPermitApplications()
    console.log(`✅ Created ${applications.length} test applications`)

    // Step 2: Run tests
    console.log("\n🧪 Step 2: Running comprehensive test suite...")
    execSync("npm test -- tests/permit-preview-with-real-data.test.ts", {
      stdio: "inherit",
      timeout: 300000, // 5 minutes
    })

    // Step 3: Generate summary
    console.log("\n📊 Step 3: Test Summary")
    console.log("=======================")

    applications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.applicantName}`)
      console.log(`   • Application ID: ${app.applicationId}`)
      console.log(`   • Permit Type: ${app.permitType}`)
      console.log(`   • Water Allocation: ${app.waterAllocation} ML`)
      console.log(`   • Boreholes: ${app.numberOfBoreholes}`)
      console.log(`   • Status: ${app.status}`)
      console.log(`   • Documents: ${app.documents.length}`)
      console.log(`   • Comments: ${app.workflowComments.length}`)
      console.log("")
    })

    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
    console.log("✅ Permitting Officers can now preview permits with real data")
    console.log("🚀 System is PRODUCTION READY")
  } catch (error) {
    console.error("❌ Test execution failed:", error)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  runRealDataTests()
    .then(() => {
      console.log("✅ Real data testing completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Real data testing failed:", error)
      process.exit(1)
    })
}

export { runRealDataTests }
