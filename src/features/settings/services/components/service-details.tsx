import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useRef } from "react"
import { Controller, useForm, type UseFormSetError } from "react-hook-form"
import { toast } from "sonner"

import {
  useCreateService,
  useUpdateService,
} from "@/api/generated/config/config"
import type { ServiceOut } from "@/api/generated/model"
import { ApiError, errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { DecisionMakersInput } from "@/features/settings/services/components/decision-makers-input"
import { ExportYamlButton } from "@/features/settings/services/components/export-yaml-button"
import { UnsavedChangesGuard } from "@/features/settings/services/components/unsaved-changes-guard"
import { copy } from "@/features/settings/services/copy"
import {
  storeService,
  useToggleServiceActive,
} from "@/features/settings/services/hooks/use-service-writes"
import {
  cleanServiceValues,
  diffService,
  emptyServiceValues,
  serviceSchema,
  type ServiceFormValues,
  toServiceValues,
} from "@/features/settings/services/lib/service-form"
import { uniqueSlug } from "@/features/settings/services/lib/service-summary"

const FIELDS = [
  "name",
  "description",
  "value_proposition",
  "decision_makers",
] as const

function reportSaveError(
  error: unknown,
  setError: UseFormSetError<ServiceFormValues>
) {
  const errors = fieldErrors(error)
  const field = FIELDS.find((name) => errors[name])
  if (field) {
    setError(field, { message: errors[field] })
    return
  }
  toast.error(
    error instanceof ApiError && error.status < 500
      ? errorMessage(error)
      : copy.toast.saveFailed
  )
}

function FormRow({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string
  label: string
  help?: string
  error?: { message?: string }
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {help ? (
        <p id={`${id}-help`} className="m-0 text-[13px] text-muted-foreground">
          {help}
        </p>
      ) : null}
      {children}
      <FieldError errors={[error]} />
    </div>
  )
}

const textareaClass =
  "min-h-0 resize-y rounded-sm px-2.5 py-2.5 field-sizing-fixed"

/** The details form: edits the selected service, or creates one when `service` is undefined. */
export function ServiceDetails({
  service,
  services,
  onCreated,
  onCancel,
}: {
  service: ServiceOut | undefined
  services: readonly ServiceOut[]
  onCreated: (serviceId: string) => void
  onCancel: () => void
}) {
  const queryClient = useQueryClient()
  const bypassGuard = useRef(false)
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? toServiceValues(service) : emptyServiceValues,
  })
  const { errors, isDirty, isSubmitting } = form.formState
  const activeToggle = useToggleServiceActive()

  const update = useUpdateService({
    mutation: {
      meta: { errorToast: false },
      onSuccess: (saved) => {
        form.reset(toServiceValues(saved))
        toast.success(copy.toast.saved)
        return storeService(queryClient, saved)
      },
      onError: (error) => reportSaveError(error, form.setError),
    },
  })
  const create = useCreateService({
    mutation: {
      meta: { errorToast: false },
      onSuccess: (created) => {
        toast.success(copy.toast.created)
        // The list must hold the new service before the page selects it.
        const stored = storeService(queryClient, created)
        bypassGuard.current = true
        onCreated(created.id)
        return stored
      },
      onError: (error) => reportSaveError(error, form.setError),
    },
  })
  // isSubmitting covers the async validation before mutate(), so a double click cannot POST the same slug twice.
  const pending = isSubmitting || update.isPending || create.isPending
  const submitLabel = service
    ? update.isPending
      ? copy.details.saving
      : copy.details.save
    : create.isPending
      ? copy.details.creating
      : copy.details.create

  const submit = form.handleSubmit((values) => {
    if (!service) {
      const clean = cleanServiceValues(values)
      create.mutate({
        data: { ...clean, slug: uniqueSlug(clean.name, services) },
      })
      return
    }
    const patch = diffService(service, values)
    if (Object.keys(patch).length === 0) form.reset(values)
    else update.mutate({ id: service.id, data: patch })
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label={
        service ? copy.details.title(service.name) : copy.details.createTitle
      }
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-6"
    >
      <UnsavedChangesGuard dirty={isDirty} bypass={bypassGuard} />
      <div className="flex items-center justify-between gap-4">
        <h2 className="m-0 min-w-0 truncate text-lg font-bold">
          {service
            ? copy.details.title(service.name)
            : copy.details.createTitle}
        </h2>
        <label className="flex shrink-0 items-center gap-2 text-sm">
          {service ? (
            <Checkbox
              className="size-[18px]"
              checked={service.is_active}
              disabled={activeToggle.isPending}
              onCheckedChange={(checked) =>
                activeToggle.toggle(service.id, checked)
              }
            />
          ) : (
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <Checkbox
                  className="size-[18px]"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          )}
          {copy.details.active}
        </label>
      </div>

      <FormRow id="service-name" label={copy.details.name} error={errors.name}>
        <Input
          id="service-name"
          autoComplete="off"
          aria-invalid={!!errors.name}
          className="rounded-sm px-2.5"
          {...form.register("name")}
        />
      </FormRow>
      <FormRow
        id="service-description"
        label={copy.details.description}
        help={copy.details.descriptionHelp}
        error={errors.description}
      >
        <Textarea
          id="service-description"
          rows={3}
          aria-describedby="service-description-help"
          aria-invalid={!!errors.description}
          className={textareaClass}
          {...form.register("description")}
        />
      </FormRow>
      <FormRow
        id="service-value"
        label={copy.details.valueProposition}
        help={copy.details.valuePropositionHelp}
        error={errors.value_proposition}
      >
        <Textarea
          id="service-value"
          rows={3}
          aria-describedby="service-value-help"
          aria-invalid={!!errors.value_proposition}
          className={textareaClass}
          {...form.register("value_proposition")}
        />
      </FormRow>
      <div
        role="group"
        aria-labelledby="service-roles-label"
        className="flex flex-col gap-2"
      >
        <div id="service-roles-label" className="text-[13px] font-semibold">
          {copy.details.decisionMakers}
        </div>
        <Controller
          control={form.control}
          name="decision_makers"
          render={({ field }) => (
            <DecisionMakersInput
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FieldError errors={[errors.decision_makers]} />
      </div>

      <div className="flex justify-end gap-2">
        {service ? (
          <ExportYamlButton service={service} />
        ) : (
          <Button type="button" variant="outline" onClick={onCancel}>
            {copy.details.cancel}
          </Button>
        )}
        <Button
          type="submit"
          variant="black"
          disabled={(!isDirty && !!service) || pending}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
