import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import { useTheme } from "@/lib/theme"

/** Sun while the app is dark, moon while it is light: the icon is the theme the click turns on. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const toDark = theme === "light"
  const Icon = toDark ? MoonIcon : SunIcon

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={toDark ? "Switch to dark theme" : "Switch to light theme"}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <Icon className="size-[18px]" weight="bold" />
    </button>
  )
}
