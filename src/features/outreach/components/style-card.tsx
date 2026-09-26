import type { OutreachTone } from "@/api/generated/model"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { tones, toneLabels } from "@/features/outreach/copy"
import { SideCard } from "@/features/outreach/components/outreach-layout"

type Option<T extends string> = { value: T; label: string }

const toneOptions: Option<OutreachTone>[] = tones.map((tone) => ({
  value: tone,
  label: toneLabels[tone],
}))

export function StyleCard({
  tone,
  onToneChange,
  language,
  onLanguageChange,
  languages,
}: {
  tone: OutreachTone
  onToneChange: (tone: OutreachTone) => void
  language: string
  onLanguageChange: (language: string) => void
  languages: { code: string; label: string }[]
}) {
  return (
    <SideCard title="Style">
      <OptionGroup
        label="Tone"
        value={tone}
        options={toneOptions}
        onChange={onToneChange}
      />
      <OptionGroup
        label="Language"
        value={language}
        options={languages.map((item) => ({
          value: item.code,
          label: item.label,
        }))}
        onChange={onLanguageChange}
      />
    </SideCard>
  )
}

/** Single choice that cannot be cleared: pressing the selected chip again keeps it. */
function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      spacing={1.5}
      value={[value]}
      onValueChange={(next) => {
        const picked = options.find((option) => option.value === next[0])
        if (picked) onChange(picked.value)
      }}
      className="w-full flex-wrap"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-8 px-2.5 data-pressed:font-normal"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
