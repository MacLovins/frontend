/** Filler documents ("Sources scanned") generated deterministically per company. */
import type { DocumentOut, SourceType } from "@/api/generated/model"

import { between, pick, prng } from "./prng"

const ROLES = [
  "Senior Business Analyst",
  "Data Engineer",
  "Finance Process Manager",
  "IT Project Manager",
  "Procurement Specialist",
  "Customer Service Team Lead",
  "Cloud Engineer",
  "SAP FI/CO Consultant",
  "Operations Manager",
  "HR Business Partner",
  "Software Developer (Java)",
  "Controller",
  "Supply Chain Planner",
  "Network Engineer",
  "Scrum Master",
  "Product Owner Digital Channels",
  "Legal Counsel",
  "Accountant",
  "Data Scientist",
  "Payroll Specialist",
  "Key Account Manager",
  "Service Desk Analyst",
  "Solution Architect",
  "Treasury Analyst",
  "Quality Manager",
]

const NEWS = [
  (c: string) => `${c} reports half-year results`,
  (c: string) => `${c} opens a new regional hub`,
  (c: string) => `${c} names a new head of sales`,
  (c: string) => `${c} signs a multi-year customer agreement`,
  (c: string) => `${c} expands its services in the Nordics`,
  (c: string) => `${c} invests in electric fleet`,
  (c: string) => `Interview: ${c} on growth plans for 2027`,
  (c: string) => `${c} wins an industry award for customer service`,
  (c: string) => `${c} updates its sustainability targets`,
  (c: string) => `${c} to cut emissions by 2030`,
  (c: string) => `${c} partners with a university on research`,
  (c: string) => `${c} publishes its tax transparency report`,
  (c: string) => `${c} extends its credit facility`,
  (c: string) => `${c} hosts its capital markets day`,
  (c: string) => `${c} completes a bond placement`,
]

const PAGES = [
  "About us",
  "Careers",
  "Investor relations",
  "Sustainability",
  "Leadership team",
  "Locations",
  "Services overview",
  "Customer service",
  "Digital & innovation",
  "Compliance and ethics",
  "Suppliers",
  "Press releases",
]

const REPORTS = [
  "Annual Report 2025",
  "Half-year report 2026",
  "Sustainability report 2025",
  "Quarterly statement Q2 2026",
]

const NEWS_COLLECTORS = ["google_news", "gdelt"]

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export interface FillerContext {
  companyId: string
  name: string
  domain: string
  city: string | null
  lang: string
  atsKind: string | null
  /** Document ids come from the caller (seed or runtime sequence). */
  nextId: () => string
  now: Date
  /** Most documents were fetched well before now; `recentFetch` of them in the last `recentHours`. */
  recentFetch?: number
  recentHours?: number
  /** Only documents published in the last `maxAgeDays` days (new collections). */
  maxAgeDays?: number
  seed?: string
}

const DAY = 86_400_000

function isoAt(ms: number) {
  return new Date(ms).toISOString().replace("Z", "+00:00")
}

/** `count` filler documents of one source type. */
export function fillerDocuments(
  ctx: FillerContext,
  type: SourceType,
  count: number,
  offset = 0
): DocumentOut[] {
  const rand = prng(`${ctx.seed ?? ""}${ctx.domain}:${type}:${offset}`)
  const out: DocumentOut[] = []
  const maxAge = ctx.maxAgeDays ?? 365
  for (let i = 0; i < count; i += 1) {
    let title: string
    let url: string
    let sourceName: string
    let lang: string | null = "en"
    let publishedDays: number | null = between(rand, 1, maxAge)
    switch (type) {
      case "jobs": {
        const role = pick(rand, ROLES)
        title = `${role}, ${ctx.city ?? "Remote"}`
        sourceName = ctx.atsKind ?? "careers_page"
        url = `https://www.${ctx.domain}/careers/jobs/${slug(role)}-${offset + i + 1}`
        publishedDays = between(rand, 1, Math.min(maxAge, 80))
        lang = rand() < 0.6 ? "en" : ctx.lang
        break
      }
      case "news": {
        title = pick(rand, NEWS)(ctx.name)
        sourceName = pick(rand, NEWS_COLLECTORS)
        url = `https://news.example.org/${slug(ctx.name)}/${slug(title)}-${offset + i + 1}`
        lang = rand() < 0.7 ? "en" : ctx.lang
        break
      }
      case "website": {
        const page = PAGES[(offset + i) % PAGES.length]
        title = `${page} · ${ctx.name}`
        sourceName = "website"
        url = `https://www.${ctx.domain}/${slug(page)}`
        publishedDays = rand() < 0.5 ? null : between(rand, 20, maxAge)
        lang = rand() < 0.5 ? "en" : ctx.lang
        break
      }
      case "report": {
        title = REPORTS[(offset + i) % REPORTS.length]
        sourceName = "annual_report"
        url = `https://www.${ctx.domain}/investors/${slug(title)}.pdf`
        publishedDays = between(rand, 40, Math.max(41, maxAge))
        break
      }
      default: {
        title = `${ctx.name} (Wikidata)`
        sourceName = "wikidata"
        url = `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(ctx.name)}`
        publishedDays = null
        lang = null
      }
    }
    const nowMs = ctx.now.getTime()
    const publishedMs =
      publishedDays === null
        ? null
        : nowMs - publishedDays * DAY - between(rand, 0, 20) * 3_600_000
    const recent = i < (ctx.recentFetch ?? 0)
    const fetchedMs = recent
      ? nowMs -
        between(rand, 5, Math.max(6, Math.round((ctx.recentHours ?? 2) * 60))) *
          60_000
      : Math.min(
          nowMs - 3 * 3_600_000,
          (publishedMs ?? nowMs - 30 * DAY) + between(rand, 1, 48) * 3_600_000
        )
    out.push({
      id: ctx.nextId(),
      company_id: ctx.companyId,
      source_type: type,
      source_name: sourceName,
      url,
      canonical_url: url,
      title,
      published_at: publishedMs === null ? null : isoAt(publishedMs),
      fetched_at: isoAt(fetchedMs),
      language: lang,
    })
  }
  return out
}
