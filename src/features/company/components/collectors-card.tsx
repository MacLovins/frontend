import { cn } from "cn"

import type { CompanyOut, LeadDetail } from "@/api/generated/model"

import { atsLabels } from "../lib/copy"
import { SideCard } from "./side-card"

type Row = { key: string; text: string; count: number }

function jobsText(company: CompanyOut) {
  if (company.ats) return `${atsLabels[company.ats.kind]} job board (detected)`
  return company.careers_url ? "Careers page" : "Job boards"
}

/**
 * Per source type, not per collector: the API has no per-collector status, counts or key configuration.
 */
export function CollectorsCard({
  company,
  summary,
}: {
  company: CompanyOut
  summary: LeadDetail["sources_summary"]
}) {
  const count = (type: string) => summary[type] ?? 0
  const rows: Row[] = [
    { key: "jobs", text: jobsText(company), count: count("jobs") },
    {
      key: "news",
      text: "News search (Google News, GDELT)",
      count: count("news"),
    },
    {
      key: "website",
      text: "Company website and newsroom",
      count: count("website"),
    },
    { key: "report", text: "Annual report PDFs", count: count("report") },
    {
      key: "registry",
      text: "Company registries (Wikidata, GLEIF)",
      count: count("registry"),
    },
    ...(count("incident") > 0
      ? [
          {
            key: "incident",
            text: "Security incident records",
            count: count("incident"),
          },
        ]
      : []),
  ]

  return (
    <SideCard title="Collectors for this company">
      <div className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 text-[13px]">
        {rows.map((row) => {
          const active = row.count > 0
          return (
            <div key={row.key} className="contents">
              <span
                role="img"
                aria-label={active ? "Collected" : "Nothing collected"}
                className={
                  active
                    ? "font-bold text-positive-strong"
                    : "text-muted-foreground"
                }
              >
                {active ? "✓" : "–"}
              </span>
              <span className={cn(!active && "text-muted-foreground")}>
                {row.text}
              </span>
              <span className="text-right font-mono">
                {active ? row.count : ""}
              </span>
            </div>
          )
        })}
        <span
          role="img"
          aria-label="Never used"
          className="font-bold text-muted-foreground"
        >
          ⊘
        </span>
        <span className="text-muted-foreground">
          LinkedIn: never contacted, by design
        </span>
        <span />
      </div>
    </SideCard>
  )
}
