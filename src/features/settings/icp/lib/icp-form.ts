import { z } from "zod"

import {
  CriterionKind,
  type Criterion,
  type ICPProfileIn,
  type ICPProfileOut,
} from "@/api/generated/model"
import { copy } from "@/features/settings/icp/copy"

const count = z.number().int().min(0).nullable()

/** employees_between: [min] or [min, max]; the engine reads min ≤ max (ai/scoring/fit.py). */
function employeesRangeValid(values: Criterion["values"]) {
  const [min, max] = values.map(Number)
  return max === undefined || min === undefined || max >= min
}

const criterionSchema = z
  .object({
    kind: z.enum(CriterionKind),
    values: z.array(z.union([z.string(), z.number()])),
    weight: z.number().positive(),
  })
  .superRefine((criterion, ctx) => {
    if (criterion.values.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["values"],
        message: copy.niceToHave.pickValue,
      })
    } else if (
      criterion.kind === "employees_between" &&
      !employeesRangeValid(criterion.values)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["values"],
        message: copy.mustHave.maxBelowMin,
      })
    }
  })

export const icpSchema = z
  .object({
    countries: z.array(z.string()),
    industries_any: z.array(z.string()),
    employees_min: count,
    employees_max: count,
    revenue_min_eur: z.number().min(0).nullable(),
    criteria: z.array(criterionSchema),
  })
  .refine(
    (values) =>
      values.employees_min === null ||
      values.employees_max === null ||
      values.employees_max >= values.employees_min,
    { path: ["employees_max"], message: copy.mustHave.maxBelowMin }
  )

export type IcpFormValues = z.infer<typeof icpSchema>

/** GET 404 ("ICP not configured") starts from an empty profile. */
export function toFormValues(icp: ICPProfileOut | null): IcpFormValues {
  return {
    countries: icp?.countries ?? [],
    industries_any: icp?.industries_any ?? [],
    employees_min: icp?.employees_min ?? null,
    employees_max: icp?.employees_max ?? null,
    revenue_min_eur: icp?.revenue_min_eur ?? null,
    criteria: icp?.nice_to_have?.criteria ?? [],
  }
}

/** PUT is a full replace: every key is sent (backend config/router.py put_icp). */
export function toPayload(values: IcpFormValues): ICPProfileIn {
  return {
    countries: values.countries,
    industries_any: values.industries_any,
    employees_min: values.employees_min,
    employees_max: values.employees_max,
    revenue_min_eur: values.revenue_min_eur,
    nice_to_have: { criteria: values.criteria },
  }
}

export const formFields = [
  "countries",
  "industries_any",
  "employees_min",
  "employees_max",
  "revenue_min_eur",
] as const satisfies readonly (keyof IcpFormValues)[]
