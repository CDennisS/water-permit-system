import { NextResponse } from "next/server"
import { StorageVerification } from "@/deployment/storage-verification"

export async function GET() {
  try {
    const storageStatus = await StorageVerification.verifyCloudStorage()
    const config = StorageVerification.getStorageConfiguration()

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      storage: storageStatus,
      configuration: config,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
