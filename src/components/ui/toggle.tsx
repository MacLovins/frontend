import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Segment of a grey segmented track (see ToggleGroup)
        default:
          "bg-transparent font-normal text-text-secondary hover:text-black data-pressed:bg-white data-pressed:font-semibold data-pressed:text-black",
        // Stand-alone bordered option (Importance, "Where to look" chips)
        outline:
          "border border-input bg-white font-normal text-black hover:bg-muted data-pressed:border-black data-pressed:bg-black data-pressed:font-semibold data-pressed:text-white",
      },
      size: {
        default:
          "h-[34px] min-w-[34px] rounded-sm px-3 text-[13px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        sm: "h-7 min-w-7 rounded px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 min-w-10 rounded-sm px-3.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        // H/M/L weight segment (Signal questions)
        weight:
          "h-7 w-[34px] rounded px-0 text-xs data-pressed:bg-black data-pressed:font-bold data-pressed:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
