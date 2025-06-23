"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import type { User } from "@/types"

interface TestDashboardProps {
  user: User
  onNewApplication: () => void
}

export function TestDashboard({ user, onNewApplication }: TestDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Test Dashboard for {user.username} ({user.userType})
          </span>
          <Button onClick={onNewApplication} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is a test dashboard to verify the New Application button works.</p>
        <Button onClick={() => alert("Button clicked!")} className="mt-4">
          Test Button
        </Button>
      </CardContent>
    </Card>
  )
}
