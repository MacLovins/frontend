/** Seed: org, users and the service configuration (from the backend presets + the design's extras). */
import type {
  DisqualificationRuleOut,
  ICPProfileOut,
  ScoringProfileOut,
  ServiceOut,
  SignalQuestionOut,
} from "@/api/generated/model"

import {
  G,
  ORG_ID,
  SERVICE_CLOUD_ID,
  SERVICE_CYBER_ID,
  SERVICE_IA_ID,
  USER_ADMIN_ID,
  USER_INACTIVE_ID,
  USER_SALES_ID,
  uuid,
} from "../data/ids"
import {
  CYBERSECURITY,
  INTELLIGENT_AUTOMATION,
  type PresetDef,
} from "../data/presets"
import { agoIso, agoMs, iso } from "../data/time"
import { expandedKeywords } from "../engine/keywords"
import { DEFAULT_PARAMS } from "../engine/scoring"
import type { DbState, UserRecord } from "../types"

export const ORG_NAME = "Orange Systems"

/** The backend's public demo seed accounts. */
export const DEMO_USERS = {
  admin: { email: "admin@leadradar.ai", password: "admin12345!" },
  sales: { email: "sales@leadradar.ai", password: "sales12345!" },
} as const

export function seedUsers(now: Date): UserRecord[] {
  return [
    {
      id: USER_ADMIN_ID,
      org_id: ORG_ID,
      email: DEMO_USERS.admin.email,
      password: DEMO_USERS.admin.password,
      full_name: "Ana Rusu",
      role: "admin",
      is_active: true,
      last_login_at: agoIso(now, { h: 1, m: 12 }),
      created_at: agoIso(now, { d: 200 }),
    },
    {
      id: USER_SALES_ID,
      org_id: ORG_ID,
      email: DEMO_USERS.sales.email,
      password: DEMO_USERS.sales.password,
      full_name: "Ion Ceban",
      role: "sales",
      is_active: true,
      last_login_at: agoIso(now, { h: 9, m: 40 }),
      created_at: agoIso(now, { d: 150 }),
    },
    {
      id: USER_INACTIVE_ID,
      org_id: ORG_ID,
      email: "elena.moraru@leadradar.ai",
      password: "elena12345!",
      full_name: "Elena Moraru",
      role: "sales",
      is_active: false,
      last_login_at: agoIso(now, { d: 61 }),
      created_at: agoIso(now, { d: 100 }),
    },
  ]
}

const PRESET_DAYS = 120

/** The IA question added from the design's Questions drawer (keywords ready in EN, DE, PL, RO). */
const SSC_CEE = {
  key: "ia_ssc_cee",
  text: "Is the company opening or expanding a shared service centre in Eastern Europe (Poland, Romania, Czechia, Bulgaria)?",
  keywords: {
    en: [
      "shared service centre",
      "global business services",
      "nearshore hub",
      "service delivery centre",
    ],
    de: ["Shared-Service-Center", "Dienstleistungszentrum"],
    pl: ["centrum usług wspólnych", "centrum usług biznesowych"],
    ro: ["centru de servicii partajate", "hub de servicii"],
  },
  job_titles: ["SSC Manager", "GBS Lead", "Transition Manager"],
  negative_terms: ["shared office space", "co-working"],
}

function presetService(
  id: string,
  preset: PresetDef,
  createdMs: number,
  updatedMs: number
): ServiceOut {
  return {
    id,
    org_id: ORG_ID,
    name: preset.name,
    slug: preset.key,
    description: preset.description,
    value_proposition: preset.value_proposition,
    decision_makers: [...preset.decision_makers],
    is_active: true,
    created_at: iso(createdMs),
    updated_at: iso(updatedMs),
  }
}

export function seedConfig(state: DbState, now: Date): void {
  const t0 = agoMs(now, { d: PRESET_DAYS })
  state.services = [
    presetService(
      SERVICE_IA_ID,
      INTELLIGENT_AUTOMATION,
      t0,
      agoMs(now, { d: 30 })
    ),
    presetService(SERVICE_CYBER_ID, CYBERSECURITY, t0 + 60_000, t0 + 60_000),
    {
      id: SERVICE_CLOUD_ID,
      org_id: ORG_ID,
      name: "Cloud & Data Platforms",
      slug: "cloud_data_platforms",
      description:
        "We migrate legacy data warehouses to modern cloud data platforms and set up data governance. Typical buyers are CDOs at mid-size and large companies in regulated industries.",
      value_proposition: "",
      decision_makers: ["Chief Data Officer", "CIO", "Head of Data"],
      is_active: false,
      created_at: agoIso(now, { d: 3, h: 4 }),
      updated_at: agoIso(now, { d: 3, h: 4 }),
    },
  ]

  let q = 0
  const questions: SignalQuestionOut[] = []
  for (const [serviceId, preset, base] of [
    [SERVICE_IA_ID, INTELLIGENT_AUTOMATION, t0],
    [SERVICE_CYBER_ID, CYBERSECURITY, t0 + 60_000],
  ] as const) {
    preset.questions.forEach((pq, i) => {
      q += 1
      const created = iso(base + (i + 1) * 1000)
      questions.push({
        id: uuid(G.question, q),
        org_id: ORG_ID,
        service_id: serviceId,
        key: pq.key,
        text: pq.text,
        category: pq.category,
        polarity: pq.polarity,
        weight: pq.weight,
        source_types: [...pq.source_types],
        recency_days: pq.recency_days,
        keywords: expandedKeywords(pq, pq.keywords_seed),
        job_titles: [...pq.job_titles],
        negative_terms: [...pq.negative_terms],
        keywords_status: "ready",
        version: 1,
        is_active: true,
        created_at: created,
        updated_at: iso(base + (i + 1) * 1000 + 45_000),
      })
    })
  }
  q += 1
  questions.push({
    id: uuid(G.question, q),
    org_id: ORG_ID,
    service_id: SERVICE_IA_ID,
    key: SSC_CEE.key,
    text: SSC_CEE.text,
    category: "shared_services",
    polarity: "positive",
    weight: "medium",
    source_types: ["news", "website", "jobs"],
    recency_days: 365,
    keywords: SSC_CEE.keywords,
    job_titles: SSC_CEE.job_titles,
    negative_terms: SSC_CEE.negative_terms,
    keywords_status: "ready",
    version: 1,
    is_active: true,
    created_at: agoIso(now, { h: 14, m: 10 }),
    updated_at: agoIso(now, { h: 14, m: 9 }),
  })
  state.questions = questions

  const icp = (
    id: number,
    serviceId: string,
    preset: PresetDef,
    version: number,
    createdMs: number,
    updatedMs: number
  ): ICPProfileOut => ({
    id: uuid(G.icp, id),
    service_id: serviceId,
    countries: [...preset.icp.countries],
    industries_any: [],
    employees_min: preset.icp.employees_min,
    employees_max: null,
    revenue_min_eur: null,
    nice_to_have: {
      criteria: preset.icp.nice_to_have.map((c) => ({
        ...c,
        values: [...c.values],
      })),
    },
    version,
    created_at: iso(createdMs),
    updated_at: iso(updatedMs),
  })
  state.icps = [
    icp(1, SERVICE_IA_ID, INTELLIGENT_AUTOMATION, 2, t0, agoMs(now, { d: 30 })),
    icp(2, SERVICE_CYBER_ID, CYBERSECURITY, 1, t0 + 60_000, t0 + 60_000),
  ]

  let r = 0
  const rules: DisqualificationRuleOut[] = []
  for (const [serviceId, preset, base] of [
    [SERVICE_IA_ID, INTELLIGENT_AUTOMATION, t0],
    [SERVICE_CYBER_ID, CYBERSECURITY, t0 + 60_000],
  ] as const) {
    preset.rules.forEach((rule, i) => {
      r += 1
      rules.push({
        id: uuid(G.rule, r),
        service_id: serviceId,
        name: rule.name,
        kind: rule.kind,
        condition: structuredClone(rule.condition),
        action: rule.action,
        cap_value: rule.cap_value,
        is_active: true,
        created_at: iso(base + (i + 1) * 1000),
        updated_at: iso(base + (i + 1) * 1000),
      })
    })
  }
  r += 1
  rules.push({
    id: uuid(G.rule, r),
    service_id: SERVICE_IA_ID,
    name: "Competitors and existing clients",
    kind: "list",
    condition: {
      domains: [
        "automatica-consulting.example",
        "processbridge.example",
        "botforge.example",
        "flowmatic.example",
        "rpa-partners.example",
        "digitalops.example",
        "clevercase.example",
        "nordic-automation.example",
        "alpine-bots.example",
        "iberia-rpa.example",
        "kaizen-digital.example",
        "baltic-rpa.example",
        "celtic-automation.example",
        "orange-systems.example",
      ],
    },
    action: "exclude",
    cap_value: null,
    is_active: true,
    created_at: agoIso(now, { d: 20 }),
    updated_at: agoIso(now, { d: 20 }),
  })
  state.rules = rules

  const profile = (
    id: number,
    serviceId: string,
    version: number,
    params: Partial<typeof DEFAULT_PARAMS>,
    atMs: number,
    current: boolean
  ): ScoringProfileOut => ({
    id: uuid(G.profile, id),
    service_id: serviceId,
    version,
    params: { ...structuredClone(DEFAULT_PARAMS), ...params },
    is_current: current,
    created_at: iso(atMs),
    updated_at: iso(atMs),
  })
  // v3 is the design's "Hot from 65" profile; its tau_intent 3 reproduces the artboards' numbers.
  state.profiles = [
    profile(1, SERVICE_IA_ID, 1, {}, t0, false),
    profile(
      2,
      SERVICE_IA_ID,
      2,
      { tau_intent: 4.0 },
      agoMs(now, { d: 45 }),
      false
    ),
    profile(
      3,
      SERVICE_IA_ID,
      3,
      { tau_intent: 3.0 },
      agoMs(now, { d: 29 }),
      true
    ),
    profile(4, SERVICE_CYBER_ID, 1, {}, t0 + 60_000, false),
    profile(
      5,
      SERVICE_CYBER_ID,
      2,
      { tau_intent: 3.0 },
      agoMs(now, { d: 29 }),
      true
    ),
  ]
}
