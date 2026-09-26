import type { ImportCompaniesCsvMapping } from "@/api/generated/model"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { copy, formatLabels } from "@/features/accounts/copy"

const formats = Object.keys(formatLabels) as ImportCompaniesCsvMapping[]

export function FormatTiles({
  value,
  onChange,
  disabled,
}: {
  value: ImportCompaniesCsvMapping
  onChange: (value: ImportCompaniesCsvMapping) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <span id="import-format" className="text-[13px] font-semibold">
        {copy.import.format}
      </span>
      <ToggleGroup
        aria-labelledby="import-format"
        variant="outline"
        spacing={1.5}
        value={[value]}
        disabled={disabled}
        onValueChange={(next) => {
          const [picked] = next as ImportCompaniesCsvMapping[]
          if (picked) onChange(picked)
        }}
        className="w-full"
      >
        {formats.map((format) => (
          <ToggleGroupItem
            key={format}
            value={format}
            size="lg"
            // Selected: 2 px black border drawn as border + inset ring, so the label does not shift.
            className="h-11 flex-1 justify-start rounded-sm px-3 data-pressed:border-black data-pressed:bg-white data-pressed:text-black data-pressed:shadow-[inset_0_0_0_1px_var(--color-black)]"
          >
            {formatLabels[format]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
