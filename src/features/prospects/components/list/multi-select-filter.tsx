import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

type FilterOption = { value: string; label: string; hint?: string }
export type FilterPreset = { id: string; label: string; values: string[] }

/** A "Label: value ▾" pill that opens a searchable checklist; every toggle applies at once. */
export function MultiSelectFilter({
  label,
  searchPlaceholder,
  heading,
  options,
  presets = [],
  selected,
  onChange,
  isLoading,
}: {
  label: string
  searchPlaceholder: string
  heading: string
  options: FilterOption[]
  presets?: FilterPreset[]
  selected: string[]
  onChange: (values: string[]) => void
  isLoading: boolean
}) {
  const chosen = new Set(selected)
  const toggle = (value: string) =>
    onChange(
      chosen.has(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    )
  const presetOn = (preset: FilterPreset) =>
    preset.values.every((value) => chosen.has(value))
  const togglePreset = (preset: FilterPreset) =>
    onChange(
      presetOn(preset)
        ? selected.filter((value) => !preset.values.includes(value))
        : [...new Set([...selected, ...preset.values])]
    )

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="gap-1 px-3" />}>
        {label}
        <span aria-hidden="true">▾</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex flex-col gap-2 p-3" aria-busy="true">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <CommandEmpty>No matches.</CommandEmpty>
                {presets.length ? (
                  <>
                    <CommandGroup heading="Regions">
                      {presets.map((preset) => (
                        <CommandItem
                          key={preset.id}
                          value={`preset:${preset.id}`}
                          keywords={[preset.label]}
                          data-checked={presetOn(preset)}
                          onSelect={() => togglePreset(preset)}
                        >
                          {preset.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                ) : null}
                <CommandGroup heading={heading}>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label]}
                      data-checked={chosen.has(option.value)}
                      onSelect={() => toggle(option.value)}
                    >
                      <span className="truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="font-mono text-2xs text-muted-foreground">
                          {option.hint}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div className="flex items-center justify-between border-t border-border px-2.5 py-1.5">
            <span className="text-xs text-muted-foreground">
              {selected.length ? `${selected.length} selected` : ""}
            </span>
            <Button
              variant="ghost"
              size="xs"
              disabled={!selected.length}
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
