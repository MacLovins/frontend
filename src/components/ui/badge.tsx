import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-subtle text-text-secondary [a]:hover:bg-[#e4e4e4]",
        black: "bg-black font-bold text-white",
        primary: "bg-primary font-bold text-black [a]:hover:bg-primary-hover",
        muted: "bg-muted text-text-secondary",
        outline: "border border-border text-text-secondary [a]:hover:bg-muted",
        dashed: "border border-dashed border-faint text-text-secondary",
        success: "bg-positive-surface text-positive-strong",
        warning: "bg-warning-surface text-warning-foreground",
        danger: "bg-negative-surface text-negative-strong",
        secondary: "bg-subtle text-black [a]:hover:bg-[#e4e4e4]",
        destructive: "bg-negative-surface text-negative-strong",
        ghost: "text-muted-foreground hover:bg-subtle hover:text-black",
        link: "text-black underline underline-offset-4 hover:text-link-hover",
      },
      size: {
        default:
          "px-1.5 py-px text-2xs has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1",
        md: "px-2 py-0.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "px-[9px] py-[3px] text-[13px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
      size,
    },
  })
}

export { Badge, badgeVariants }
