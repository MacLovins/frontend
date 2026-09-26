import { cn } from "cn"

/** The LeadRadar radar mark: black strokes on an orange tile. */
export function BrandMark({ className, size = 32 }: { className?: string; size?: 32 | 40 }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center bg-primary text-black",
        size === 32 ? "size-8 rounded-[7px]" : "size-10 rounded-md",
        className,
      )}
    >
      <svg
        width={size === 32 ? 20 : 24}
        height={size === 32 ? 20 : 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <path d="M12 12 18.5 5.5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    </span>
  )
}
