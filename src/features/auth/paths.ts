import type { Role } from "@/features/auth/types"

export function homePath(lang: string, role: Role | null) {
  if (role === "admin") {
    return `/${lang}/admin`
  }
  return `/${lang}`
}
