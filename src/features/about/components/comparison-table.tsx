import { cn } from "cn"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { comparisonColumns, comparisonRows } from "../copy"

const cell = "px-3 py-2.5 text-[13px] leading-[1.4] whitespace-normal"
const bodyCell = cn(cell, "border-t border-subtle")

/** Below xl the table keeps 720 px and scrolls inside its own frame: the page's only horizontal scroll. */
export function ComparisonTable({ labelledBy }: { labelledBy: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table
        aria-labelledby={labelledBy}
        className="min-w-[720px] table-fixed xl:min-w-0"
      >
        <colgroup>
          <col className="w-[170px]" />
          <col />
          <col />
          <col />
        </colgroup>
        <TableHeader className="bg-black [&_tr]:border-0">
          <TableRow className="hover:bg-transparent">
            {comparisonColumns.map((column, index) => (
              <TableHead
                key={column}
                className={cn(
                  cell,
                  "h-auto align-top",
                  index === 3 ? "text-primary" : "text-white"
                )}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparisonRows.map((row) => (
            <TableRow
              key={row.approach}
              className="border-0 hover:bg-transparent"
            >
              <TableCell className={cn(bodyCell, "font-semibold text-black")}>
                {row.approach}
              </TableCell>
              <TableCell className={cn(bodyCell, "text-text-secondary")}>
                {row.how}
              </TableCell>
              <TableCell className={cn(bodyCell, "text-text-secondary")}>
                {row.gap}
              </TableCell>
              <TableCell className={cn(bodyCell, "text-black")}>
                {row.borrow}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
