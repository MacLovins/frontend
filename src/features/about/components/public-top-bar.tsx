import type { ReactNode } from "react"
import { Link } from "react-router"

import { BrandMark } from "@/components/common/brand-mark"
import { Button } from "@/components/ui/button"
import { useMe } from "@/hooks/use-session"

/** Brand on the left, page chips and the way into the app on the right. Signed-out visitors land on /login via RequireAuth. */
export function PublicTopBar({
  tagline = false,
  children,
}: {
  tagline?: boolean
  children?: ReactNode
}) {
  const me = useMe()

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/about"
          className="flex items-center gap-3 text-black"
          aria-label="LeadRadar product brief"
        >
          <BrandMark size={40} />
          <span className="text-[22px] font-bold tracking-[-0.01em]">
            LeadRadar
          </span>
        </Link>
        {tagline && (
          <span className="hidden border-l border-border pl-3 text-sm text-muted-foreground md:inline">
            AI sales intelligence for Orange Systems
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {children}
        <Button
          variant="black"
          size="sm"
          nativeButton={false}
          render={<Link to="/prospects" />}
        >
          {me.data ? "Open LeadRadar" : "Sign in"}
        </Button>
      </div>
    </header>
  )
}
