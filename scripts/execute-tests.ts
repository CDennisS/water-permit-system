console.log("🚀 UMSCC Permit Management System - Test Execution Started")
console.log("=========================================================")

// Import and run the test execution
import("./run-tests-now")
  .then(() => {
    console.log("✅ Test execution completed successfully!")
  })
  .catch((error) => {
    console.error("❌ Test execution failed:", error)
    process.exit(1)
  })
