import { zodResolver } from "@hookform/resolvers/zod"
import { useId, useMemo } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { formatNumber } from "@/lib/format"

import { copy } from "../copy"
import type { Catalog } from "../hooks/use-catalog"
import type { SearchDefaults } from "../hooks/use-icp-defaults"
import { ChipPicker, type PickerOption } from "./chip-picker"

export type SearchQuery = {
  countries: string[]
  industries: string[]
  employees_min: number
}

const schema = z.object({
  countries: z.array(z.string()).min(1),
  industries: z.array(z.string()).min(1),
  employees: z.string(),
})

type Values = z.infer<typeof schema>

const digits = (value: string) => value.replace(/\D/g, "")
const withSeparators = (value: string) =>
  digits(value) ? formatNumber(Number(digits(value))) : ""

export const fieldClass = "flex flex-col gap-1.5 text-[13px] font-semibold"

/** Catalog entries first (their order), then picked values the catalog does not know, labelled by their code. */
function withUnknown(
  options: PickerOption[],
  picked: string[]
): PickerOption[] {
  const known = new Set(options.map((option) => option.value))
  return [
    ...options,
    ...picked
      .filter((value) => !known.has(value))
      .map((value) => ({ value, label: value })),
  ]
}

export function SearchForm({
  defaults,
  catalog,
  searching,
  onSearch,
}: {
  defaults: SearchDefaults
  catalog: Catalog
  searching: boolean
  onSearch: (query: SearchQuery) => void
}) {
  const employeesId = useId()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      countries: defaults.countries,
      industries: defaults.industries,
      employees:
        defaults.employeesMin === null
          ? ""
          : formatNumber(defaults.employeesMin),
    },
  })

  // Read synchronously: `formState.isValid` settles only after the async resolver, so the button would flicker.
  const [countries, industries] = useWatch({
    control: form.control,
    name: ["countries", "industries"],
  })
  const complete = countries.length > 0 && industries.length > 0

  const countryOptions = useMemo(
    () =>
      withUnknown(
        catalog.countries.map((country) => ({
          value: country.code,
          label: country.name,
        })),
        defaults.countries
      ),
    [catalog.countries, defaults.countries]
  )
  const industryOptions = useMemo(
    () =>
      withUnknown(
        catalog.industries.map((industry) => ({
          value: industry.id,
          label: industry.label,
        })),
        defaults.industries
      ),
    [catalog.industries, defaults.industries]
  )

  // Empty = no minimum: 0 overrides the ICP minimum (the backend falls back to the ICP only for null).
  const submit = form.handleSubmit((values) =>
    onSearch({
      countries: values.countries,
      industries: values.industries,
      employees_min: Number(digits(values.employees)) || 0,
    })
  )

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className={fieldClass}>
        <span aria-hidden>{copy.panel.countries}</span>
        <Controller
          control={form.control}
          name="countries"
          render={({ field }) => (
            <ChipPicker
              label={copy.panel.countries}
              options={countryOptions}
              value={field.value}
              onChange={field.onChange}
              icpValue={defaults.countries}
              visible={5}
              moreFromIcp
              strings={copy.picker.countries}
            />
          )}
        />
      </div>
      <div className={fieldClass}>
        <span aria-hidden>{copy.panel.industries}</span>
        <Controller
          control={form.control}
          name="industries"
          render={({ field }) => (
            <ChipPicker
              label={copy.panel.industries}
              options={industryOptions}
              value={field.value}
              onChange={field.onChange}
              icpValue={defaults.industries}
              visible={4}
              strings={copy.picker.industries}
            />
          )}
        />
      </div>
      <div className={fieldClass}>
        <label htmlFor={employeesId}>{copy.panel.employees}</label>
        <Controller
          control={form.control}
          name="employees"
          render={({ field }) => (
            <Input
              id={employeesId}
              ref={field.ref}
              name={field.name}
              inputMode="numeric"
              autoComplete="off"
              placeholder={copy.panel.employeesPlaceholder}
              className="rounded-sm px-2.5 font-mono font-normal"
              value={field.value}
              onChange={(event) => field.onChange(digits(event.target.value))}
              onBlur={() => {
                field.onChange(withSeparators(field.value))
                field.onBlur()
              }}
            />
          )}
        />
      </div>
      <div className={fieldClass}>
        {copy.panel.sources}
        <p className="m-0 leading-[1.45] font-normal text-text-secondary">
          {copy.panel.sourcesText}
        </p>
      </div>
      <Button
        type="submit"
        variant="black"
        size="lg"
        className="w-full"
        disabled={searching || !complete}
      >
        {searching ? (
          <>
            <Spinner />
            {copy.panel.searching}
          </>
        ) : (
          copy.panel.search
        )}
      </Button>
      {!complete && !searching ? (
        <p className="m-0 -mt-2 text-[13px] text-muted-foreground">
          {copy.panel.incomplete}
        </p>
      ) : null}
    </form>
  )
}
