import fs from "fs"
import path from "path"

interface DeploymentRecord {
  version: string
  deployedAt: string
  environment: string
  status: string
  features: string[]
  buildHash?: string
}

class DeploymentVersionChecker {
  private deploymentHistoryPath = path.join(process.cwd(), "deployment-history.json")
  private packageJsonPath = path.join(process.cwd(), "package.json")

  async checkCurrentVersion(): Promise<string> {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, "utf8"))
      return packageJson.version || "1.0.0"
    } catch (error) {
      console.error("Error reading package.json:", error)
      return "1.0.0"
    }
  }

  async getDeploymentHistory(): Promise<DeploymentRecord[]> {
    try {
      if (!fs.existsSync(this.deploymentHistoryPath)) {
        return []
      }
      const history = JSON.parse(fs.readFileSync(this.deploymentHistoryPath, "utf8"))
      return history.deployments || []
    } catch (error) {
      console.error("Error reading deployment history:", error)
      return []
    }
  }

  async getLastDeployedVersion(): Promise<DeploymentRecord | null> {
    const history = await this.getDeploymentHistory()
    const productionDeployments = history.filter((d) => d.environment === "production")

    if (productionDeployments.length === 0) {
      return null
    }

    return productionDeployments.sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())[0]
  }

  async generateDeploymentReport(): Promise<void> {
    console.log("🔍 UMSCC Permit Management System - Deployment Version Check")
    console.log("=".repeat(60))

    const currentVersion = await this.checkCurrentVersion()
    const lastDeployed = await this.getLastDeployedVersion()
    const allDeployments = await this.getDeploymentHistory()

    console.log(`📦 Current Version: ${currentVersion}`)

    if (lastDeployed) {
      console.log(`🚀 Last Deployed Version: ${lastDeployed.version}`)
      console.log(`📅 Last Deployment Date: ${lastDeployed.deployedAt}`)
      console.log(`🌍 Environment: ${lastDeployed.environment}`)
      console.log(`✅ Status: ${lastDeployed.status}`)
    } else {
      console.log("🚀 Last Deployed Version: NEVER DEPLOYED")
      console.log("📅 Last Deployment Date: N/A")
      console.log("🌍 Environment: N/A")
      console.log("❌ Status: NOT DEPLOYED")
    }

    console.log(`📊 Total Deployments: ${allDeployments.length}`)

    if (allDeployments.length > 0) {
      console.log("\n📋 Deployment History:")
      allDeployments.forEach((deployment, index) => {
        console.log(`  ${index + 1}. v${deployment.version} - ${deployment.deployedAt} (${deployment.environment})`)
      })
    }

    console.log("\n🎯 System Features:")
    const features = [
      "Application Management System",
      "Multi-role Dashboard System",
      "Document Upload & Management",
      "Workflow Management with Comments",
      "Permit Printing System",
      "Messaging System with Notifications",
      "Advanced Reporting & Analytics",
      "User Management & Authentication",
      "Mobile Responsive Design",
      "Print & Export Functionality",
    ]

    features.forEach((feature) => {
      console.log(`  ✅ ${feature}`)
    })

    if (!lastDeployed) {
      console.log("\n⚠️  RECOMMENDATION: READY FOR INITIAL PRODUCTION DEPLOYMENT")
      console.log("   This would be version 1.0.0 - the first production release")
    }
  }
}

// Execute the version check
const checker = new DeploymentVersionChecker()
checker.generateDeploymentReport().catch(console.error)
