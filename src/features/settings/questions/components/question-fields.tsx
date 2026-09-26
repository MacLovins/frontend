import { cn } from "cn"
import { useId, type ReactNode } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"

import { SignalCategory } from "@/api/generated/model"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  copy,
  polarityCopy,
  weightNames,
  weightOrder,
  windowOptions,
} from "@/features/settings/questions/copy"
import { SourceToggles } from "@/features/settings/questions/components/source-toggles"
import type { QuestionFormValues } from "@/features/settings/questions/lib/question-form"
import { useLabels } from "@/hooks/use-labels"

const labelClass = "text-[13px] font-semibold text-black"
const optionClass = "h-10 flex-1 rounded-sm text-[13px]"

/** A labelled field; controls without a single input are named by the title instead of a <label>. */
function Block({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <Field aria-labelledby={htmlFor ? undefined : titleId} className="min-w-0">
      {htmlFor ? (
        <FieldLabel htmlFor={htmlFor} className={labelClass}>
          {label}
        </FieldLabel>
      ) : (
        <FieldTitle id={titleId} className={labelClass}>
          {label}
        </FieldTitle>
      )}
      {children}
    </Field>
  )
}

function windowItems(current: number) {
  const known = windowOptions.some((option) => option.value === current)
  return known
    ? windowOptions
    : [...windowOptions, { value: current, label: `${current} days` }].sort(
        (a, b) => a.value - b.value
      )
}

export function QuestionFields({
  form,
  disabled,
}: {
  form: UseFormReturn<QuestionFormValues>
  /** A turned-off question is shown read-only. */
  disabled: boolean
}) {
  const label = useLabels()
  const { control, register, formState } = form
  const textId = useId()
  const categoryId = useId()
  const windowId = useId()
  const categoryItems = Object.values(SignalCategory).map((value) => ({
    value,
    label: label("categories", value),
  }))

  return (
    <>
      <Block label={copy.sheet.text} htmlFor={textId}>
        <Textarea
          id={textId}
          rows={3}
          disabled={disabled}
          aria-invalid={!!formState.errors.text}
          aria-describedby={`${textId}-help`}
          className="rounded-sm p-2.5 text-[15px] leading-[1.45]"
          {...register("text")}
        />
        <span
          id={`${textId}-help`}
          className="text-[13px] text-muted-foreground"
        >
          {copy.sheet.textHelp}
        </span>
        <FieldError errors={[formState.errors.text]} />
      </Block>

      <div className="grid grid-cols-2 gap-3">
        <Block label={copy.sheet.category} htmlFor={categoryId}>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select
                items={categoryItems}
                value={field.value}
                disabled={disabled}
                onValueChange={(value) => value && field.onChange(value)}
              >
                <SelectTrigger
                  id={categoryId}
                  className="w-full rounded-sm px-2"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Block>

        <Block label={copy.sheet.effect}>
          <Controller
            control={control}
            name="polarity"
            render={({ field }) => (
              <ToggleGroup
                variant="outline"
                spacing={1}
                className="w-full"
                disabled={disabled}
                value={[field.value]}
                onValueChange={([next]) => {
                  if (next === "positive" || next === "negative")
                    field.onChange(next)
                }}
              >
                <ToggleGroupItem
                  value="positive"
                  className={cn(
                    optionClass,
                    "data-pressed:border-positive-strong data-pressed:bg-positive-surface data-pressed:font-bold data-pressed:text-positive-strong"
                  )}
                >
                  {polarityCopy.positive.option}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="negative"
                  className={cn(
                    optionClass,
                    "data-pressed:border-negative-strong data-pressed:bg-negative-surface data-pressed:font-bold data-pressed:text-negative-strong"
                  )}
                >
                  {polarityCopy.negative.option}
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          />
        </Block>

        <Block label={copy.sheet.importance}>
          <Controller
            control={control}
            name="weight"
            render={({ field }) => (
              <ToggleGroup
                variant="outline"
                spacing={1}
                className="w-full"
                disabled={disabled}
                value={[field.value]}
                onValueChange={([next]) => {
                  const weight = weightOrder.find((item) => item === next)
                  if (weight) field.onChange(weight)
                }}
              >
                {weightOrder.map((weight) => (
                  <ToggleGroupItem
                    key={weight}
                    value={weight}
                    className={optionClass}
                  >
                    {weightNames[weight]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </Block>

        <Block label={copy.sheet.window} htmlFor={windowId}>
          <Controller
            control={control}
            name="recency_days"
            render={({ field }) => {
              const items = windowItems(field.value)
              return (
                <Select
                  items={items}
                  value={field.value}
                  disabled={disabled}
                  onValueChange={(value) => value && field.onChange(value)}
                >
                  <SelectTrigger
                    id={windowId}
                    className="w-full rounded-sm px-2"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }}
          />
        </Block>
      </div>

      <Block label={copy.sheet.sources}>
        <Controller
          control={control}
          name="source_types"
          render={({ field }) => (
            <SourceToggles
              value={field.value}
              disabled={disabled}
              onChange={field.onChange}
            />
          )}
        />
        <FieldError errors={[formState.errors.source_types]} />
      </Block>
    </>
  )
}
