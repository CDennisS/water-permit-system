import { execSync } from "child_process"
import { existsSync, readFileSync, writeFileSync } from "fs"

interface DeploymentRecord {
  version: string
  timestamp: string
  environment: string
  status: "deployed" | "failed" | "pending"
  features: string[]
  buildHash?: string
  deploymentUrl?: string
}

interface VersionHistory {
  currentVersion: string
  lastDeployedVersion: string
  deploymentHistory: DeploymentRecord[]
  pendingChanges: string[]
}

class DeploymentVersionChecker {
  private versionHistoryPath = "deployment-history.json"

  constructor() {
    console.log("🔍 UMSCC Deployment Version Checker")
    console.log("===================================")
  }

  getCurrentVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
      return packageJson.version || "1.0.0"
    } catch (error) {
      console.warn("⚠️ Could not read package.json, defaulting to 1.0.0")
      return "1.0.0"
    }
  }

  getGitInfo(): { hash: string; branch: string; hasChanges: boolean } {
    try {
      const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim()
      const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim()

      let hasChanges = false
      try {
        const status = execSync("git status --porcelain", { encoding: "utf8" }).trim()
        hasChanges = status.length > 0
      } catch {
        hasChanges = true // Assume changes if we can't check
      }

      return { hash, branch, hasChanges }
    } catch (error) {
      return { hash: "unknown", branch: "unknown", hasChanges: true }
    }
  }

  loadVersionHistory(): VersionHistory {
    if (existsSync(this.versionHistoryPath)) {
      try {
        return JSON.parse(readFileSync(this.versionHistoryPath, "utf8"))
      } catch (error) {
        console.warn("⚠️ Could not parse version history, creating new one")
      }
    }

    // Create default version history
    const defaultHistory: VersionHistory = {
      currentVersion: this.getCurrentVersion(),
      lastDeployedVersion: "none",
      deploymentHistory: [],
      pendingChanges: [],
    }

    this.saveVersionHistory(defaultHistory)
    return defaultHistory
  }

  saveVersionHistory(history: VersionHistory) {
    writeFileSync(this.versionHistoryPath, JSON.stringify(history, null, 2))
  }

  checkDeploymentStatus(): {
    isDeployed: boolean
    needsDeployment: boolean
    lastDeployment?: DeploymentRecord
    currentStatus: string
  } {
    const history = this.loadVersionHistory()
    const currentVersion = this.getCurrentVersion()
    const gitInfo = this.getGitInfo()

    const lastDeployment = history.deploymentHistory
      .filter((d) => d.status === "deployed")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    const isDeployed = lastDeployment !== undefined
    const needsDeployment = !isDeployed || currentVersion !== history.lastDeployedVersion || gitInfo.hasChanges

    let currentStatus = "Unknown"
    if (!isDeployed) {
      currentStatus = "Never Deployed"
    } else if (needsDeployment) {
      currentStatus = "Needs Deployment"
    } else {
      currentStatus = "Up to Date"
    }

    return {
      isDeployed,
      needsDeployment,
      lastDeployment,
      currentStatus,
    }
  }

  recordDeployment(environment = "production", features: string[] = []) {
    const history = this.loadVersionHistory()
    const currentVersion = this.getCurrentVersion()
    const gitInfo = this.getGitInfo()

    const deploymentRecord: DeploymentRecord = {
      version: currentVersion,
      timestamp: new Date().toISOString(),
      environment,
      status: "deployed",
      features,
      buildHash: gitInfo.hash,
    }

    history.deploymentHistory.push(deploymentRecord)
    history.lastDeployedVersion = currentVersion
    history.currentVersion = currentVersion
    history.pendingChanges = []

    this.saveVersionHistory(history)

    console.log(`✅ Recorded deployment of version ${currentVersion}`)
    return deploymentRecord
  }

  generateDeploymentReport(): string {
    const history = this.loadVersionHistory()
    const status = this.checkDeploymentStatus()
    const gitInfo = this.getGitInfo()
    const currentVersion = this.getCurrentVersion()

    const report = `# UMSCC Permit Management System - Deployment Status

## Current Status
- **Current Version**: ${currentVersion}
- **Last Deployed Version**: ${history.lastDeployedVersion}
- **Deployment Status**: ${status.currentStatus}
- **Git Branch**: ${gitInfo.branch}
- **Git Hash**: ${gitInfo.hash}
- **Has Uncommitted Changes**: ${gitInfo.hasChanges ? "Yes" : "No"}
- **Needs Deployment**: ${status.needsDeployment ? "Yes" : "No"}

## Last Deployment
${
  status.lastDeployment
    ? `
- **Version**: ${status.lastDeployment.version}
- **Date**: ${new Date(status.lastDeployment.timestamp).toLocaleString()}
- **Environment**: ${status.lastDeployment.environment}
- **Build Hash**: ${status.lastDeployment.buildHash || "N/A"}
- **Features**: ${status.lastDeployment.features.length > 0 ? status.lastDeployment.features.join(", ") : "None specified"}
`
    : "**No previous deployments recorded**"
}

## Deployment History
${
  history.deploymentHistory.length > 0
    ? history.deploymentHistory
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5) // Show last 5 deployments
        .map(
          (d) => `- **${d.version}** (${new Date(d.timestamp).toLocaleDateString()}) - ${d.environment} - ${d.status}`,
        )
        .join("\n")
    : "No deployment history available"
}

## System Features (Current)
- ✅ Application Management System
- ✅ Multi-role Dashboard System
- ✅ Document Upload & Management
- ✅ Workflow Management
- ✅ Permit Printing System
- ✅ Messaging System with Notifications
- ✅ Advanced Reporting & Analytics
- ✅ User Management & Authentication
- ✅ Mobile Responsive Design
- ✅ Print & Export Functionality

## Recommendations
${
  status.needsDeployment
    ? `
⚠️ **Deployment Required**
- Current version (${currentVersion}) differs from deployed version (${history.lastDeployedVersion})
- Run deployment process to update production environment
- Ensure all tests pass before deployment
`
    : `
✅ **System Up to Date**
- Production environment matches current version
- No immediate deployment required
- Continue monitoring for new changes
`
}

---
*Generated on ${new Date().toLocaleString()}*
`

    return report
  }

  printStatus() {
    const status = this.checkDeploymentStatus()
    const currentVersion = this.getCurrentVersion()
    const gitInfo = this.getGitInfo()

    console.log("\n📊 DEPLOYMENT STATUS SUMMARY")
    console.log("============================")
    console.log(`📦 Current Version: ${currentVersion}`)
    console.log(`🚀 Last Deployed: ${status.lastDeployment?.version || "Never"}`)
    console.log(
      `📅 Last Deployment Date: ${status.lastDeployment ? new Date(status.lastDeployment.timestamp).toLocaleString() : "N/A"}`,
    )
    console.log(`🌿 Git Branch: ${gitInfo.branch}`)
    console.log(`🔗 Git Hash: ${gitInfo.hash}`)
    console.log(`📝 Uncommitted Changes: ${gitInfo.hasChanges ? "Yes" : "No"}`)
    console.log(`⚡ Status: ${status.currentStatus}`)
    console.log(`🎯 Needs Deployment: ${status.needsDeployment ? "YES" : "NO"}`)

    if (status.lastDeployment) {
      console.log(`\n🏷️ Last Deployment Features:`)
      if (status.lastDeployment.features.length > 0) {
        status.lastDeployment.features.forEach((feature) => {
          console.log(`   ✅ ${feature}`)
        })
      } else {
        console.log(`   📝 No features specified`)
      }
    }

    console.log("============================")
  }
}

async function checkDeploymentVersion() {
  const checker = new DeploymentVersionChecker()

  try {
    checker.printStatus()

    const report = checker.generateDeploymentReport()
    const reportPath = `deployment-status-${Date.now()}.md`
    writeFileSync(reportPath, report)

    console.log(`\n💾 Detailed report saved: ${reportPath}`)

    const status = checker.checkDeploymentStatus()
    process.exit(status.needsDeployment ? 1 : 0)
  } catch (error) {
    console.error("❌ Failed to check deployment version:", error)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  checkDeploymentVersion()
}

export { DeploymentVersionChecker, checkDeploymentVersion }
