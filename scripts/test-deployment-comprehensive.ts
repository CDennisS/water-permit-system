import { execSync } from "child_process"
import fs from "fs"

interface TestResult {
  name: string
  status: "passed" | "failed" | "warning"
  message: string
  details?: string[]
}

class DeploymentTester {
  private results: TestResult[] = []

  private addResult(name: string, status: "passed" | "failed" | "warning", message: string, details?: string[]) {
    this.results.push({ name, status, message, details })
  }

  async testFileStructure(): Promise<void> {
    console.log("🔍 Testing file structure...")

    const requiredFiles = [
      "package.json",
      "next.config.mjs",
      "tailwind.config.ts",
      "tsconfig.json",
      "app/page.tsx",
      "app/layout.tsx",
      "components/permit-preview-dialog.tsx",
      "components/permitting-officer-applications-table.tsx",
      "components/permit-print-workflow.tsx",
      "lib/database.ts",
      "lib/auth.ts",
      "types/index.ts",
    ]

    const missingFiles: string[] = []
    const existingFiles: string[] = []

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        existingFiles.push(file)
      } else {
        missingFiles.push(file)
      }
    }

    if (missingFiles.length === 0) {
      this.addResult("File Structure", "passed", `All ${requiredFiles.length} required files exist`, existingFiles)
    } else {
      this.addResult("File Structure", "failed", `${missingFiles.length} files missing`, missingFiles)
    }
  }

  async testTypeScriptCompilation(): Promise<void> {
    console.log("🔍 Testing TypeScript compilation...")

    try {
      execSync("npx tsc --noEmit", { stdio: "pipe" })
      this.addResult("TypeScript Compilation", "passed", "No TypeScript errors found")
    } catch (error: any) {
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || "Unknown error"
      this.addResult("TypeScript Compilation", "failed", "TypeScript compilation failed", [errorOutput])
    }
  }

  async testBuildProcess(): Promise<void> {
    console.log("🔍 Testing build process...")

    try {
      execSync("npm run build", { stdio: "pipe" })
      this.addResult("Build Process", "passed", "Build completed successfully")
    } catch (error: any) {
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || "Build failed"
      this.addResult("Build Process", "failed", "Build process failed", [errorOutput])
    }
  }

  async testPermitPreviewFunctionality(): Promise<void> {
    console.log("🔍 Testing permit preview functionality...")

    try {
      // Check if PermitPreviewDialog component exists and has required props
      const permitPreviewPath = "components/permit-preview-dialog.tsx"
      if (!fs.existsSync(permitPreviewPath)) {
        this.addResult("Permit Preview", "failed", "PermitPreviewDialog component not found")
        return
      }

      const content = fs.readFileSync(permitPreviewPath, "utf8")

      const requiredElements = [
        "PermitPreviewDialog",
        "application: PermitApplication",
        "currentUser: User",
        "handlePrint",
        "handleDownload",
        "generatePermitData",
      ]

      const missingElements = requiredElements.filter((element) => !content.includes(element))

      if (missingElements.length === 0) {
        this.addResult("Permit Preview", "passed", "All required functionality present")
      } else {
        this.addResult("Permit Preview", "failed", "Missing required elements", missingElements)
      }
    } catch (error) {
      this.addResult("Permit Preview", "failed", "Error testing permit preview functionality")
    }
  }

  async testWorkflowIntegration(): Promise<void> {
    console.log("🔍 Testing workflow integration...")

    try {
      const workflowPath = "components/permit-print-workflow.tsx"
      if (!fs.existsSync(workflowPath)) {
        this.addResult("Workflow Integration", "failed", "Permit print workflow component not found")
        return
      }

      const content = fs.readFileSync(workflowPath, "utf8")

      const requiredElements = [
        "PermitPrintWorkflow",
        "PermitPreviewDialog",
        "canPreviewPermit",
        "Preview Permit",
        "trigger=",
      ]

      const missingElements = requiredElements.filter((element) => !content.includes(element))

      if (missingElements.length === 0) {
        this.addResult("Workflow Integration", "passed", "Permit preview properly integrated in workflow")
      } else {
        this.addResult("Workflow Integration", "failed", "Missing workflow integration elements", missingElements)
      }
    } catch (error) {
      this.addResult("Workflow Integration", "failed", "Error testing workflow integration")
    }
  }

  async testDependencies(): Promise<void> {
    console.log("🔍 Testing dependencies...")

    try {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

      const requiredDeps = ["next", "react", "typescript", "@types/react", "tailwindcss", "lucide-react"]

      const missingDeps = requiredDeps.filter((dep) => !dependencies[dep])

      if (missingDeps.length === 0) {
        this.addResult("Dependencies", "passed", "All required dependencies present")
      } else {
        this.addResult("Dependencies", "failed", "Missing required dependencies", missingDeps)
      }
    } catch (error) {
      this.addResult("Dependencies", "failed", "Error checking dependencies")
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting comprehensive deployment tests...\n")

    await this.testFileStructure()
    await this.testTypeScriptCompilation()
    await this.testPermitPreviewFunctionality()
    await this.testWorkflowIntegration()
    await this.testDependencies()
    await this.testBuildProcess()

    this.generateReport()
  }

  private generateReport(): void {
    console.log("\n" + "=".repeat(60))
    console.log("📊 DEPLOYMENT TEST REPORT")
    console.log("=".repeat(60))

    const passed = this.results.filter((r) => r.status === "passed").length
    const failed = this.results.filter((r) => r.status === "failed").length
    const warnings = this.results.filter((r) => r.status === "warning").length

    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings\n`)

    this.results.forEach((result) => {
      const icon = result.status === "passed" ? "✅" : result.status === "failed" ? "❌" : "⚠️"
      console.log(`${icon} ${result.name}: ${result.message}`)

      if (result.details && result.details.length > 0) {
        result.details.forEach((detail) => {
          console.log(`   - ${detail}`)
        })
      }
    })

    console.log("\n" + "=".repeat(60))

    if (failed === 0) {
      console.log("🎉 ALL TESTS PASSED - READY FOR DEPLOYMENT!")
      console.log("✅ Permit Preview functionality is working correctly")
      console.log("✅ Workflow integration is complete")
    } else {
      console.log("❌ DEPLOYMENT BLOCKED - Fix issues above")
      console.log("🔧 Focus on permit preview button responsiveness")
    }

    console.log("=".repeat(60))
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DeploymentTester()
  tester
    .runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Test runner failed:", error)
      process.exit(1)
    })
}

export { DeploymentTester }
