import fs from "fs"
import path from "path"

interface DeploymentInfo {
  version: string
  lastDeployed: string | null
  environment: string
  status: string
  features: string[]
}

async function checkDeploymentVersion(): Promise<DeploymentInfo> {
  try {
    // Read package.json for version
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

    // Check if deployment history exists
    const deploymentHistoryPath = path.join(process.cwd(), "deployment-history.json")
    let deploymentHistory = null

    if (fs.existsSync(deploymentHistoryPath)) {
      deploymentHistory = JSON.parse(fs.readFileSync(deploymentHistoryPath, "utf8"))
    }

    const deploymentInfo: DeploymentInfo = {
      version: packageJson.version || "1.0.0",
      lastDeployed: deploymentHistory?.lastDeployed || null,
      environment: process.env.NODE_ENV || "development",
      status: deploymentHistory?.status || "never-deployed",
      features: [
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
      ],
    }

    console.log("=== DEPLOYMENT VERSION CHECK ===")
    console.log(`Current Version: ${deploymentInfo.version}`)
    console.log(`Last Deployed: ${deploymentInfo.lastDeployed || "Never"}`)
    console.log(`Environment: ${deploymentInfo.environment}`)
    console.log(`Status: ${deploymentInfo.status}`)
    console.log("\nFeatures:")
    deploymentInfo.features.forEach((feature) => {
      console.log(`  ✅ ${feature}`)
    })

    return deploymentInfo
  } catch (error) {
    console.error("Error checking deployment version:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  checkDeploymentVersion()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { checkDeploymentVersion }
