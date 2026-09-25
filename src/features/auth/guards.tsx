import { Navigate, Outlet } from "react-router"

import { useLocaleParam } from "@/lib/use-locale"
import { useAuth } from "@/features/auth/auth-context"
import { homePath } from "@/features/auth/paths"
import { SessionLoading } from "@/features/auth/session-loading"

export function GuestOnly() {
  const { hasRefresh, status, role } = useAuth()
  const lang = useLocaleParam()

  if (!hasRefresh) {
    return <Outlet />
  }

  if (status === "restoring") {
    return <SessionLoading />
  }

  return <Navigate to={homePath(lang, role)} replace />
}

export function RequireAuth() {
  const { hasRefresh } = useAuth()
  const lang = useLocaleParam()

  if (!hasRefresh) {
    return <Navigate to={`/${lang}/login`} replace />
  }

  return <Outlet />
}
