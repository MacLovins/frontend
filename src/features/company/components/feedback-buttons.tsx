import type { SignalVerdict } from "@/api/generated/model"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const options: { value: SignalVerdict; label: string; pressed: string }[] = [
  {
    value: "correct",
    label: "✓ Correct",
    pressed:
      "data-pressed:border-positive-strong data-pressed:bg-positive-surface data-pressed:text-positive-strong",
  },
  {
    value: "incorrect",
    label: "✕ Wrong",
    pressed:
      "data-pressed:border-negative-strong data-pressed:bg-negative-surface data-pressed:text-negative-strong",
  },
  {
    value: "irrelevant",
    label: "⊘ Not relevant",
    pressed:
      "data-pressed:border-text-secondary data-pressed:bg-subtle data-pressed:text-foreground",
  },
]

/** One verdict at a time; pressing the active one again withdraws it. */
export function FeedbackButtons({
  value,
  onChange,
  pending,
}: {
  value: SignalVerdict | null
  onChange: (value: SignalVerdict | null) => void
  pending: boolean
}) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={1.5}
      aria-label="Rate this signal"
      aria-busy={pending || undefined}
      disabled={pending}
      value={value ? [value] : []}
      onValueChange={(next) =>
        onChange((next[0] as SignalVerdict | undefined) ?? null)
      }
      className="ml-auto"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={`h-[30px] rounded-sm px-2.5 text-xs text-text-secondary data-pressed:font-bold ${option.pressed}`}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
