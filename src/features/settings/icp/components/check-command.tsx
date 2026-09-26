import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Option } from "@/features/settings/icp/hooks/use-catalogs"
import { copy } from "@/features/settings/icp/copy"

type CheckGroup = { heading?: string; options: Option[] }

/** Searchable checkable list for multi-select pickers (Popover content). */
export function CheckCommand({
  placeholder,
  groups,
  isChecked,
  onToggle,
}: {
  placeholder: string
  groups: CheckGroup[]
  isChecked: (value: string) => boolean
  onToggle: (value: string) => void
}) {
  return (
    <Command>
      <CommandInput placeholder={placeholder} aria-label={placeholder} />
      <CommandList className="max-h-[280px]">
        <CommandEmpty>{copy.pickers.noMatch}</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.heading ?? "all"} heading={group.heading}>
            {group.options.map((option) => {
              const checked = isChecked(option.value)
              return (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  data-checked={checked}
                  aria-checked={checked}
                  onSelect={() => onToggle(option.value)}
                  className="min-h-8 py-1"
                >
                  {option.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}
