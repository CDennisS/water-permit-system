"use client"

import { useEffect, useState } from "react"
import { EnhancedPermitPrinter } from "@/components/enhanced-permit-printer"
import { Button } from "@/components/ui/button"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

interface Props {
  user: User
}

export function PermitPrintingTestSimple({ user }: Props) {
  const [apps, setApps] = useState<PermitApplication[]>([])
  const [selected, setSelected] = useState<PermitApplication | null>(null)
  const [loading, setLoading] = useState(false)

  // Load (approved) applications once
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const all = await db.getApplications()
        // Pick approved apps; if none, just show everything
        const approved = all.filter((a) => a.status === "approved")
        setApps(approved.length ? approved : all)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground">Loading applications…</p>

  if (!apps.length)
    return <p className="text-sm text-muted-foreground">No applications found – create or approve one first.</p>

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Permit Printing / Preview Test</h3>

      {/* Picker */}
      <div className="flex flex-wrap gap-2">
        {apps.map((app) => (
          <Button
            key={app.applicationId}
            size="sm"
            variant={selected?.applicationId === app.applicationId ? "default" : "secondary"}
            onClick={() => setSelected(app)}
          >
            {app.applicationId}
          </Button>
        ))}
      </div>

      {/* Preview / printer */}
      {selected ? (
        <EnhancedPermitPrinter user={user} application={selected} onClose={() => setSelected(null)} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Select an application above, then use the Preview / Print buttons that appear.
        </p>
      )}
    </div>
  )
}
