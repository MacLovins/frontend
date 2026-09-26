import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import type { SignalQuestionOut } from "@/api/generated/model"
import { errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { SheetFooter } from "@/components/ui/sheet"
import { ConfirmDialog } from "@/features/settings/questions/components/confirm-dialog"
import { KeywordsPanel } from "@/features/settings/questions/components/keywords-panel"
import { QuestionFields } from "@/features/settings/questions/components/question-fields"
import { copy } from "@/features/settings/questions/copy"
import { useQuestionsContext } from "@/features/settings/questions/hooks/questions-context"
import {
  useCreateQuestionAction,
  useSaveQuestion,
  useTurnOffQuestion,
  useTurnOnQuestion,
} from "@/features/settings/questions/hooks/use-question-mutations"
import {
  changesMeaning,
  diffQuestion,
  newQuestionValues,
  questionSchema,
  toFormValues,
  type QuestionFormValues,
} from "@/features/settings/questions/lib/question-form"
import { shortText } from "@/features/settings/questions/lib/question-utils"

const formFields = new Set<string>(Object.keys(newQuestionValues))
const isFormField = (name: string): name is keyof QuestionFormValues =>
  formFields.has(name)

/** Create / edit form of the question sheet: body and footer. A turned-off question is read-only. */
export function QuestionEditor({
  question,
  onDirtyChange,
  onCancel,
  onClose,
}: {
  question?: SignalQuestionOut
  onDirtyChange: (dirty: boolean) => void
  onCancel: () => void
  onClose: () => void
}) {
  const { companyCount } = useQuestionsContext()
  const readOnly = question ? !question.is_active : false
  const current = useMemo(
    () => (question ? toFormValues(question) : undefined),
    [question]
  )

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: current ?? newQuestionValues,
    // Polling refreshes the question (e.g. job titles after generation) without touching what the admin edited.
    values: current,
    resetOptions: { keepDirtyValues: true },
  })
  const values = useWatch({ control: form.control }) as QuestionFormValues
  const { isDirty, errors } = form.formState

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const create = useCreateQuestionAction()
  const save = useSaveQuestion()
  const turnOff = useTurnOffQuestion()
  const turnOn = useTurnOnQuestion()
  const [confirmOff, setConfirmOff] = useState(false)

  const showServerError = (error: unknown) => {
    let mapped = false
    for (const [path, message] of Object.entries(fieldErrors(error))) {
      const name = path.split(".")[0]
      if (isFormField(name)) {
        form.setError(name, { message })
        mapped = true
      }
    }
    if (!mapped) form.setError("root.server", { message: errorMessage(error) })
  }

  const submit = form.handleSubmit((submitted) => {
    if (!question) {
      create.mutate(submitted, { onSuccess: onClose, onError: showServerError })
      return
    }
    const patch = diffQuestion(question, submitted)
    if (!Object.keys(patch).length) return onClose()
    save.mutate(
      { id: question.id, data: patch },
      { onSuccess: onClose, onError: showServerError }
    )
  })

  const patch = question ? diffQuestion(question, values) : null
  let note: string | null = copy.sheet.noteCreate
  if (patch) {
    if (changesMeaning(patch))
      note = companyCount ? copy.sheet.noteWording(companyCount) : null
    else note = "weight" in patch ? copy.sheet.noteWeight : null
  }
  const pending = create.isPending || save.isPending

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <QuestionFields form={form} disabled={readOnly} />
        <KeywordsPanel
          question={question}
          control={form.control}
          readOnly={readOnly}
        />
        {errors.root?.server ? (
          <p
            role="alert"
            className="m-0 rounded-md bg-negative-surface px-3 py-2.5 text-sm text-negative-strong"
          >
            {errors.root.server.message}
          </p>
        ) : null}
      </div>

      <SheetFooter className="justify-start">
        {question?.is_active ? (
          <Button
            type="button"
            variant="ghost"
            className="text-negative-strong hover:text-negative-strong"
            disabled={pending}
            onClick={() => setConfirmOff(true)}
          >
            {copy.sheet.turnOff}
          </Button>
        ) : null}
        <span className="flex-1 self-center text-xs text-muted-foreground">
          {readOnly ? null : note}
        </span>
        <Button type="button" variant="outline" onClick={onCancel}>
          {copy.sheet.cancel}
        </Button>
        {question && readOnly ? (
          <Button
            type="button"
            disabled={turnOn.isPending}
            onClick={() =>
              turnOn.mutate(
                { id: question.id, data: { is_active: true } },
                { onSuccess: onClose }
              )
            }
          >
            {copy.sheet.turnOn}
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending
              ? copy.sheet.saving
              : question
                ? copy.sheet.save
                : copy.sheet.create}
          </Button>
        )}
      </SheetFooter>

      {question ? (
        <ConfirmDialog
          open={confirmOff}
          onOpenChange={setConfirmOff}
          title={copy.confirm.turnOffTitle(shortText(question.text))}
          description={copy.confirm.turnOffBody}
          confirmLabel={copy.confirm.turnOffAction}
          tone="destructive"
          pending={turnOff.isPending}
          onConfirm={() =>
            turnOff.mutate(
              { id: question.id },
              {
                onSuccess: () => {
                  setConfirmOff(false)
                  onClose()
                },
              }
            )
          }
        />
      ) : null}
    </form>
  )
}
