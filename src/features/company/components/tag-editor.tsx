import { useRef, useState, type KeyboardEvent } from "react"

import { Input } from "@/components/ui/input"

const MAX_TAG = 40

/** Tag chips with a hover/focus remove button and an inline "+ tag" input (Enter adds, Esc cancels). */
export function TagEditor({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  // Enter and Esc remove the input, and some browsers then fire blur on it: that blur must not commit again.
  const closed = useRef(false)

  const open = () => {
    closed.current = false
    setDraft("")
  }

  const close = (save: boolean) => {
    if (closed.current) return
    closed.current = true
    const tag = (draft ?? "").trim().slice(0, MAX_TAG)
    setDraft(null)
    if (
      !save ||
      !tag ||
      tags.some((item) => item.toLowerCase() === tag.toLowerCase())
    )
      return
    onChange([...tags, tag])
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      close(true)
    } else if (event.key === "Escape") {
      close(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="group inline-flex items-center gap-1 rounded bg-muted px-2 py-[3px] text-xs"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            className="sr-only text-muted-foreground group-hover:not-sr-only hover:text-foreground focus-visible:not-sr-only"
          >
            ×
          </button>
        </span>
      ))}
      {draft === null ? (
        <button
          type="button"
          onClick={open}
          className="rounded border border-dashed border-faint bg-card px-2 py-[3px] text-xs"
        >
          + tag
        </button>
      ) : (
        <Input
          autoFocus
          aria-label="New tag"
          maxLength={MAX_TAG}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => close(true)}
          className="h-6 w-28 rounded px-1.5 text-xs"
        />
      )}
    </div>
  )
}
