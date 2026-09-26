import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import { useCreateUser } from "@/api/generated/auth/auth"
import { errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { FormRow } from "@/features/settings/users/components/form-row"
import { RoleSelect } from "@/features/settings/users/components/role-select"
import { copy } from "@/features/settings/users/copy"
import {
  createUserSchema,
  type CreateUserValues,
  isConflict,
  newUserValues,
} from "@/features/settings/users/lib/user-form"

export function AddUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const form = useForm<CreateUserValues>({ resolver: zodResolver(createUserSchema), defaultValues: newUserValues })
  const { errors, isSubmitting } = form.formState

  const create = useCreateUser({
    mutation: {
      meta: { errorToast: false },
      onSuccess: async () => {
        toast.success(copy.toast.added)
        onOpenChange(false)
        form.reset(newUserValues)
        await invalidateApi(queryClient, apiPaths.users)
      },
      onError: (error) => {
        // Emails are unique across all orgs (backend auth/service.py:45-48).
        if (isConflict(error)) {
          form.setError("email", { message: copy.validation.duplicate }, { shouldFocus: true })
          return
        }
        const fields = fieldErrors(error)
        const field = (["email", "password", "full_name", "role"] as const).find((name) => fields[name])
        if (field) form.setError(field, { message: fields[field] })
        else form.setError("root", { message: errorMessage(error) })
      },
    },
  })

  const submit = form.handleSubmit(({ email, full_name, role, password }) =>
    create.mutate({ data: { email, full_name: full_name || null, role, password } }),
  )

  const changeOpen = (next: boolean) => {
    if (!next) form.reset(newUserValues)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-[min(480px,calc(100%-2rem))]">
        <form noValidate onSubmit={submit}>
          {/* The close button is not a sibling of the header here (the form wraps it), so reserve its space. */}
          <DialogHeader className="pr-14">
            <DialogTitle>{copy.addTitle}</DialogTitle>
            <DialogDescription>{copy.addDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-6 py-5">
            <FormRow id="user-email" label={copy.form.email} error={errors.email}>
              <Input
                id="user-email"
                type="email"
                autoComplete="off"
                autoFocus
                aria-invalid={!!errors.email}
                className="rounded-sm px-2.5"
                {...form.register("email")}
              />
            </FormRow>
            <FormRow id="user-name" label={copy.form.fullName} error={errors.full_name}>
              <Input
                id="user-name"
                autoComplete="off"
                aria-invalid={!!errors.full_name}
                className="rounded-sm px-2.5"
                {...form.register("full_name")}
              />
            </FormRow>
            <FormRow id="user-role" label={copy.form.role} error={errors.role}>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => <RoleSelect id="user-role" value={field.value} onChange={field.onChange} />}
              />
            </FormRow>
            <FormRow id="user-password" label={copy.form.password} help={copy.form.passwordHelp} error={errors.password}>
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby="user-password-help"
                className="rounded-sm px-2.5"
                {...form.register("password")}
              />
            </FormRow>
            <FieldError errors={[errors.root]} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => changeOpen(false)}>
              {copy.form.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting || create.isPending}>
              {create.isPending ? copy.form.creating : copy.form.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
