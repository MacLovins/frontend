import type { ReactNode } from "react"

import { FieldError } from "@/components/ui/field"

/** Label (13/600), optional helper line, control and inline error — the settings form rhythm. */
export function FormRow({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string
  label: string
  help?: string
  error?: { message?: string }
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {help ? (
        <p id={`${id}-help`} className="m-0 text-xs leading-[1.45] text-muted-foreground">
          {help}
        </p>
      ) : null}
      <FieldError errors={[error]} />
    </div>
  )
}
