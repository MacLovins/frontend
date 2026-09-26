import { useEffect, useId, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import type { DisqualificationRuleOut } from "@/api/generated/model"
import { errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { DiscardDialog } from "@/features/settings/icp/components/discard-dialog"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import { useDiscardGuard } from "@/features/settings/icp/hooks/use-discard-guard"
import { ConfirmDialog } from "@/features/settings/questions/components/confirm-dialog"
import { RuleSentence } from "@/features/settings/rules/components/rule-sentence"
import type { SentenceItem } from "@/features/settings/rules/components/sentence-select"
import { copy } from "@/features/settings/rules/copy"
import { useRuleWrites } from "@/features/settings/rules/hooks/use-rule-mutations"
import {
  emptyDraft,
  ruleSchema,
  toCreate,
  toDraft,
  toUpdate,
  type RuleDraft,
} from "@/features/settings/rules/lib/rule-form"

const strings = copy.editor
const conditionErrors = [
  "amount",
  "text",
  "items",
  "questionKey",
  "minStrength",
  "domains",
  "cap",
] as const

/** Editor card below the table. The page keys it by `?rule=`, so every open starts from the stored rule. */
export function RuleEditor({
  serviceId,
  rule,
  index,
  otherNames,
  questionItems,
  countries,
  industries,
  onClose,
}: {
  serviceId: string
  /** null = new rule. */
  rule: DisqualificationRuleOut | null
  /** 1-based display position of an existing rule. */
  index: number
  otherNames: string[]
  questionItems: SentenceItem<string>[]
  countries: CountryCatalog
  industries: IndustryCatalog
  onClose: () => void
}) {
  const nameId = useId()
  const cardRef = useRef<HTMLElement>(null)
  const form = useForm<RuleDraft>({
    resolver: zodResolver(ruleSchema),
    defaultValues: rule ? toDraft(rule) : emptyDraft,
  })
  const { errors, isDirty } = form.formState
  const { blocker, release } = useDiscardGuard(isDirty)
  const { create, update, remove } = useRuleWrites(serviceId)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const name = useWatch({ control: form.control, name: "name" })
    .trim()
    .toLowerCase()
  const duplicate =
    !!name && otherNames.some((other) => other.trim().toLowerCase() === name)
  const saving = create.isPending || update.isPending
  const conditionError = conditionErrors
    .map((key) => errors[key]?.message)
    .find(Boolean)

  useEffect(() => {
    cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [])

  const close = () => {
    release()
    onClose()
  }
  const saved = () => {
    toast.success(copy.toasts.saved)
    close()
  }
  const failed = (error: unknown) => {
    const nameError = fieldErrors(error).name
    if (nameError) form.setError("name", { message: nameError })
    setServerError(errorMessage(error))
  }

  const onSubmit = form.handleSubmit((draft) => {
    setServerError(null)
    if (!rule) {
      create.mutate(
        { id: serviceId, data: toCreate(draft) },
        { onSuccess: saved, onError: failed }
      )
      return
    }
    const data = toUpdate(draft, rule)
    if (Object.keys(data).length === 0) close()
    else
      update.mutate(
        { id: rule.id, data },
        { onSuccess: saved, onError: failed }
      )
  })

  return (
    <FormProvider {...form}>
      <section
        ref={cardRef}
        aria-label={
          rule ? strings.editTitle(index, rule.name) : strings.newTitle
        }
        className="scroll-mt-6 rounded-lg border-2 border-black bg-card p-[22px]"
      >
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="m-0 truncate text-lg font-bold">
              {rule ? strings.editTitle(index, rule.name) : strings.newTitle}
            </h2>
            <span className="shrink-0 text-[13px] text-muted-foreground">
              {strings.tagline}
            </span>
          </div>
          <Field data-invalid={!!errors.name} className="gap-1.5">
            <FieldLabel htmlFor={nameId} className="font-semibold text-black">
              {strings.name}
            </FieldLabel>
            <Input
              id={nameId}
              autoComplete="off"
              aria-invalid={!!errors.name}
              className="max-w-[480px] rounded-sm"
              {...form.register("name")}
            />
            <FieldError errors={[errors.name]} />
            {duplicate ? (
              <p className="m-0 text-xs text-warning-strong">
                {strings.duplicateName}
              </p>
            ) : null}
          </Field>
          <div className="flex flex-col gap-2">
            <RuleSentence
              kindLocked={!!rule}
              questionItems={questionItems}
              countries={countries}
              industries={industries}
            />
            {conditionError || serverError ? (
              <p role="alert" className="m-0 text-[13px] text-negative-strong">
                {conditionError ?? serverError}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-3 text-[13px]">
            {strings.info.map((box) => (
              <div
                key={box.lead}
                className="rounded-md bg-muted p-3 leading-[1.45]"
              >
                <strong>{box.lead}</strong> {box.text}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-primary-surface p-3.5 text-sm">
            <strong>{strings.preview}</strong>
            <span className="min-w-0 flex-1">{strings.previewText}</span>
            <div className="ml-auto flex gap-2">
              {rule ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-negative-strong hover:bg-negative-surface hover:text-negative-strong"
                  onClick={() => setConfirmDelete(true)}
                >
                  {strings.delete}
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={onClose}>
                {strings.cancel}
              </Button>
              <Button
                type="submit"
                variant="black"
                disabled={saving || (!!rule && !isDirty)}
              >
                {saving ? (
                  <>
                    <Spinner aria-hidden />
                    {strings.saving}
                  </>
                ) : (
                  strings.save
                )}
              </Button>
            </div>
          </div>
        </form>
      </section>
      {rule ? (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={copy.confirmDelete.title(rule.name)}
          description={copy.confirmDelete.body}
          confirmLabel={strings.delete}
          tone="destructive"
          pending={remove.isPending}
          onConfirm={() =>
            remove.mutate(
              { id: rule.id },
              {
                onSuccess: () => {
                  toast.success(copy.toasts.deleted)
                  setConfirmDelete(false)
                  close()
                },
              }
            )
          }
        />
      ) : null}
      <DiscardDialog
        blocker={blocker}
        title={copy.discard.title}
        body={copy.discard.body}
        keepLabel={copy.discard.keep}
        discardLabel={copy.discard.discard}
      />
    </FormProvider>
  )
}
