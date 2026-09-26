import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { meQueryKey } from "@/api/cache"
import { getMe, logout, refresh } from "@/api/generated/auth/auth"
import type { UserOut } from "@/api/generated/model"
import { ApiError } from "@/api/mutator"

const KEEP_ALIVE_MS = 30 * 60_000

/** The signed-in user, `null` when signed out. Auth is the httpOnly `lr_session` cookie; the app never sees a token. */
export function useMe() {
  return useQuery<UserOut | null>({
    queryKey: meQueryKey,
    queryFn: async ({ signal }) => {
      try {
        const me = await getMe({ signal })
        return me.is_active ? me : null
      } catch (error) {
        // 404: the token is valid but the user row is gone.
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 404)
        )
          return null
        throw error
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return async () => {
    try {
      await logout()
    } finally {
      queryClient.clear()
      queryClient.setQueryData(meQueryKey, null)
    }
  }
}

/** The session cookie lasts 12 h; refresh it on load and every 30 min while the tab is visible. */
export function useSessionKeepAlive(userId: string | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!userId) return
    const tick = () => {
      if (document.visibilityState !== "visible") return
      refresh()
        .then((session) => queryClient.setQueryData(meQueryKey, session.user))
        .catch(() => {
          // A failed refresh leaves the current session alone; a real expiry shows up as a 401 elsewhere.
        })
    }
    tick()
    const timer = window.setInterval(tick, KEEP_ALIVE_MS)
    return () => window.clearInterval(timer)
  }, [queryClient, userId])
}
