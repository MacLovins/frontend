import { Link, useSearchParams } from "react-router"
import { cn } from "cn"

import { viewCopy } from "@/features/prospects/copy"

type View = "list" | "matrix"

// Both views live on /prospects; the list filters stay in the URL across the switch so "List" restores them.
function viewHref(params: URLSearchParams, view: View) {
  const next = new URLSearchParams(params)
  if (view === "matrix") {
    next.set("view", "matrix")
  } else {
    next.delete("view")
    next.delete("selected")
  }
  const search = next.toString()
  return search ? `/prospects?${search}` : "/prospects"
}

/** "List | Fit × Signals": two navigation links styled as a segmented control. */
export function ViewSwitch({
  current,
  className,
}: {
  current: View
  className?: string
}) {
  const [params] = useSearchParams()
  const items: { view: View; label: string }[] = [
    { view: "list", label: viewCopy.list },
    { view: "matrix", label: viewCopy.matrix },
  ]
  return (
    <nav
      aria-label={viewCopy.label}
      className={cn(
        "inline-flex gap-1.5 rounded-md bg-subtle p-[3px]",
        className
      )}
    >
      {items.map((item) => {
        const active = item.view === current
        return (
          <Link
            key={item.view}
            to={viewHref(params, item.view)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[34px] items-center rounded-sm px-3 text-[13px] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
              active
                ? "bg-white font-semibold text-black hover:text-black"
                : "text-text-secondary hover:text-black"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
