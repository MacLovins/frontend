import { useState } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"

import type { CriterionKind } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CriterionRow } from "@/features/settings/icp/components/criterion-row"
import { SettingsCard } from "@/features/settings/icp/components/settings-card"
import { copy } from "@/features/settings/icp/copy"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import type { IcpFormValues } from "@/features/settings/icp/lib/icp-form"

const strings = copy.niceToHave

const addKinds: CriterionKind[] = [
  "country_in",
  "industry_in",
  "employees_between",
  "revenue_at_least",
  "tag_in",
]

export function NiceToHaveCard({
  countries,
  industries,
}: {
  countries: CountryCatalog
  industries: IndustryCatalog
}) {
  const { control, setValue, formState } = useFormContext<IcpFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria",
  })
  const criteria = useWatch({ control, name: "criteria" })
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  // The new criterion's editor opens once the menu has closed, so the menu's focus return does not dismiss it.
  const [pendingOpen, setPendingOpen] = useState<number | null>(null)
  const validate = formState.isSubmitted

  return (
    <SettingsCard
      title={strings.title}
      description={strings.description}
      className="gap-4"
    >
      {fields.map((field, index) => {
        const criterion = criteria[index]
        if (!criterion) return null
        return (
          <CriterionRow
            key={field.id}
            criterion={criterion}
            error={formState.errors.criteria?.[index]?.values?.message}
            open={openIndex === index}
            onOpenChange={(open) => setOpenIndex(open ? index : null)}
            onValues={(values) =>
              setValue(`criteria.${index}.values`, values, {
                shouldDirty: true,
                shouldValidate: validate,
              })
            }
            onWeight={(weight) =>
              setValue(`criteria.${index}.weight`, weight, {
                shouldDirty: true,
              })
            }
            onRemove={() => {
              setOpenIndex(null)
              remove(index)
            }}
            countries={countries}
            industries={industries}
          />
        )
      })}
      <DropdownMenu
        onOpenChangeComplete={(open) => {
          if (open || pendingOpen === null) return
          setOpenIndex(pendingOpen)
          setPendingOpen(null)
        }}
      >
        <DropdownMenuTrigger
          render={<Button variant="outline-dashed" className="self-start" />}
        >
          {strings.add}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {addKinds.map((kind) => (
            <DropdownMenuItem
              key={kind}
              onClick={() => {
                append({ kind, values: [], weight: 1 }, { shouldFocus: false })
                setPendingOpen(fields.length)
              }}
            >
              {strings.kinds[kind]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SettingsCard>
  )
}
