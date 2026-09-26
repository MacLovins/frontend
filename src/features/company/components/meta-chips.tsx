import type { ReactNode } from "react"
import { cn } from "cn"

import { useGetCountries, useGetIndustries } from "@/api/generated/meta/meta"
import type { CompanyOut } from "@/api/generated/model"
import { humanize } from "@/lib/labels"

import { atsLabels, originLabels } from "../lib/copy"
import { employeesText, relativeShort } from "../lib/text"

const MAX_INDUSTRIES = 2

function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode
  tone?: "default" | "success"
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-[3px] text-[13px]",
        tone === "success"
          ? "bg-positive-surface font-semibold text-positive-strong"
          : "bg-muted text-foreground"
      )}
    >
      {children}
    </span>
  )
}

/** "Germany · Bonn", industries, size, ATS, origin and monitoring, each hidden when the API has no value. */
export function MetaChips({ company }: { company: CompanyOut }) {
  const countries = useGetCountries({ query: { staleTime: Infinity } })
  const industries = useGetIndustries({ query: { staleTime: Infinity } })

  const country = company.country_code
    ? (countries.data?.find((item) => item.code === company.country_code)
        ?.name ?? company.country_code)
    : null
  const location = [country, company.hq_city].filter(Boolean).join(" · ")
  const industryNames = company.industry_ids.map(
    (id) =>
      industries.data?.find((item) => item.id === id)?.label ?? humanize(id)
  )
  const origin = originLabels[company.origin]

  return (
    <div className="flex flex-wrap gap-2">
      {location ? <Chip>{location}</Chip> : null}
      {industryNames.slice(0, MAX_INDUSTRIES).map((name) => (
        <Chip key={name}>{name}</Chip>
      ))}
      {industryNames.length > MAX_INDUSTRIES ? (
        <Chip>+{industryNames.length - MAX_INDUSTRIES}</Chip>
      ) : null}
      {company.employees != null ? (
        <Chip>{employeesText(company.employees)}</Chip>
      ) : null}
      {company.ats ? (
        <Chip>Careers on {atsLabels[company.ats.kind]} (detected)</Chip>
      ) : null}
      {origin ? <Chip>{origin}</Chip> : null}
      {company.is_tracked ? (
        <Chip tone="success">
          Monitored ·{" "}
          {company.last_analyzed_at
            ? `checked ${relativeShort(company.last_analyzed_at)}`
            : "not checked yet"}
        </Chip>
      ) : (
        <Chip>Not monitored</Chip>
      )}
    </div>
  )
}
