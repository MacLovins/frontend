import { differenceInCalendarDays, format } from "date-fns"

/** Feed timestamps: "06:12", "Yesterday 22:05", "Tue 18:10", "12 Sep". */
export function formatWhen(iso: string, now: number) {
  const date = new Date(iso)
  const days = differenceInCalendarDays(now, date)
  if (days <= 0) return format(date, "HH:mm")
  if (days === 1) return `Yesterday ${format(date, "HH:mm")}`
  if (days <= 6) return format(date, "EEE HH:mm")
  return format(date, "d MMM")
}

/** "today, 08:14", "yesterday, 17:40", "22 Sep, 17:40". */
export function formatLastVisit(time: number, now: number) {
  const days = differenceInCalendarDays(now, time)
  if (days <= 0) return `today, ${format(time, "HH:mm")}`
  if (days === 1) return `yesterday, ${format(time, "HH:mm")}`
  return format(time, "d MMM, HH:mm")
}

/** "06:14" today, "25 Sep, 06:14" before. */
export function formatClock(iso: string, now: number) {
  const date = new Date(iso)
  return differenceInCalendarDays(now, date) <= 0
    ? format(date, "HH:mm")
    : format(date, "d MMM, HH:mm")
}
