import type { PermitApplication, PermitData, BoreholeDetail } from "@/types"

export function generatePermitNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  // In production, this would increment from database
  const permitNumber = Math.floor(Math.random() * 1000) + 1

  return `UM${year}${month}${day}${permitNumber}`
}

export function calculateWaterAllocation(permitType: string, customAllocation?: number): number {
  switch (permitType) {
    case "urban":
      return 2500 // megaliters
    case "bulk_water":
      return customAllocation || 0 // variable, entered by officer
    default:
      return 10000 // megaliters for all other permits
  }
}

export function calculateExpiryDate(approvalDate: Date, permitType: string, customValidityPeriod?: number): Date {
  const expiryDate = new Date(approvalDate)

  if (permitType === "bulk_water" && customValidityPeriod) {
    expiryDate.setFullYear(expiryDate.getFullYear() + customValidityPeriod)
  } else {
    // All other permits valid for 5 years
    expiryDate.setFullYear(expiryDate.getFullYear() + 5)
  }

  return expiryDate
}

export function preparePermitData(application: PermitApplication): PermitData {
  const permitNumber = generatePermitNumber()
  const approvalDate = new Date()
  const expiryDate = calculateExpiryDate(approvalDate, application.permitType, application.validityPeriod)

  // Create borehole details
  const boreholeDetails: BoreholeDetail[] = []
  for (let i = 1; i <= application.numberOfBoreholes; i++) {
    boreholeDetails.push({
      boreholeNumber: i.toString(),
      allocatedAmount: application.waterAllocation / application.numberOfBoreholes,
      gpsX: application.gpsLatitude,
      gpsY: application.gpsLongitude,
      intendedUse: application.intendedUse,
      maxAbstractionRate: application.waterAllocation / application.numberOfBoreholes,
      waterSampleFrequency: "3 months",
    })
  }

  return {
    permitNumber,
    applicantName: application.applicantName,
    physicalAddress: application.physicalAddress,
    postalAddress: application.postalAddress,
    numberOfBoreholes: application.numberOfBoreholes,
    landSize: application.landSize,
    totalAllocatedAbstraction: application.waterAllocation,
    boreholeDetails,
    intendedUse: application.intendedUse,
    validUntil: expiryDate.toLocaleDateString("en-GB"),
    issueDate: approvalDate.toLocaleDateString("en-GB"),
  }
}
