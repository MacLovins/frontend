import { useId } from "react"
import { cn } from "cn"

import {
  NotPreviewedNote,
  SettingsCard,
} from "@/features/settings/scoring/components/settings-card"
import { copy } from "@/features/settings/scoring/copy"
import type { ScoringDraft } from "@/features/settings/scoring/hooks/use-scoring-draft"
import {
  HALF_LIFE_KEYS,
  HALF_LIFE_MAX,
  HALF_LIFE_MIN,
  type HalfLifeKey,
  parseHalfLife,
} from "@/features/settings/scoring/lib/params"

/** Looks like the mock's static "45 d" chip, but the number is editable (SPEC FE-14). */
function HalfLifeInput({
  id,
  label,
  value,
  invalid,
  disabled,
  describedBy,
  onChange,
  onCommit,
}: {
  id: string
  label: string
  value: string
  invalid: boolean
  disabled: boolean
  describedBy: string
  onChange: (value: string) => void
  onCommit: () => void
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded border border-input px-2 py-1 font-mono text-[13px] focus-within:border-black",
        invalid && "border-destructive focus-within:border-destructive",
        disabled && "opacity-50"
      )}
    >
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={HALF_LIFE_MIN}
        max={HALF_LIFE_MAX}
        step={1}
        aria-label={copy.halfLife.inputLabel(label)}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter") onCommit()
        }}
        className="w-[4ch] [appearance:textfield] border-0 bg-transparent p-0 text-right outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span aria-hidden="true">&nbsp;{copy.halfLife.unit}</span>
    </span>
  )
}

function HalfLifeRow({
  halfLife,
  editor,
  disabled,
}: {
  halfLife: HalfLifeKey
  editor: ScoringDraft
  disabled: boolean
}) {
  const id = useId()
  const label = copy.halfLife.labels[halfLife]
  const text = editor.halfLifeText[halfLife]
  // The helper follows what is typed; while the entry is invalid it keeps the last valid value.
  const days = parseHalfLife(text) ?? editor.draft.half_life_days[halfLife]
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <HalfLifeInput
        id={id}
        label={label}
        value={text}
        invalid={editor.invalidHalfLives.includes(halfLife)}
        disabled={disabled}
        describedBy={`${id}-help`}
        onChange={(value) => editor.setHalfLife(halfLife, value)}
        onCommit={() => editor.commitHalfLife(halfLife)}
      />
      <span id={`${id}-help`} className="text-muted-foreground">
        {days ? copy.halfLife.help[halfLife](days) : null}
      </span>
    </>
  )
}

export function HalfLifeCard({
  editor,
  disabled,
}: {
  editor: ScoringDraft
  disabled: boolean
}) {
  return (
    <SettingsCard title={copy.halfLife.title} className="gap-2.5">
      <div className="grid grid-cols-[110px_70px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-2 text-[13px]">
        {HALF_LIFE_KEYS.map((key) => (
          <HalfLifeRow
            key={key}
            halfLife={key}
            editor={editor}
            disabled={disabled}
          />
        ))}
      </div>
      {editor.halfLivesDirty ? (
        <NotPreviewedNote>{copy.notPreviewed}</NotPreviewedNote>
      ) : null}
    </SettingsCard>
  )
}
