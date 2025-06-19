"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Trash2, Download, Search, Shield, Save, X } from "lucide-react"
import type { ActivityLog, User } from "@/types"
import { db } from "@/lib/database"
import { getUserTypeLabel } from "@/lib/auth"

interface ICTLogEditorProps {
  user: User
}

interface EditingLog {
  id: string
  action: string
  details: string
  timestamp: Date
}

export function ICTLogEditor({ user }: ICTLogEditorProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<EditingLog | null>(null)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm])

  const loadLogs = async () => {
    try {
      const allLogs = await db.getLogs()
      setLogs(allLogs)
    } catch (error) {
      console.error("Failed to load logs:", error)
      setError("Failed to load logs")
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.applicationId && log.applicationId.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredLogs(filtered)
  }

  const handleEditLog = (log: ActivityLog) => {
    setEditingLog({
      id: log.id,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp,
    })
    setIsEditDialogOpen(true)
    setError("")
    setSuccess("")
  }

  const handleSaveLog = async () => {
    if (!editingLog) return

    try {
      await db.updateLog(
        editingLog.id,
        {
          action: editingLog.action,
          details: editingLog.details,
        },
        user.userType,
      )

      setSuccess("Log entry updated successfully")
      loadLogs()
      setIsEditDialogOpen(false)
      setEditingLog(null)
    } catch (error) {
      console.error("Failed to update log:", error)
      setError("Failed to update log")
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this log entry? This action cannot be undone.")) {
      return
    }

    try {
      await db.deleteLog(logId, user.userType)
      setSuccess("Log entry deleted successfully")
      loadLogs()
    } catch (error) {
      console.error("Failed to delete log:", error)
      setError("Failed to delete log")
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "User Type", "Action", "Details", "Application ID"],
      ...filteredLogs.map((log) => [
        log.timestamp.toLocaleString(),
        getUserTypeLabel(log.userType),
        log.action,
        log.details,
        log.applicationId || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `system_logs_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes("Created") || action.includes("Added")) return "bg-green-100 text-green-800"
    if (action.includes("Updated") || action.includes("Advanced")) return "bg-blue-100 text-blue-800"
    if (action.includes("Deleted") || action.includes("Rejected")) return "bg-red-100 text-red-800"
    if (action.includes("Approved")) return "bg-green-100 text-green-800"
    if (action.includes("Submitted")) return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading system logs...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-600" />
            System Log Editor
          </h2>
          <p className="text-gray-600 mt-1">ICT Administrator - Full log editing capabilities</p>
        </div>
        <Button onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export All Logs
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* ICT Warning */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>ICT Administrator Access:</strong> You can edit and delete any log entry. Your activities ARE logged
          for audit purposes. Use this power responsibly as log integrity is crucial for system auditing.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search logs by action, details, or application ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Logs ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>ICT Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    <div>{log.timestamp.toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getUserTypeLabel(log.userType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    <div className="truncate" title={log.details}>
                      {log.details}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.applicationId && (
                      <Badge variant="outline" className="text-xs">
                        {log.applicationId}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditLog(log)} title="Edit log entry">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLog(log.id)}
                        title="Delete log entry"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No log entries found matching your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Log Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Edit Log Entry
            </DialogTitle>
          </DialogHeader>

          {editingLog && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Timestamp</label>
                <Input value={editingLog.timestamp.toLocaleString()} disabled className="bg-gray-50" />
              </div>

              <div>
                <label className="text-sm font-medium">Action *</label>
                <Input
                  value={editingLog.action}
                  onChange={(e) => setEditingLog({ ...editingLog, action: e.target.value })}
                  placeholder="Enter action description"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Details *</label>
                <Textarea
                  value={editingLog.details}
                  onChange={(e) => setEditingLog({ ...editingLog, details: e.target.value })}
                  placeholder="Enter detailed description"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingLog(null)
                    setError("")
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveLog}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
