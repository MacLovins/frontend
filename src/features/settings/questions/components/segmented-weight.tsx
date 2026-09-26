import type { Weight } from "@/api/generated/model"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  weightLetters,
  weightNames,
  weightOrder,
} from "@/features/settings/questions/copy"

const isWeight = (value: string | undefined): value is Weight =>
  weightOrder.some((weight) => weight === value)

/** H / M / L track: a click on the pressed segment keeps it pressed. */
export function SegmentedWeight({
  value,
  disabled,
  onChange,
}: {
  value: Weight
  disabled?: boolean
  onChange: (weight: Weight) => void
}) {
  return (
    <ToggleGroup
      size="weight"
      aria-label="Weight"
      value={[value]}
      disabled={disabled}
      onValueChange={([next]) => {
        if (isWeight(next) && next !== value) onChange(next)
      }}
    >
      {weightOrder.map((weight) => (
        <ToggleGroupItem
          key={weight}
          value={weight}
          aria-label={weightNames[weight]}
        >
          {weightLetters[weight]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
