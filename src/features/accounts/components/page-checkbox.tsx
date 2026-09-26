import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "@phosphor-icons/react"

/**
 * Select-all for the visible page. The shared `Checkbox` has no indeterminate glyph (it would draw a check on a
 * partial selection), so this one mirrors its styling and adds the dash.
 */
export function PageCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  label,
}: {
  checked: boolean
  indeterminate: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  return (
    <CheckboxPrimitive.Root
      aria-label={label}
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange}
      className="relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-white text-black transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black data-indeterminate:border-primary data-indeterminate:bg-primary data-checked:border-primary data-checked:bg-primary"
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center [&>svg]:size-3">
        {indeterminate ? (
          <MinusIcon weight="bold" />
        ) : (
          <CheckIcon weight="bold" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
