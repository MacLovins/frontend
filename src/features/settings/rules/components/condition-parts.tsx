import { useRef } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"

import type {
  FirmographicConditionField,
  FirmographicConditionOp,
} from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChipInput } from "@/features/settings/icp/components/chip-input"
import { MultiPicker } from "@/features/settings/icp/components/multi-picker"
import { NumberInput } from "@/features/settings/icp/components/number-input"
import {
  CountryCommand,
  IndustryCommand,
} from "@/features/settings/icp/components/pickers"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import {
  SentenceSelect,
  type SentenceItem,
} from "@/features/settings/rules/components/sentence-select"
import { copy } from "@/features/settings/rules/copy"
import { strengthWord } from "@/features/settings/rules/lib/describe"
import {
  normalizeDomain,
  parseDomains,
} from "@/features/settings/rules/lib/domains"
import {
  fieldOps,
  isNumericField,
  isTextValue,
  type RuleDraft,
} from "@/features/settings/rules/lib/rule-form"

const strings = copy.editor
const dirty = { shouldDirty: true }

function opLabel(
  field: FirmographicConditionField,
  op: FirmographicConditionOp
) {
  if (op === "eq" && field === "domain") return strings.domainIs
  if (op === "not_in" && (field === "industry_ids" || field === "tags"))
    return strings.noneOf
  return strings.ops[op]
}

const fieldItems = (
  Object.keys(strings.fields) as FirmographicConditionField[]
).map((value) => ({
  value,
  label: strings.fields[value],
}))

/** `[field ▾] [operator ▾] [value]` of a company-data rule. */
export function FirmographicPart({
  countries,
  industries,
}: {
  countries: CountryCatalog
  industries: IndustryCatalog
}) {
  const { control, setValue, formState } = useFormContext<RuleDraft>()
  const [field, op] = useWatch({ control, name: ["field", "op"] })
  const { errors } = formState

  return (
    <>
      <Controller
        control={control}
        name="field"
        render={({ field: input }) => (
          <SentenceSelect
            label={strings.fieldLabel}
            value={input.value}
            items={fieldItems}
            onChange={(next) => {
              input.onChange(next)
              setValue("op", fieldOps[next][0], dirty)
              setValue("amount", null, dirty)
              setValue("text", "", dirty)
              setValue("items", [], dirty)
            }}
          />
        )}
      />
      <Controller
        control={control}
        name="op"
        render={({ field: input }) => (
          <SentenceSelect
            label={strings.opLabel}
            value={input.value}
            items={fieldOps[field].map((value) => ({
              value,
              label: opLabel(field, value),
            }))}
            onChange={input.onChange}
          />
        )}
      />
      {isNumericField(field) ? (
        <Controller
          control={control}
          name="amount"
          render={({ field: input }) => (
            <NumberInput
              aria-label={strings.valueLabel}
              aria-invalid={!!errors.amount}
              value={input.value}
              onChange={input.onChange}
              onBlur={input.onBlur}
              className="w-[120px] px-3 text-base"
            />
          )}
        />
      ) : isTextValue(field, op) ? (
        <Controller
          control={control}
          name="text"
          render={({ field: input }) => (
            <Input
              aria-label={strings.valueLabel}
              aria-invalid={!!errors.text}
              placeholder={strings.domainPlaceholder}
              value={input.value}
              onChange={input.onChange}
              onBlur={() => {
                input.onChange(normalizeDomain(input.value))
                input.onBlur()
              }}
              className="w-[240px] rounded-sm text-base"
            />
          )}
        />
      ) : (
        <Controller
          control={control}
          name="items"
          render={({ field: input }) => {
            const remove = (value: string) =>
              input.onChange(input.value.filter((item) => item !== value))
            const box = "min-w-[240px] max-w-[480px] flex-1"
            if (field === "country_code") {
              return (
                <MultiPicker
                  values={input.value}
                  labelOf={countries.name}
                  placeholder={strings.pickCountries}
                  label={strings.pickCountries}
                  invalid={!!errors.items}
                  onRemove={remove}
                  className={box}
                >
                  <CountryCommand
                    value={input.value}
                    onChange={input.onChange}
                    countries={countries}
                  />
                </MultiPicker>
              )
            }
            if (field === "industry_ids") {
              return (
                <MultiPicker
                  values={input.value}
                  labelOf={industries.label}
                  placeholder={strings.pickIndustries}
                  label={strings.pickIndustries}
                  invalid={!!errors.items}
                  onRemove={remove}
                  className={box}
                >
                  <IndustryCommand
                    value={input.value}
                    onChange={input.onChange}
                    industries={industries}
                  />
                </MultiPicker>
              )
            }
            const domains = field === "domain"
            return (
              <ChipInput
                values={input.value}
                onChange={input.onChange}
                label={strings.valueLabel}
                placeholder={domains ? strings.addDomain : strings.addTag}
                normalize={domains ? normalizeDomain : undefined}
                invalid={!!errors.items}
                className={box}
              />
            )
          }}
        />
      )}
    </>
  )
}

const strengthItems = copy.strengths.map((item) => ({
  value: String(item.value),
  label: item.label,
}))

/** `[question ▾] is at least [strength ▾]` of a signal rule. */
export function SignalPart({
  questionItems,
}: {
  questionItems: SentenceItem<string>[]
}) {
  const { control, formState } = useFormContext<RuleDraft>()
  return (
    <>
      <Controller
        control={control}
        name="questionKey"
        render={({ field: input }) => (
          <SentenceSelect
            label={strings.questionLabel}
            value={input.value || null}
            items={questionItems}
            placeholder={strings.pickQuestionPlaceholder}
            invalid={!!formState.errors.questionKey}
            onChange={input.onChange}
          />
        )}
      />
      <span>{strings.isAtLeast}</span>
      <Controller
        control={control}
        name="minStrength"
        render={({ field: input }) => (
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <SentenceSelect
                label={strings.strengthLabel}
                value={String(input.value)}
                items={strengthItems}
                onChange={(next) => input.onChange(Number(next))}
                renderValue={(value) => strengthWord(Number(value))}
              />
            </TooltipTrigger>
            <TooltipContent>{strings.minStrength(input.value)}</TooltipContent>
          </Tooltip>
        )}
      />
    </>
  )
}

/** `is in [domain list]` of a list rule: pasted or uploaded domains, one per line. */
export function ListPart() {
  const { control, register, setValue, getValues, formState } =
    useFormContext<RuleDraft>()
  const text = useWatch({ control, name: "domains" })
  const fileInput = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    const merged = parseDomains(`${getValues("domains")}\n${await file.text()}`)
    setValue("domains", merged.join("\n"), {
      shouldDirty: true,
      shouldValidate: formState.isSubmitted,
    })
  }

  return (
    <>
      <span>{strings.isIn}</span>
      <div className="flex basis-full flex-col gap-2">
        <Textarea
          aria-label={strings.domainsLabel}
          aria-invalid={!!formState.errors.domains}
          placeholder={strings.domainsPlaceholder}
          rows={4}
          spellCheck={false}
          className="max-h-60 rounded-sm font-mono text-[13px]"
          {...register("domains")}
        />
        <div className="flex items-center gap-3 text-[13px]">
          <Button
            type="button"
            variant="link"
            className="text-[13px]"
            onClick={() => fileInput.current?.click()}
          >
            {strings.upload}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) void upload(file)
            }}
          />
          <span className="text-muted-foreground">
            {strings.domainCount(parseDomains(text).length)}
          </span>
        </div>
      </div>
    </>
  )
}
