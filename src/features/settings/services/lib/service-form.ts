import { z } from "zod"

import type { ServiceOut, ServiceUpdate } from "@/api/generated/model"

import { copy } from "@/features/settings/services/copy"

export const MAX_ROLE_LENGTH = 80

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, copy.validation.name)
    .max(255, copy.validation.name),
  description: z.string(),
  value_proposition: z.string(),
  decision_makers: z.array(z.string()),
  is_active: z.boolean(),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>

export const emptyServiceValues: ServiceFormValues = {
  name: "",
  description: "",
  value_proposition: "",
  decision_makers: [],
  is_active: false,
}

export function toServiceValues(service: ServiceOut): ServiceFormValues {
  return {
    name: service.name,
    description: service.description,
    value_proposition: service.value_proposition,
    decision_makers: service.decision_makers,
    is_active: service.is_active,
  }
}

/** Trimmed text fields for both POST and PATCH. */
export function cleanServiceValues(
  values: ServiceFormValues
): ServiceFormValues {
  return {
    ...values,
    name: values.name.trim(),
    description: values.description.trim(),
    value_proposition: values.value_proposition.trim(),
  }
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index])

/**
 * Only the changed keys: `null` on any service column is a 500 (NOT NULL, config/router.py:164-165).
 * `is_active` is saved on its own by the checkbox, so it never goes through the form PATCH.
 */
export function diffService(
  service: ServiceOut,
  values: ServiceFormValues
): ServiceUpdate {
  const clean = cleanServiceValues(values)
  const patch: ServiceUpdate = {}
  if (clean.name !== service.name) patch.name = clean.name
  if (clean.description !== service.description)
    patch.description = clean.description
  if (clean.value_proposition !== service.value_proposition)
    patch.value_proposition = clean.value_proposition
  if (!sameList(clean.decision_makers, service.decision_makers))
    patch.decision_makers = clean.decision_makers
  return patch
}

/** Adds a role unless it is empty or already listed (case-insensitive). */
export function addRole(roles: readonly string[], input: string) {
  const role = input.trim().slice(0, MAX_ROLE_LENGTH)
  if (!role || roles.some((item) => item.toLowerCase() === role.toLowerCase()))
    return [...roles]
  return [...roles, role]
}
