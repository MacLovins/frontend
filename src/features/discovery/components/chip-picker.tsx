import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { copy } from "../copy"

export type PickerOption = { value: string; label: string }

type PickerStrings = {
  search: string
  empty: string
  pick: string
  edit: string
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((value) => b.includes(value))
}

/**
 * The first `visible` picks as black chips plus a dashed "+ n more" chip. Any chip opens the multi-select list,
 * which can reset the pick to the ICP.
 */
export function ChipPicker({
  label,
  options,
  value,
  onChange,
  icpValue,
  visible,
  moreFromIcp = false,
  strings,
}: {
  /** The field name, e.g. "Countries"; the trigger reads as "Countries: Poland, Czechia, …". */
  label: string
  options: PickerOption[]
  value: string[]
  onChange: (value: string[]) => void
  icpValue: string[]
  visible: number
  /** Countries say "+ n more from ICP" while the pick still equals the ICP. */
  moreFromIcp?: boolean
  strings: PickerStrings
}) {
  const labels = new Map(options.map((option) => [option.value, option.label]))
  const labelOf = (item: string) => labels.get(item) ?? item
  const isIcp = sameSet(value, icpValue)
  const rest = value.length - visible

  const toggle = (item: string) =>
    onChange(
      value.includes(item)
        ? value.filter((picked) => picked !== item)
        : [...value, item]
    )

  const dashed =
    value.length === 0
      ? strings.pick
      : rest > 0
        ? moreFromIcp && isIcp
          ? copy.picker.moreFromIcp(rest)
          : copy.picker.more(rest)
        : null

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`${label}: ${value.length ? value.map(labelOf).join(", ") : strings.pick}`}
            className="flex w-full flex-wrap gap-1 rounded-sm text-left text-xs font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          />
        }
      >
        {value.slice(0, visible).map((item) => (
          <span
            key={item}
            className="rounded bg-black px-2 py-[3px] text-white hover:bg-[#262626]"
          >
            {labelOf(item)}
          </span>
        ))}
        {dashed ? (
          <span className="rounded border border-dashed border-faint px-2 py-[3px] text-black hover:bg-muted">
            {dashed}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 gap-0 p-0"
        aria-label={strings.edit}
      >
        <Command>
          <CommandInput
            placeholder={strings.search}
            aria-label={strings.search}
          />
          <CommandList>
            <CommandEmpty>{strings.empty}</CommandEmpty>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                keywords={[option.value]}
                data-checked={value.includes(option.value)}
                onSelect={() => toggle(option.value)}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        {icpValue.length ? (
          <div className="border-t border-border px-3 py-2.5">
            <Button
              variant="link"
              className="text-[13px]"
              disabled={isIcp}
              onClick={() => onChange(icpValue)}
            >
              {copy.picker.reset}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
