/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { ApiError } from "@/lib/api"
import { login, logout, refreshSession, register } from "@/features/auth/session"
import type { LoginBody, RegisterBody } from "@/features/auth/session"
import { clearRefresh, readRefresh, writeRefresh } from "@/features/auth/storage"
import type { AuthTokens, Role } from "@/features/auth/types"

type AuthStatus = "restoring" | "authenticated" | "anonymous"

type AuthContextValue = {
  status: AuthStatus
  role: Role | null
  accessToken: string | null
  hasRefresh: boolean
  signIn: (body: LoginBody) => Promise<AuthTokens>
  signUp: (body: RegisterBody) => Promise<AuthTokens>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applyTokens(
  tokens: AuthTokens,
  setAccessToken: (token: string | null) => void,
  setRole: (role: Role | null) => void,
) {
  writeRefresh(tokens.refresh)
  setAccessToken(tokens.access)
  setRole(tokens.role)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    readRefresh() ? "restoring" : "anonymous",
  )

  useEffect(() => {
    const refresh = readRefresh()
    if (!refresh) {
      return
    }

    let cancelled = false

    refreshSession(refresh)
      .then((tokens) => {
        if (cancelled) {
          return
        }
        applyTokens(tokens, setAccessToken, setRole)
        setStatus("authenticated")
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        const rejected =
          error instanceof ApiError &&
          (error.code === 401 || error.code === 403)
        if (!rejected) {
          setStatus("authenticated")
          return
        }
        clearRefresh()
        setAccessToken(null)
        setRole(null)
        setStatus("anonymous")
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (body: LoginBody) => {
    const tokens = await login(body)
    applyTokens(tokens, setAccessToken, setRole)
    setStatus("authenticated")
    return tokens
  }, [])

  const signUp = useCallback(async (body: RegisterBody) => {
    const tokens = await register(body)
    applyTokens(tokens, setAccessToken, setRole)
    setStatus("authenticated")
    return tokens
  }, [])

  const signOut = useCallback(async () => {
    const refresh = readRefresh()
    clearRefresh()
    setAccessToken(null)
    setRole(null)
    setStatus("anonymous")
    if (!refresh) {
      return
    }
    try {
      await logout(refresh)
    } catch {
      // Local session is already cleared.
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      role,
      accessToken,
      hasRefresh: status !== "anonymous",
      signIn,
      signUp,
      signOut,
    }),
    [accessToken, role, signIn, signOut, signUp, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
