import { type ReactNode, useId } from "react"

import { Slider } from "@/components/ui/slider"

type SliderFieldProps = {
  label: ReactNode
  /** The value as the row shows it. */
  display: string
  value: number
  min: number
  max: number
  step: number
  disabled: boolean
  /** Screen-reader format of the value, e.g. `{ style: "percent" }`. */
  format?: Intl.NumberFormatOptions
  onChange: (value: number) => void
}

function ScoringSlider({
  labelId,
  value,
  min,
  max,
  step,
  disabled,
  format,
  onChange,
}: Omit<SliderFieldProps, "label" | "display"> & { labelId: string }) {
  return (
    <Slider
      aria-labelledby={labelId}
      value={[value]}
      min={min}
      max={max}
      step={step}
      format={format}
      disabled={disabled}
      onValueChange={(next) => {
        const raw = typeof next === "number" ? next : (next[0] ?? value)
        // Drop float noise from fractional steps (0.1 + 0.2).
        onChange(Math.round(raw * 100) / 100)
      }}
    />
  )
}

/** Label · slider · value in one 3-column row (importance weights, tier thresholds). */
export function SliderRow({ label, display, ...slider }: SliderFieldProps) {
  const labelId = useId()
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)_36px] items-center gap-3 text-sm">
      <span id={labelId} className="flex items-center gap-1.5">
        {label}
      </span>
      <ScoringSlider labelId={labelId} {...slider} />
      <span className="text-right font-mono">{display}</span>
    </div>
  )
}

/** Label and value above the slider, helper text below (the "How the priority is built" rows). */
export function LabeledSlider({
  label,
  display,
  help,
  note,
  ...slider
}: SliderFieldProps & { help: string; note?: ReactNode }) {
  const labelId = useId()
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex justify-between gap-3">
        <span id={labelId}>{label}</span>
        <span className="font-mono">{display}</span>
      </div>
      <ScoringSlider labelId={labelId} {...slider} />
      <p className="m-0 text-xs text-muted-foreground">{help}</p>
      {note}
    </div>
  )
}
