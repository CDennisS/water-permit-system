import fs from "fs"
import path from "path"

interface DeploymentInfo {
  version: string
  lastDeployed: string | null
  environment: string
  status: string
}

export async function checkDeploymentVersion(): Promise<DeploymentInfo> {
  try {
    // Read package.json for current version
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

    // Check if deployment history exists
    const deploymentHistoryPath = path.join(process.cwd(), "deployment-history.json")
    let deploymentHistory = { deployments: [] }

    if (fs.existsSync(deploymentHistoryPath)) {
      deploymentHistory = JSON.parse(fs.readFileSync(deploymentHistoryPath, "utf8"))
    }

    const lastDeployment =
      deploymentHistory.deployments.length > 0
        ? deploymentHistory.deployments[deploymentHistory.deployments.length - 1]
        : null

    return {
      version: packageJson.version,
      lastDeployed: lastDeployment ? lastDeployment.timestamp : null,
      environment: process.env.NODE_ENV || "development",
      status: lastDeployment ? "deployed" : "never deployed",
    }
  } catch (error) {
    console.error("Error checking deployment version:", error)
    return {
      version: "unknown",
      lastDeployed: null,
      environment: "unknown",
      status: "error",
    }
  }
}

// Run if called directly
if (require.main === module) {
  checkDeploymentVersion().then((info) => {
    console.log("Deployment Information:")
    console.log(`Version: ${info.version}`)
    console.log(`Last Deployed: ${info.lastDeployed || "Never"}`)
    console.log(`Environment: ${info.environment}`)
    console.log(`Status: ${info.status}`)
  })
}
