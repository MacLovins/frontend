import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router"

import { useGetService } from "@/api/generated/config/config"
import { useListLeads } from "@/api/generated/leads/leads"
import { EmptyState } from "@/components/common/states"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QuestionSheet } from "@/features/settings/questions/components/question-sheet"
import { QuestionsTable } from "@/features/settings/questions/components/questions-table"
import {
  ChangeBanner,
  InlineStatus,
} from "@/features/settings/questions/components/status-bars"
import { SuggestionsSheet } from "@/features/settings/questions/components/suggestions-sheet"
import { copy, plural } from "@/features/settings/questions/copy"
import {
  QuestionsContext,
  type QuestionsContextValue,
} from "@/features/settings/questions/hooks/questions-context"
import { useChangedQuestions } from "@/features/settings/questions/hooks/use-changed-questions"
import { useQuestionList } from "@/features/settings/questions/hooks/use-question-list"
import { useReanalyze } from "@/features/settings/questions/hooks/use-reanalyze"

export function QuestionsPage() {
  const { serviceId } = useParams()
  if (!serviceId) return null
  // Keyed so that switching the service starts from a clean screen (sheet, status bar, polling).
  return <QuestionsScreen key={serviceId} serviceId={serviceId} />
}

function QuestionsScreen({ serviceId }: { serviceId: string }) {
  const [params, setParams] = useSearchParams()
  const [now] = useState(() => Date.now())
  const [rescoredCount, setRescoredCount] = useState(0)

  const service = useGetService(serviceId)
  const { query, questions, keywordsStalled, restartPolling } =
    useQuestionList(serviceId)
  // Same params as the sidebar's count, so the request is shared.
  const leads = useListLeads({ service_id: serviceId, page_size: 1 })
  const changed = useChangedQuestions(serviceId)
  const reanalyze = useReanalyze(serviceId, changed.clear)

  const active = questions.filter((question) => question.is_active)
  const inactive = questions.filter((question) => !question.is_active)
  const changedCount = active.filter((question) =>
    changed.ids.includes(question.id)
  ).length
  const companyCount = leads.data?.total ?? 0
  const serviceName = service.data?.name ?? ""

  // Sheets live in the URL for deep links but do not add history entries (like the Prospects detail panel).
  const setParam = useCallback(
    (key: "q" | "suggest", value: string | null) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true }
      ),
    [setParams]
  )
  const closeSheet = useCallback(() => setParam("q", null), [setParam])
  const closeSuggestions = useCallback(
    () => setParam("suggest", null),
    [setParam]
  )
  const openQuestion = (id: string) => setParam("q", id)
  const openNew = () => setParam("q", "new")
  const openSuggestions = () => setParam("suggest", "1")

  const sheetParam = params.get("q")
  const editing = sheetParam
    ? questions.find((question) => question.id === sheetParam)
    : undefined
  const unknownQuestion =
    !!query.data && !!sheetParam && sheetParam !== "new" && !editing
  useEffect(() => {
    if (unknownQuestion) closeSheet()
  }, [unknownQuestion, closeSheet])

  const takenKeys = useMemo(
    () => new Set(questions.map((question) => question.key)),
    [questions]
  )
  const showRescored = useCallback(
    () => setRescoredCount((count) => count + 1),
    []
  )
  const context = useMemo<QuestionsContextValue>(
    () => ({
      serviceId,
      serviceName,
      companyCount,
      takenKeys,
      keywordsStalled,
      now,
      markChanged: changed.add,
      restartPolling,
      showRescored,
    }),
    [
      serviceId,
      serviceName,
      companyCount,
      takenKeys,
      keywordsStalled,
      now,
      changed.add,
      restartPolling,
      showRescored,
    ]
  )

  // 422 is a malformed id in the URL: for the admin it is the same dead end as an unknown one.
  const serviceStatus = service.error?.status
  if (serviceStatus === 404 || serviceStatus === 422) {
    return (
      <>
        <PageHeader title={copy.title} />
        <EmptyState
          title={copy.notFound.title}
          actions={
            <Button
              nativeButton={false}
              render={<Link to="/settings/services" />}
            >
              {copy.notFound.action}
            </Button>
          }
        />
      </>
    )
  }

  const loading = service.isPending || query.isPending
  const subtitle = [
    serviceName,
    query.data ? plural(active.length, "question") : "",
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <QuestionsContext value={context}>
      <PageHeader
        title={copy.title}
        subtitle={loading ? undefined : subtitle}
        actions={
          <>
            <Button variant="outline" onClick={openSuggestions}>
              {copy.suggest}
            </Button>
            <Button onClick={openNew}>{copy.newQuestion}</Button>
          </>
        }
      >
        {loading ? <Skeleton className="h-4 w-[220px]" /> : null}
      </PageHeader>

      <div className="flex flex-col gap-3.5 px-8 py-5">
        {changedCount && companyCount ? (
          <ChangeBanner
            title={copy.banner.title(changedCount)}
            body={copy.banner.body(companyCount)}
            action={copy.banner.action(companyCount)}
            pending={reanalyze.isPending}
            onAction={() => reanalyze.mutate()}
          />
        ) : null}
        {rescoredCount ? (
          <InlineStatus key={rescoredCount}>{copy.rescored}</InlineStatus>
        ) : null}
        <QuestionsTable
          serviceName={serviceName}
          active={active}
          inactive={inactive}
          isLoading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          onOpen={openQuestion}
          onNew={openNew}
          onSuggest={openSuggestions}
        />
      </div>

      <QuestionSheet
        open={sheetParam === "new" || !!editing}
        question={editing}
        onClose={closeSheet}
      />
      <SuggestionsSheet
        open={params.get("suggest") === "1"}
        onClose={closeSuggestions}
      />
    </QuestionsContext>
  )
}
