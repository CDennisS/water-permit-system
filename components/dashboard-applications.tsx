"use client"

import { forwardRef, useImperativeHandle, useState, useEffect, type ForwardedRef } from "react"
import { db } from "@/lib/database"
import type { User, PermitApplication } from "@/types"

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

  const loadApplications = async () => {
    const apps = await db.getApplications()
    setApplications(apps)
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useImperativeHandle(ref, () => ({
    refreshApplications: loadApplications,
  }))

  return null
}

export const DashboardApplications = forwardRef(DashboardApplicationsInner)
