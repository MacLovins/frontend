import { cn } from "cn"
import { useState } from "react"

import type { SignalQuestionOut } from "@/api/generated/model"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { copy } from "@/features/settings/questions/copy"
import { questionGrid } from "@/features/settings/questions/components/question-grid"
import { QuestionRow } from "@/features/settings/questions/components/question-row"

const SKELETON_ROWS = 8
const card = "overflow-hidden rounded-lg border border-border bg-card"

type TableProps = {
  serviceName: string
  active: SignalQuestionOut[]
  inactive: SignalQuestionOut[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  onOpen: (id: string) => void
  onNew: () => void
  onSuggest: () => void
}

export function QuestionsTable({
  serviceName,
  active,
  inactive,
  isLoading,
  error,
  onRetry,
  onOpen,
  onNew,
  onSuggest,
}: TableProps) {
  const [showInactive, setShowInactive] = useState(false)

  if (isLoading) {
    return (
      <div role="table" aria-label={copy.title} aria-busy className={card}>
        <TableHead />
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <SkeletonRow key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={card}>
        <ErrorState
          title={copy.table.loadError}
          error={error}
          onRetry={onRetry}
        />
      </div>
    )
  }

  const rows = showInactive ? [...active, ...inactive] : active

  return (
    <div className={card}>
      {active.length ? null : (
        <EmptyState
          title={copy.empty.title}
          actions={
            <>
              <Button variant="outline" onClick={onSuggest}>
                {copy.suggest}
              </Button>
              <Button onClick={onNew}>{copy.newQuestion}</Button>
            </>
          }
        >
          {copy.empty.body(serviceName)}
        </EmptyState>
      )}
      {rows.length ? (
        <div
          role="table"
          aria-label={copy.title}
          className={cn(!active.length && "border-t border-subtle")}
        >
          <TableHead />
          {rows.map((question) => (
            <QuestionRow
              key={question.id}
              question={question}
              onOpen={onOpen}
            />
          ))}
        </div>
      ) : null}
      {inactive.length ? (
        <div
          className={cn(
            "flex h-10 items-center gap-1 px-4 text-xs text-muted-foreground",
            !rows.length && "border-t border-subtle"
          )}
        >
          <span>{copy.table.turnedOff(inactive.length)} ·</span>
          <button
            type="button"
            aria-expanded={showInactive}
            onClick={() => setShowInactive((shown) => !shown)}
            className="text-black underline underline-offset-2 hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            {showInactive ? copy.table.hide : copy.table.show}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function TableHead() {
  return (
    <div
      role="row"
      className={cn(
        questionGrid,
        "h-10 border-b border-border bg-muted text-xs font-semibold text-muted-foreground"
      )}
    >
      {copy.table.heads.map((head) => (
        <span key={head} role="columnheader">
          {head}
        </span>
      ))}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div
      aria-hidden
      className={cn(questionGrid, "h-14 border-b border-subtle")}
    >
      <div className="flex flex-col gap-1.5 pr-3">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-3.5 w-6" />
      <Skeleton className="h-8 w-[110px] rounded-sm" />
      <div className="flex gap-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-3.5 w-10" />
      <Skeleton className="h-3.5 w-12" />
    </div>
  )
}
