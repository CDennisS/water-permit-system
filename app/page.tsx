"use client"
import { useSession } from "next-auth/react"
import { LoginForm } from "@/components/login-form"
import { ChairpersonDashboard } from "@/components/chairperson-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

// Mock data for demonstration
const mockApplications = [
  {
    id: "APP-001",
    applicantName: "John Doe",
    permitType: "Water Extraction",
    dateSubmitted: "2024-01-15",
    status: "Pending Review",
    documents: [
      { name: "Application Form.pdf", url: "/placeholder.svg?height=400&width=600&text=Application+Form" },
      { name: "Site Plan.jpg", url: "/placeholder.svg?height=400&width=600&text=Site+Plan" },
    ],
    officerComments: "Initial review completed. Awaiting environmental impact assessment.",
    location: "Harare North",
    contactNumber: "+263 77 123 4567",
  },
  {
    id: "APP-002",
    applicantName: "Jane Smith",
    permitType: "Borehole Drilling",
    dateSubmitted: "2024-01-18",
    status: "Pending Review",
    documents: [
      { name: "Drilling Permit.pdf", url: "/placeholder.svg?height=400&width=600&text=Drilling+Permit" },
      { name: "Geological Survey.pdf", url: "/placeholder.svg?height=400&width=600&text=Geological+Survey" },
    ],
    officerComments: "Documentation complete. Ready for chairperson review.",
    location: "Chitungwiza",
    contactNumber: "+263 77 987 6543",
  },
]

export default function HomePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    )
  }

  if (session && (session.user as any).role === "chairperson") {
    return <ChairpersonDashboard />
  }

  // Add other role-based dashboards here
  // if (session && (session.user as any).role === 'manager') {
  //   return <ManagerDashboard />;
  // }

  return <LoginForm />
}
