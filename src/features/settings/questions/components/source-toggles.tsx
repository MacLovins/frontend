import type { SourceType } from "@/api/generated/model"
import { Toggle } from "@/components/ui/toggle"
import {
  isSelectableSource,
  selectableSources,
  sourceLongLabels,
} from "@/features/settings/questions/copy"
import { useLabels } from "@/hooks/use-labels"

const chipClass =
  "h-auto min-w-0 rounded-sm px-2.5 py-[5px] text-[13px] data-pressed:font-normal"

/** "Where to look" chips: black with ✓ when picked. */
export function SourceToggles({
  value,
  disabled,
  onChange,
}: {
  value: SourceType[]
  disabled: boolean
  onChange: (value: SourceType[]) => void
}) {
  const label = useLabels()
  // System-only sources (derived, manual) stay visible on questions that have them, but cannot be picked.
  const fixed = value.filter((source) => !isSelectableSource(source))

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectableSources.map((source) => {
        const pressed = value.includes(source)
        return (
          <Toggle
            key={source}
            variant="outline"
            pressed={pressed}
            disabled={disabled}
            onPressedChange={(next) =>
              onChange(
                next
                  ? [...value, source]
                  : value.filter((item) => item !== source)
              )
            }
            className={chipClass}
          >
            {sourceLongLabels[source]}
            {pressed ? <span aria-hidden> ✓</span> : null}
          </Toggle>
        )
      })}
      {fixed.map((source) => (
        <Toggle
          key={source}
          variant="outline"
          pressed
          disabled
          className={chipClass}
        >
          {label("source_types", source)}
          <span aria-hidden> ✓</span>
        </Toggle>
      ))}
    </div>
  )
}
