"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { calculateWaterAllocation } from "@/lib/permit-generator"

interface CompactApplicationFormProps {
  user: User
  application?: PermitApplication
  onSave: (application: PermitApplication) => void
  onCancel: () => void
}

export function CompactApplicationForm({ user, application, onSave, onCancel }: CompactApplicationFormProps) {
  const [formData, setFormData] = useState({
    applicantName: application?.applicantName || "",
    physicalAddress: application?.physicalAddress || "",
    customerAccountNumber: application?.customerAccountNumber || "",
    cellularNumber: application?.cellularNumber || "",
    numberOfBoreholes: application?.numberOfBoreholes || 1,
    landSize: application?.landSize || 0,
    gpsLatitude: application?.gpsLatitude || 0,
    gpsLongitude: application?.gpsLongitude || 0,
    waterSource: application?.waterSource || "ground_water",
    permitType: application?.permitType || "urban",
    intendedUse: application?.intendedUse || "",
    waterAllocation: application?.waterAllocation || 2500,
    comments: application?.comments || "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "permitType") {
        updated.waterAllocation = calculateWaterAllocation(value as string, prev.waterAllocation)
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const applicationData = {
        ...formData,
        status: "unsubmitted" as const,
        currentStage: 1,
        documents: [],
        workflowComments: [],
        postalAddress: "", // Optional field
        waterSourceDetails: "",
        validityPeriod: 5,
      }

      let savedApplication: PermitApplication

      if (application) {
        savedApplication = (await db.updateApplication(application.id, applicationData)) as PermitApplication
        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Updated Application",
          details: `Updated application ${application.applicationId}`,
          applicationId: application.id,
        })
      } else {
        savedApplication = await db.createApplication(applicationData)
        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Created Application",
          details: `Created new application ${savedApplication.applicationId}`,
          applicationId: savedApplication.id,
        })
      }

      onSave(savedApplication)
    } catch (err) {
      setError("Failed to save application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">
            {application ? "Edit Application" : "New Permit Application"} - Single Page Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Single Page Grid Layout - No Scrolling Required */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Applicant Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 border-b pb-1">APPLICANT INFORMATION</h3>

                <div>
                  <Label htmlFor="applicantName" className="text-xs">
                    Name of Applicant *
                  </Label>
                  <Input
                    id="applicantName"
                    value={formData.applicantName}
                    onChange={(e) => handleInputChange("applicantName", e.target.value)}
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="physicalAddress" className="text-xs">
                    Physical Address *
                  </Label>
                  <Textarea
                    id="physicalAddress"
                    value={formData.physicalAddress}
                    onChange={(e) => handleInputChange("physicalAddress", e.target.value)}
                    className="h-16 text-sm resize-none"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerAccountNumber" className="text-xs">
                    Customer Account Number *
                  </Label>
                  <Input
                    id="customerAccountNumber"
                    value={formData.customerAccountNumber}
                    onChange={(e) => handleInputChange("customerAccountNumber", e.target.value)}
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cellularNumber" className="text-xs">
                    Cellular Number *
                  </Label>
                  <Input
                    id="cellularNumber"
                    value={formData.cellularNumber}
                    onChange={(e) => handleInputChange("cellularNumber", e.target.value)}
                    className="h-8 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Column 2: Property & Technical Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 border-b pb-1">PROPERTY & TECHNICAL</h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="numberOfBoreholes" className="text-xs">
                      Number of Boreholes *
                    </Label>
                    <Input
                      id="numberOfBoreholes"
                      type="number"
                      min="1"
                      value={formData.numberOfBoreholes}
                      onChange={(e) => handleInputChange("numberOfBoreholes", Number.parseInt(e.target.value))}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="landSize" className="text-xs">
                      Land Size (ha) *
                    </Label>
                    <Input
                      id="landSize"
                      type="number"
                      step="0.1"
                      value={formData.landSize}
                      onChange={(e) => handleInputChange("landSize", Number.parseFloat(e.target.value))}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="gpsLatitude" className="text-xs">
                      GPS Latitude (X) *
                    </Label>
                    <Input
                      id="gpsLatitude"
                      type="number"
                      step="0.000001"
                      value={formData.gpsLatitude}
                      onChange={(e) => handleInputChange("gpsLatitude", Number.parseFloat(e.target.value))}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpsLongitude" className="text-xs">
                      GPS Longitude (Y) *
                    </Label>
                    <Input
                      id="gpsLongitude"
                      type="number"
                      step="0.000001"
                      value={formData.gpsLongitude}
                      onChange={(e) => handleInputChange("gpsLongitude", Number.parseFloat(e.target.value))}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="waterSource" className="text-xs">
                    Water Source *
                  </Label>
                  <Select
                    value={formData.waterSource}
                    onValueChange={(value) => handleInputChange("waterSource", value)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ground_water">Ground Water</SelectItem>
                      <SelectItem value="surface_water">Surface Water (Dam, River, Lake)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="intendedUse" className="text-xs">
                    Intended Use *
                  </Label>
                  <Input
                    id="intendedUse"
                    value={formData.intendedUse}
                    onChange={(e) => handleInputChange("intendedUse", e.target.value)}
                    className="h-8 text-sm"
                    placeholder="e.g., Urban water supply, Irrigation"
                    required
                  />
                </div>
              </div>

              {/* Column 3: Permit Details & Comments */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 border-b pb-1">PERMIT DETAILS</h3>

                <div>
                  <Label htmlFor="permitType" className="text-xs">
                    Permit Type *
                  </Label>
                  <Select value={formData.permitType} onValueChange={(value) => handleInputChange("permitType", value)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urban">Urban</SelectItem>
                      <SelectItem value="bulk_water">Bulk Water</SelectItem>
                      <SelectItem value="irrigation">Irrigation</SelectItem>
                      <SelectItem value="institution">Institution</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="surface_water_storage">Surface Water (Storage)</SelectItem>
                      <SelectItem value="surface_water_flow">Surface Water (Flow)</SelectItem>
                      <SelectItem value="tempering">Tempering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="waterAllocation" className="text-xs">
                    Water Allocation (Megaliters)
                  </Label>
                  <Input
                    id="waterAllocation"
                    type="number"
                    value={formData.waterAllocation}
                    onChange={(e) => handleInputChange("waterAllocation", Number.parseFloat(e.target.value))}
                    className="h-8 text-sm"
                    disabled={formData.permitType !== "bulk_water"}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated based on permit type</p>
                </div>

                <div className="flex-1">
                  <Label htmlFor="comments" className="text-xs">
                    Comments for Upper Manyame Sub Catchment Council
                  </Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleInputChange("comments", e.target.value)}
                    className="h-32 text-sm resize-none"
                    placeholder="Add any relevant comments for the Upper Manyame Sub Catchment Council..."
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="h-8 px-4 text-sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="h-8 px-4 text-sm">
                {isLoading ? "Saving..." : "Save Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
