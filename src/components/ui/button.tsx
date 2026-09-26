import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding whitespace-nowrap transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary font-semibold text-black hover:bg-primary-hover aria-expanded:bg-primary-hover",
        black:
          "bg-black font-semibold text-white hover:bg-[#262626] aria-expanded:bg-[#262626]",
        outline:
          "border-input bg-white font-normal text-black hover:bg-muted aria-expanded:bg-muted",
        "outline-dashed":
          "border-dashed border-faint bg-white font-normal text-black hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "bg-subtle font-semibold text-black hover:bg-[#e4e4e4] aria-expanded:bg-[#e4e4e4]",
        ghost:
          "bg-transparent font-normal text-muted-foreground hover:bg-subtle hover:text-black aria-expanded:bg-subtle aria-expanded:text-black",
        positive:
          "border-positive-strong bg-positive-surface font-bold text-positive-strong",
        negative:
          "border-negative-strong bg-negative-surface font-bold text-negative-strong",
        destructive:
          "bg-destructive font-semibold text-white hover:bg-negative-strong aria-expanded:bg-negative-strong",
        link: "font-normal text-black underline underline-offset-4 hover:text-link-hover",
      },
      size: {
        default:
          "h-10 gap-2 rounded-md px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-[30px] gap-1.5 rounded-sm px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-[34px] gap-1.5 rounded-sm px-3 text-[13px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-11 gap-2 rounded-md px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10 rounded-md [&_svg:not([class*='size-'])]:size-[18px]",
        "icon-xs":
          "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-sm",
        "icon-lg": "size-11 rounded-md [&_svg:not([class*='size-'])]:size-[18px]",
      },
    },
    compoundVariants: [
      // Mock: bordered 40 px buttons use 14 px side padding, filled ones 16 px.
      {
        variant: ["outline", "outline-dashed"],
        size: "default",
        className: "px-3.5",
      },
      // Mock: bordered icon buttons (sheet close, row "⋯") use the #ddd border.
      {
        variant: "outline",
        size: ["icon", "icon-xs", "icon-sm", "icon-lg"],
        className: "border-border",
      },
      {
        variant: "link",
        className:
          "h-auto border-0 p-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
