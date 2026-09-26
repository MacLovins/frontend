import { Link } from "react-router"

import type { LeadDetail, QuestionRef } from "@/api/generated/model"
import { Card } from "@/components/ui/card"
import { useLabels } from "@/hooks/use-labels"

import { useRejectedSignals } from "../hooks/rejected-signals"
import { useSignalFeedback } from "../hooks/use-signal-feedback"
import { weightWords } from "../lib/copy"
import {
  evidenceGroups,
  strongest,
  sumOfSources,
  type EvidenceGroup,
} from "../lib/lead-card"
import { formatPoints, plural } from "../lib/text"
import { PolarityMark } from "./polarity-mark"
import { SignalCard } from "./signal-card"

function groupMeta(group: EvidenceGroup) {
  const weight = weightWords[group.question.weight]
  const strength = strongest(group.signals)
  if (group.question.polarity === "negative") {
    return ["Blocker", `${weight.toLowerCase()} weight`, strength]
      .filter(Boolean)
      .join(" · ")
  }
  const sources = new Set(group.signals.map((signal) => signal.source_name))
    .size
  return [`${weight} weight`, strength, plural(sources, "source")]
    .filter(Boolean)
    .join(" · ")
}

/** Category names, with the question text for a category that repeats. */
function questionNames(
  questions: QuestionRef[],
  category: (question: QuestionRef) => string
) {
  const seen = new Set<string>()
  return questions.map((question) => {
    const name = category(question)
    if (seen.has(name)) return question.text
    seen.add(name)
    return name
  })
}

export function EvidenceCard({
  detail,
  companyId,
  serviceId,
  sourcesHref,
}: {
  detail: LeadDetail
  companyId: string
  serviceId: string
  sourcesHref: string
}) {
  const label = useLabels()
  const category = (question: QuestionRef) =>
    label("categories", question.category)
  const rejected = useRejectedSignals(companyId, serviceId)
  const { rate, pending } = useSignalFeedback(companyId, serviceId)
  const groups = evidenceGroups(detail, rejected)
  const shown = new Set(groups.map((group) => group.question.id))
  const unanswered = detail.questions_without_evidence.filter(
    (question) => !shown.has(question.id)
  )

  return (
    <Card className="gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="m-0 text-lg font-bold">Evidence by question</h2>
        <span className="text-[13px] text-muted-foreground">
          Quotes are shown in the original language, summaries in English
        </span>
      </div>
      {!groups.length && !unanswered.length ? (
        <p className="m-0 text-[13px] text-muted-foreground">
          No questions are set up for this service.
        </p>
      ) : null}
      {groups.map((group) => (
        <section
          key={group.question.id}
          aria-label={category(group.question)}
          className="flex flex-col gap-2.5 border-b border-subtle pb-3.5"
        >
          <div className="flex items-center gap-2.5">
            <PolarityMark kind={group.question.polarity} size={22} />
            <span
              className="text-[15px] font-semibold"
              title={group.question.text}
            >
              {category(group.question)}
            </span>
            <span className="text-xs text-muted-foreground">
              {groupMeta(group)}
            </span>
            <span className="ml-auto font-mono text-[13px] font-semibold">
              {group.points === null
                ? "—"
                : formatPoints(group.points, group.question.polarity)}
            </span>
          </div>
          {group.signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              pending={pending.has(signal.id)}
              onRate={(verdict) => void rate(signal, group.question, verdict)}
            />
          ))}
        </section>
      ))}
      {unanswered.length ? (
        <div className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          <div className="font-semibold text-foreground">
            No evidence found in {sumOfSources(detail.sources_summary)} scanned
            sources
          </div>
          <div>{questionNames(unanswered, category).join(" · ")}</div>
          <div className="text-muted-foreground">
            "No evidence" is not "no". Check the{" "}
            <Link to={sourcesHref} className="text-foreground underline">
              sources tab
            </Link>
            , or add the newsroom URL if it is missing.
          </div>
        </div>
      ) : null}
    </Card>
  )
}
