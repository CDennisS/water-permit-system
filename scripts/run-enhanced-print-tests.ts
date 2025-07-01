import { execSync } from "child_process"
import { writeFileSync } from "fs"
import { join } from "path"

interface TestResult {
  name: string
  status: "PASSED" | "FAILED" | "SKIPPED"
  duration: number
  error?: string
}

interface TestSuite {
  name: string
  tests: TestResult[]
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  duration: number
}

class EnhancedPrintTestRunner {
  private testSuites: TestSuite[] = []
  private startTime: number = Date.now()

  constructor() {
    console.log("🧪 Enhanced Permit Printing Test Runner")
    console.log("=====================================")
  }

  async runTestSuite(name: string, testFiles: string[]): Promise<TestSuite> {
    console.log(`\n📋 Running ${name}...`)
    const suiteStartTime = Date.now()
    const tests: TestResult[] = []

    for (const testFile of testFiles) {
      const testStartTime = Date.now()
      try {
        console.log(`  ▶️ ${testFile}`)

        // Run the test file
        const result = execSync(`npm test ${testFile} -- --reporter=json`, {
          encoding: "utf-8",
          timeout: 30000,
        })

        const testResult: TestResult = {
          name: testFile,
          status: "PASSED",
          duration: Date.now() - testStartTime,
        }

        tests.push(testResult)
        console.log(`  ✅ ${testFile} - PASSED (${testResult.duration}ms)`)
      } catch (error) {
        const testResult: TestResult = {
          name: testFile,
          status: "FAILED",
          duration: Date.now() - testStartTime,
          error: error instanceof Error ? error.message : String(error),
        }

        tests.push(testResult)
        console.log(`  ❌ ${testFile} - FAILED (${testResult.duration}ms)`)
        console.log(`     Error: ${testResult.error}`)
      }
    }

    const suite: TestSuite = {
      name,
      tests,
      totalTests: tests.length,
      passedTests: tests.filter((t) => t.status === "PASSED").length,
      failedTests: tests.filter((t) => t.status === "FAILED").length,
      skippedTests: tests.filter((t) => t.status === "SKIPPED").length,
      duration: Date.now() - suiteStartTime,
    }

    this.testSuites.push(suite)
    return suite
  }

  async runAllTests(): Promise<void> {
    try {
      // 1. Core Functionality Tests
      await this.runTestSuite("Core Functionality", [
        "tests/enhanced-permit-printing.test.ts",
        "tests/permit-printing-performance.test.ts",
        "tests/permit-printing-integration.test.ts",
      ])

      // 2. Permission and Security Tests
      await this.runTestSuite("Permissions & Security", [
        "tests/enhanced-permit-printing.test.ts --grep 'Permission Checks'",
        "tests/enhanced-permit-printing.test.ts --grep 'unauthenticated users'",
      ])

      // 3. Error Handling Tests
      await this.runTestSuite("Error Handling", [
        "tests/enhanced-permit-printing.test.ts --grep 'Error Handling'",
        "tests/enhanced-permit-printing.test.ts --grep 'download errors'",
        "tests/permit-printing-integration.test.ts --grep 'Error Recovery'",
      ])

      // 4. Performance Tests
      await this.runTestSuite("Performance Optimizations", [
        "tests/permit-printing-performance.test.ts --grep 'Memoization'",
        "tests/permit-printing-performance.test.ts --grep 'Render Performance'",
        "tests/permit-printing-performance.test.ts --grep 'Memory Management'",
      ])

      // 5. Accessibility Tests
      await this.runTestSuite("Accessibility", [
        "tests/enhanced-permit-printing.test.ts --grep 'ARIA labels'",
        "tests/enhanced-permit-printing.test.ts --grep 'dialog accessibility'",
        "tests/enhanced-permit-printing.test.ts --grep 'disabled state'",
      ])

      // 6. Print Functionality Tests
      await this.runTestSuite("Print Functionality", [
        "tests/enhanced-permit-printing.test.ts --grep 'print from preview'",
        "tests/enhanced-permit-printing.test.ts --grep 'direct print without preview'",
        "tests/enhanced-permit-printing.test.ts --grep 'print window blocked'",
      ])

      // Generate comprehensive report
      this.generateReport()
    } catch (error) {
      console.error("❌ Test runner failed:", error)
      process.exit(1)
    }
  }

  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0)
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passedTests, 0)
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failedTests, 0)
    const totalSkipped = this.testSuites.reduce((sum, suite) => sum + suite.skippedTests, 0)

    console.log("\n" + "=".repeat(60))
    console.log("📊 ENHANCED PERMIT PRINTING TEST REPORT")
    console.log("=".repeat(60))

    // Overall Summary
    console.log(`\n🎯 Overall Results:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   ✅ Passed: ${totalPassed}`)
    console.log(`   ❌ Failed: ${totalFailed}`)
    console.log(`   ⏭️  Skipped: ${totalSkipped}`)
    console.log(`   ⏱️  Duration: ${totalDuration}ms`)
    console.log(`   📈 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`)

    // Suite Breakdown
    console.log(`\n📋 Test Suite Breakdown:`)
    this.testSuites.forEach((suite) => {
      const successRate = ((suite.passedTests / suite.totalTests) * 100).toFixed(1)
      const status = suite.failedTests === 0 ? "✅" : "❌"

      console.log(`   ${status} ${suite.name}:`)
      console.log(`      Tests: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests}`)
      console.log(`      Duration: ${suite.duration}ms | Success: ${successRate}%`)
    })

    // Failed Tests Details
    const failedTests = this.testSuites.flatMap((suite) => suite.tests.filter((test) => test.status === "FAILED"))

    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests Details:`)
      failedTests.forEach((test) => {
        console.log(`   • ${test.name}`)
        console.log(`     Error: ${test.error}`)
        console.log(`     Duration: ${test.duration}ms`)
      })
    }

    // Performance Insights
    console.log(`\n⚡ Performance Insights:`)
    const slowestSuite = this.testSuites.reduce((prev, current) => (prev.duration > current.duration ? prev : current))
    const fastestSuite = this.testSuites.reduce((prev, current) => (prev.duration < current.duration ? prev : current))

    console.log(`   Slowest Suite: ${slowestSuite.name} (${slowestSuite.duration}ms)`)
    console.log(`   Fastest Suite: ${fastestSuite.name} (${fastestSuite.duration}ms)`)

    // Recommendations
    console.log(`\n💡 Recommendations:`)
    if (totalFailed > 0) {
      console.log(`   • Fix ${totalFailed} failing test(s) before deployment`)
    }
    if (slowestSuite.duration > 5000) {
      console.log(`   • Consider optimizing ${slowestSuite.name} tests (>5s duration)`)
    }
    if (totalPassed === totalTests) {
      console.log(`   • 🎉 All tests passing! Ready for deployment`)
    }

    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalSkipped,
        totalDuration,
        successRate: (totalPassed / totalTests) * 100,
      },
      testSuites: this.testSuites,
      failedTests,
    }

    const reportPath = join(process.cwd(), "test-reports", "enhanced-print-tests.json")
    try {
      writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
      console.log(`\n📄 Detailed report saved to: ${reportPath}`)
    } catch (error) {
      console.log(`\n⚠️  Could not save detailed report: ${error}`)
    }

    // Exit with appropriate code
    process.exit(totalFailed > 0 ? 1 : 0)
  }
}

// Run the tests
const runner = new EnhancedPrintTestRunner()
runner.runAllTests().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
