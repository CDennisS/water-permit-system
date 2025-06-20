import type React from "react"

interface User {
  userType: string
}

type Application = {}

interface DocumentViewerProps {
  user: User
  application: Application
  canUpload: boolean
  canDelete: boolean
  isOwner: boolean
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ user, application, canUpload, canDelete, isOwner }) => {
  return (
    <div>
      {/* Document Viewer Content */}
      <p>User Type: {user.userType}</p>
      <p>Can Upload: {canUpload ? "Yes" : "No"}</p>
      <p>Can Delete: {canDelete ? "Yes" : "No"}</p>
      <p>Is Owner: {isOwner ? "Yes" : "No"}</p>
    </div>
  )
}

interface ApplicationDetailsProps {
  user: User
  application: Application
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ user, application }) => {
  return (
    <div>
      <h1>Application Details</h1>
      <DocumentViewer
        user={user}
        application={application}
        canUpload={user.userType === "permitting_officer"}
        canDelete={user.userType === "permitting_officer"}
        isOwner={true}
      />
    </div>
  )
}

/* Named export for existing imports */
export { ApplicationDetails }

/* Optional: keep default export for flexibility */
export default ApplicationDetails
