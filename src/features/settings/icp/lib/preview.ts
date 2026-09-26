import type { LeadListItem } from "@/api/generated/model"

// The engine adds a rule hit named "Outside ICP: {failed must-have labels}" (ai/scoring/engine.py outside_icp_hit);
// GET /leads exposes rule-hit names as `flags`.
const OUTSIDE_ICP = "Outside ICP: "

export type FailingCompany = { id: string; name: string; reason: string }

/** 0–24, 25–49, 50–74, 75–99, 100. */
function bucketOf(fit: number) {
  return fit >= 100 ? 4 : Math.min(3, Math.max(0, Math.floor(fit / 25)))
}

/**
 * How the saved ICP splits the scored accounts. No endpoint evaluates an ICP draft, so this reads the
 * stored scores only; nothing is recomputed on the client.
 */
export function icpSplit(leads: LeadListItem[]) {
  const failing: FailingCompany[] = []
  const buckets = [0, 0, 0, 0, 0]
  const fits = new Set<number>()
  for (const lead of leads) {
    const flag = lead.flags.find((item) => item.startsWith(OUTSIDE_ICP))
    if (flag) {
      failing.push({
        id: lead.company.id,
        name: lead.company.name,
        reason: flag.slice(OUTSIDE_ICP.length),
      })
      continue
    }
    buckets[bucketOf(lead.score.fit)] += 1
    fits.add(Math.round(lead.score.fit))
  }
  return {
    total: leads.length,
    passing: leads.length - failing.length,
    failing,
    buckets,
    distinct: fits.size,
  }
}
