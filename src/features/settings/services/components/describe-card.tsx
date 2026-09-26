import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { z } from "zod"

import { useCreateService } from "@/api/generated/config/config"
import type { ServiceOut } from "@/api/generated/model"
import { errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { copy } from "@/features/settings/services/copy"
import { storeService } from "@/features/settings/services/hooks/use-service-writes"
import { uniqueSlug } from "@/features/settings/services/lib/service-summary"

const schema = z.object({
  name: z.string().trim().min(1, copy.validation.describeName).max(255, copy.validation.name),
  description: z.string().trim().min(20, copy.validation.describeText),
})

type Values = z.infer<typeof schema>

/**
 * Creates an inactive draft service, then opens its Questions screen with the suggestions sheet
 * (`?suggest=1`), which calls POST /services/{id}/questions/suggest. Suggestions are never stored.
 */
export function DescribeCard({ services }: { services: readonly ServiceOut[] }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "" } })
  const { errors, isSubmitting } = form.formState

  const create = useCreateService({
    mutation: {
      meta: { errorToast: false },
      onSuccess: (service) => {
        void storeService(queryClient, service)
        void navigate(`/settings/${service.id}/questions?suggest=1`)
      },
      onError: (error) => {
        const fields = fieldErrors(error)
        if (fields.name) form.setError("name", { message: fields.name })
        else if (fields.description) form.setError("description", { message: fields.description })
        else form.setError("root", { message: errorMessage(error) })
      },
    },
  })

  const submit = form.handleSubmit(({ name, description }) =>
    create.mutate({ data: { name, slug: uniqueSlug(name, services), description, is_active: false } }),
  )

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="describe-title"
      className="flex flex-col gap-3 rounded-lg bg-primary-surface p-5"
    >
      <h2 id="describe-title" className="m-0 text-base font-bold">
        {copy.describe.title}
      </h2>
      <div className="flex flex-col gap-1.5 text-[13px]">
        <label htmlFor="describe-name">{copy.describe.name}</label>
        <Input
          id="describe-name"
          autoComplete="off"
          aria-invalid={!!errors.name}
          className="rounded-sm px-2.5"
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </div>
      <div className="flex flex-col gap-1.5 text-[13px]">
        <label htmlFor="describe-text">{copy.describe.description}</label>
        <Textarea
          id="describe-text"
          rows={4}
          placeholder={copy.describe.placeholder}
          aria-invalid={!!errors.description}
          className="min-h-0 resize-y rounded-sm px-2.5 py-2.5 field-sizing-fixed"
          {...form.register("description")}
        />
        <FieldError errors={[errors.description]} />
      </div>
      <FieldError errors={[errors.root]} />
      <Button type="submit" variant="black" className="self-start" disabled={isSubmitting || create.isPending}>
        {create.isPending ? copy.describe.submitting : copy.describe.submit}
      </Button>
      <p className="m-0 text-xs leading-[1.45] text-text-secondary">{copy.describe.note}</p>
    </form>
  )
}
