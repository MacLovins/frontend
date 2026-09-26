/**
 * In-memory state of the mock backend, initialized from the seed. Handlers read and mutate `db` directly;
 * `resetDb()` restores the seed (tests call it after each test).
 */
import { iso } from "./data/time"
import type { EmitSpec } from "./engine/timeline"
import { buildSeed } from "./seed"
import { clearScheduled } from "./settings"
import type { DbState, RunEventRecord, UserRecord } from "./types"

export const db: DbState = buildSeed()

// --- session (the backend's httpOnly cookie), mirrored to sessionStorage so a reload keeps you signed in ---

const SESSION_KEY = "leadradar.mock.session"

function readStoredSession(): string | null {
  try {
    return typeof sessionStorage === "undefined"
      ? null
      : sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function writeStoredSession(userId: string | null): void {
  try {
    if (typeof sessionStorage === "undefined") return
    if (userId) sessionStorage.setItem(SESSION_KEY, userId)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // storage blocked (private mode, sandboxed iframe): the session lives in memory only
  }
}

function restoreSession(): void {
  const stored = readStoredSession()
  db.sessionUserId =
    stored && db.users.some((u) => u.id === stored) ? stored : null
}

restoreSession()

export function signIn(userId: string): void {
  db.sessionUserId = userId
  writeStoredSession(userId)
}

export function signOut(): void {
  db.sessionUserId = null
  writeStoredSession(null)
}

export function currentUser(): UserRecord | null {
  return db.users.find((u) => u.id === db.sessionUserId) ?? null
}

// --- run events: stored with a global increasing id and pushed to live SSE subscribers ---------------

type RunListener = (event: RunEventRecord) => void

const runListeners = new Map<string, Set<RunListener>>()
const openStreams = new Set<() => void>()

export function subscribeRun(runId: string, listener: RunListener): () => void {
  const set = runListeners.get(runId) ?? new Set<RunListener>()
  set.add(listener)
  runListeners.set(runId, set)
  return () => {
    set.delete(listener)
    if (set.size === 0) runListeners.delete(runId)
  }
}

/** Stores a run event (next global id) and publishes it to the run's live streams. */
export function emitRunEvent(runId: string, spec: EmitSpec): RunEventRecord {
  db.runEventSeq += 1
  const record: RunEventRecord = {
    id: db.runEventSeq,
    run_id: runId,
    company_id: spec.company_id,
    event: spec.event,
    data: spec.data,
  }
  db.runEvents.push(record)
  for (const listener of [...(runListeners.get(runId) ?? [])]) listener(record)
  return record
}

/** SSE streams register a closer so resetDb() can end them. Returns the unregister function. */
export function registerStream(close: () => void): () => void {
  openStreams.add(close)
  return () => openStreams.delete(close)
}

// --- reset ---------------------------------------------------------------------------------------------

/** Restores the seed: clears background timers, closes live streams and signs out. */
export function resetDb(): void {
  clearScheduled()
  for (const close of [...openStreams]) close()
  openStreams.clear()
  runListeners.clear()
  Object.assign(db, buildSeed(new Date()))
  signOut()
}

export function nowIso(): string {
  return iso(Date.now())
}
