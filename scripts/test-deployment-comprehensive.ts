import { execSync } from "child_process"
import fs from "fs"

interface TestResult {
  name: string
  status: "PASS" | "FAIL" | "WARN"
  message: string
  details?: string[]
}

class ComprehensiveDeploymentTest {
  private results: TestResult[] = []

  private addResult(name: string, status: "PASS" | "FAIL" | "WARN", message: string, details?: string[]) {
    this.results.push({ name, status, message, details })
  }

  async testFileStructure(): Promise<void> {
    console.log("🔍 Testing file structure...")

    const requiredFiles = [
      "package.json",
      "next.config.mjs",
      "tailwind.config.ts",
      "tsconfig.json",
      "app/layout.tsx",
      "app/page.tsx",
      "components/ui/button.tsx",
      "components/ui/dialog.tsx",
      "components/permit-preview-dialog.tsx",
      "lib/database.ts",
      "types/index.ts",
    ]

    const missingFiles: string[] = []

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file)
      }
    }

    if (missingFiles.length === 0) {
      this.addResult("File Structure", "PASS", "All required files present")
    } else {
      this.addResult("File Structure", "FAIL", "Missing required files", missingFiles)
    }
  }

  async testTypeScript(): Promise<void> {
    console.log("🔍 Testing TypeScript compilation...")

    try {
      execSync("npx tsc --noEmit", { stdio: "pipe" })
      this.addResult("TypeScript", "PASS", "TypeScript compilation successful")
    } catch (error) {
      this.addResult("TypeScript", "FAIL", "TypeScript compilation failed", [error.toString()])
    }
  }

  async testDependencies(): Promise<void> {
    console.log("🔍 Testing dependencies...")

    try {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
      const requiredDeps = [
        "react",
        "react-dom",
        "next",
        "typescript",
        "@types/react",
        "@types/node",
        "tailwindcss",
        "lucide-react",
      ]

      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      const missingDeps = requiredDeps.filter((dep) => !allDeps[dep])

      if (missingDeps.length === 0) {
        this.addResult("Dependencies", "PASS", "All required dependencies present")
      } else {
        this.addResult("Dependencies", "FAIL", "Missing dependencies", missingDeps)
      }
    } catch (error) {
      this.addResult("Dependencies", "FAIL", "Failed to check dependencies", [error.toString()])
    }
  }

  async testBuild(): Promise<void> {
    console.log("🔍 Testing build process...")

    try {
      execSync("npm run build", { stdio: "pipe" })
      this.addResult("Build", "PASS", "Build process successful")
    } catch (error) {
      this.addResult("Build", "FAIL", "Build process failed", [error.toString()])
    }
  }

  async testPermitPreview(): Promise<void> {
    console.log("🔍 Testing permit preview functionality...")

    try {
      // Check if permit preview component exists and has required exports
      const permitPreviewPath = "components/permit-preview-dialog.tsx"
      if (!fs.existsSync(permitPreviewPath)) {
        this.addResult("Permit Preview", "FAIL", "PermitPreviewDialog component not found")
        return
      }

      const content = fs.readFileSync(permitPreviewPath, "utf8")

      const requiredElements = [
        "PermitPreviewDialog",
        "handlePrint",
        "handleDownload",
        "generatePermitData",
        "Dialog",
        "DialogContent",
      ]

      const missingElements = requiredElements.filter((element) => !content.includes(element))

      if (missingElements.length === 0) {
        this.addResult("Permit Preview", "PASS", "Permit preview component complete")
      } else {
        this.addResult("Permit Preview", "FAIL", "Missing permit preview elements", missingElements)
      }
    } catch (error) {
      this.addResult("Permit Preview", "FAIL", "Failed to test permit preview", [error.toString()])
    }
  }

  async testDatabase(): Promise<void> {
    console.log("🔍 Testing database functionality...")

    try {
      const dbPath = "lib/database.ts"
      if (!fs.existsSync(dbPath)) {
        this.addResult("Database", "FAIL", "Database module not found")
        return
      }

      const content = fs.readFileSync(dbPath, "utf8")

      const requiredMethods = [
        "getApplications",
        "getApplicationById",
        "createApplication",
        "updateApplication",
        "getUsers",
        "addComment",
        "getCommentsByApplication",
      ]

      const missingMethods = requiredMethods.filter((method) => !content.includes(method))

      if (missingMethods.length === 0) {
        this.addResult("Database", "PASS", "Database functionality complete")
      } else {
        this.addResult("Database", "FAIL", "Missing database methods", missingMethods)
      }
    } catch (error) {
      this.addResult("Database", "FAIL", "Failed to test database", [error.toString()])
    }
  }

  async testTypes(): Promise<void> {
    console.log("🔍 Testing type definitions...")

    try {
      const typesPath = "types/index.ts"
      if (!fs.existsSync(typesPath)) {
        this.addResult("Types", "FAIL", "Types file not found")
        return
      }

      const content = fs.readFileSync(typesPath, "utf8")

      const requiredTypes = [
        "User",
        "PermitApplication",
        "WorkflowComment",
        "ActivityLog",
        "Message",
        "Document",
        "PermitData",
        "BoreholeDetail",
      ]

      const missingTypes = requiredTypes.filter((type) => !content.includes(`interface ${type}`))

      if (missingTypes.length === 0) {
        this.addResult("Types", "PASS", "All type definitions present")
      } else {
        this.addResult("Types", "FAIL", "Missing type definitions", missingTypes)
      }
    } catch (error) {
      this.addResult("Types", "FAIL", "Failed to test types", [error.toString()])
    }
  }

  async runAllTests(): Promise<void> {
    console.log("🚀 Starting Comprehensive Deployment Test")
    console.log("=".repeat(60))

    await this.testFileStructure()
    await this.testDependencies()
    await this.testTypes()
    await this.testDatabase()
    await this.testPermitPreview()
    await this.testTypeScript()
    await this.testBuild()

    this.generateReport()
  }

  private generateReport(): void {
    console.log("\n📊 DEPLOYMENT TEST RESULTS")
    console.log("=".repeat(60))

    const passed = this.results.filter((r) => r.status === "PASS").length
    const failed = this.results.filter((r) => r.status === "FAIL").length
    const warnings = this.results.filter((r) => r.status === "WARN").length

    this.results.forEach((result) => {
      const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️"
      console.log(`${icon} ${result.name}: ${result.message}`)

      if (result.details && result.details.length > 0) {
        result.details.forEach((detail) => {
          console.log(`   - ${detail}`)
        })
      }
    })

    console.log("\n📈 SUMMARY")
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Warnings: ${warnings}`)
    console.log(`📊 Total: ${this.results.length}`)

    const overallStatus = failed === 0 ? "READY FOR DEPLOYMENT" : "DEPLOYMENT BLOCKED"
    const statusIcon = failed === 0 ? "🚀" : "🚫"

    console.log(`\n${statusIcon} OVERALL STATUS: ${overallStatus}`)

    if (failed === 0) {
      console.log("\n🎉 All tests passed! The application is ready for deployment.")
      console.log("Next steps:")
      console.log("1. Deploy to production environment")
      console.log("2. Update deployment history")
      console.log("3. Monitor application performance")
    } else {
      console.log("\n🔧 Please fix the failing tests before deployment.")
    }
  }
}

// Run the comprehensive test
const tester = new ComprehensiveDeploymentTest()
tester.runAllTests().catch(console.error)
