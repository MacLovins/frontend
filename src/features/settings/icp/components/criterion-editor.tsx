import { useId, useState } from "react"

import type { Criterion } from "@/api/generated/model"
import { Field, FieldLabel } from "@/components/ui/field"
import { ChipInput } from "@/features/settings/icp/components/chip-input"
import { NumberInput } from "@/features/settings/icp/components/number-input"
import {
  CountryCommand,
  IndustryCommand,
} from "@/features/settings/icp/components/pickers"
import { copy } from "@/features/settings/icp/copy"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"

const strings = copy.niceToHave

type Values = Criterion["values"]

function toNumber(value: Values[number] | undefined) {
  if (value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function LabelledNumber({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  const id = useId()
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id} className="font-semibold text-black">
        {label}
      </FieldLabel>
      <NumberInput id={id} value={value} onChange={onChange} />
    </Field>
  )
}

/** employees_between: [min] or [min, max]. Local state keeps "at most" while "at least" is still empty. */
function EmployeesEditor({
  values,
  onChange,
}: {
  values: Values
  onChange: (values: Values) => void
}) {
  const [range, setRange] = useState(() => ({
    min: toNumber(values[0]),
    max: toNumber(values[1]),
  }))
  const update = (next: typeof range) => {
    setRange(next)
    if (next.min === null) onChange(next.max === null ? [] : [0, next.max])
    else onChange(next.max === null ? [next.min] : [next.min, next.max])
  }
  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      <LabelledNumber
        label={strings.atLeast}
        value={range.min}
        onChange={(min) => update({ ...range, min })}
      />
      <LabelledNumber
        label={strings.atMost}
        value={range.max}
        onChange={(max) => update({ ...range, max })}
      />
    </div>
  )
}

/** Popover body that edits one nice-to-have criterion's values. */
export function CriterionEditor({
  criterion,
  onChange,
  countries,
  industries,
}: {
  criterion: Criterion
  onChange: (values: Values) => void
  countries: CountryCatalog
  industries: IndustryCatalog
}) {
  const selected = criterion.values.map(String)
  switch (criterion.kind) {
    case "country_in":
      return (
        <CountryCommand
          value={selected}
          onChange={onChange}
          countries={countries}
        />
      )
    case "industry_in":
      return (
        <IndustryCommand
          value={selected}
          onChange={onChange}
          industries={industries}
        />
      )
    case "employees_between":
      return <EmployeesEditor values={criterion.values} onChange={onChange} />
    case "revenue_at_least":
      return (
        <div className="p-3">
          <LabelledNumber
            label={strings.revenue}
            value={toNumber(criterion.values[0])}
            onChange={(value) => onChange(value === null ? [] : [value])}
          />
        </div>
      )
    case "tag_in":
      return (
        <div className="p-3">
          <ChipInput
            values={selected}
            onChange={onChange}
            label={copy.niceToHave.kinds.tag_in}
            placeholder={`+ ${strings.tag}`}
          />
        </div>
      )
  }
}
