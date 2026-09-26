/* eslint-disable react-refresh/only-export-components */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, type ReactNode } from "react"
import { Navigate, Outlet, useLocation } from "react-router"

import { api, type UserOut } from "@/api/client"
import { labels } from "@/lib/labels"

const AuthContext = createContext<{ me: UserOut | null; loading: boolean } | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    retry: false,
    staleTime: 30_000,
  })

  return (
    <AuthContext.Provider value={{ me: me.data ?? null, loading: me.isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSession() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("useSession must be used within SessionProvider")
  }
  return value
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login({ email, password, remember_me: false }),
    onSuccess: (me) => {
      queryClient.setQueryData(["me"], me)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.setQueryData(["me"], null)
    },
  })
}

export function RequireAuth() {
  const { me, loading } = useSession()
  const location = useLocation()

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">{labels.loading}</p>
  }

  if (!me) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { me } = useSession()
  if (me?.role !== "admin") {
    return <Navigate to="/403" replace />
  }
  return <Outlet />
}
