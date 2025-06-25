import type * as React from "react"

/**
 * Prevents Recharts “reading 'props' of null” runtime error.
 *
 * If `data` is empty, we show a lightweight placeholder.
 * Otherwise we render **exactly one** valid child for Recharts.
 */
export function ChartOrPlaceholder({
  data,
  children,
  height = 300,
}: {
  data: any[]
  children: React.ReactElement
  height?: number | string
}) {
  const isEmpty = !data || data.length === 0

  return isEmpty ? (
    <div
      className="flex w-full items-center justify-center text-sm text-muted-foreground"
      style={{ minHeight: height }}
    >
      {"No data to display"}
    </div>
  ) : (
    children
  )
}
