"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileText, CheckCircle, AlertTriangle, MapPin, Droplets } from "lucide-react"
import type { PermitApplication, User } from "@/types"
import { db } from "@/lib/database"
import { calculateWaterAllocation } from "@/lib/enhanced-permit-generator"

interface OptimizedApplicationFormProps {
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
  permitTypes?: string[]
}

export function OptimizedApplicationForm({ user, application, onSave, onCancel }: OptimizedApplicationFormProps) {
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

  // Memoized document requirements based on permit type and water source
  const documentRequirements = useMemo((): DocumentRequirement[] => {
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

    // Add water source specific requirements
    if (formData.waterSource === "ground_water") {
      baseRequirements.push(
        {
          type: "capacity_test",
          label: "Borehole Capacity Test",
          required: ["bulk_water", "industrial"].includes(formData.permitType),
          description: "Professional borehole yield test results",
          permitTypes: ["bulk_water", "industrial", "irrigation"],
        },
        {
          type: "water_quality_test",
          label: "Water Quality Analysis",
          required: ["bulk_water", "urban"].includes(formData.permitType),
          description: "Laboratory water quality test certificate",
          permitTypes: ["bulk_water", "urban", "institution"],
        },
      )
    }

    // Add permit type specific requirements
    if (["industrial", "institution"].includes(formData.permitType)) {
      baseRequirements.push({
        type: "environmental_clearance",
        label: "Environmental Impact Assessment",
        required: true,
        description: "Environmental clearance certificate",
        permitTypes: ["industrial", "institution"],
      })
    }

    if (formData.permitType === "bulk_water") {
      baseRequirements.push({
        type: "site_plan",
        label: "Site Development Plan",
        required: true,
        description: "Detailed site layout and infrastructure plan",
        permitTypes: ["bulk_water"],
      })
    }

    baseRequirements.push({
      type: "other",
      label: "Other Supporting Documents",
      required: false,
      description: "Any additional supporting documentation",
    })

    return baseRequirements
  }, [formData.permitType, formData.waterSource])

  // Optimized form field update handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-calculate water allocation based on permit type
      if (field === "permitType") {
        updated.waterAllocation = calculateWaterAllocation(value, prev.waterAllocation)
      }

      return updated
    })
  }, [])

  // Optimized file upload handler with validation
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => {
      const isValidType = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      return isValidType && isValidSize
    })

    if (validFiles.length !== files.length) {
      setError("Some files were rejected. Please ensure files are PDF, DOC, DOCX, JPG, or PNG and under 10MB.")
    }

    setUploadedFiles((prev) => [...prev, ...validFiles])
  }, [])

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDocumentChecklistChange = useCallback((documentType: string, checked: boolean) => {
    setDocumentChecklist((prev) => ({
      ...prev,
      [documentType]: checked,
    }))
  }, [])

  // Memoized completion status calculation
  const completionStatus = useMemo(() => {
    const requiredDocs = documentRequirements.filter((req) => req.required)
    const checkedRequired = requiredDocs.filter((req) => documentChecklist[req.type])

    return {
      completed: checkedRequired.length,
      total: requiredDocs.length,
      percentage: requiredDocs.length > 0 ? Math.round((checkedRequired.length / requiredDocs.length) * 100) : 100,
    }
  }, [documentRequirements, documentChecklist])

  // Form validation
  const isFormValid = useMemo(() => {
    const requiredFields = [
      formData.applicantName,
      formData.physicalAddress,
      formData.customerAccountNumber,
      formData.cellularNumber,
      formData.permitType,
      formData.waterSource,
      formData.intendedUse,
    ]

    const hasRequiredFields = requiredFields.every((field) => field && field.toString().trim() !== "")
    const hasRequiredDocuments = completionStatus.percentage === 100
    const hasValidGPS = formData.gpsLatitude !== 0 && formData.gpsLongitude !== 0

    return hasRequiredFields && hasRequiredDocuments && hasValidGPS
  }, [formData, completionStatus.percentage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError("Please complete all required fields and document verification.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const applicationData = {
        ...formData,
        status: "unsubmitted" as const,
        currentStage: 1,
        documents: [],
        workflowComments: [],
        createdBy: user.id,
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

      // Log document completion
      await db.addLog({
        userId: user.id,
        userType: user.userType,
        action: "Document Verification Completed",
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

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Progress Indicator */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Application Progress</CardTitle>
              <Badge variant={completionStatus.percentage === 100 ? "default" : "secondary"}>
                {completionStatus.percentage}% Complete
              </Badge>
            </div>
            <Progress value={completionStatus.percentage} className="w-full" />
          </CardHeader>
        </Card>

        {/* Single Page Layout - All sections in a grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div>
                  <Label htmlFor="cellularNumber">Cellular Number *</Label>
                  <Input
                    id="cellularNumber"
                    value={formData.cellularNumber}
                    onChange={(e) => handleInputChange("cellularNumber", e.target.value)}
                    required
                  />
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
              </CardContent>
            </Card>

            {/* Property & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Property & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landSize">Land Size (hectares) *</Label>
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
                    <Label htmlFor="numberOfBoreholes">Number of Boreholes *</Label>
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

                <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Permit Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="h-5 w-5 mr-2" />
                  Permit Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="waterAllocation">Water Allocation (ML) *</Label>
                    <Input
                      id="waterAllocation"
                      type="number"
                      value={formData.waterAllocation}
                      onChange={(e) => handleInputChange("waterAllocation", Number.parseFloat(e.target.value))}
                      disabled={formData.permitType !== "bulk_water"}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.permitType === "urban" && "Urban permits: 2,500 ML"}
                      {formData.permitType === "bulk_water" && "Variable allocation"}
                      {!["urban", "bulk_water"].includes(formData.permitType) && "Standard permits: 10,000 ML"}
                    </p>
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
                </div>

                <div>
                  <Label htmlFor="comments">Comments for UMSCC</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleInputChange("comments", e.target.value)}
                    placeholder="Add any relevant comments for the Upper Manyame Sub Catchment Council"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-gray-900">Drop files here or click to browse</span>
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
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)</p>
                    </div>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Uploaded Files ({uploadedFiles.length})</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
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
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {documentRequirements.map((req) => (
                                <SelectItem key={req.type} value={req.type}>
                                  {req.label}
                                </SelectItem>
                              ))}
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
          </div>
        </div>

        {/* Document Verification Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Document Verification Checklist
              <div className="ml-auto flex items-center space-x-2">
                {completionStatus.percentage === 100 ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {completionStatus.completed}/{completionStatus.total} Required
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documentRequirements.map((requirement) => (
                <div
                  key={requirement.type}
                  className={`flex items-start space-x-2 p-3 rounded border text-sm ${
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
                    onCheckedChange={(checked) => handleDocumentChecklistChange(requirement.type, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor={requirement.type} className="text-xs cursor-pointer font-medium">
                      {requirement.label}
                      {requirement.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-xs text-gray-600 mt-1">{requirement.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * Required documents must be verified before saving the application
            </p>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pb-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !isFormValid} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Saving..." : "Save Application"}
          </Button>
        </div>
      </form>
    </div>
  )
}
