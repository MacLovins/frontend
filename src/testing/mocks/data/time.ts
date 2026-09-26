/** Date helpers. The backend sends datetimes as ISO 8601 with an explicit `+00:00` offset. */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function iso(date: Date | number): string {
  return new Date(date).toISOString().replace("Z", "+00:00")
}

export function isoNow(): string {
  return iso(Date.now())
}

/** `YYYY-MM-DD` (UTC). */
export function ymd(date: Date | number): string {
  return new Date(date).toISOString().slice(0, 10)
}

export interface Ago {
  d?: number
  h?: number
  m?: number
}

export function agoMs(now: Date, { d = 0, h = 0, m = 0 }: Ago): number {
  return now.getTime() - d * DAY - h * HOUR - m * MINUTE
}

export function agoIso(now: Date, ago: Ago): string {
  return iso(agoMs(now, ago))
}

export function daysAgoDate(now: Date, days: number): string {
  return ymd(now.getTime() - days * DAY)
}

export function parseMs(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0
}

/** Whole days between an ISO date or datetime and now. */
export function ageDays(value: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(value).getTime()) / DAY))
}

export const MS = { MINUTE, HOUR, DAY }

/**
 * Start of the LLM quota day: midnight America/Los_Angeles (backend meta/service.py), as ISO with the
 * Pacific offset, e.g. `2026-09-26T00:00:00-07:00`.
 */
export function pacificDay(now: Date): {
  start: string
  resets: string
  startMs: number
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)
  const localAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  )
  const offsetMin = Math.round(
    (localAsUtc - Math.floor(now.getTime() / 1000) * 1000) / MINUTE
  )
  const startMs =
    Date.UTC(get("year"), get("month") - 1, get("day")) - offsetMin * MINUTE
  const sign = offsetMin <= 0 ? "-" : "+"
  const abs = Math.abs(offsetMin)
  const offset = `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`
  const fmt = (ms: number) => {
    const local = new Date(ms + offsetMin * MINUTE).toISOString().slice(0, 19)
    return `${local}${offset}`
  }
  return { start: fmt(startMs), resets: fmt(startMs + DAY), startMs }
}
