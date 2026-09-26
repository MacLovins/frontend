import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Controller, useForm, type UseFormReturn } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

import { useCreateCompany } from "@/api/generated/accounts/accounts"
import { useGetCountries, useGetIndustries } from "@/api/generated/meta/meta"
import type { CompanyCreate } from "@/api/generated/model"
import { ApiError, errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DialogBar,
  DialogBody,
  ErrorBox,
} from "@/features/accounts/components/dialog-parts"
import { copy } from "@/features/accounts/copy"
import { useStartAnalysis } from "@/features/accounts/hooks/use-start-analysis"
import { invalidateCompanyLists } from "@/features/accounts/lib/cache"

const schema = z.object({
  name: z.string().trim().min(1, copy.add.nameRequired).max(255),
  // The API accepts any non-empty host (accounts/router.py), but CSV import rejects hosts without a dot; match that.
  domain: z
    .string()
    .trim()
    .min(1, copy.add.domainRequired)
    .max(255)
    .refine((value) => value.includes("."), copy.add.invalidDomain),
  country: z.string().nullable(),
  industry: z.string().nullable(),
  employees: z.string().trim().regex(/^\d*$/, copy.add.wholeNumber),
  analyze: z.boolean(),
})

type Values = z.infer<typeof schema>
type Form = UseFormReturn<Values>

const defaults: Values = {
  name: "",
  domain: "",
  country: null,
  industry: null,
  employees: "",
  analyze: true,
}

const serverFields: Record<string, keyof Values> = {
  name: "name",
  domain: "domain",
  country_code: "country",
  industry_ids: "industry",
  employees: "employees",
}

function toBody(values: Values): CompanyCreate {
  return {
    name: values.name,
    domain: values.domain,
    ...(values.country ? { country_code: values.country } : {}),
    ...(values.industry ? { industry_ids: [values.industry] } : {}),
    ...(values.employees ? { employees: Number(values.employees) } : {}),
  }
}

function showServerError(form: Form, error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    form.setError(
      "domain",
      { message: copy.add.duplicateDomain },
      { shouldFocus: true }
    )
    return
  }
  if (error instanceof ApiError && error.status === 400) {
    form.setError(
      "domain",
      { message: copy.add.invalidDomain },
      { shouldFocus: true }
    )
    return
  }
  const fields = Object.entries(fieldErrors(error)).filter(
    ([path]) => path in serverFields
  )
  if (fields.length === 0) {
    form.setError("root", { message: errorMessage(error) })
    return
  }
  for (const [path, message] of fields)
    form.setError(serverFields[path], { message })
}

type Option = { value: string | null; label: string }

function withNotSet(options: Option[]): Option[] {
  return [
    { value: null, label: copy.add.notSet },
    ...options.sort((a, b) => a.label.localeCompare(b.label)),
  ]
}

function OptionSelect({
  form,
  name,
  id,
  options,
  loading,
}: {
  form: Form
  name: "country" | "industry"
  id: string
  options: Option[]
  loading: boolean
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Select
          items={options}
          value={field.value}
          onValueChange={field.onChange}
          disabled={loading}
        >
          <SelectTrigger
            id={id}
            className="w-full rounded-sm"
            onBlur={field.onBlur}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {options.map((option) => (
              <SelectItem key={option.value ?? ""} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

function CountrySelect({ form }: { form: Form }) {
  const countries = useGetCountries({ query: { staleTime: Infinity } })
  const options = useMemo(
    () =>
      withNotSet(
        (countries.data ?? []).map((country) => ({
          value: country.code,
          label: country.name,
        }))
      ),
    [countries.data]
  )
  return (
    <OptionSelect
      form={form}
      name="country"
      id="company-country"
      options={options}
      loading={countries.isPending}
    />
  )
}

function IndustrySelect({ form }: { form: Form }) {
  const industries = useGetIndustries({ query: { staleTime: Infinity } })
  const options = useMemo(
    () =>
      withNotSet(
        (industries.data ?? []).map((industry) => ({
          value: industry.id,
          label: industry.label,
        }))
      ),
    [industries.data]
  )
  return (
    <OptionSelect
      form={form}
      name="industry"
      id="company-industry"
      options={options}
      loading={industries.isPending}
    />
  )
}

function AddCompanyForm({
  onBusyChange,
  onDone,
}: {
  onBusyChange: (busy: boolean) => void
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const create = useCreateCompany({ mutation: { meta: { errorToast: false } } })
  const { start, runPath } = useStartAnalysis()
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    onBusyChange(true)
    try {
      const company = await create
        .mutateAsync({ data: toBody(values) })
        .catch((error: unknown) => {
          showServerError(form, error)
          return null
        })
      if (!company) return
      void invalidateCompanyLists(queryClient)
      const run = values.analyze ? await start([company.id]) : null
      if (run) {
        toast.success(copy.add.addedAndStarted(company.name), {
          action: {
            label: copy.add.viewRun,
            onClick: () => void navigate(runPath(run.id)),
          },
        })
      } else {
        toast.success(copy.add.added(company.name))
      }
      onDone()
    } finally {
      onBusyChange(false)
    }
  })

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
      <DialogBar title={copy.add.title} closeDisabled={isSubmitting} />
      <DialogBody>
        <Field data-invalid={!!errors.name} className="gap-1.5">
          <FieldLabel
            htmlFor="company-name"
            className="font-semibold text-black"
          >
            {copy.add.name}
          </FieldLabel>
          <Input
            id="company-name"
            autoFocus
            className="rounded-sm"
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.domain} className="gap-1.5">
          <FieldLabel
            htmlFor="company-domain"
            className="font-semibold text-black"
          >
            {copy.add.domain}
          </FieldLabel>
          <Input
            id="company-domain"
            placeholder={copy.add.domainPlaceholder}
            autoComplete="off"
            className="rounded-sm"
            aria-invalid={!!errors.domain}
            {...form.register("domain")}
          />
          <FieldError errors={[errors.domain]} />
        </Field>
        <Field data-invalid={!!errors.country} className="gap-1.5">
          <FieldLabel
            htmlFor="company-country"
            className="font-semibold text-black"
          >
            {copy.add.country}
          </FieldLabel>
          <CountrySelect form={form} />
          <FieldError errors={[errors.country]} />
        </Field>
        <Field data-invalid={!!errors.industry} className="gap-1.5">
          <FieldLabel
            htmlFor="company-industry"
            className="font-semibold text-black"
          >
            {copy.add.industry}
          </FieldLabel>
          <IndustrySelect form={form} />
          <FieldError errors={[errors.industry]} />
        </Field>
        <Field data-invalid={!!errors.employees} className="gap-1.5">
          <FieldLabel
            htmlFor="company-employees"
            className="font-semibold text-black"
          >
            {copy.add.employees}
          </FieldLabel>
          <Input
            id="company-employees"
            inputMode="numeric"
            className="rounded-sm font-mono"
            aria-invalid={!!errors.employees}
            {...form.register("employees")}
          />
          <FieldError errors={[errors.employees]} />
        </Field>
        <Controller
          control={form.control}
          name="analyze"
          render={({ field }) => (
            <Label className="gap-2.5 text-sm text-black">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className="size-[18px]"
              />
              {copy.add.analyze}
            </Label>
          )}
        />
        {errors.root ? <ErrorBox>{errors.root.message}</ErrorBox> : null}
      </DialogBody>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onDone}
        >
          {copy.add.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.add.submitting : copy.add.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AddCompanyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(520px,calc(100%-2rem))]"
      >
        <AddCompanyForm
          onBusyChange={setBusy}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
