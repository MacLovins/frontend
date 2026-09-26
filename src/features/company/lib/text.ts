import { differenceInMinutes, format, isThisYear, parseISO } from "date-fns"

import type { Polarity } from "@/api/generated/model"
import { formatDate, formatNumber } from "@/lib/format"

/** "just now", "12 min ago", "2 h ago", "3 d ago", "2 w ago", then the date. */
export function relativeShort(iso: string, now = new Date()) {
  const minutes = differenceInMinutes(now, parseISO(iso))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d ago`
  if (days < 35) return `${Math.floor(days / 7)} w ago`
  return formatDate(iso)
}

/** "14 Sep", with the year when it is not the current one. */
export function formatDateShort(iso: string) {
  const date = parseISO(iso)
  return format(date, isThisYear(date) ? "d MMM" : "d MMM yyyy")
}

/** Breakdown points are always ≥ 0; the sign comes from the question's polarity. "+2.49", "−0.96". */
export function formatPoints(points: number, polarity: Polarity) {
  return `${polarity === "negative" ? "−" : "+"}${points.toFixed(2)}`
}

export function employeesText(employees: number) {
  return `≈ ${formatNumber(employees)} employees`
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** Mirrors the backend's `normalize_url`, so signal URLs can be matched to documents. */
export function normalizeUrl(url: string) {
  return url.split("#")[0].trim().replace(/\/+$/, "").toLowerCase()
}

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`
