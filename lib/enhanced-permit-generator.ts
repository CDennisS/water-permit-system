import type { PermitApplication, PermitData, BoreholeDetail } from "@/types"

export function preparePermitData(application: PermitApplication): PermitData {
  try {
    // Validate input
    if (!application) {
      throw new Error("Application data is required")
    }

    if (!application.applicantName) {
      throw new Error("Applicant name is required")
    }

    // Generate permit number if not exists
    const permitNumber = application.permitNumber || generatePermitNumber(application)

    // Calculate validity date (typically 1 year from approval)
    const validUntil = calculateValidityDate(application.approvedAt)

    // Prepare borehole details
    const boreholeDetails: BoreholeDetail[] = generateBoreholeDetails(application)

    // Calculate total allocated abstraction
    const totalAllocatedAbstraction = boreholeDetails.reduce(
      (total, borehole) => total + (borehole.allocatedAmount || 0),
      0,
    )

    return {
      permitNumber,
      applicantName: application.applicantName,
      physicalAddress: application.physicalAddress || "N/A",
      postalAddress: application.postalAddress || "N/A",
      landSize: application.landSize || 0,
      numberOfBoreholes: application.numberOfBoreholes || 1,
      totalAllocatedAbstraction: totalAllocatedAbstraction || application.waterAllocation * 1000 || 0,
      intendedUse: application.intendedUse || "General use",
      validUntil,
      boreholeDetails,
      issueDate: new Date().toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }),
      gpsCoordinates: {
        latitude: application.gpsLatitude?.toString() || "N/A",
        longitude: application.gpsLongitude?.toString() || "N/A",
      },
      catchment: "MANYAME",
      subCatchment: "UPPER MANYAME",
      permitType: "temporary",
    }
  } catch (error) {
    console.error("Error in preparePermitData:", error)
    throw error
  }
}

function generatePermitNumber(application: PermitApplication): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, "0")
  const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")

  return `UMSCC-${year}-${month}-${sequence}`
}

function calculateValidityDate(approvedAt?: Date): string {
  const baseDate = approvedAt || new Date()
  const validityDate = new Date(baseDate)
  validityDate.setFullYear(validityDate.getFullYear() + 1)

  return validityDate.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  })
}

function generateBoreholeDetails(application: PermitApplication): BoreholeDetail[] {
  const details: BoreholeDetail[] = []
  const numberOfBoreholes = application.numberOfBoreholes || 1
  const totalAllocation = (application.waterAllocation || 0) * 1000 // Convert ML to m³
  const allocationPerBorehole = Math.floor(totalAllocation / numberOfBoreholes)

  for (let i = 1; i <= numberOfBoreholes; i++) {
    details.push({
      boreholeNumber: `BH-${String(i).padStart(2, "0")}`,
      allocatedAmount:
        i === numberOfBoreholes
          ? totalAllocation - allocationPerBorehole * (numberOfBoreholes - 1) // Last borehole gets remainder
          : allocationPerBorehole,
      gpsX: generateGPSCoordinate(application.gpsLatitude || -17.8252, 0.001),
      gpsY: generateGPSCoordinate(application.gpsLongitude || 31.0335, 0.001),
      intendedUse: application.intendedUse || "General use",
      maxAbstractionRate: Math.floor(allocationPerBorehole * 1.1), // 10% buffer
      waterSampleFrequency: "3 months",
    })
  }

  return details
}

function generateGPSCoordinate(base: number, variance: number): string {
  const offset = (Math.random() - 0.5) * variance * 2
  return (base + offset).toFixed(6)
}

export function validatePermitData(permitData: PermitData): boolean {
  const required = [
    "permitNumber",
    "applicantName",
    "physicalAddress",
    "landSize",
    "numberOfBoreholes",
    "totalAllocatedAbstraction",
    "intendedUse",
    "validUntil",
  ]

  return required.every((field) => {
    const value = permitData[field as keyof PermitData]
    return value !== null && value !== undefined && value !== ""
  })
}

export function formatPermitForPrint(permitData: PermitData): string {
  return `
GROUNDWATER ABSTRACTION PERMIT
==============================

Permit Number: ${permitData.permitNumber}
Issue Date: ${permitData.issueDate}
Valid Until: ${permitData.validUntil}

APPLICANT DETAILS
-----------------
Name: ${permitData.applicantName}
Physical Address: ${permitData.physicalAddress}
Postal Address: ${permitData.postalAddress || "N/A"}

PROPERTY DETAILS
----------------
Land Size: ${permitData.landSize} hectares
Number of Boreholes: ${permitData.numberOfBoreholes}
Total Allocated Abstraction: ${permitData.totalAllocatedAbstraction.toLocaleString()} m³/annum
Intended Use: ${permitData.intendedUse}

BOREHOLE DETAILS
----------------
${permitData.boreholeDetails
  .map(
    (bh) => `${bh.boreholeNumber}: ${bh.allocatedAmount?.toLocaleString() || 0} m³/annum (GPS: ${bh.gpsX}, ${bh.gpsY})`,
  )
  .join("\n")}

This permit is issued under the authority of the Upper Manyame Sub Catchment Council.
  `.trim()
}

export function generatePermitPDF(permitData: PermitData): Promise<Blob> {
  return new Promise((resolve) => {
    // This would integrate with a PDF generation library like jsPDF or Puppeteer
    // For now, we'll create a simple HTML-based PDF
    const htmlContent = formatPermitForPrint(permitData)
    const blob = new Blob([htmlContent], { type: "text/plain" })
    resolve(blob)
  })
}
