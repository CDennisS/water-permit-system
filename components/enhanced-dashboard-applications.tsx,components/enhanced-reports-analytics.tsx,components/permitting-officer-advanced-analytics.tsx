\`\`\`typescript
import { useReactTable, getCoreRowModel, type ColumnDef } from "@tanstack/react-table"

interface Application {
  id: string
  name: string
  status: string
  dateSubmitted: string
}

const EnhancedDashboardApplications = ({ applications }: { applications: Application[] | undefined }) => {
  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "dateSubmitted",
      header: "Date Submitted",
    },
  ]

  const table = useReactTable({
    data: applications ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>{header.column.columnDef.header}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{cell.getValue()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EnhancedDashboardApplications
\`\`\`

\`\`\`typescript
import { useReactTable, getCoreRowModel, type ColumnDef } from "@tanstack/react-table"

interface AnalyticsData {
  date: string
  views: number
  clicks: number
}

const EnhancedReportsAnalytics = ({ analyticsData }: { analyticsData: AnalyticsData[] | undefined }) => {
  const columns: ColumnDef<AnalyticsData>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "views",
      header: "Views",
    },
    {
      accessorKey: "clicks",
      header: "Clicks",
    },
  ]

  const table = useReactTable({
    data: analyticsData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>{header.column.columnDef.header}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{cell.getValue()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EnhancedReportsAnalytics;
\`\`\`

\`\`\`typescript
import { useReactTable, getCoreRowModel, type ColumnDef } from "@tanstack/react-table"

interface PermitData {
  permitNumber: string
  officerName: string
  dateIssued: string
  status: string
}

const PermittingOfficerAdvancedAnalytics = ({ permitData }: { permitData: PermitData[] | undefined }) => {
  const columns: ColumnDef<PermitData>[] = [
    {
      accessorKey: "permitNumber",
      header: "Permit Number",
    },
    {
      accessorKey: "officerName",
      header: "Officer Name",
    },
    {
      accessorKey: "dateIssued",
      header: "Date Issued",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
  ]

  const table = useReactTable({
    data: permitData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>{header.column.columnDef.header}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{cell.getValue()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PermittingOfficerAdvancedAnalytics;
\`\`\`
