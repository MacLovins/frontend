export const ROLES = ["admin", "employee"] as const

export type Role = (typeof ROLES)[number]

export type AuthTokens = {
  access: string
  refresh: string
  role: Role
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role)
}

export function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const tokens = value as Record<string, unknown>
  return (
    typeof tokens.access === "string" &&
    typeof tokens.refresh === "string" &&
    isRole(tokens.role)
  )
}
