import type React from "react"
import type { Application } from "@/types/application"
import { Label } from "@/components/ui/label"

interface StrictViewOnlyApplicationDetailsProps {
  application: Application
}

const StrictViewOnlyApplicationDetails: React.FC<StrictViewOnlyApplicationDetailsProps> = ({ application }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-600">Applicant Name</Label>
          <p className="text-sm">{application.applicantName || "Not specified"}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Email</Label>
          <p className="text-sm">{application.email || "Not specified"}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
          <p className="text-sm">{application.phoneNumber || "Not specified"}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600">Address</Label>
          <p className="text-sm">{application.address || "Not specified"}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
            <p className="text-sm">{application.dateOfBirth || "Not specified"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Occupation</Label>
            <p className="text-sm">{application.occupation || "Not specified"}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">GPS Coordinates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Latitude</Label>
            <p className="text-sm">{application.gpsLatitude?.toFixed(6) || "Not specified"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Longitude</Label>
            <p className="text-sm">{application.gpsLongitude?.toFixed(6) || "Not specified"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StrictViewOnlyApplicationDetails
