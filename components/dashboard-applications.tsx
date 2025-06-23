"use client"

import { forwardRef, useImperativeHandle, useState, useEffect, type ForwardedRef } from "react"
import { db } from "@/lib/database"
import type { User, PermitApplication } from "@/types"
import { Button } from "@/components/ui/button"
import { Download, Plus, RefreshCw } from "lucide-react"

interface DashboardApplicationsProps {
  user: User
  onNewApplication: () => void
  onEditApplication: (a: PermitApplication) => void
  onViewApplication: (a: PermitApplication) => void
}

export interface DashboardApplicationsHandle {
  refreshApplications: () => void
}

function DashboardApplicationsInner(
  { user, onNewApplication, onEditApplication, onViewApplication }: DashboardApplicationsProps,
  ref: ForwardedRef<DashboardApplicationsHandle>,
) {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  const loadApplications = async () => {
    const apps = await db.getApplications()
    setApplications(apps)
    setFilteredApplications(apps) // Initially, filtered applications are all applications
  }

  const exportFilteredData = () => {
    // TODO: Implement export functionality
    alert("Exporting data is not yet implemented.")
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useImperativeHandle(ref, () => ({
    refreshApplications: loadApplications,
  }))

  return (
    <div>
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applications Dashboard</h2>
          <p className="text-gray-600">
            Showing {filteredApplications.length} of {applications.length} applications
            {activeFiltersCount > 0 && ` (${activeFiltersCount} filters active)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportFilteredData}
            className="flex items-center gap-2"
            disabled={filteredApplications.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={loadApplications} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={onNewApplication}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>
    </div>
  )
}

export const DashboardApplications = forwardRef(DashboardApplicationsInner)
