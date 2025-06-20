"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Table, BarChart3 } from "lucide-react"
import type { PermitApplication } from "@/types"

interface ExportOptionsProps {
  applications: PermitApplication[]
  onExport: (options: ExportConfig) => void
}

interface ExportConfig {
  format: "csv" | "excel" | "pdf" | "json"
  fields: string[]
  includeComments: boolean
  includeDocuments: boolean
  groupBy?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export function ExportOptions({ applications, onExport }: ExportOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ExportConfig>({
    format: "csv",
    fields: ["applicationId", "applicantName", "permitType", "status", "createdAt", "waterAllocation"],
    includeComments: false,
    includeDocuments: false,
    sortBy: "createdAt",
    sortOrder: "desc",
  })

  const availableFields = [
    { id: "applicationId", label: "Application ID", category: "Basic" },
    { id: "applicantName", label: "Applicant Name", category: "Basic" },
    { id: "physicalAddress", label: "Physical Address", category: "Contact" },
    { id: "postalAddress", label: "Postal Address", category: "Contact" },
    { id: "cellularNumber", label: "Phone Number", category: "Contact" },
    { id: "customerAccountNumber", label: "Account Number", category: "Contact" },
    { id: "permitType", label: "Permit Type", category: "Permit" },
    { id: "waterSource", label: "Water Source", category: "Permit" },
    { id: "intendedUse", label: "Intended Use", category: "Permit" },
    { id: "waterAllocation", label: "Water Allocation (ML)", category: "Technical" },
    { id: "numberOfBoreholes", label: "Number of Boreholes", category: "Technical" },
    { id: "landSize", label: "Land Size (ha)", category: "Technical" },
    { id: "gpsLatitude", label: "GPS Latitude", category: "Location" },
    { id: "gpsLongitude", label: "GPS Longitude", category: "Location" },
    { id: "status", label: "Status", category: "Workflow" },
    { id: "currentStage", label: "Current Stage", category: "Workflow" },
    { id: "createdAt", label: "Created Date", category: "Dates" },
    { id: "submittedAt", label: "Submitted Date", category: "Dates" },
    { id: "approvedAt", label: "Approved Date", category: "Dates" },
    { id: "updatedAt", label: "Last Updated", category: "Dates" },
    { id: "comments", label: "Comments", category: "Additional" },
  ]

  const fieldCategories = Array.from(new Set(availableFields.map((f) => f.category)))

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      fields: checked ? [...prev.fields, fieldId] : prev.fields.filter((f) => f !== fieldId),
    }))
  }

  const handleSelectAll = (category?: string) => {
    const fieldsToAdd = category
      ? availableFields.filter((f) => f.category === category).map((f) => f.id)
      : availableFields.map((f) => f.id)

    setConfig((prev) => ({
      ...prev,
      fields: Array.from(new Set([...prev.fields, ...fieldsToAdd])),
    }))
  }

  const handleDeselectAll = (category?: string) => {
    const fieldsToRemove = category
      ? availableFields.filter((f) => f.category === category).map((f) => f.id)
      : availableFields.map((f) => f.id)

    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => !fieldsToRemove.includes(f)),
    }))
  }

  const handleExport = () => {
    onExport(config)
    setIsOpen(false)
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "csv":
        return <Table className="h-4 w-4" />
      case "excel":
        return <FileText className="h-4 w-4" />
      case "pdf":
        return <FileText className="h-4 w-4" />
      case "json":
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Advanced Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Applications ({applications.length} records)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "csv", label: "CSV", description: "Comma-separated values" },
                  { value: "excel", label: "Excel", description: "Microsoft Excel format" },
                  { value: "pdf", label: "PDF", description: "Portable document format" },
                  { value: "json", label: "JSON", description: "JavaScript object notation" },
                ].map((format) => (
                  <div
                    key={format.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      config.format === format.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setConfig((prev) => ({ ...prev, format: format.value as any }))}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getFormatIcon(format.value)}
                      <span className="font-medium">{format.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{format.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Select Fields to Export
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleSelectAll()}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeselectAll()}>
                    Deselect All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fieldCategories.map((category) => (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{category}</h4>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleSelectAll(category)}>
                          Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeselectAll(category)}>
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableFields
                        .filter((field) => field.category === category)
                        .map((field) => (
                          <div key={field.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={field.id}
                              checked={config.fields.includes(field.id)}
                              onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
                            />
                            <Label htmlFor={field.id} className="text-sm cursor-pointer">
                              {field.label}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeComments"
                      checked={config.includeComments}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, includeComments: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeComments">Include workflow comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDocuments"
                      checked={config.includeDocuments}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, includeDocuments: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeDocuments">Include document information</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Sort By</Label>
                    <Select
                      value={config.sortBy}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created Date</SelectItem>
                        <SelectItem value="applicantName">Applicant Name</SelectItem>
                        <SelectItem value="applicationId">Application ID</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="permitType">Permit Type</SelectItem>
                        <SelectItem value="waterAllocation">Water Allocation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Select
                      value={config.sortOrder}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, sortOrder: value as "asc" | "desc" }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={config.fields.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export {applications.length} Records
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
