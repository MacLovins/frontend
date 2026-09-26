/**
 * Timing of the mock backend.
 *
 * - Latency: every handler waits `mockLatency()` ms before answering (250 ms in the browser, 0 in Node so
 *   Vitest stays fast). In-request "work" (discovery search, question suggestions) only waits when latency
 *   is on.
 * - Simulation speed: background work (analysis runs, outreach jobs, keyword expansion) runs on plain
 *   `setTimeout`s whose durations are divided by the speed. Tests can raise the speed or use
 *   `vi.useFakeTimers()` and advance time.
 */
import { delay } from "msw"

// Vitest runs in Node even with the jsdom environment (where `window` exists), so check for Node itself.
const nodeProcess = (
  globalThis as { process?: { versions?: { node?: string } } }
).process
const isNode =
  Boolean(nodeProcess?.versions?.node) || typeof window === "undefined"

let latencyMs = isNode ? 0 : 250
let speed = 1

export function mockLatency(): number {
  return latencyMs
}

export function setMockLatency(ms: number): void {
  latencyMs = Math.max(0, ms)
}

/** 2 = background work twice as fast; 100 = practically instant. */
export function setSimulationSpeed(multiplier: number): void {
  speed = multiplier > 0 ? multiplier : 1
}

export function simulationSpeed(): number {
  return speed
}

/** A background duration scaled by the simulation speed. */
export function simMs(ms: number): number {
  return Math.max(0, Math.round(ms / speed))
}

/** Waits the configured response latency (skipped entirely at 0, so fake timers are not needed). */
export async function responseDelay(): Promise<void> {
  if (latencyMs > 0) await delay(latencyMs)
}

/** Extra in-request processing time (an LLM call, a registry query); only when latency is on. */
export async function processingDelay(ms: number): Promise<void> {
  if (latencyMs > 0) await delay(simMs(ms))
}

// --- background timers, cleared by resetDb() ----------------------------------------------------------

const timers = new Set<ReturnType<typeof setTimeout>>()

/** setTimeout that resetDb() can cancel; `ms` is scaled by the simulation speed. */
export function schedule(fn: () => void, ms: number): void {
  const handle = setTimeout(() => {
    timers.delete(handle)
    fn()
  }, simMs(ms))
  timers.add(handle)
}

export function clearScheduled(): void {
  for (const handle of timers) clearTimeout(handle)
  timers.clear()
}

/** Number of pending background timers (handy in tests: 0 means the simulation is idle). */
export function pendingSimulations(): number {
  return timers.size
}
