"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { PermitApplication, User } from "@/types"
import { cn } from "@/lib/utils"
import { db } from "@/lib/database"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  user: User
  /** Invoked when “View” is clicked on a row */
  onView: (app: PermitApplication) => void
}

type AppStatus = "unsubmitted" | "submitted" | "under_review" | "approved" | "rejected"

/* -------------------------------------------------------------------------- */
/*                           Helper / presentation logic                      */
/* -------------------------------------------------------------------------- */

const statusColor: Record<AppStatus, string> = {
  unsubmitted: "bg-orange-600",
  submitted: "bg-blue-600",
  under_review: "bg-yellow-500",
  approved: "bg-green-600",
  rejected: "bg-red-600",
}

/* -------------------------------------------------------------------------- */
/*                          PermittingOfficerApplicationsTable                */
/* -------------------------------------------------------------------------- */

export default function PermittingOfficerApplicationsTable({ user, onView }: Props) {
  /* ------------------------------ State ----------------------------------- */
  const [apps, setApps] = useState<PermitApplication[]>([])
  const [statusFilter, setStatusFilter] = useState<AppStatus | "all">("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ----------------------------- Effects ---------------------------------- */
  useEffect(() => {
    /* fetch initial data */
    void (async () => {
      const data = await db.getApplications()
      setApps(data)
    })()
  }, [])

  /* ---------------------------- Derived ----------------------------------- */
  const filteredApps = useMemo(() => {
    return statusFilter === "all" ? apps : apps.filter((a) => a.status === statusFilter)
  }, [apps, statusFilter])

  const unsubmittedIds = useMemo(() => apps.filter((a) => a.status === "unsubmitted").map((a) => a.id), [apps])

  const allUnsubmittedSelected = unsubmittedIds.length > 0 && unsubmittedIds.every((id) => selectedIds.has(id))

  /* --------------------------- Handlers ----------------------------------- */
  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  function toggleSelectAllUnsubmitted(checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return new Set([...prev, ...unsubmittedIds])
      }
      const next = new Set(prev)
      unsubmittedIds.forEach((id) => next.delete(id))
      return next
    })
  }

  async function handleSubmitAll() {
    if (!allUnsubmittedSelected) return
    setIsSubmitting(true)
    try {
      await db.submitApplications(Array.from(unsubmittedIds), user.id) // 🔒 assumes this helper exists
      /* mark them as submitted locally */
      setApps((prev) =>
        prev.map((a) => (a.status === "unsubmitted" ? { ...a, status: "submitted", currentStage: 2 } : a)),
      )
      setSelectedIds(new Set()) // clear selection
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ------------------------------ UI -------------------------------------- */
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">Active Applications</CardTitle>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter status:</span>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unsubmitted">Unsubmitted</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {/* Bulk-submit bar (only visible when ALL unsubmitted are checked) */}
      {allUnsubmittedSelected && (
        <div className="flex items-center justify-between bg-orange-50 px-6 py-3 border-b">
          <p className="text-sm font-medium text-orange-700">
            {unsubmittedIds.length} unsubmitted application
            {unsubmittedIds.length > 1 && "s"} selected
          </p>
          <Button
            size="sm"
            onClick={handleSubmitAll}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit All Unsubmitted
          </Button>
        </div>
      )}

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[52px]">
                {/* Select-all checkbox (unsubmitted only) */}
                <Checkbox
                  checked={unsubmittedIds.length === 0 ? false : allUnsubmittedSelected}
                  indeterminate={!allUnsubmittedSelected && selectedIds.size > 0}
                  onCheckedChange={(c) => toggleSelectAllUnsubmitted(Boolean(c))}
                  aria-label="Select all unsubmitted applications"
                />
              </TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredApps.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center">
                  No applications to display.
                </TableCell>
              </TableRow>
            )}

            {filteredApps.map((app) => {
              const isUnsubmitted = app.status === "unsubmitted"
              const isChecked = selectedIds.has(app.id)

              return (
                <TableRow key={app.id}>
                  <TableCell>
                    {isUnsubmitted ? (
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(c) => toggleRow(app.id, Boolean(c))}
                        aria-label="Select application"
                      />
                    ) : null}
                  </TableCell>

                  <TableCell className="font-medium">
                    {app.reference}
                    {isUnsubmitted && (
                      <Badge className="ml-2 bg-orange-600" aria-label="Not submitted">
                        Not&nbsp;Submitted
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">{app.applicantName}</TableCell>

                  <TableCell>
                    <Badge className={cn(statusColor[app.status as AppStatus], "capitalize")}>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => onView(app)}>
                      View
                    </Button>

                    {/* Edit button only for unsubmitted apps */}
                    {isUnsubmitted && (
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
