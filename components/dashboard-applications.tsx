import type React from "react"

type DashboardApplicationsProps = {}

const DashboardApplications: React.FC<DashboardApplicationsProps> = () => {
  return (
    <div>
      {/* Content for the DashboardApplications component */}
      <h1>Dashboard Applications</h1>
      <p>This is where the applications related to the dashboard will be displayed.</p>
    </div>
  )
}

export default DashboardApplications
export { DashboardApplications } // ← add this line
