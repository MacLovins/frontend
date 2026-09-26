import { useMemo } from "react"
import { cn } from "cn"

import type { LeadListItem, Tier } from "@/api/generated/model"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { score } from "@/lib/format"
import { tierLabels } from "@/lib/labels"
import { matrixCopy } from "@/features/prospects/copy"
import { shortName } from "@/features/prospects/lib/format"
import {
  placeLabels,
  plotX,
  plotY,
} from "@/features/prospects/lib/matrix-geometry"

const HIGHLIGHT_COUNT = 10
const RISK_RING = 30

const tierFill: Record<Tier, string> = {
  hot: "bg-tier-hot",
  warm: "bg-tier-warm",
  cold: "bg-tier-cold",
  disqualified: "bg-tier-dq",
}

// Paint order: context dots < highlighted dots < labels; within a layer, higher priority on top.
const LAYER = { context: 0, highlight: 1000, label: 2000 }

const ticks = [
  { text: "100", left: 0, top: 50 },
  { text: "50", left: 0, top: 310 },
  { text: "0", left: 0, top: 570 },
  { text: "0", left: 56, top: 608 },
  { text: "50", left: 392, top: 608 },
  { text: "100", left: 722, top: 608 },
]

function Quadrants() {
  const { wrongMoment, contactNow, deprioritise, weakFit } =
    matrixCopy.quadrants
  return (
    <>
      <div className="absolute top-0 left-[60px] h-[316px] w-[340px] bg-muted" />
      <div className="absolute top-0 left-[400px] h-[316px] w-[340px] bg-primary-surface" />
      <div className="absolute top-[316px] left-[60px] h-[284px] w-[340px] bg-canvas" />
      <div className="absolute top-[316px] left-[400px] h-[284px] w-[340px] bg-muted" />
      <div className="absolute top-2.5 left-[72px] text-xs font-bold text-text-secondary">
        {wrongMoment.title}
        <div className="font-normal text-muted-foreground">
          {wrongMoment.sub}
        </div>
      </div>
      <div className="absolute top-2.5 right-3 text-right text-xs font-bold text-black">
        {contactNow.title}
        <div className="font-normal text-muted-foreground">
          {contactNow.sub}
        </div>
      </div>
      <div className="absolute top-[326px] left-[72px] text-xs font-bold text-text-secondary">
        {deprioritise.title}
      </div>
      <div className="absolute top-[326px] right-3 text-right text-xs font-bold text-text-secondary">
        {weakFit.title}
        <div className="font-normal text-muted-foreground">{weakFit.sub}</div>
      </div>
    </>
  )
}

function Axes() {
  return (
    <div aria-hidden="true">
      <div className="absolute top-[600px] left-[60px] h-px w-[680px] bg-black" />
      <div className="absolute top-0 left-[60px] h-[600px] w-px bg-black" />
      {ticks.map((tick) => (
        <div
          key={`${tick.left}-${tick.top}`}
          className="absolute font-mono text-2xs text-muted-foreground"
          style={{ left: tick.left, top: tick.top }}
        >
          {tick.text}
        </div>
      ))}
      <div className="absolute top-[624px] left-[300px] text-xs font-semibold">
        {matrixCopy.xAxis}
      </div>
      <div className="absolute top-[250px] -left-[26px] -rotate-90 text-xs font-semibold">
        {matrixCopy.yAxis}
      </div>
    </div>
  )
}

function Dot({
  lead,
  highlighted,
  selected,
  zIndex,
  onSelect,
}: {
  lead: LeadListItem
  highlighted: boolean
  selected: boolean
  zIndex: number
  onSelect: (companyId: string) => void
}) {
  const size = !highlighted ? 10 : selected ? 22 : 16
  const risky = highlighted && lead.score.risk >= RISK_RING
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={lead.company.name}
            aria-pressed={selected}
            onClick={() => onSelect(lead.company.id)}
            style={{
              left: plotX(lead.score.intent) - size / 2,
              top: plotY(lead.score.fit) - size / 2,
              width: size,
              height: size,
              zIndex,
            }}
            className={cn(
              "absolute cursor-pointer rounded-full p-0",
              highlighted
                ? [
                    tierFill[lead.score.tier],
                    "border-black",
                    selected ? "border-[3px]" : "border",
                  ]
                : "bg-input",
              // The dashed risk ring already uses `outline`, so its focus ring is a shadow.
              risky
                ? "outline-2 outline-offset-2 outline-destructive outline-dashed focus-visible:shadow-[0_0_0_4px_var(--foreground)]"
                : "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            )}
          />
        }
      />
      <TooltipContent>
        {lead.company.name} · Priority {score(lead.score.priority)} ·{" "}
        {tierLabels[lead.score.tier]}
      </TooltipContent>
    </Tooltip>
  )
}

/** The scatter itself: x = Buying signals, y = ICP fit; top 10 and the selected lead are drawn large. */
export function MatrixPlot({
  items,
  selectedId,
  onSelect,
}: {
  items: LeadListItem[]
  selectedId: string | undefined
  onSelect: (companyId: string) => void
}) {
  const highlightIds = useMemo(() => {
    const ids = new Set(
      items.slice(0, HIGHLIGHT_COUNT).map((lead) => lead.company.id)
    )
    if (selectedId) ids.add(selectedId)
    return ids
  }, [items, selectedId])

  const labels = useMemo(() => {
    const highlighted = items.filter((lead) =>
      highlightIds.has(lead.company.id)
    )
    // The selected label is placed first so it is never the one skipped.
    const ordered = [
      ...highlighted.filter((lead) => lead.company.id === selectedId),
      ...highlighted.filter((lead) => lead.company.id !== selectedId),
    ]
    return placeLabels(
      ordered.map((lead) => ({
        id: lead.company.id,
        text: shortName(lead.company.name),
        x: plotX(lead.score.intent),
        y: plotY(lead.score.fit),
        bold: lead.company.id === selectedId,
      }))
    )
  }, [items, highlightIds, selectedId])

  return (
    <div className="relative isolate h-[640px] w-[740px] shrink-0">
      <Quadrants />
      <Axes />
      {/* Items arrive sorted by priority, so the tab order follows the ranking. */}
      {items.map((lead, index) => {
        const highlighted = highlightIds.has(lead.company.id)
        return (
          <Dot
            key={lead.company.id}
            lead={lead}
            highlighted={highlighted}
            selected={lead.company.id === selectedId}
            zIndex={
              (highlighted ? LAYER.highlight : LAYER.context) +
              items.length -
              index
            }
            onSelect={onSelect}
          />
        )
      })}
      {labels.map((label) => (
        <span
          key={label.id}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute text-xs whitespace-nowrap",
            label.bold ? "font-bold" : "font-medium"
          )}
          style={{
            left: label.left,
            right: label.right,
            top: label.top,
            zIndex: LAYER.label,
          }}
        >
          {label.text}
        </span>
      ))}
    </div>
  )
}
