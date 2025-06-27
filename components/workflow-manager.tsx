import type React from "react"

interface WorkflowManagerProps {
  application: any // Replace 'any' with the actual type of your application object
  user: any // Replace 'any' with the actual type of your user object
  canPrint: boolean
  PermitPrinter: React.ComponentType<any> // Replace 'any' with the actual type of your PermitPrinter props
  EnhancedPermitPrinter?: React.ComponentType<any> // Optional EnhancedPermitPrinter component
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  application,
  user,
  canPrint,
  PermitPrinter,
  EnhancedPermitPrinter,
}) => {
  return (
    <div>
      {/* Other workflow management components and logic here */}
      {PermitPrinter && <PermitPrinter application={application} user={user} disabled={!canPrint} />}

      {EnhancedPermitPrinter && <EnhancedPermitPrinter application={application} user={user} disabled={!canPrint} />}
    </div>
  )
}

export { WorkflowManager }
export default WorkflowManager
