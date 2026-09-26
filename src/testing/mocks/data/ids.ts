/**
 * Deterministic UUIDs: `00000000-0000-4000-8000-GGGGNNNNNNNN` (version 4 and variant bits set, so they
 * validate as UUIDs), where GGGG is the entity group and NNNNNNNN a sequence number.
 */

const hex = (n: number, width: number) => n.toString(16).padStart(width, "0")

export function uuid(group: number, n: number): string {
  return `00000000-0000-4000-8000-${hex(group, 4)}${hex(n, 8)}`
}

export const G = {
  org: 0x0001,
  user: 0x0002,
  service: 0x0003,
  question: 0x0004,
  icp: 0x0005,
  rule: 0x0006,
  profile: 0x0007,
  company: 0x000c,
  document: 0x000d,
  signal: 0x0051,
  score: 0x0052,
  feedback: 0x00fb,
  event: 0x00e0,
  run: 0x00a0,
  runtime: 0xff00,
} as const

export const ORG_ID = uuid(G.org, 1)

export const USER_ADMIN_ID = uuid(G.user, 1)
export const USER_SALES_ID = uuid(G.user, 2)
export const USER_INACTIVE_ID = uuid(G.user, 3)

export const SERVICE_IA_ID = uuid(G.service, 1)
export const SERVICE_CYBER_ID = uuid(G.service, 2)
export const SERVICE_CLOUD_ID = uuid(G.service, 3)

/** Counter-based id for records created while the mock runs. */
export function nextId(state: { idSeq: number }): string {
  state.idSeq += 1
  return uuid(G.runtime, state.idSeq)
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}
