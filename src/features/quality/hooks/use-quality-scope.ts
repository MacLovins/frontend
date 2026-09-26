import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import { useCurrentService } from "@/hooks/use-current-service"

import { serviceTabLabels } from "../copy"

const SCOPE_PARAM = "scope"

export type ScopeTab = { id: string; label: string }

/**
 * `?scope=<serviceId>`, independent of the global `?service=`: the screen opens on all services.
 * An unknown or inactive id falls back to all services.
 */
export function useQualityScope() {
  const [params, setParams] = useSearchParams()
  const { services, isLoading } = useCurrentService()

  const tabs = useMemo<ScopeTab[]>(
    () =>
      services
        .map((service) => ({
          id: service.id,
          label: serviceTabLabels[service.slug] ?? service.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [services]
  )

  const requested = params.get(SCOPE_PARAM)
  // With one service the tabs are hidden, so a leftover `?scope=` must not narrow the page invisibly.
  const serviceId =
    requested && tabs.length > 1 && tabs.some((tab) => tab.id === requested)
      ? requested
      : undefined

  const setScope = useCallback(
    (next: string | undefined) => {
      setParams(
        (current) => {
          const search = new URLSearchParams(current)
          if (next) search.set(SCOPE_PARAM, next)
          else search.delete(SCOPE_PARAM)
          return search
        },
        { replace: true }
      )
    },
    [setParams]
  )

  // While services load, trust the URL so the first request already has the right scope.
  return {
    serviceId: isLoading ? (requested ?? undefined) : serviceId,
    tabs,
    isLoading,
    setScope,
  }
}
