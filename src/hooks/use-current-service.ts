import { useCallback, useMemo } from "react"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router"

import { useListServices } from "@/api/generated/config/config"
import type { ServiceOut } from "@/api/generated/model"
import { readStorage, storageKeys, writeStorage } from "@/lib/storage"

const SETTINGS_PATH = /^\/settings\/[^/]+\/(questions|icp|rules|scoring)/

/**
 * The service the user is working in. Order: `/settings/:serviceId/…` → `?service=` → the last choice
 * (localStorage, if still active) → the first active service by name.
 */
export function useCurrentService() {
  const { serviceId: routeServiceId } = useParams()
  const [params] = useSearchParams()
  const services = useListServices({ query: { staleTime: 5 * 60_000 } })

  const active = useMemo(
    () => (services.data ?? []).filter((service) => service.is_active).sort((a, b) => a.name.localeCompare(b.name)),
    [services.data],
  )

  const requested = routeServiceId ?? params.get("service")
  const stored = readStorage(storageKeys.service)
  const serviceId =
    requested ?? (stored && active.some((service) => service.id === stored) ? stored : active[0]?.id)
  const service: ServiceOut | undefined = services.data?.find((item) => item.id === serviceId)

  return {
    serviceId,
    service,
    services: active,
    isLoading: services.isLoading,
    error: services.error,
    refetch: services.refetch,
  }
}

/** Switches the service in place: settings pages keep their section, other pages keep their path. */
export function useSelectService() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  return useCallback(
    (serviceId: string) => {
      writeStorage(storageKeys.service, serviceId)
      const section = SETTINGS_PATH.exec(pathname)?.[1]
      if (section) {
        void navigate(`/settings/${serviceId}/${section}`)
        return
      }
      const next = new URLSearchParams(params)
      next.set("service", serviceId)
      next.delete("page")
      void navigate({ pathname, search: next.toString() })
    },
    [navigate, params, pathname],
  )
}

/** Adds the current `?service=` to an app link so the choice survives navigation. */
export function withService(path: string, serviceId: string | undefined) {
  if (!serviceId) return path
  const [pathname, query = ""] = path.split("?")
  const search = new URLSearchParams(query)
  search.set("service", serviceId)
  return `${pathname}?${search.toString()}`
}
