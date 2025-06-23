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
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, FileText, CheckCircle, AlertTriangle } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { calculateWaterAllocation } from "@/lib/permit-generator"

interface ApplicationFormProps {
  user: User
  application?: PermitApplication
  onSave: (application: PermitApplication) => void
  onCancel: () => void
}

interface DocumentRequirement {
  type: string
  label: string
  required: boolean
  description: string
}

export function ApplicationForm({ user, application, onSave, onCancel }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    applicantName: application?.applicantName || "",
    physicalAddress: application?.physicalAddress || "",
    postalAddress: application?.postalAddress || "",
    customerAccountNumber: application?.customerAccountNumber || "",
    cellularNumber: application?.cellularNumber || "",
    numberOfBoreholes: application?.numberOfBoreholes || 1,
    landSize: application?.landSize || 0,
    gpsLatitude: application?.gpsLatitude || 0,
    gpsLongitude: application?.gpsLongitude || 0,
    waterSource: application?.waterSource || "ground_water",
    waterSourceDetails: application?.waterSourceDetails || "",
    permitType: application?.permitType || "urban",
    intendedUse: application?.intendedUse || "",
    waterAllocation: application?.waterAllocation || 2500,
    validityPeriod: application?.validityPeriod || 5,
    comments: application?.comments || "",
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [documentTypes, setDocumentTypes] = useState<Record<string, string>>({})
  const [documentChecklist, setDocumentChecklist] = useState<Record<string, boolean>>({
    application_form: false,
    proof_of_residence: false,
    receipt: false,
    capacity_test: false,
    water_quality_test: false,
    site_plan: false,
    environmental_clearance: false,
    other: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Document requirements based on permit type
  const getDocumentRequirements = (): DocumentRequirement[] => {
    const baseRequirements: DocumentRequirement[] = [
      {
        type: "application_form",
        label: "Completed Application Form",
        required: true,
        description: "Official UMSCC water permit application form",
      },
      {
        type: "proof_of_residence",
        label: "Proof of Residence",
        required: true,
        description: "Utility bill, lease agreement, or property ownership documents",
      },
      {
        type: "receipt",
        label: "Payment Receipt",
        required: true,
        description: "Proof of application fee payment",
      },
    ]

    // Add permit-type specific requirements (now optional)
    if (formData.waterSource === "ground_water") {
      baseRequirements.push(
        {
          type: "capacity_test",
          label: "Borehole Capacity Test",
          required: false, // Changed to optional
          description: "Professional borehole yield test results",
        },
        {
          type: "water_quality_test",
          label: "Water Quality Analysis",
          required: false, // Changed to optional
          description: "Laboratory water quality test certificate",
        },
      )
    }

    if (["industrial", "institution"].includes(formData.permitType)) {
      baseRequirements.push({
        type: "environmental_clearance",
        label: "Environmental Clearance",
        required: true,
        description: "Environmental Impact Assessment clearance certificate",
      })
    }

    baseRequirements.push({
      type: "other",
      label: "Other Supporting Documents",
      required: false,
      description: "Any additional supporting documentation",
    })

    return baseRequirements
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-calculate water allocation based on permit type
      if (field === "permitType") {
        updated.waterAllocation = calculateWaterAllocation(value, prev.waterAllocation)
      }

      return updated
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDocumentChecklistChange = (documentType: string, checked: boolean) => {
    setDocumentChecklist((prev) => ({
      ...prev,
      [documentType]: checked,
    }))
  }

  const getCompletionStatus = () => {
    const requirements = getDocumentRequirements()
    const requiredDocs = requirements.filter((req) => req.required)
    const checkedRequired = requiredDocs.filter((req) => documentChecklist[req.type])

    return {
      completed: checkedRequired.length,
      total: requiredDocs.length,
      percentage: Math.round((checkedRequired.length / requiredDocs.length) * 100),
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate required documents
      const requirements = getDocumentRequirements()
      const missingRequired = requirements.filter((req) => req.required && !documentChecklist[req.type])

      if (missingRequired.length > 0) {
        setError(
          `Missing required documents: ${missingRequired.map((req) => req.label).join(", ")}. Please check all required document types.`,
        )
        setIsLoading(false)
        return
      }

      const applicationData = {
        ...formData,
        status: "unsubmitted" as const,
        currentStage: 1,
        documents: [],
        workflowComments: [],
        createdBy: user.id, // Add this line to ensure createdBy is set
      }

      let savedApplication: PermitApplication

      if (application) {
        // Update existing application
        savedApplication = (await db.updateApplication(application.id, applicationData)) as PermitApplication
        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Updated Application",
          details: `Updated application ${application.applicationId}`,
          applicationId: application.id,
        })
      } else {
        // Create new application
        console.log("Creating application with data:", applicationData) // Add debugging
        savedApplication = await db.createApplication(applicationData)
        console.log("Created application:", savedApplication) // Add debugging
        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "Created Application",
          details: `Created new application ${savedApplication.applicationId}`,
          applicationId: savedApplication.id,
        })
      }

      // Handle file uploads
      for (const file of uploadedFiles) {
        await db.uploadDocument({
          applicationId: savedApplication.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          documentType: documentTypes[file.name] || "other",
        })
      }

      // Log document checklist completion
      const completionStatus = getCompletionStatus()
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Document Checklist Completed",
        details: `Document verification: ${completionStatus.completed}/${completionStatus.total} required documents confirmed for ${savedApplication.applicationId}`,
        applicationId: savedApplication.id,
      })

      onSave(savedApplication)
    } catch (err) {
      setError("Failed to save application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const completionStatus = getCompletionStatus()
  const documentRequirements = getDocumentRequirements()

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{application ? "Edit Application" : "New Permit Application"}</span>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-600">
                Document Completion: {completionStatus.completed}/{completionStatus.total}
              </div>
              <div className="w-16 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionStatus.percentage}%` }}
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Applicant Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Applicant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicantName">Name of Applicant *</Label>
                    <Input
                      id="applicantName"
                      value={formData.applicantName}
                      onChange={(e) => handleInputChange("applicantName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerAccountNumber">Customer Account Number *</Label>
                    <Input
                      id="customerAccountNumber"
                      value={formData.customerAccountNumber}
                      onChange={(e) => handleInputChange("customerAccountNumber", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="physicalAddress">Physical Address *</Label>
                  <Textarea
                    id="physicalAddress"
                    value={formData.physicalAddress}
                    onChange={(e) => handleInputChange("physicalAddress", e.target.value)}
                    required
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="postalAddress">Postal Address</Label>
                  <Input
                    id="postalAddress"
                    value={formData.postalAddress}
                    onChange={(e) => handleInputChange("postalAddress", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cellularNumber">Cellular Number *</Label>
                  <Input
                    id="cellularNumber"
                    value={formData.cellularNumber}
                    onChange={(e) => handleInputChange("cellularNumber", e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property & Location Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property & Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landSize">Size of Land/Property (ha) *</Label>
                    <Input
                      id="landSize"
                      type="number"
                      step="0.1"
                      value={formData.landSize}
                      onChange={(e) => handleInputChange("landSize", Number.parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfBoreholes">Number of Drilled Boreholes *</Label>
                    <Input
                      id="numberOfBoreholes"
                      type="number"
                      min="1"
                      value={formData.numberOfBoreholes}
                      onChange={(e) => handleInputChange("numberOfBoreholes", Number.parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gpsLatitude">GPS Latitude (X) *</Label>
                    <Input
                      id="gpsLatitude"
                      type="number"
                      step="0.000001"
                      value={formData.gpsLatitude}
                      onChange={(e) => handleInputChange("gpsLatitude", Number.parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpsLongitude">GPS Longitude (Y) *</Label>
                    <Input
                      id="gpsLongitude"
                      type="number"
                      step="0.000001"
                      value={formData.gpsLongitude}
                      onChange={(e) => handleInputChange("gpsLongitude", Number.parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permit Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="waterSource">Water Source *</Label>
                    <Select
                      value={formData.waterSource}
                      onValueChange={(value) => handleInputChange("waterSource", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ground_water">Ground Water</SelectItem>
                        <SelectItem value="surface_water">Surface Water (Dam, River, Lake)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="permitType">Permit Type *</Label>
                    <Select
                      value={formData.permitType}
                      onValueChange={(value) => handleInputChange("permitType", value)}
                    >
                      <SelectTrigger>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="intendedUse">Intended Use *</Label>
                    <Input
                      id="intendedUse"
                      value={formData.intendedUse}
                      onChange={(e) => handleInputChange("intendedUse", e.target.value)}
                      placeholder="e.g., Urban water supply, Irrigation, Industrial use"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="waterAllocation">Water Allocation (Megaliters) *</Label>
                    <Input
                      id="waterAllocation"
                      type="number"
                      value={formData.waterAllocation}
                      onChange={(e) => handleInputChange("waterAllocation", Number.parseFloat(e.target.value))}
                      disabled={formData.permitType !== "bulk_water"}
                      required
                    />
                  </div>
                </div>

                {formData.permitType === "bulk_water" && (
                  <div>
                    <Label htmlFor="validityPeriod">Validity Period (Years) *</Label>
                    <Input
                      id="validityPeriod"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.validityPeriod}
                      onChange={(e) => handleInputChange("validityPeriod", Number.parseInt(e.target.value))}
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Drop files here or click to browse
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
                      </p>
                    </div>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Uploaded Files ({uploadedFiles.length})</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex items-center flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={documentTypes[file.name] || "other"}
                            onValueChange={(value) => setDocumentTypes((prev) => ({ ...prev, [file.name]: value }))}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Document type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="application_form">Application Form</SelectItem>
                              <SelectItem value="proof_of_residence">Proof of Residence</SelectItem>
                              <SelectItem value="receipt">Payment Receipt</SelectItem>
                              <SelectItem value="capacity_test">Capacity Test</SelectItem>
                              <SelectItem value="water_quality_test">Water Quality Test</SelectItem>
                              <SelectItem value="environmental_clearance">Environmental Clearance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compact Document Verification Checklist */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Document Verification
                  <div className="ml-auto flex items-center space-x-2">
                    {completionStatus.percentage === 100 ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </div>
                    ) : (
                      <div className="flex items-center text-orange-600 text-sm">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {completionStatus.completed}/{completionStatus.total} Required
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {documentRequirements.map((requirement) => (
                    <div
                      key={requirement.type}
                      className={`flex items-center space-x-2 p-2 rounded border text-sm ${
                        requirement.required
                          ? documentChecklist[requirement.type]
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50"
                          : documentChecklist[requirement.type]
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        id={requirement.type}
                        checked={documentChecklist[requirement.type]}
                        onCheckedChange={(checked) =>
                          handleDocumentChecklistChange(requirement.type, checked as boolean)
                        }
                      />
                      <label htmlFor={requirement.type} className="text-xs cursor-pointer flex-1 leading-tight">
                        {requirement.label}
                        {requirement.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Required documents must be verified before saving the application
                </p>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleInputChange("comments", e.target.value)}
                  placeholder="Add any relevant comments for the Upper Manyame Sub Catchment Council"
                  rows={3}
                />
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || completionStatus.percentage < 100}>
                {isLoading ? "Saving..." : "Save Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
