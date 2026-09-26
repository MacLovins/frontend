import { useCallback } from "react"
import { useSearchParams } from "react-router"

import { monitoringOptions, type Monitoring } from "@/features/accounts/copy"

// Own keys only: `in` would accept "toString" and crash the monitoring select.
const isMonitoring = (value: string | null): value is Monitoring =>
  value !== null && Object.hasOwn(monitoringOptions, value)

/** `?q=&tracked=all|yes|no&page=` — other params (e.g. `service`) are kept. */
export function useAccountsParams() {
  const [params, setParams] = useSearchParams()
  const q = params.get("q") ?? ""
  const rawTracked = params.get("tracked")
  const tracked: Monitoring = isMonitoring(rawTracked) ? rawTracked : "all"
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "", 10) || 1)

  const update = useCallback(
    (changes: Record<string, string | null>, replace = false) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace }
      ),
    [setParams]
  )

  const setQuery = useCallback(
    (value: string) => update({ q: value, page: null }, true),
    [update]
  )
  const setTracked = useCallback(
    (value: Monitoring) =>
      update({ tracked: value === "all" ? null : value, page: null }),
    [update]
  )
  const setPage = useCallback(
    (value: number) => update({ page: value > 1 ? String(value) : null }),
    [update]
  )

  return { q, tracked, page, setQuery, setTracked, setPage }
}
