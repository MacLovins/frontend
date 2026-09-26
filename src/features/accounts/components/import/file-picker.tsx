import { useRef, useState, type DragEvent } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { copy } from "@/features/accounts/copy"
import type { CsvFile } from "@/features/accounts/lib/csv"

export function FilePicker({
  csv,
  error,
  disabled,
  onFile,
}: {
  csv: CsvFile | null
  error: string | null
  disabled: boolean
  onFile: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const browse = () => input.current?.click()

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file && !disabled) onFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Reset so choosing the same file again still fires a change.
          event.target.value = ""
          if (file) onFile(file)
        }}
      />
      {csv ? (
        <div className="flex min-w-0 items-center gap-3 rounded-md bg-muted p-3.5 text-sm">
          <span className="truncate font-semibold">{csv.file.name}</span>
          <span className="shrink-0 text-muted-foreground">
            {copy.import.fileMeta(
              csv.rows.length,
              Math.max(1, Math.round(csv.file.size / 1024))
            )}
          </span>
          <Button
            variant="link"
            className="ml-auto text-[13px]"
            disabled={disabled}
            onClick={browse}
          >
            {copy.import.replaceFile}
          </Button>
        </div>
      ) : (
        <>
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            className={cn(
              "flex h-24 items-center justify-center gap-1 rounded-md border border-dashed border-faint bg-white text-sm transition-colors",
              dragging && "border-primary bg-primary-surface-subtle"
            )}
          >
            {copy.import.dropHere}
            <Button variant="link" className="text-sm" onClick={browse}>
              {copy.import.chooseFile}
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {copy.import.fileHelp}
          </span>
        </>
      )}
      {error ? (
        <p role="alert" className="m-0 text-[13px] text-negative-strong">
          {error}
        </p>
      ) : null}
    </div>
  )
}
