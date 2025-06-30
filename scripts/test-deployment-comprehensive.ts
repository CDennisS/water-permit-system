import { execSync } from "child_process"
import fs from "fs"

interface TestResult {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
  details?: string[]
}

export async function runComprehensiveDeploymentTest(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: File Structure
  try {
    const requiredFiles = [
      "package.json",
      "next.config.mjs",
      "tailwind.config.ts",
      "tsconfig.json",
      "app/page.tsx",
      "app/layout.tsx",
      "components/permit-preview-dialog.tsx",
      "components/application-details.tsx",
      "components/permitting-officer-applications-table.tsx",
      "lib/database.ts",
      "types/index.ts",
    ]

    const missingFiles = requiredFiles.filter((file) => !fs.existsSync(file))

    if (missingFiles.length === 0) {
      results.push({
        name: "File Structure",
        status: "pass",
        message: "All required files present",
      })
    } else {
      results.push({
        name: "File Structure",
        status: "fail",
        message: "Missing required files",
        details: missingFiles,
      })
    }
  } catch (error) {
    results.push({
      name: "File Structure",
      status: "fail",
      message: `Error checking files: ${error}`,
    })
  }

  // Test 2: TypeScript Compilation
  try {
    execSync("npx tsc --noEmit", { stdio: "pipe" })
    results.push({
      name: "TypeScript Compilation",
      status: "pass",
      message: "TypeScript compiles without errors",
    })
  } catch (error) {
    results.push({
      name: "TypeScript Compilation",
      status: "fail",
      message: "TypeScript compilation failed",
      details: [error.toString()],
    })
  }

  // Test 3: Build Process
  try {
    execSync("npm run build", { stdio: "pipe" })
    results.push({
      name: "Build Process",
      status: "pass",
      message: "Application builds successfully",
    })
  } catch (error) {
    results.push({
      name: "Build Process",
      status: "fail",
      message: "Build process failed",
      details: [error.toString()],
    })
  }

  // Test 4: Component Integration
  try {
    const permitPreviewExists = fs.existsSync("components/permit-preview-dialog.tsx")
    const applicationDetailsExists = fs.existsSync("components/application-details.tsx")

    if (permitPreviewExists && applicationDetailsExists) {
      // Check if PermitPreviewDialog is properly imported in ApplicationDetails
      const applicationDetailsContent = fs.readFileSync("components/application-details.tsx", "utf8")
      const hasPermitPreviewImport = applicationDetailsContent.includes("PermitPreviewDialog")

      if (hasPermitPreviewImport) {
        results.push({
          name: "Component Integration",
          status: "pass",
          message: "PermitPreviewDialog properly integrated",
        })
      } else {
        results.push({
          name: "Component Integration",
          status: "fail",
          message: "PermitPreviewDialog not properly imported",
        })
      }
    } else {
      results.push({
        name: "Component Integration",
        status: "fail",
        message: "Required components missing",
      })
    }
  } catch (error) {
    results.push({
      name: "Component Integration",
      status: "fail",
      message: `Error checking component integration: ${error}`,
    })
  }

  // Test 5: Database Mock Data
  try {
    const databaseContent = fs.readFileSync("lib/database.ts", "utf8")
    const hasApprovedApplications = databaseContent.includes('status: "approved"')

    if (hasApprovedApplications) {
      results.push({
        name: "Database Mock Data",
        status: "pass",
        message: "Mock data includes approved applications for testing",
      })
    } else {
      results.push({
        name: "Database Mock Data",
        status: "warning",
        message: "No approved applications found in mock data",
      })
    }
  } catch (error) {
    results.push({
      name: "Database Mock Data",
      status: "fail",
      message: `Error checking database: ${error}`,
    })
  }

  // Test 6: Permit Preview Functionality
  try {
    const permitPreviewContent = fs.readFileSync("components/permit-preview-dialog.tsx", "utf8")
    const hasCurrentUserProp = permitPreviewContent.includes("currentUser")
    const hasGeneratePermitData = permitPreviewContent.includes("generatePermitData")
    const hasPrintFunction = permitPreviewContent.includes("handlePrint")

    if (hasCurrentUserProp && hasGeneratePermitData && hasPrintFunction) {
      results.push({
        name: "Permit Preview Functionality",
        status: "pass",
        message: "All permit preview functions implemented",
      })
    } else {
      results.push({
        name: "Permit Preview Functionality",
        status: "fail",
        message: "Missing permit preview functionality",
        details: [
          !hasCurrentUserProp ? "Missing currentUser prop" : "",
          !hasGeneratePermitData ? "Missing generatePermitData function" : "",
          !hasPrintFunction ? "Missing print function" : "",
        ].filter(Boolean),
      })
    }
  } catch (error) {
    results.push({
      name: "Permit Preview Functionality",
      status: "fail",
      message: `Error checking permit preview: ${error}`,
    })
  }

  return results
}

// Run if called directly
if (require.main === module) {
  runComprehensiveDeploymentTest().then((results) => {
    console.log("=== COMPREHENSIVE DEPLOYMENT TEST RESULTS ===\n")

    results.forEach((result) => {
      const statusIcon = result.status === "pass" ? "✅" : result.status === "warning" ? "⚠️" : "❌"
      console.log(`${statusIcon} ${result.name}: ${result.message}`)

      if (result.details && result.details.length > 0) {
        result.details.forEach((detail) => {
          console.log(`   - ${detail}`)
        })
      }
      console.log("")
    })

    const passCount = results.filter((r) => r.status === "pass").length
    const failCount = results.filter((r) => r.status === "fail").length
    const warningCount = results.filter((r) => r.status === "warning").length

    console.log(`Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failed`)

    if (failCount === 0) {
      console.log("🚀 DEPLOYMENT READY!")
    } else {
      console.log("❌ DEPLOYMENT NOT READY - Fix failing tests first")
    }
  })
}
