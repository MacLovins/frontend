import type { ReactNode } from "react"
import { CaretDownIcon, XIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ValueChip } from "@/features/settings/icp/components/chip"

/**
 * Select-like box with removable value chips; the free space opens a Popover with a checkable list
 * (`children`). Chips and trigger are siblings so no button is nested in another.
 */
export function MultiPicker({
  values,
  labelOf,
  placeholder,
  label,
  invalid,
  className,
  onRemove,
  children,
}: {
  values: string[]
  labelOf: (value: string) => string
  placeholder: string
  /** Accessible name of the trigger. */
  label: string
  invalid?: boolean
  className?: string
  onRemove: (value: string) => void
  children: ReactNode
}) {
  return (
    <Popover>
      <div
        aria-invalid={invalid || undefined}
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1 rounded-sm border border-input bg-white py-1 pr-1 pl-2.5 has-focus-visible:border-black has-data-popup-open:border-black aria-invalid:border-destructive",
          className
        )}
      >
        {values.map((value) => (
          <ValueChip key={value} className="pr-1">
            {labelOf(value)}
            <button
              type="button"
              aria-label={`Remove ${labelOf(value)}`}
              onClick={() => onRemove(value)}
              className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-subtle hover:text-black focus-visible:outline-2 focus-visible:outline-black"
            >
              <XIcon aria-hidden className="size-3" />
            </button>
          </ValueChip>
        ))}
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label={label}
              className="flex h-[30px] min-w-16 flex-1 items-center justify-between gap-2 text-left text-sm text-muted-foreground outline-none"
            />
          }
        >
          {values.length ? null : placeholder}
          <CaretDownIcon aria-hidden className="ml-auto size-3.5" />
        </PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        {children}
      </PopoverContent>
    </Popover>
  )
}
