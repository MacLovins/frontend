import { useCallback, useEffect, useMemo } from "react"
import { Link, useParams, useSearchParams } from "react-router"

import {
  useGetService,
  useListQuestions,
  useListRules,
} from "@/api/generated/config/config"
import type {
  DisqualificationRuleOut,
  SignalQuestionOut,
} from "@/api/generated/model"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCountryCatalog,
  useIndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import { useServiceLeads } from "@/features/settings/icp/hooks/use-service-leads"
import { describeCondition } from "@/features/settings/questions/lib/describe-rule"
import { ExplainerTiles } from "@/features/settings/rules/components/explainer-tiles"
import { RuleEditor } from "@/features/settings/rules/components/rule-editor"
import {
  RulesTable,
  RulesTableCard,
  RulesTableSkeleton,
} from "@/features/settings/rules/components/rules-table"
import { copy } from "@/features/settings/rules/copy"
import { useRuleToggle } from "@/features/settings/rules/hooks/use-rule-mutations"
import {
  questionText,
  shortQuestion,
} from "@/features/settings/rules/lib/describe"

const NEW = "new"

const byCreated = (a: { created_at: string }, b: { created_at: string }) =>
  a.created_at.localeCompare(b.created_at)

/** Active questions as options; a stored key that is no longer active stays selectable so the rule still reads. */
function questionOptions(
  questions: SignalQuestionOut[],
  selectedKeys: string[]
) {
  return [...questions]
    .sort(byCreated)
    .filter(
      (question) => question.is_active || selectedKeys.includes(question.key)
    )
    .map((question) => ({
      value: question.key,
      label: shortQuestion(question.text),
      hint: question.text,
    }))
}

export function RulesPage() {
  const { serviceId } = useParams()
  if (!serviceId) return null
  // Keyed so that switching the service closes the editor and starts clean.
  return <RulesScreen key={serviceId} serviceId={serviceId} />
}

function RulesScreen({ serviceId }: { serviceId: string }) {
  const [params, setParams] = useSearchParams()
  const service = useGetService(serviceId)
  const rulesQuery = useListRules(serviceId)
  const questions = useListQuestions(serviceId)
  const leads = useServiceLeads(serviceId)
  const countries = useCountryCatalog()
  const industries = useIndustryCatalog()
  const toggle = useRuleToggle(serviceId)

  // The backend has no ORDER BY for rules (config/router.py list_rules).
  const rules = useMemo(
    () => [...(rulesQuery.data ?? [])].sort(byCreated),
    [rulesQuery.data]
  )
  const selectedId = params.get("rule")
  const selectedIndex = rules.findIndex((rule) => rule.id === selectedId)
  const selected = selectedIndex >= 0 ? rules[selectedIndex] : null
  const unknownRule =
    !!rulesQuery.data && !!selectedId && selectedId !== NEW && !selected

  const setRule = useCallback(
    (id: string | null) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (id) next.set("rule", id)
          else next.delete("rule")
          return next
        },
        { replace: true, preventScrollReset: true }
      ),
    [setParams]
  )

  useEffect(() => {
    if (unknownRule) setRule(null)
  }, [unknownRule, setRule])

  const describe = useCallback(
    (rule: DisqualificationRuleOut) =>
      describeCondition(rule.condition, {
        industry: industries.label,
        country: countries.name,
        question: (key) => shortQuestion(questionText(questions.data, key)),
      }),
    [countries, industries, questions.data]
  )

  const newRuleButton = (
    <Button onClick={() => setRule(NEW)}>{copy.newRule}</Button>
  )

  if (service.error?.status === 404) {
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

  const error = service.error ?? rulesQuery.error
  const editing = rulesQuery.data && (selected || selectedId === NEW)

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={service.data ? copy.subtitle(service.data.name) : undefined}
        actions={newRuleButton}
      >
        {service.data ? null : <Skeleton className="h-4 w-[220px]" />}
      </PageHeader>
      <div className="flex flex-col gap-5 px-8 py-6">
        <ExplainerTiles />
        {error ? (
          <ErrorState
            title={copy.loadError}
            error={error}
            onRetry={() => {
              if (service.error) void service.refetch()
              if (rulesQuery.error) void rulesQuery.refetch()
            }}
            className="rounded-lg border border-border bg-card"
          />
        ) : !rulesQuery.data ? (
          <RulesTableSkeleton />
        ) : rules.length === 0 ? (
          <RulesTableCard>
            <EmptyState title={copy.table.empty.title} actions={newRuleButton}>
              {copy.table.empty.body}
            </EmptyState>
          </RulesTableCard>
        ) : (
          <RulesTable
            rules={rules}
            selectedId={selectedId}
            describe={describe}
            leads={leads.isError ? null : leads.data}
            togglingId={toggle.isPending ? toggle.variables.id : undefined}
            onToggle={(rule, active) =>
              toggle.mutate({ id: rule.id, data: { is_active: active } })
            }
          />
        )}
        {editing ? (
          <RuleEditor
            key={selectedId}
            serviceId={serviceId}
            rule={selected}
            index={selectedIndex + 1}
            otherNames={rules
              .filter((rule) => rule !== selected)
              .map((rule) => rule.name)}
            questionItems={questionOptions(
              questions.data ?? [],
              selected && "question_key" in selected.condition
                ? [selected.condition.question_key]
                : []
            )}
            countries={countries}
            industries={industries}
            onClose={() => setRule(null)}
          />
        ) : null}
      </div>
    </>
  )
}
