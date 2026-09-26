import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

/**
 * The rules table's 40×22 switch: black track with an orange thumb when on, grey track and white thumb when
 * off. The shared ui/switch is 36×20 with a white thumb, so this one is local.
 */
export function ActiveSwitch(props: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className="relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full p-[3px] transition-colors after:absolute after:-inset-x-2 after:-inset-y-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black data-checked:bg-black data-unchecked:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50"
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full transition-transform data-checked:translate-x-[18px] data-checked:bg-primary data-unchecked:bg-white" />
    </SwitchPrimitive.Root>
  )
}
