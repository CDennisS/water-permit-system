"use client"

import type { User } from "@/lib/types"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dashboard } from "@/components/dashboard"
import { Messages } from "@/components/messages"
import { ActivityLogs } from "@/components/activity-logs"
import { Analytics } from "@/components/analytics"
import { Reports } from "@/components/reports"
import { PermitPrintingTestSimple } from "@/components/permit-printing-test-simple"

const baseTabs = [{ value: "logs", label: "Activity Logs" }]

const getUserTabs = () => {
  if (!user) return baseTabs

  const tabs = [
    { value: "dashboard", label: "Dashboard & Applications" },
    { value: "messages", label: "Messages" },
  ]

  // Add analytics tab for permitting officers
  if (user.userType === "permitting_officer") {
    tabs.push({ value: "analytics", label: "Analytics" })
  }

  // Add print testing tab for authorized users
  if (["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)) {
    tabs.push({ value: "print-testing", label: "🧪 Print Testing" })
  }

  // Add reports tab for specific roles
  if (["permitting_officer", "permit_supervisor", "ict"].includes(user.userType)) {
    tabs.push({ value: "reports", label: "Reports" })
  }

  tabs.push({ value: "logs", label: "Activity Logs" })

  return tabs
}

export default function Home() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [tabs, setTabs] = useState(baseTabs)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user as User)
    }
  }, [session])

  useEffect(() => {
    setTabs(getUserTabs())
  }, [user])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    redirect("/api/auth/signin")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Welcome {session?.user?.name}</h1>

      <Tabs defaultValue={tabs[0].value} className="w-[400px]">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="dashboard">
          <Dashboard user={user} />
        </TabsContent>
        <TabsContent value="messages">
          <Messages user={user} />
        </TabsContent>
        {user?.userType === "permitting_officer" && (
          <TabsContent value="analytics">
            <Analytics user={user} />
          </TabsContent>
        )}
        {["permitting_officer", "permit_supervisor", "ict"].includes(user?.userType || "") && (
          <TabsContent value="reports">
            <Reports user={user} />
          </TabsContent>
        )}
        <TabsContent value="logs">
          <ActivityLogs user={user} />
        </TabsContent>
        <TabsContent value="print-testing">
          <PermitPrintingTestSimple user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
