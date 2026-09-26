/** Evidence helpers shared by the seed and the simulated worker. Pure. */
import type { CompanyOut } from "@/api/generated/model"

import { DORA_INDUSTRIES, DORA_URL, NIS2_ANNEX, NIS2_URL } from "../data/meta"
import type { DbState } from "../types"
import { activeQuestions } from "./scoring"

/** Identity of a piece of evidence across runs (backend: sha256 of question key, normalized quote, URL). */
export function evidenceKey(
  questionKey: string,
  quote: string,
  url: string | null
): string {
  return `${questionKey}|${quote.toLowerCase().replace(/\s+/g, " ").trim()}|${url ?? ""}`
}

/** Firmographic NIS2 / DORA scope signals (backend ai/scoring/derived.py). */
export function derivedTexts(company: CompanyOut, kind: "nis2" | "dora") {
  const country = company.country_code ?? ""
  if (kind === "dora") {
    const finance = company.industry_ids
      .filter((i) => DORA_INDUSTRIES.includes(i))
      .sort()
    return {
      quote: `${company.name}: ${finance.join(", ")}, ${country}.`,
      summary:
        "In DORA scope: EU financial entity subject to the Digital Operational Resilience Act.",
      source: "DORA scope (firmographics)",
      url: DORA_URL,
      strength: "moderate" as const,
    }
  }
  const sectors = company.industry_ids.filter((i) => NIS2_ANNEX[i]).sort()
  const annex = sectors.some((i) => NIS2_ANNEX[i] === "I") ? "I" : "II"
  const size: string[] = []
  if (company.employees !== null)
    size.push(`${company.employees.toLocaleString("en-US")} employees`)
  if (company.revenue_eur !== null)
    size.push(
      `€${Math.round(company.revenue_eur / 1e6).toLocaleString("en-US")}M revenue`
    )
  return {
    quote: `${company.name}: ${sectors.join(", ")} (NIS2 Annex ${annex}), ${country}, ${size.join(" and ")}.`,
    summary: `Likely in NIS2 scope: ${sectors.join(", ").replace(/_/g, " ")} company in the EU of NIS2 size (Annex ${annex}).`,
    source: "NIS2 scope (firmographics)",
    url: NIS2_URL,
    strength: "weak" as const,
  }
}

/** Source types an analysis collects for the given services (backend build_collect_request). */
export function sourcesOf(state: DbState, serviceIds: string[]): string[] {
  const types = new Set<string>()
  for (const s of serviceIds)
    for (const q of activeQuestions(state, s))
      for (const t of q.source_types)
        if (t !== "derived" && t !== "manual") types.add(t)
  return [...types].sort()
}
