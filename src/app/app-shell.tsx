import { Outlet } from "react-router"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useMe, useSessionKeepAlive } from "@/hooks/use-session"

/** Black sidebar on the left, the page on the grey canvas. Rendered only inside RequireAuth. */
export function AppShell() {
  const { data: me } = useMe()
  useSessionKeepAlive(me?.id)
  if (!me) return null

  return (
    <div className="flex min-h-svh">
      <AppSidebar me={me} />
      <main className="relative flex min-w-0 flex-1 flex-col bg-canvas">
        <div className="pointer-events-none fixed top-5 right-8 z-30 flex h-8 items-center">
          <ThemeToggle className="pointer-events-auto bg-card" />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
