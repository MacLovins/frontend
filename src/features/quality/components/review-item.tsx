import type { KeyboardEvent, MouseEvent } from "react"
import { useId } from "react"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import type { SignalVerdict } from "@/api/generated/model"
import { useLabels } from "@/hooks/use-labels"
import { formatDate, percent } from "@/lib/format"

import { qualityCopy } from "../copy"
import type { ReviewItem as Item } from "../hooks/use-review-queue"

const reviewButton =
  "inline-flex h-9 items-center rounded-sm border px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"

const verdicts: {
  verdict: SignalVerdict
  key: string
  label: string
  className: string
}[] = [
  {
    verdict: "correct",
    key: "c",
    label: qualityCopy.correct,
    className:
      "border-positive-strong bg-positive-surface font-bold text-positive-strong hover:bg-[#d5ecdf]",
  },
  {
    verdict: "incorrect",
    key: "w",
    label: qualityCopy.wrong,
    className:
      "border-negative-strong bg-negative-surface font-bold text-negative-strong hover:bg-[#fadcd8]",
  },
  {
    verdict: "irrelevant",
    key: "n",
    label: qualityCopy.notRelevant,
    className: "border-input bg-card text-foreground hover:bg-muted",
  },
]

/** One signal to label: who, which question, the quote, where it came from, and the four actions. */
export function ReviewItem({
  item,
  onVote,
  onSkip,
}: {
  item: Item
  onVote: (verdict: SignalVerdict) => void
  onSkip: () => void
}) {
  const label = useLabels()
  const hintId = useId()
  const metaId = useId()
  const { signal, question } = item

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A held key would label every following signal.
    if (event.repeat) return
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const key = event.key.toLowerCase()
    const match = verdicts.find((option) => option.key === key)
    if (match) onVote(match.verdict)
    else if (key === "s") onSkip()
    else return
    event.preventDefault()
  }

  // The queue advances on the first click, so a double-click's second click would label the next signal.
  const onClick = (action: () => void) => (event: MouseEvent) => {
    if (event.detail < 2) action()
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-labelledby={metaId}
      aria-describedby={hintId}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-2 rounded-md bg-muted p-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      <span id={hintId} className="sr-only">
        {qualityCopy.reviewShortcuts}
      </span>
      <div id={metaId} className="text-xs text-muted-foreground">
        {item.companyName} ·{" "}
        <span title={question.text}>
          {label("categories", question.category)}
        </span>{" "}
        · {qualityCopy.reviewConfidence(percent(signal.confidence))}
      </div>
      <blockquote className="m-0 line-clamp-5 text-sm leading-[1.5] italic">
        “{signal.quote}”
      </blockquote>
      <SourceLine
        name={signal.source_name}
        url={signal.url}
        date={signal.event_date}
      />
      <div
        role="group"
        aria-label={qualityCopy.reviewActionsLabel}
        className="flex flex-wrap gap-2"
      >
        {verdicts.map((option) => (
          <button
            key={option.verdict}
            type="button"
            aria-keyshortcuts={option.key.toUpperCase()}
            onClick={onClick(() => onVote(option.verdict))}
            className={cn(reviewButton, option.className)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          aria-keyshortcuts="S"
          onClick={onClick(onSkip)}
          className={cn(
            reviewButton,
            "ml-auto border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {qualityCopy.skip}
        </button>
      </div>
    </div>
  )
}

function SourceLine({
  name,
  url,
  date,
}: {
  name: string
  url: string | null
  date: string | null
}) {
  const text = date ? `${name} · ${formatDate(date)}` : name
  if (!url) return <div className="text-xs text-muted-foreground">{text}</div>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-link-hover"
    >
      {text}
      <ArrowSquareOutIcon className="size-3" aria-hidden />
    </a>
  )
}
