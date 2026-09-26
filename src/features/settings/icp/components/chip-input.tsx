import { useState, type KeyboardEvent } from "react"
import { XIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import { ValueChip } from "@/features/settings/icp/components/chip"

/**
 * Free-text chips in an input-like box. Enter or comma adds (pasted lists split on commas and whitespace),
 * Backspace on an empty draft removes the last chip, duplicates are ignored case-insensitively.
 */
export function ChipInput({
  values,
  onChange,
  label,
  placeholder,
  normalize = (raw) => raw,
  invalid,
  className,
}: {
  values: string[]
  onChange: (values: string[]) => void
  /** Accessible name of the text box. */
  label: string
  placeholder: string
  /** Cleans one entry; an empty result is dropped. */
  normalize?: (raw: string) => string
  invalid?: boolean
  className?: string
}) {
  const [draft, setDraft] = useState("")

  const commit = () => {
    const next = [...values]
    for (const raw of draft.split(/[,\s]+/)) {
      const item = normalize(raw.trim())
      if (
        item &&
        !next.some((value) => value.toLowerCase() === item.toLowerCase())
      )
        next.push(item)
    }
    if (next.length !== values.length) onChange(next)
    setDraft("")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      commit()
    } else if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1 rounded-sm border border-input bg-white px-2.5 py-1 has-focus-visible:border-black aria-invalid:border-destructive",
        className
      )}
    >
      {values.map((value) => (
        <ValueChip key={value} className="pr-1">
          {value}
          <button
            type="button"
            aria-label={`Remove ${value}`}
            onClick={() => onChange(values.filter((item) => item !== value))}
            className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-subtle hover:text-black focus-visible:outline-2 focus-visible:outline-black"
          >
            <XIcon aria-hidden className="size-3" />
          </button>
        </ValueChip>
      ))}
      <input
        aria-label={label}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        className="h-[30px] min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
