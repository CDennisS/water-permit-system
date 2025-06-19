"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  Server,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Archive,
  FileText,
  Users,
  Activity,
} from "lucide-react"
import type { User } from "@/types"

interface ICTSystemAdminProps {
  user: User
}

export function ICTSystemAdmin({ user }: ICTSystemAdminProps) {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const handleBackup = async () => {
    setIsBackingUp(true)
    // Simulate backup process
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsBackingUp(false)
  }

  const handleRestore = async () => {
    setIsRestoring(true)
    // Simulate restore process
    await new Promise((resolve) => setTimeout(resolve, 5000))
    setIsRestoring(false)
  }

  const toggleMaintenanceMode = () => {
    setMaintenanceMode(!maintenanceMode)
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold">Online</span>
            </div>
            <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold">Excellent</span>
            </div>
            <p className="text-xs text-muted-foreground">Uptime: 99.9%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold">Secure</span>
            </div>
            <p className="text-xs text-muted-foreground">All systems protected</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode Alert */}
      {maintenanceMode && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System is currently in maintenance mode. Users may experience limited functionality.
          </AlertDescription>
        </Alert>
      )}

      {/* System Administration Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage Used</span>
                <span>2.4 GB / 10 GB</span>
              </div>
              <Progress value={24} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleBackup} disabled={isBackingUp} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {isBackingUp ? "Backing up..." : "Backup"}
              </Button>
              <Button onClick={handleRestore} disabled={isRestoring} variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {isRestoring ? "Restoring..." : "Restore"}
              </Button>
            </div>

            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">Database Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <span>15,847</span>
                </div>
                <div className="flex justify-between">
                  <span>Applications:</span>
                  <span>1,234</span>
                </div>
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span>45</span>
                </div>
                <div className="flex justify-between">
                  <span>Activity Logs:</span>
                  <span>14,568</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              System Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={toggleMaintenanceMode}
                variant={maintenanceMode ? "destructive" : "outline"}
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {maintenanceMode ? "Exit Maintenance Mode" : "Enter Maintenance Mode"}
              </Button>

              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear System Cache
              </Button>

              <Button variant="outline" className="w-full">
                <Archive className="h-4 w-4 mr-2" />
                Archive Old Records
              </Button>

              <Button variant="outline" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Temporary Files
              </Button>
            </div>

            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">System Resources</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>62%</span>
                  </div>
                  <Progress value={62} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Logs and Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            System Monitoring & Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">System Healthy</div>
              <div className="text-sm text-gray-600">All services running</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Server className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium">High Performance</div>
              <div className="text-sm text-gray-600">Response time: 120ms</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium">Security Active</div>
              <div className="text-sm text-gray-600">No threats detected</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Recent System Events</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Database backup completed successfully</span>
                </div>
                <span className="text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span>System cache cleared</span>
                </div>
                <span className="text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span>New user account created</span>
                </div>
                <span className="text-gray-500">6 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span>Application submitted for review</span>
                </div>
                <span className="text-gray-500">8 hours ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
