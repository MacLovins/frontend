import { Navigate, Outlet, useLocation } from "react-router"

import { ErrorState } from "@/components/common/states"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/hooks/use-session"

export function RequireAuth() {
  const me = useMe()
  const location = useLocation()

  if (me.isPending) {
    return (
      <div className="flex min-h-svh">
        <div className="w-[248px] shrink-0 bg-sidebar" />
        <div className="flex flex-1 flex-col gap-4 p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }
  if (me.isError) {
    return (
      <div className="grid min-h-svh place-items-center">
        <ErrorState title="Cannot reach LeadRadar" error={me.error} onRetry={() => void me.refetch()} />
      </div>
    )
  }
  if (!me.data) {
    const from = `${location.pathname}${location.search}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  return <Outlet />
}

/** Settings are admin-only in the UI; the API enforces the same on every write. */
export function RequireAdmin() {
  const { data: me } = useMe()
  if (me?.role !== "admin") return <Navigate to="/403" replace />
  return <Outlet />
}
