import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { apiPaths, invalidateApi, meQueryKey } from "@/api/cache"
import { useUpdateUser } from "@/api/generated/auth/auth"
import type { UserOut } from "@/api/generated/model"
import { errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"

import { FormRow } from "@/features/settings/users/components/form-row"
import { RoleSelect } from "@/features/settings/users/components/role-select"
import { copy } from "@/features/settings/users/copy"
import {
  diffUser,
  editUserSchema,
  type EditUserValues,
  toEditValues,
} from "@/features/settings/users/lib/user-form"

function EditUserForm({
  user,
  isSelf,
  onDone,
}: {
  user: UserOut
  isSelf: boolean
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: toEditValues(user),
  })
  const { errors, isDirty } = form.formState

  const update = useUpdateUser({
    mutation: {
      meta: { errorToast: false },
      onSuccess: async () => {
        toast.success(copy.toast.saved)
        onDone()
        await Promise.all([
          invalidateApi(queryClient, apiPaths.users),
          isSelf
            ? queryClient.invalidateQueries({ queryKey: meQueryKey })
            : null,
        ])
      },
      onError: (error) => {
        const fields = fieldErrors(error)
        const field = (
          ["full_name", "role", "is_active", "password"] as const
        ).find((name) => fields[name])
        if (field) form.setError(field, { message: fields[field] })
        else form.setError("root", { message: errorMessage(error) })
      },
    },
  })

  const submit = form.handleSubmit((values) => {
    const patch = diffUser(user, values)
    if (Object.keys(patch).length === 0) onDone()
    else update.mutate({ id: user.id, data: patch })
  })

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <FormRow
          id="edit-name"
          label={copy.form.fullName}
          error={errors.full_name}
        >
          <Input
            id="edit-name"
            autoComplete="off"
            aria-invalid={!!errors.full_name}
            className="rounded-sm px-2.5"
            {...form.register("full_name")}
          />
        </FormRow>
        <FormRow
          id="edit-role"
          label={copy.form.role}
          help={isSelf ? copy.form.selfRole : copy.form.roleHelp}
          error={errors.role}
        >
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <RoleSelect
                id="edit-role"
                value={field.value}
                onChange={field.onChange}
                disabled={isSelf}
                describedBy="edit-role-help"
              />
            )}
          />
        </FormRow>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="edit-active" className="text-[13px] font-semibold">
              {copy.form.active}
            </label>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <Switch
                  id="edit-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSelf}
                  aria-describedby="edit-active-help"
                />
              )}
            />
          </div>
          <p
            id="edit-active-help"
            className="m-0 text-xs leading-[1.45] text-muted-foreground"
          >
            {isSelf ? copy.form.selfActive : copy.form.activeHelp}
          </p>
        </div>
        <FormRow
          id="edit-password"
          label={copy.form.newPassword}
          help={copy.form.newPasswordHelp}
          error={errors.password}
        >
          <Input
            id="edit-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="edit-password-help"
            className="rounded-sm px-2.5"
            {...form.register("password")}
          />
        </FormRow>
        <FieldError errors={[errors.root]} />
      </div>
      <SheetFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {copy.form.cancel}
        </Button>
        <Button
          type="submit"
          variant="black"
          disabled={!isDirty || update.isPending}
        >
          {update.isPending ? copy.form.saving : copy.form.save}
        </Button>
      </SheetFooter>
    </form>
  )
}

/**
 * The backend does not stop an admin from demoting or deactivating themself (auth/service.py:73-80),
 * so the sheet disables both controls for the signed-in user.
 */
export function EditUserSheet({
  user,
  open,
  currentUserId,
  onClose,
}: {
  /** Kept while the sheet animates out, so `open` is separate. */
  user: UserOut | undefined
  open: boolean
  currentUserId: string | undefined
  onClose: () => void
}) {
  return (
    <Sheet
      open={open && user !== undefined}
      onOpenChange={(next) => !next && onClose()}
    >
      <SheetContent>
        {user ? (
          <>
            <SheetHeader>
              <SheetTitle>{copy.editTitle}</SheetTitle>
              <SheetDescription>{user.email}</SheetDescription>
            </SheetHeader>
            <EditUserForm
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              onDone={onClose}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
