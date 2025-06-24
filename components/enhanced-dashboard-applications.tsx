"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { deleteApplication } from "@/lib/actions/application.actions"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Printer, FileText } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PermitPreview } from "./permit-preview"
import { A4CommentsPrinter } from "./a4-comments-printer"

interface PermitApplication {
  id: string
  applicationId: string
  submittedDate: Date
  applicantName: string
  address: string
  status: string
}

interface EnhancedDashboardApplicationsProps {
  data: PermitApplication[]
}

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
}

export function EnhancedDashboardApplications({ data = [] }: EnhancedDashboardApplicationsProps) {
  const router = useRouter()
  const [selectedApplication, setSelectedApplication] = useState<PermitApplication | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showPermitPreview, setShowPermitPreview] = useState(false)
  const [showPermitPrint, setShowPermitPrint] = useState(false)
  const [showCommentsPrint, setShowCommentsPrint] = useState(false)

  const columns: ColumnDef<PermitApplication>[] = [
    {
      accessorKey: "applicationId",
      header: "Application ID",
    },
    {
      accessorKey: "submittedDate",
      header: "Submitted Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("submittedDate"))
        return date.toLocaleDateString()
      },
    },
    {
      accessorKey: "applicantName",
      header: "Applicant Name",
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status")
        return <Badge className={cn(statusColors[status.toLowerCase()])}>{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const application = row.original

        const handleEdit = (applicationId: string) => {
          router.push(`/dashboard/applications/${applicationId}/edit`)
        }

        const handleDelete = (applicationId: string) => {
          setSelectedApplication({ id: applicationId } as PermitApplication)
          setShowDeleteAlert(true)
        }

        return (
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEdit(application.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(application.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Download</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Print Options - Only for approved applications */}
            {application.status === "approved" && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewPermit(application)}
                    className="h-8 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintPermit(application)}
                    className="h-8 px-2"
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintComments(application)}
                    className="h-8 px-2"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Comments
                  </Button>
                </div>
              </>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const confirmDelete = async () => {
    if (selectedApplication) {
      try {
        await deleteApplication(selectedApplication.id)
        toast.success("Application deleted successfully")
        router.refresh()
      } catch (error) {
        toast.error("Failed to delete application")
      } finally {
        setShowDeleteAlert(false)
        setSelectedApplication(null)
      }
    }
  }

  const handlePreviewPermit = (application: PermitApplication) => {
    setSelectedApplication(application)
    setShowPermitPreview(true)
  }

  const handlePrintPermit = (application: PermitApplication) => {
    setSelectedApplication(application)
    setShowPermitPrint(true)
  }

  const handlePrintComments = (application: PermitApplication) => {
    setSelectedApplication(application)
    setShowCommentsPrint(true)
  }

  return (
    <>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the application and remove your data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedApplication(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} row(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
      {/* Permit Preview Dialog */}
      {showPermitPreview && selectedApplication && (
        <Dialog open={showPermitPreview} onOpenChange={setShowPermitPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Permit Preview - {selectedApplication.applicationId}</DialogTitle>
            </DialogHeader>
            <PermitPreview application={selectedApplication} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPermitPreview(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPermitPreview(false)
                  handlePrintPermit(selectedApplication)
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Permit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Permit Print Dialog */}
      {showPermitPrint && selectedApplication && (
        <Dialog open={showPermitPrint} onOpenChange={setShowPermitPrint}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Print Permit - {selectedApplication.applicationId}</DialogTitle>
            </DialogHeader>
            <EnhancedPermitPrinter application={selectedApplication} />
          </DialogContent>
        </Dialog>
      )}

      {/* Comments Print Dialog */}
      {showCommentsPrint && selectedApplication && (
        <Dialog open={showCommentsPrint} onOpenChange={setShowCommentsPrint}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Print Comments - {selectedApplication.applicationId}</DialogTitle>
            </DialogHeader>
            <A4CommentsPrinter application={selectedApplication} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

const EnhancedPermitPrinter = ({ application }: { application: PermitApplication }) => {
  return (
    <div>
      <h1>Permit Printer</h1>
      <p>Application ID: {application.applicationId}</p>
      <p>Applicant Name: {application.applicantName}</p>
      {/* Add more details here */}
    </div>
  )
}
