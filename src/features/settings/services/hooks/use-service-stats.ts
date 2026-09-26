import { useQueries } from "@tanstack/react-query"

import {
  getGetIcpQueryOptions,
  getGetScoringProfileQueryOptions,
  getListQuestionsQueryOptions,
  getListRulesQueryOptions,
} from "@/api/generated/config/config"
import { getListLeadsQueryOptions } from "@/api/generated/leads/leads"
import type { ICPProfileOut, PresetOut, ScoringProfileOut } from "@/api/generated/model"

import { isNotFound } from "@/features/settings/services/lib/config-queries"

export type Loadable<T> = { status: "loading" } | { status: "error" } | { status: "ready"; value: T }

function loadable<T, V>(
  query: { isPending: boolean; isError: boolean; error: unknown; data: T | undefined },
  pick: (data: T) => V,
  missing?: V,
): Loadable<V> {
  if (query.data !== undefined) return { status: "ready", value: pick(query.data) }
  if (query.isError && missing !== undefined && isNotFound(query.error)) return { status: "ready", value: missing }
  if (query.isError) return { status: "error" }
  return { status: "loading" }
}

/** The per-card fan-out of the Services screen (design §1.5): config counts, versions and lead totals. */
export function useServiceStats(serviceId: string, preset: PresetOut | undefined) {
  const [questions, rules, icp, scoring, scored, hot] = useQueries({
    queries: [
      getListQuestionsQueryOptions(serviceId),
      getListRulesQueryOptions(serviceId),
      getGetIcpQueryOptions(serviceId),
      getGetScoringProfileQueryOptions(serviceId),
      getListLeadsQueryOptions({ service_id: serviceId, page_size: 1 }),
      getListLeadsQueryOptions({ service_id: serviceId, tier: ["hot"], page_size: 1 }),
    ],
  })

  const activeQuestions = questions.data?.filter((question) => question.is_active)

  // Weight-only edits do not bump versions, so they are not detected (design §1.5).
  const edited =
    preset !== undefined &&
    activeQuestions !== undefined &&
    ((icp.data?.version ?? 1) > 1 ||
      (scoring.data?.version ?? 1) > 1 ||
      activeQuestions.some((question) => question.version > 1) ||
      activeQuestions.length !== preset.questions_count)

  return {
    questions: loadable(questions, (list) => {
      const active = list.filter((question) => question.is_active)
      return { total: active.length, blockers: active.filter((question) => question.polarity === "negative").length }
    }),
    rules: loadable(rules, (list) => list.filter((rule) => rule.is_active).length),
    icp: loadable<ICPProfileOut, ICPProfileOut | null>(icp, (profile) => profile, null),
    scoringVersion: loadable<ScoringProfileOut, number | null>(scoring, (profile) => profile.version, null),
    scored: loadable(scored, (page) => page.total),
    hot: loadable(hot, (page) => page.total),
    edited,
  }
}
