import { useCallback, useMemo, useSyncExternalStore } from "react"

// The API has no staleness data (backend gap GAP-4), so the questions whose wording changed in this browser
// session are remembered per service until a re-analysis starts. sessionStorage may be blocked; memory is the
// source of truth and storage only survives reloads.
const memory = new Map<string, string>()
const listeners = new Set<() => void>()

const storageKey = (serviceId: string) => `lr:questions-changed:${serviceId}`

function readRaw(serviceId: string) {
  const key = storageKey(serviceId)
  if (!memory.has(key)) {
    let stored = ""
    try {
      stored = window.sessionStorage.getItem(key) ?? ""
    } catch {
      // Blocked storage: start empty.
    }
    memory.set(key, stored)
  }
  return memory.get(key) ?? ""
}

function parseIds(raw: string): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : []
  } catch {
    return []
  }
}

function writeIds(serviceId: string, ids: string[]) {
  const key = storageKey(serviceId)
  const raw = ids.length ? JSON.stringify(ids) : ""
  memory.set(key, raw)
  try {
    if (raw) window.sessionStorage.setItem(key, raw)
    else window.sessionStorage.removeItem(key)
  } catch {
    // Not persisted; the banner still works until the tab reloads.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useChangedQuestions(serviceId: string) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(serviceId))
  const ids = useMemo(() => parseIds(raw), [raw])

  const add = useCallback(
    (questionIds: string[]) => {
      if (!questionIds.length) return
      const current = parseIds(readRaw(serviceId))
      writeIds(serviceId, [...new Set([...current, ...questionIds])])
    },
    [serviceId]
  )
  const clear = useCallback(() => writeIds(serviceId, []), [serviceId])

  return { ids, add, clear }
}
