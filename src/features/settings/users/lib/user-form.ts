import { z } from "zod"

import { UserOutRole, type UserOut, type UserUpdate } from "@/api/generated/model"
import { ApiError } from "@/api/mutator"
import { roleLabels } from "@/lib/labels"

import { copy } from "@/features/settings/users/copy"

// The backend has no password rule (auth/schemas.py UserCreate), so the UI enforces one.
const MIN_PASSWORD = 10

export const roleItems = Object.values(UserOutRole).map((role) => ({ value: role, label: roleLabels[role] }))

export const createUserSchema = z.object({
  email: z.string().trim().pipe(z.email(copy.validation.email)),
  full_name: z.string().trim().max(255),
  role: z.enum(UserOutRole),
  password: z.string().min(MIN_PASSWORD, copy.validation.password),
})

export type CreateUserValues = z.infer<typeof createUserSchema>

export const newUserValues: CreateUserValues = { email: "", full_name: "", role: "sales", password: "" }

export const editUserSchema = z.object({
  full_name: z.string().trim().max(255),
  role: z.enum(UserOutRole),
  is_active: z.boolean(),
  password: z.string().refine((value) => value === "" || value.length >= MIN_PASSWORD, copy.validation.password),
})

export type EditUserValues = z.infer<typeof editUserSchema>

export function toEditValues(user: UserOut): EditUserValues {
  return { full_name: user.full_name ?? "", role: user.role, is_active: user.is_active, password: "" }
}

/** Only changed keys; `null` means "unchanged" to the backend, so a cleared name is sent as "". */
export function diffUser(user: UserOut, values: EditUserValues): UserUpdate {
  const patch: UserUpdate = {}
  const fullName = values.full_name.trim()
  if (fullName !== (user.full_name ?? "")) patch.full_name = fullName
  if (values.role !== user.role) patch.role = values.role
  if (values.is_active !== user.is_active) patch.is_active = values.is_active
  if (values.password) patch.password = values.password
  return patch
}

export const isConflict = (error: unknown) => error instanceof ApiError && error.status === 409

export const displayName = (user: UserOut) => user.full_name?.trim() || user.email

/** Active users first, then by name: the backend returns newest first. */
export function sortUsers(users: readonly UserOut[]) {
  return [...users].sort(
    (a, b) => Number(b.is_active) - Number(a.is_active) || displayName(a).localeCompare(displayName(b)),
  )
}
