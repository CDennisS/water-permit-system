import { NextResponse } from "next/server"
import { put, del } from "@vercel/blob"

export async function POST() {
  try {
    // Check if token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: "BLOB_READ_WRITE_TOKEN not configured",
          instructions: "Please set up Vercel Blob Storage first",
        },
        { status: 400 },
      )
    }

    // Test blob storage with a small test file
    const testContent = `Test file created at ${new Date().toISOString()}`
    const testFileName = `test-${Date.now()}.txt`

    // Upload test file
    const blob = await put(testFileName, testContent, {
      access: "public",
      addRandomSuffix: false,
    })

    // Clean up test file
    await del(blob.url)

    return NextResponse.json({
      success: true,
      message: "Vercel Blob Storage is working correctly!",
      testUrl: blob.url,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        troubleshooting: [
          "Verify BLOB_READ_WRITE_TOKEN is correct",
          "Check token has read/write permissions",
          "Ensure token is added to all environments",
        ],
      },
      { status: 500 },
    )
  }
}
