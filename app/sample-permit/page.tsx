"use client"

import SamplePermitGenerator from "@/components/sample-permit-generator"

export default function SamplePermitPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Sample Permit Generator</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Generate and test the permit template with sample data to verify formatting and layout across different screen
          sizes.
        </p>
      </div>

      <SamplePermitGenerator />
    </div>
  )
}
