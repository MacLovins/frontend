import { type KeyboardEvent, useState } from "react"

import { Input } from "@/components/ui/input"

import { copy } from "@/features/settings/services/copy"
import { addRole, MAX_ROLE_LENGTH } from "@/features/settings/services/lib/service-form"

/** Removable role chips plus a dashed "+ role" chip that turns into an inline input. */
export function DecisionMakersInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (roles: string[]) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (keepOpen: boolean) => {
    if (draft?.trim()) onChange(addRole(value, draft))
    setDraft(keepOpen ? "" : null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      commit(true)
    } else if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      setDraft(null)
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
      {value.map((role) => (
        <span key={role} className="inline-flex items-center gap-1.5 rounded-sm bg-muted py-[5px] pr-1.5 pl-2.5">
          {role}
          <button
            type="button"
            aria-label={`Remove ${role}`}
            onClick={() => onChange(value.filter((item) => item !== role))}
            className="inline-flex size-4 items-center justify-center rounded-sm text-text-secondary hover:bg-subtle hover:text-black focus-visible:outline-2 focus-visible:outline-black"
          >
            ✕
          </button>
        </span>
      ))}
      {draft === null ? (
        <button
          type="button"
          onClick={() => setDraft("")}
          className="rounded-sm border border-dashed border-faint px-2.5 py-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {copy.details.addRole}
        </button>
      ) : (
        <Input
          autoFocus
          aria-label={copy.details.newRole}
          value={draft}
          maxLength={MAX_ROLE_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => commit(false)}
          className="h-[30px] w-[180px] rounded-sm px-2.5 text-[13px]"
        />
      )}
    </div>
  )
}
