import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  copy,
  MAX_RUN_COMPANIES,
  monitoringOptions,
  type Monitoring,
} from "@/features/accounts/copy"

const SEARCH_DEBOUNCE_MS = 300

/** Typing is local; the trimmed text reaches the URL 300 ms after the last key. Back/forward and "Clear search" flow back in. */
function SearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [text, setText] = useState(value)
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    if (value !== text.trim()) setText(value)
  }

  useEffect(() => {
    const next = text.trim()
    if (next === value) return
    const timer = window.setTimeout(() => onChange(next), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [text, value, onChange])

  return (
    <Input
      type="search"
      aria-label={copy.searchLabel}
      placeholder={copy.searchPlaceholder}
      value={text}
      onChange={(event) => setText(event.target.value)}
      className="w-[280px]"
    />
  )
}

function MonitoringSelect({
  value,
  onChange,
}: {
  value: Monitoring
  onChange: (value: Monitoring) => void
}) {
  return (
    <Select<Monitoring>
      value={value}
      onValueChange={(next) => next && onChange(next)}
      items={monitoringOptions}
    >
      <SelectTrigger aria-label={copy.monitoringLabel}>
        <SelectValue>
          {(current: Monitoring) =>
            copy.monitoringValue(monitoringOptions[current])
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {(Object.keys(monitoringOptions) as Monitoring[]).map((option) => (
          <SelectItem key={option} value={option}>
            {monitoringOptions[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function AnalyzeSelected({
  count,
  pending,
  onAnalyze,
}: {
  count: number
  pending: boolean
  onAnalyze: () => void
}) {
  const overLimit = count > MAX_RUN_COMPANIES
  const button = (
    <Button
      variant="black"
      className="px-3.5"
      disabled={count === 0 || overLimit || pending}
      onClick={onAnalyze}
    >
      {copy.analyzeSelected}
    </Button>
  )
  if (!overLimit) return button
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} className="inline-flex rounded-md" />}
      >
        {button}
      </TooltipTrigger>
      <TooltipContent>{copy.runLimit}</TooltipContent>
    </Tooltip>
  )
}

export function FilterBar({
  query,
  onQueryChange,
  monitoring,
  onMonitoringChange,
  selectedCount,
  analyzing,
  onAnalyze,
}: {
  query: string
  onQueryChange: (value: string) => void
  monitoring: Monitoring
  onMonitoringChange: (value: Monitoring) => void
  selectedCount: number
  analyzing: boolean
  onAnalyze: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput value={query} onChange={onQueryChange} />
      <MonitoringSelect value={monitoring} onChange={onMonitoringChange} />
      <div className="ml-auto flex items-center gap-2">
        {selectedCount > 0 ? (
          <span className="text-[13px] text-muted-foreground">
            {copy.selected(selectedCount)}
          </span>
        ) : null}
        <AnalyzeSelected
          count={selectedCount}
          pending={analyzing}
          onAnalyze={onAnalyze}
        />
      </div>
    </div>
  )
}
