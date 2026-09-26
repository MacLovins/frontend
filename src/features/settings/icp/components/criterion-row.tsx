import { useId } from "react"
import { XIcon } from "@phosphor-icons/react"

import type { Criterion } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { ValueChip } from "@/features/settings/icp/components/chip"
import { CriterionEditor } from "@/features/settings/icp/components/criterion-editor"
import { copy } from "@/features/settings/icp/copy"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import {
  criterionChips,
  criterionTitle,
} from "@/features/settings/icp/lib/criteria"

const strings = copy.niceToHave

/** Stored weights may be fractional (API: float > 0); the slider snaps to whole steps on first move. */
function formatWeight(weight: number) {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1)
}

export function CriterionRow({
  criterion,
  error,
  open,
  onOpenChange,
  onValues,
  onWeight,
  onRemove,
  countries,
  industries,
}: {
  criterion: Criterion
  error?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onValues: (values: Criterion["values"]) => void
  onWeight: (weight: number) => void
  onRemove: () => void
  countries: CountryCatalog
  industries: IndustryCatalog
}) {
  const weightId = useId()
  const errorId = useId()
  const title = criterionTitle(criterion, countries)
  const chips = criterionChips(criterion, industries)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_220px_32px] items-center gap-3 rounded-md border border-subtle p-3.5">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label={strings.edit(title)}
              aria-describedby={error ? errorId : undefined}
              className="-m-1 flex min-w-0 flex-col gap-1.5 rounded-sm p-1 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-black"
            />
          }
        >
          <span className="text-sm font-semibold">{title}</span>
          {chips.length ? (
            <span className="flex flex-wrap gap-1">
              {chips.map((chip) => (
                <ValueChip key={chip}>{chip}</ValueChip>
              ))}
            </span>
          ) : null}
          {error ? (
            <span id={errorId} className="text-xs text-negative-strong">
              {error}
            </span>
          ) : null}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-0 p-0">
          <CriterionEditor
            criterion={criterion}
            onChange={onValues}
            countries={countries}
            industries={industries}
          />
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2.5 text-[13px]">
        <span id={weightId}>{strings.weight}</span>
        <Slider
          aria-labelledby={weightId}
          min={1}
          max={5}
          step={1}
          value={[Math.min(5, Math.max(1, criterion.weight))]}
          onValueChange={(value) =>
            onWeight(Math.round(Array.isArray(value) ? value[0] : value))
          }
          className="flex-1"
        />
        <span className="min-w-3.5 text-right font-mono">
          {formatWeight(criterion.weight)}
        </span>
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={strings.remove}
        onClick={onRemove}
      >
        <XIcon aria-hidden />
      </Button>
    </div>
  )
}
