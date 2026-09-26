import { cn } from "cn"

import type { CompanyImportReport } from "@/api/generated/model"
import { copy } from "@/features/accounts/copy"
import { formatNumber } from "@/lib/format"

function ReportTile({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className: string
}) {
  return (
    <div className={cn("flex flex-col gap-0.5 rounded-md p-3", className)}>
      <span className="font-mono text-[22px] leading-7 font-semibold">
        {formatNumber(value)}
      </span>
      <span className="text-xs">{label}</span>
    </div>
  )
}

export function ImportReport({ report }: { report: CompanyImportReport }) {
  const errors = report.errors.length
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <ReportTile
          value={report.created}
          label={copy.import.stats.created}
          className="bg-positive-surface"
        />
        <ReportTile
          value={report.updated}
          label={copy.import.stats.updated}
          className="bg-muted"
        />
        {/* The server counts error rows inside `skipped` (accounts/importer.py `parse_csv`). */}
        <ReportTile
          value={Math.max(0, report.skipped - errors)}
          label={copy.import.stats.skipped}
          className="bg-muted"
        />
        <ReportTile
          value={errors}
          label={copy.import.stats.errors}
          className="bg-negative-surface"
        />
      </div>
      {report.warnings.length > 0 ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">
            {copy.import.warnings(report.warnings.length)}
          </summary>
          <ul className="m-0 mt-2 flex max-h-40 list-none flex-col gap-1 overflow-y-auto p-0">
            {report.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  )
}
