"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X } from "lucide-react"
import type { User, PermitApplication } from "@/types"

interface ApplicationFormProps {
  user: User
  application?: PermitApplication | null
  onSave: () => void
  onCancel: () => void
}

export function ApplicationForm({ user, application, onSave, onCancel }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    applicantName: application?.applicantName || "",
    applicantId: application?.applicantId || "",
    physicalAddress: application?.physicalAddress || "",
    postalAddress: application?.postalAddress || "",
    landSize: application?.landSize || 0,
    numberOfBoreholes: application?.numberOfBoreholes || 1,
    waterAllocation: application?.waterAllocation || 0,
    intendedUse: application?.intendedUse || "",
    gpsLatitude: application?.gpsLatitude || 0,
    gpsLongitude: application?.gpsLongitude || 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onSave()
    } catch (error) {
      console.error("Failed to save application:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{application ? "Edit Application" : "New Water Permit Application"}</CardTitle>
          <CardDescription>
            {application ? "Update your application details" : "Fill in the details for your water permit application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Applicant Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Applicant Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicantName">Full Name</Label>
                  <Input
                    id="applicantName"
                    value={formData.applicantName}
                    onChange={(e) => handleInputChange("applicantName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="applicantId">National ID</Label>
                  <Input
                    id="applicantId"
                    value={formData.applicantId}
                    onChange={(e) => handleInputChange("applicantId", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="physicalAddress">Physical Address</Label>
                <Textarea
                  id="physicalAddress"
                  value={formData.physicalAddress}
                  onChange={(e) => handleInputChange("physicalAddress", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="postalAddress">Postal Address</Label>
                <Textarea
                  id="postalAddress"
                  value={formData.postalAddress}
                  onChange={(e) => handleInputChange("postalAddress", e.target.value)}
                />
              </div>
            </div>

            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="landSize">Land Size (hectares)</Label>
                  <Input
                    id="landSize"
                    type="number"
                    value={formData.landSize}
                    onChange={(e) => handleInputChange("landSize", Number.parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfBoreholes">Number of Boreholes</Label>
                  <Input
                    id="numberOfBoreholes"
                    type="number"
                    value={formData.numberOfBoreholes}
                    onChange={(e) => handleInputChange("numberOfBoreholes", Number.parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gpsLatitude">GPS Latitude</Label>
                  <Input
                    id="gpsLatitude"
                    type="number"
                    step="any"
                    value={formData.gpsLatitude}
                    onChange={(e) => handleInputChange("gpsLatitude", Number.parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gpsLongitude">GPS Longitude</Label>
                  <Input
                    id="gpsLongitude"
                    type="number"
                    step="any"
                    value={formData.gpsLongitude}
                    onChange={(e) => handleInputChange("gpsLongitude", Number.parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Water Usage Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Water Usage Information</h3>
              <div>
                <Label htmlFor="waterAllocation">Water Allocation (m³/month)</Label>
                <Input
                  id="waterAllocation"
                  type="number"
                  value={formData.waterAllocation}
                  onChange={(e) => handleInputChange("waterAllocation", Number.parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="intendedUse">Intended Use</Label>
                <Textarea
                  id="intendedUse"
                  value={formData.intendedUse}
                  onChange={(e) => handleInputChange("intendedUse", e.target.value)}
                  placeholder="Describe the intended use of water (e.g., domestic, irrigation, industrial)"
                  required
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
