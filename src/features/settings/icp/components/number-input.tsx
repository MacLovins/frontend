import { useState, type ComponentProps } from "react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import { formatNumber } from "@/lib/format"

function parseCount(text: string) {
  const digits = text.replace(/[,\s]/g, "")
  return digits ? Number(digits) : null
}

/** Whole-number input: accepts "1,000" or "1000", shows thousands separators when not editing; empty = null. */
export function NumberInput({
  value,
  onChange,
  onBlur,
  maxLength = 19,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null
  onChange: (value: number | null) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={maxLength}
      value={draft ?? (value === null ? "" : formatNumber(value))}
      onChange={(event) => {
        const text = event.target.value.replace(/[^\d,\s]/g, "")
        setDraft(text)
        onChange(parseCount(text))
      }}
      onBlur={(event) => {
        setDraft(null)
        onBlur?.(event)
      }}
      className={cn("rounded-sm px-2.5 font-mono", className)}
    />
  )
}
