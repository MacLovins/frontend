/**
 * Deterministic seed of the mock backend: the Orange Systems demo org with the design's companies, scores,
 * evidence, runs and activity. Content and ids never change; timestamps are relative to `now`, so the demo
 * always looks fresh ("2 h ago", "yesterday").
 */
import { seedConfig, seedUsers, ORG_NAME } from "./build/config"
import { seedEvidence } from "./build/evidence"
import { RECENT_RUN_ID, seedHistory } from "./build/history"
import { seedMetrics, seedUsage } from "./build/metrics"
import { DISCOVERY_POOL } from "./data/discovery"
import { ORG_ID } from "./data/ids"
import type { DbState } from "./types"

export { DEMO_USERS, ORG_NAME } from "./build/config"
export {
  ORG_ID,
  SERVICE_CLOUD_ID,
  SERVICE_CYBER_ID,
  SERVICE_IA_ID,
  USER_ADMIN_ID,
  USER_INACTIVE_ID,
  USER_SALES_ID,
} from "./data/ids"
export { companyId } from "./build/evidence"
export { SEEDED_RUN_IDS } from "./build/history"

export function buildSeed(now: Date = new Date()): DbState {
  const state: DbState = {
    org: { id: ORG_ID, name: ORG_NAME },
    users: seedUsers(now),
    sessionUserId: null,
    loginFailures: {},
    services: [],
    questions: [],
    icps: [],
    rules: [],
    profiles: [],
    companies: [],
    documents: [],
    signals: [],
    scores: [],
    feedback: [],
    events: [],
    runs: [],
    runEvents: [],
    runEventSeq: 0,
    runtime: {},
    outreachJobs: [],
    candidates: structuredClone(DISCOVERY_POOL),
    qualityBaseline: [],
    rejectedEvidence: {},
    historicEvidence: {},
    usage: seedUsage(),
    idSeq: 0,
    analysisSeq: 0,
  }
  seedConfig(state, now)
  seedEvidence(state, now, RECENT_RUN_ID)
  seedHistory(state, now)
  seedMetrics(state)
  return state
}
