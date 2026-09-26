import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { copy } from "@/features/accounts/copy"
import {
  customFields,
  fieldDescriptions,
  missingRequired,
  type ColumnMap,
  type ImportField,
} from "@/features/accounts/lib/csv-mapping"

const requiredLabels = { name: "Name", domain: "Domain" } as const

function MissingColumns({ columns }: { columns: ColumnMap }) {
  return missingRequired(columns).map((field) => (
    <p
      key={field}
      role="alert"
      className="m-0 text-[13px] text-negative-strong"
    >
      {copy.import.missingColumn(requiredLabels[field])}
    </p>
  ))
}

/** Read-only "Header → Field" rows for the built-in formats. */
export function MatchedColumns({ columns }: { columns: ColumnMap }) {
  const rows = Object.entries(columns) as [ImportField, string][]
  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      <div className="font-semibold">{copy.import.matched}</div>
      {rows.length > 0 ? (
        <div className="grid grid-cols-[180px_24px_minmax(0,1fr)] gap-y-1 text-text-secondary">
          {rows.map(([field, header]) => (
            <div key={field} className="contents">
              <span className="truncate" title={header}>
                {header}
              </span>
              <span aria-hidden>→</span>
              <span>{fieldDescriptions[field]}</span>
            </div>
          ))}
        </div>
      ) : null}
      <MissingColumns columns={columns} />
    </div>
  )
}

/** One Select of the file's headers per field; sent as `column_map`. */
export function CustomColumns({
  headers,
  columns,
  onChange,
  disabled,
}: {
  headers: string[]
  columns: ColumnMap
  onChange: (columns: ColumnMap) => void
  disabled: boolean
}) {
  // Blank and repeated headers cannot be told apart by name (the server resolves by name too).
  const items = [
    { value: null, label: copy.import.notImported },
    ...[...new Set(headers.filter(Boolean))].map((header) => ({
      value: header,
      label: header,
    })),
  ]

  const pick = (field: ImportField, header: string | null) => {
    const next = { ...columns }
    if (header) next[field] = header
    else delete next[field]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      <div className="font-semibold">{copy.import.custom}</div>
      <div className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
        {customFields.map(({ field, label }) => (
          <div key={field} className="contents">
            <label htmlFor={`column-${field}`} className="text-text-secondary">
              {label}
            </label>
            <Select
              items={items}
              value={columns[field] ?? null}
              onValueChange={(header) => pick(field, header)}
              disabled={disabled}
            >
              <SelectTrigger
                id={`column-${field}`}
                size="sm"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {items.map((item) => (
                  <SelectItem key={item.value ?? ""} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <MissingColumns columns={columns} />
    </div>
  )
}
