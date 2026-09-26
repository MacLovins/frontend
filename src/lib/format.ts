import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns"

/** "3 min ago", "2 days ago". */
export function relativeTime(iso: string) {
  return `${formatDistanceToNowStrict(parseISO(iso))} ago`
}

/** Compact age of an evidence date, as the prospect list shows it: "6 d", "2 w", "3 mo", "2 y". */
export function compactAge(isoDate: string, now = new Date()) {
  const date = parseISO(isoDate)
  const days = differenceInCalendarDays(now, date)
  if (days < 0) return format(date, "MMM yyyy")
  if (days < 14) return `${days} d`
  if (days < 60) return `${Math.round(days / 7)} w`
  if (days < 730) return `${Math.round(days / 30.4)} mo`
  return `${Math.floor(days / 365)} y`
}

/** "18 Jun 2026". */
export function formatDate(iso: string) {
  return format(parseISO(iso), "d MMM yyyy")
}

/** "26 Sep 2026, 08:14". */
export function formatDateTime(iso: string) {
  return format(parseISO(iso), "d MMM yyyy, HH:mm")
}

const integer = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 })

/** "590,000". */
export function formatNumber(value: number) {
  return integer.format(value)
}

/** "590k", "12.4k", "1.2m" — head counts in dense rows. */
export function formatCompact(value: number) {
  return compact.format(value).toLowerCase()
}

/** "€81.8bn", "€450m". */
export function formatEuros(value: number) {
  if (value >= 1e9) return `€${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)}bn`
  if (value >= 1e6) return `€${Math.round(value / 1e6)}m`
  return `€${formatNumber(value)}`
}

/** Score values arrive with one decimal; the UI shows whole numbers. */
export function score(value: number) {
  return Math.round(value)
}

/** 0.861 → "86%". */
export function percent(ratio: number) {
  return `${Math.round(ratio * 100)}%`
}
