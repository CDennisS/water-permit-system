export class BlobStorageSetup {
  static getSetupInstructions() {
    return {
      steps: [
        {
          step: 1,
          title: "Access Vercel Dashboard",
          description: "Go to vercel.com and sign in to your account",
          action: "Navigate to your project dashboard",
        },
        {
          step: 2,
          title: "Enable Blob Storage",
          description: "In your project, go to Storage tab",
          action: "Click 'Create Database' → Select 'Blob'",
        },
        {
          step: 3,
          title: "Get Access Token",
          description: "Copy the BLOB_READ_WRITE_TOKEN",
          action: "Save this token securely",
        },
        {
          step: 4,
          title: "Add Environment Variable",
          description: "Add token to your project settings",
          action: "Settings → Environment Variables",
        },
      ],
      environmentVariable: {
        key: "BLOB_READ_WRITE_TOKEN",
        value: "vercel_blob_rw_[your_token_here]",
        targets: ["Production", "Preview", "Development"],
      },
    }
  }

  static validateBlobConfiguration() {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    return {
      isConfigured: !!token,
      tokenPresent: !!token,
      tokenFormat: token?.startsWith("vercel_blob_rw_") ? "valid" : "invalid",
      status: token ? "ready" : "needs_configuration",
    }
  }
}
