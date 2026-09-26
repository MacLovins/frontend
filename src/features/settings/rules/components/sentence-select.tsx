import type { ReactNode } from "react"
import { cn } from "cn"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SentenceItem<T extends string> = {
  value: T
  label: string
  /** Full text when the label is cut. */ hint?: string
}

/** A 40 px select inside the rule sentence ("When [company data ▾] [employees ▾] …"). */
export function SentenceSelect<T extends string>({
  label,
  value,
  items,
  onChange,
  disabled,
  invalid,
  strong,
  placeholder,
  renderValue,
}: {
  /** Accessible name; the sentence around it is the visible label. */
  label: string
  value: T | null
  items: SentenceItem<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  invalid?: boolean
  /** The action select: black border, 600. */
  strong?: boolean
  placeholder?: string
  renderValue?: (value: T) => ReactNode
}) {
  return (
    <Select<T>
      items={items}
      value={value}
      onValueChange={(next) => next !== null && onChange(next)}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 max-w-[360px] rounded-sm px-3 text-base",
          strong && "border-black font-semibold"
        )}
      >
        <SelectValue placeholder={placeholder}>{renderValue}</SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        className="w-auto min-w-(--anchor-width)"
      >
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} title={item.hint}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
