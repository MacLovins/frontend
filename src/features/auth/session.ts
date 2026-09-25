import { apiRequest } from "@/lib/api"
import type { AuthTokens } from "@/features/auth/types"
import { isAuthTokens } from "@/features/auth/types"

export type LoginBody = {
  email: string
  password: string
  remember_me: boolean
}

export type RegisterBody = {
  email: string
  password: string
  name: string
  surname: string
  phone: string
}

async function authCall(path: string, body: unknown): Promise<AuthTokens> {
  const payload = await apiRequest<unknown>(path, { method: "POST", body })

  if (!isAuthTokens(payload)) {
    throw new Error("Invalid auth response")
  }

  return payload
}

export function login(body: LoginBody) {
  return authCall("/auth/login", body)
}

export function register(body: RegisterBody) {
  return authCall("/auth/register", body)
}

export function refreshSession(refresh: string) {
  return authCall("/auth/refresh", { refresh })
}

export function logout(refresh: string) {
  return apiRequest<void>("/auth/logout", { method: "POST", body: { refresh } })
}
