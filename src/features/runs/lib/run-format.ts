import { format, isToday, parseISO } from "date-fns"

import type { RunOut, ServiceOut } from "@/api/generated/model"

import { kindLabels, plural, serviceShortLabels } from "../copy"

/** Runs have no sequential number (backend gap), so the UI shows the first six characters of the UUID. */
export function shortId(id: string) {
  return id.slice(0, 6)
}

/** "06:14" today, "18 Jun" before. */
export function runTime(iso: string) {
  const date = parseISO(iso)
  return format(date, isToday(date) ? "HH:mm" : "d MMM")
}

export function serviceShortLabel(service: ServiceOut | undefined) {
  if (!service) return "Service"
  return serviceShortLabels[service.slug] ?? service.name
}

function servicesLabel(serviceIds: string[], services: ServiceOut[]) {
  if (serviceIds.length === 0) {
    return services.filter((service) => service.is_active).length === 2
      ? "both services"
      : "all services"
  }
  if (serviceIds.length === 1)
    return (
      services.find((service) => service.id === serviceIds[0])?.name ??
      "1 service"
    )
  return `${serviceIds.length} services`
}

/** "Analyze 4 companies · both services · full re-analysis · started 08:14" from the run's own fields. */
export function runSubtitle(run: RunOut, services: ServiceOut[]) {
  const parts = [
    `${kindLabels[run.kind]} ${plural(run.progress.total, "company", "companies")}`,
    servicesLabel(run.params.service_ids, services),
  ]
  if (run.params.trigger === "scheduler") parts.push("scheduled")
  if (run.params.mode === "full") parts.push("full re-analysis")
  const started = parseISO(run.started_at ?? run.created_at)
  parts.push(
    `started ${format(started, isToday(started) ? "HH:mm" : "d MMM, HH:mm")}`
  )
  return parts.join(" · ")
}
