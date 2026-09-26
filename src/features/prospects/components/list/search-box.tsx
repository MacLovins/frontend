import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useEffect, useEffectEvent, useState } from "react"

import { Input } from "@/components/ui/input"
import { prospectsCopy } from "@/features/prospects/copy"

const DEBOUNCE_MS = 300

/** Company or domain search; typing is debounced before it reaches the URL (`?q=`). */
export function SearchBox({
  value,
  onCommit,
}: {
  value: string
  onCommit: (q: string) => void
}) {
  const [text, setText] = useState(value)
  const [sent, setSent] = useState(value)
  const [seen, setSeen] = useState(value)

  // The URL can change without typing (Clear filters, Back): show it, unless it is our own debounced commit.
  if (value !== seen) {
    setSeen(value)
    if (value !== sent) {
      setSent(value)
      setText(value)
    }
  }

  const commit = useEffectEvent((next: string) => {
    setSent(next)
    onCommit(next)
  })

  useEffect(() => {
    const next = text.trim()
    if (next === sent) return
    const timer = window.setTimeout(() => commit(next), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [text, sent])

  return (
    <label className="flex h-10 w-[280px] items-center gap-2 rounded-md border border-input bg-white px-3 focus-within:border-black">
      <MagnifyingGlassIcon
        size={16}
        className="shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={prospectsCopy.search}
        aria-label={prospectsCopy.searchAria}
        className="h-auto rounded-none border-0 bg-transparent p-0"
      />
    </label>
  )
}
