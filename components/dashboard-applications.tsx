import type React from "react"

interface User {
  userType: string
}

interface DashboardApplicationsProps {
  user: User
}

const DashboardApplications: React.FC<DashboardApplicationsProps> = ({ user }) => {
  return (
    <div>
      <h1>Welcome to the Dashboard</h1>

      {user.userType === "permitting_officer" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Application Submission Process</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              • <strong>Draft:</strong> Create and edit applications (status: "unsubmitted")
            </p>
            <p>
              • <strong>Submit:</strong> Send applications for review (moves to Chairperson)
            </p>
            <p>
              • <strong>Review:</strong> Applications go through 4-stage approval process
            </p>
            <p>
              • <strong>Final:</strong> Approved applications return for permit printing
            </p>
          </div>
        </div>
      )}

      {/* Rest of the dashboard applications content */}
      <p>This is where the application list or other relevant information would go.</p>
    </div>
  )
}

export default DashboardApplications
