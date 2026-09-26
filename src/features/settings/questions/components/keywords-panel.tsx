import { cn } from "cn"
import type { ReactNode } from "react"
import { Controller, type Control } from "react-hook-form"

import type { SignalQuestionOut } from "@/api/generated/model"
import { Badge } from "@/components/ui/badge"
import { ChipInput } from "@/features/settings/questions/components/chip-input"
import { KeywordChip } from "@/features/settings/questions/components/keyword-chip"
import { copy } from "@/features/settings/questions/copy"
import { useQuestionsContext } from "@/features/settings/questions/hooks/questions-context"
import { useRegenerateKeywords } from "@/features/settings/questions/hooks/use-question-mutations"
import type { QuestionFormValues } from "@/features/settings/questions/lib/question-form"

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-md bg-muted p-3.5">
      {children}
    </section>
  )
}

function Row({
  code,
  negative,
  children,
}: {
  code: string
  negative?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "w-6 shrink-0 font-bold",
          negative && "text-negative-strong"
        )}
      >
        {code}
      </span>
      {children}
    </div>
  )
}

function StatusPill({
  question,
  stalled,
}: {
  question: SignalQuestionOut
  stalled: boolean
}) {
  if (question.keywords_status === "failed") {
    return (
      <Badge size="md" variant="danger">
        {copy.keywordStatus.failed}
      </Badge>
    )
  }
  if (question.keywords_status === "pending") {
    return (
      <Badge size="md" variant="warning" className="text-warning-strong">
        {stalled ? copy.keywordStatus.stalled : copy.keywordStatus.pending}
      </Badge>
    )
  }
  return (
    <Badge size="md" variant="success">
      {copy.keywordStatus.readyLanguages(
        Object.keys(question.keywords ?? {}).length
      )}
    </Badge>
  )
}

/**
 * Generated search terms. Language rows are read-only (the API cannot save them, backend gap GAP-5); job titles
 * and "Not" terms are form fields saved with the question.
 */
export function KeywordsPanel({
  question,
  control,
  readOnly,
}: {
  question?: SignalQuestionOut
  control: Control<QuestionFormValues>
  readOnly: boolean
}) {
  const { keywordsStalled } = useQuestionsContext()
  const regenerate = useRegenerateKeywords()

  if (!question) {
    return (
      <Panel>
        <span className="text-[13px] font-bold">{copy.sheet.keywords}</span>
        <p className="m-0 text-xs text-muted-foreground">
          {copy.sheet.keywordsPlaceholder}
        </p>
      </Panel>
    )
  }

  const status = question.keywords_status
  const stalled = status === "pending" && keywordsStalled
  const canRegenerate = question.is_active && (status !== "pending" || stalled)
  const loud = status === "failed" || stalled

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="font-bold">{copy.sheet.keywords}</span>
        <div className="flex items-center gap-2.5">
          {canRegenerate ? (
            <button
              type="button"
              disabled={regenerate.isPending}
              onClick={() => regenerate.mutate({ id: question.id })}
              className={cn(
                "underline underline-offset-2 hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50",
                loud
                  ? "text-[13px] font-semibold text-black"
                  : "text-xs text-muted-foreground"
              )}
            >
              {copy.sheet.regenerate}
            </button>
          ) : null}
          {question.is_active || status !== "pending" ? (
            <StatusPill question={question} stalled={stalled} />
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        {Object.entries(question.keywords ?? {}).map(([language, terms]) => (
          <Row key={language} code={language.toUpperCase()}>
            {terms.map((term, index) => (
              <KeywordChip key={`${index}:${term}`}>{term}</KeywordChip>
            ))}
          </Row>
        ))}
        {readOnly && !question.job_titles.length ? null : (
          <Controller
            control={control}
            name="job_titles"
            render={({ field }) => (
              <Row code={copy.sheet.jobsCode}>
                <ChipInput
                  values={field.value}
                  onChange={field.onChange}
                  addLabel={copy.sheet.addJobTitle}
                  readOnly={readOnly}
                />
              </Row>
            )}
          />
        )}
        {readOnly && !question.negative_terms.length ? null : (
          <Controller
            control={control}
            name="negative_terms"
            render={({ field }) => (
              <Row code={copy.sheet.notCode} negative>
                <ChipInput
                  values={field.value}
                  onChange={field.onChange}
                  addLabel={copy.sheet.addTerm}
                  negative
                  readOnly={readOnly}
                />
              </Row>
            )}
          />
        )}
      </div>
      {readOnly ? null : (
        <p className="m-0 text-xs text-muted-foreground">
          {copy.sheet.keywordsFootnote}
        </p>
      )}
    </Panel>
  )
}
