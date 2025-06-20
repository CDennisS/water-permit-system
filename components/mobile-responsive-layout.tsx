"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, Bell, MessageSquare, User, LogOut, FileText, BarChart3, Activity } from "lucide-react"
import type { User as UserType } from "@/types"
import { getUserTypeLabel } from "@/lib/auth"

interface MobileResponsiveLayoutProps {
  user: UserType
  children: React.ReactNode
  onLogout: () => void
  unreadMessageCount?: number
}

export function MobileResponsiveLayout({
  user,
  children,
  onLogout,
  unreadMessageCount = 0,
}: MobileResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const MobileHeader = () => (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                      <p className="text-xs text-gray-600">{getUserTypeLabel(user.userType)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                    <FileText className="h-4 w-4 mr-3" />
                    Applications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                    <MessageSquare className="h-4 w-4 mr-3" />
                    Messages
                    {unreadMessageCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {unreadMessageCount}
                      </Badge>
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Reports
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                    <Activity className="h-4 w-4 mr-3" />
                    Activity Logs
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onLogout()
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-lg font-bold text-blue-900">UMSCC</h1>
            <p className="text-xs text-gray-600">Permit Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {unreadMessageCount > 0 && (
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </Badge>
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  const DesktopHeader = () => (
    <div className="hidden md:block bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="font-bold text-lg">UM</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">Upper Manyame Sub Catchment Council</h1>
            <p className="text-blue-100 text-sm">Water Permit Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {unreadMessageCount > 0 && (
            <Button variant="ghost" className="text-white hover:bg-white/20 relative">
              <MessageSquare className="h-5 w-5 mr-2" />
              Messages
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </Badge>
            </Button>
          )}

          <div className="text-right">
            <p className="font-medium">{user.username}</p>
            <p className="text-blue-100 text-sm">{getUserTypeLabel(user.userType)}</p>
          </div>

          <Button variant="ghost" onClick={onLogout} className="text-white hover:bg-white/20">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? <MobileHeader /> : <DesktopHeader />}

      <main className={`${isMobile ? "p-4" : "p-6"}`}>
        <div className={`mx-auto ${isMobile ? "max-w-full" : "max-w-7xl"}`}>{children}</div>
      </main>
    </div>
  )
}
