// components/application-details.tsx

import type React from "react"

interface ApplicationDetailsProps {
  application: any // Replace 'any' with the actual type of your application object
  user: any // Replace 'any' with the actual type of your user object
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ application, user }) => {
  return (
    <div>
      <h2>Application Details</h2>
      {/* Display application details here */}
      <p>Application ID: {application?.id}</p>
      <p>Applicant Name: {application?.applicantName}</p>

      {/* Permit Printer Component */}
      <PermitPrinter application={application} user={user} />

      {/* Enhanced Permit Printer Component */}
      <EnhancedPermitPrinter application={application} user={user} />

      {/* Add more details as needed */}
    </div>
  )
}

// Dummy PermitPrinter component
const PermitPrinter: React.FC<{ application: any; user: any }> = ({ application, user }) => {
  return (
    <div>
      <h3>Permit Printer</h3>
      <p>
        Printing permit for application {application?.id} for user {user?.name}
      </p>
    </div>
  )
}

// Dummy EnhancedPermitPrinter component
const EnhancedPermitPrinter: React.FC<{ application: any; user: any }> = ({ application, user }) => {
  return (
    <div>
      <h3>Enhanced Permit Printer</h3>
      <p>
        Enhanced printing permit for application {application?.id} for user {user?.name}
      </p>
    </div>
  )
}

export default ApplicationDetails
