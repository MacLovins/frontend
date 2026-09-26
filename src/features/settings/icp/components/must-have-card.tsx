import { useId } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { MarketsField } from "@/features/settings/icp/components/markets-field"
import { MultiPicker } from "@/features/settings/icp/components/multi-picker"
import { NumberInput } from "@/features/settings/icp/components/number-input"
import { IndustryCommand } from "@/features/settings/icp/components/pickers"
import { SettingsCard } from "@/features/settings/icp/components/settings-card"
import { copy } from "@/features/settings/icp/copy"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import type { IcpFormValues } from "@/features/settings/icp/lib/icp-form"

const strings = copy.mustHave

type NumberName = "employees_min" | "employees_max" | "revenue_min_eur"

const numberFields: {
  name: NumberName
  label: string
  placeholder?: string
}[] = [
  { name: "employees_min", label: strings.employeesMin },
  {
    name: "employees_max",
    label: strings.employeesMax,
    placeholder: strings.noLimit,
  },
  {
    name: "revenue_min_eur",
    label: strings.revenueMin,
    placeholder: strings.any,
  },
]

function NumberField({
  name,
  label,
  placeholder,
}: (typeof numberFields)[number]) {
  const id = useId()
  return (
    <Controller<IcpFormValues, NumberName>
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-1.5">
          <FieldLabel
            htmlFor={id}
            className="text-[13px] font-semibold text-black"
          >
            {label}
          </FieldLabel>
          <NumberInput
            id={id}
            ref={field.ref}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function MustHaveCard({
  countries,
  industries,
}: {
  countries: CountryCatalog
  industries: IndustryCatalog
}) {
  const { control } = useFormContext<IcpFormValues>()

  return (
    <SettingsCard
      title={strings.title}
      description={strings.description}
      className="gap-[18px]"
    >
      <Controller
        control={control}
        name="countries"
        render={({ field }) => (
          <MarketsField
            value={field.value}
            onChange={field.onChange}
            countries={countries}
          />
        )}
      />
      <div className="grid grid-cols-3 gap-3">
        {numberFields.map((item) => (
          <NumberField key={item.name} {...item} />
        ))}
      </div>
      <Controller
        control={control}
        name="industries_any"
        render={({ field }) => (
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-semibold">
              {strings.industries}
              <span className="font-normal text-muted-foreground">
                {strings.industriesHint}
              </span>
            </div>
            <MultiPicker
              values={field.value}
              labelOf={industries.label}
              placeholder={strings.anyIndustry}
              label={strings.chooseIndustries}
              onRemove={(id) =>
                field.onChange(field.value.filter((item) => item !== id))
              }
            >
              <IndustryCommand
                value={field.value}
                onChange={field.onChange}
                industries={industries}
              />
            </MultiPicker>
          </div>
        )}
      />
    </SettingsCard>
  )
}
