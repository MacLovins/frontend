import { formatDistanceToNow, parseISO } from "date-fns"

export function relativeDate(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

export function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
}
