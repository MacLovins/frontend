import { Link } from "react-router"

import { criteria, pains, principles } from "../copy"

import { ProcessSteps } from "./process-steps"

export function BriefHero() {
  return (
    <section className="grid grid-cols-1 items-end gap-x-6 gap-y-5 lg:grid-cols-12">
      <h1 className="m-0 text-[40px] leading-[1.02] font-extrabold tracking-[-0.03em] lg:col-span-8 xl:text-[60px]">
        Turn public business signals into a ranked call list, where every reason
        comes with a quote you can check.
      </h1>
      <div className="flex flex-col gap-3 text-base leading-normal text-text-secondary lg:col-span-4">
        <p className="m-0">
          Sales at Orange Systems need the right company, in the right market,
          at the right moment, with the right offer. Today a rep assembles that
          by hand from Sales Navigator, news, annual reports and job boards.
        </p>
        <p className="m-0 font-semibold text-black">
          LeadRadar runs the same process automatically for each service and
          shows the evidence behind every score.
        </p>
      </div>
    </section>
  )
}

export function PainCards() {
  return (
    <section
      aria-label="Pains"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {pains.map((pain) => (
        <article
          key={pain.eyebrow}
          className="flex flex-col gap-2 rounded-md bg-muted p-5"
        >
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {pain.eyebrow}
          </p>
          <h3 className="m-0 text-lg font-bold">{pain.title}</h3>
          <p className="m-0 text-sm leading-[1.45] text-text-secondary">
            {pain.body}
          </p>
        </article>
      ))}
    </section>
  )
}

export function ProcessSection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="m-0 text-[28px] font-bold tracking-[-0.01em]">
          The Annex 1 process, step by step: manual today, automated in
          LeadRadar
        </h2>
        <p className="m-0 text-sm text-muted-foreground">
          Each step has a pipeline node, a table and a screen
        </p>
      </div>
      <ProcessSteps />
    </section>
  )
}

export function PrincipleCards() {
  return (
    <section
      aria-label="Principles"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
    >
      {principles.map((principle) => (
        <article
          key={principle.title}
          className="flex flex-col gap-2.5 rounded-md border border-border p-6"
        >
          <h3 className="m-0 text-xl font-bold">{principle.title}</h3>
          <p className="m-0 text-sm leading-normal text-text-secondary">
            {principle.body}
          </p>
        </article>
      ))}
    </section>
  )
}

export function CriteriaSection() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-[28px] font-bold tracking-[-0.01em]">
        Judging criteria → where each one is visible
      </h2>
      <div className="grid grid-cols-1 gap-2 text-[13px] leading-[1.45] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {criteria.map((criterion) => (
          <article
            key={criterion.title}
            className="flex flex-col gap-1.5 rounded-md bg-black p-4 text-white"
          >
            <p className="m-0 font-mono text-2xl leading-[1.45] font-semibold text-primary">
              {criterion.pct}
            </p>
            <h3 className="m-0 text-sm font-bold">{criterion.title}</h3>
            <p className="m-0 text-sidebar-foreground">{criterion.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function BriefFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-4 text-[13px] text-muted-foreground">
      <p className="m-0">
        Two roles: <strong className="text-black">Sales</strong> sees Today,
        Prospects, Company, Runs, Accounts and Quality.{" "}
        <strong className="text-black">Admin</strong> also sees Configure.
      </p>
      <nav aria-label="More" className="flex gap-4 font-semibold">
        <Link
          to="/about/market"
          className="text-black underline hover:text-link-hover"
        >
          How others solve it →
        </Link>
        <Link
          to="/prospects"
          className="text-black underline hover:text-link-hover"
        >
          Open the product →
        </Link>
      </nav>
    </footer>
  )
}
