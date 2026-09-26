import { cn } from "cn"
import { useId, type ReactNode } from "react"

import { dontDo, growth } from "../copy"

import { ComparisonTable } from "./comparison-table"
import { PositioningMap } from "./positioning-map"

const eyebrow = "m-0 text-[13px] font-semibold tracking-[0.08em] uppercase"

export function MarketHero() {
  return (
    <section className="grid grid-cols-1 items-end gap-x-6 gap-y-4 lg:grid-cols-12">
      <div className="flex flex-col gap-3 lg:col-span-7">
        <p className={cn(eyebrow, "text-muted-foreground")}>Market landscape</p>
        <h1 className="m-0 text-[36px] leading-[1.05] font-extrabold tracking-[-0.03em] xl:text-5xl">
          Existing tools find buying signals. None of them asks the question an
          IT services seller actually has.
        </h1>
      </div>
      <p className="m-0 text-[15px] leading-[1.55] text-text-secondary lg:col-span-5">
        Intent vendors sell a score without the reason. Contact databases sell
        generic triggers. AI workbenches can answer any question, but nothing
        checks the answers and nothing ranks them. Orange Systems needs
        something narrower and stricter: signals for one service, proven by a
        quote, ranked by a rule the team controls.
      </p>
    </section>
  )
}

export function LandscapeSection() {
  const tableTitleId = useId()
  return (
    <section className="grid grid-cols-1 gap-x-8 gap-y-10 xl:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-3 xl:col-span-5">
        <h2 className="m-0 text-base font-bold">Where each approach sits</h2>
        <PositioningMap />
        <p className="m-0 text-xs leading-[1.45] text-muted-foreground">
          Our reading of public product descriptions, not a benchmark. Positions
          are approximate.
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-3 xl:col-span-7">
        <h2 id={tableTitleId} className="m-0 text-base font-bold">
          What each one does well, where it falls short for Orange Systems, and
          what we take
        </h2>
        <ComparisonTable labelledBy={tableTitleId} />
      </div>
    </section>
  )
}

export function PositionCards() {
  return (
    <section
      aria-label="Our position"
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <article className="flex flex-col gap-3 rounded-md bg-black p-6 text-white">
        <p className={cn(eyebrow, "text-primary")}>Our wedge</p>
        <h2 className="m-0 text-[22px] leading-[1.2] font-bold">
          Service-specific questions, proven by quotes, ranked by a formula the
          team owns
        </h2>
        <p className="m-0 text-sm leading-normal text-sidebar-foreground">
          "Is DHL automating RFQ processing?" is answered with a sentence from
          dhl.com, dated June 2026, and weighted the way Orange Systems decides.
          Nobody on the list above does all three at once.
        </p>
      </article>
      <ListCard title="What we deliberately don't do" items={dontDo} mark="✕" />
      <ListCard
        title="Where it grows (stage 2)"
        items={growth}
        mark="→"
        markClassName="text-link-hover"
      />
    </section>
  )
}

function ListCard({
  title,
  items,
  mark,
  markClassName,
}: {
  title: string
  items: readonly string[]
  mark: string
  markClassName?: string
}) {
  return (
    <article className="flex flex-col gap-3 rounded-md border border-border p-6">
      <h2 className={cn(eyebrow, "text-muted-foreground")}>{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm leading-[1.45]">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden="true" className={cn("font-bold", markClassName)}>
              {mark}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function PresentationsSection() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-base font-bold">
        Same signal, three presentations
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PresentationCard label="Typical intent tool">
          <div className="flex items-center gap-3">
            <span className="font-mono text-4xl font-semibold">78</span>
            <p className="m-0 text-sm leading-[1.35]">
              DHL · "Surging on: Automation, AI"
              <br />
              <span className="text-muted-foreground">Why? Not disclosed.</span>
            </p>
          </div>
        </PresentationCard>
        <PresentationCard label="Typical AI spreadsheet">
          <p className="m-0 text-sm leading-[1.45]">
            "Yes, DHL is investing heavily in AI and automation across its
            business units."
            <br />
            <span className="text-muted-foreground">
              Plausible, and uncheckable.
            </span>
          </p>
        </PresentationCard>
        <PresentationCard label="LeadRadar" highlight>
          <p className="m-0 text-sm leading-[1.45]">
            <strong>Automation & AI projects · strong</strong>
            <br />
            "…DHL is already implementing agentic AI use cases, including RFQ
            processing…"
            <br />
            <span className="text-muted-foreground">
              dhl.com · Strategy 2030 · Jun 2026 ↗ · quote verified ·
              illustrative, after Annex 1
            </span>
          </p>
        </PresentationCard>
      </div>
    </section>
  )
}

function PresentationCard({
  label,
  highlight = false,
  children,
}: {
  label: string
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-2.5 rounded-md p-5",
        highlight ? "border-2 border-primary" : "border border-border"
      )}
    >
      <h3 className="m-0 text-xs font-semibold text-muted-foreground">
        {label}
      </h3>
      {children}
    </article>
  )
}
