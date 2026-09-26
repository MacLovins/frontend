import { Link } from "react-router"

import { EmptyState } from "@/components/common/states"
import { buttonVariants } from "@/components/ui/button"
import { useMe } from "@/hooks/use-session"
import { noServicesCopy } from "@/features/prospects/copy"

/** Leads are ranked per service, so nothing can show before an admin sets one up. */
export function NoServices() {
  const { data: me } = useMe()
  const isAdmin = me?.role === "admin"
  return (
    <EmptyState
      title={noServicesCopy.title}
      actions={
        isAdmin ? (
          <Link to="/settings/services" className={buttonVariants()}>
            {noServicesCopy.create}
          </Link>
        ) : null
      }
    >
      {isAdmin ? null : noServicesCopy.askAdmin}
    </EmptyState>
  )
}
