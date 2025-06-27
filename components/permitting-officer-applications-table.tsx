"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface Application {
  id: string
  reference: string
  applicantName: string
  status: "APPROVED" | "REJECTED" | "UNDER_REVIEW"
  stage: number
  submittedAt: string /* ISO date string */
}

interface PermittingOfficerApplicationsTableProps {
  applications?: Application[]
  /** Called when the user presses “View” on a row */
  onView?: (application: Application) => void
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

const statusColor: Record<Application["status"], string> = {
  APPROVED: "bg-green-600",
  REJECTED: "bg-red-600",
  UNDER_REVIEW: "bg-yellow-500",
}

function formatDate(dateString: string) {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

/* ── (Optional) Demo Data ──────────────────────────────────────────────── */
/* Remove or replace with real data in production.                         */

const demoData: Application[] = [
  {
    id: "1",
    reference: "MC2024-0001",
    applicantName: "Sarah Johnson",
    status: "APPROVED",
    stage: 4,
    submittedAt: "2024-04-02",
  },
  {
    id: "2",
    reference: "MC2024-0007",
    applicantName: "Daniel Khumalo",
    status: "REJECTED",
    stage: 3,
    submittedAt: "2024-03-18",
  },
  {
    id: "3",
    reference: "MC2024-0009",
    applicantName: "Nomsa Dlamini",
    status: "UNDER_REVIEW",
    stage: 2,
    submittedAt: "2024-05-05",
  },
]

/* ── Component ─────────────────────────────────────────────────────────── */

export default function PermittingOfficerApplicationsTable({
  applications = demoData,
  onView,
}: PermittingOfficerApplicationsTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-background shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[135px]">Reference</TableHead>
            <TableHead>Applicant</TableHead>
            <TableHead className="w-[115px]">Status</TableHead>
            <TableHead className="w-[90px] text-center">Stage</TableHead>
            <TableHead className="w-[135px]">Submitted</TableHead>
            <TableHead className="w-[110px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length > 0 ? (
            applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.reference}</TableCell>
                <TableCell className="whitespace-nowrap">{app.applicantName}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColor[app.status], "pointer-events-none w-full justify-center")}>
                    {app.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{app.stage}</TableCell>
                <TableCell>{formatDate(app.submittedAt)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="secondary" onClick={() => onView?.(app)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                No applications to display.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
