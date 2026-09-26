import { useCallback, useSyncExternalStore } from "react"

import type { RejectedSignal } from "../lib/lead-card"

/**
 * Signals the user marked "Wrong" in this browser session, per company and service. The API drops them
 * from the card once rejected, so this snapshot keeps them visible (greyed, with undo) on Company and
 * counted as "rejected" on Sources.
 */
type Scope = ReadonlyMap<string, RejectedSignal>

const EMPTY: Scope = new Map()
const scopes = new Map<string, Scope>()
const listeners = new Set<() => void>()

const scopeKey = (companyId: string, serviceId: string) =>
  `${companyId}:${serviceId}`

function update(
  companyId: string,
  serviceId: string,
  change: (scope: Map<string, RejectedSignal>) => void
) {
  const key = scopeKey(companyId, serviceId)
  const next = new Map(scopes.get(key) ?? EMPTY)
  change(next)
  scopes.set(key, next)
  listeners.forEach((listener) => listener())
}

export const getRejected = (
  companyId: string,
  serviceId: string,
  signalId: string
) => scopes.get(scopeKey(companyId, serviceId))?.get(signalId)

export function rememberRejected(
  companyId: string,
  serviceId: string,
  entry: RejectedSignal
) {
  update(companyId, serviceId, (scope) => scope.set(entry.signal.id, entry))
}

export function forgetRejected(
  companyId: string,
  serviceId: string,
  signalId: string
) {
  if (!scopes.get(scopeKey(companyId, serviceId))?.has(signalId)) return
  update(companyId, serviceId, (scope) => scope.delete(signalId))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRejectedSignals(
  companyId: string,
  serviceId: string | undefined
): Scope {
  const read = useCallback(
    () =>
      serviceId ? (scopes.get(scopeKey(companyId, serviceId)) ?? EMPTY) : EMPTY,
    [companyId, serviceId]
  )
  return useSyncExternalStore(subscribe, read)
}
