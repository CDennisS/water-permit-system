"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, LogOut } from "lucide-react"
import type { User as UserType } from "@/types"

interface DashboardHeaderProps {
  user: UserType
  onLogout: () => void
  onMessagesClick: () => void
  unreadCount?: number
  isLoadingMessages?: boolean
}

export function DashboardHeader({ user, onLogout, onMessagesClick, unreadCount = 0 }: DashboardHeaderProps) {
  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "permitting_officer":
        return "Permitting Officer"
      case "permit_supervisor":
        return "Permit Supervisor"
      case "catchment_manager":
        return "Catchment Manager"
      case "catchment_chairperson":
        return "Catchment Chairperson"
      case "chairperson":
        return "Chairperson"
      case "ict":
        return "ICT"
      default:
        return "User"
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <img src="/placeholder-logo.svg" alt="UMSCC Logo" className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">UMSCC Permit Management</h1>
              <p className="text-sm text-gray-500">Upper Manyame Sub Catchment Council</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Messages Button */}
            <Button variant="ghost" size="sm" onClick={onMessagesClick} className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <LogOut className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">{getUserTypeLabel(user.userType)}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
