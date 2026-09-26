/**
 * Simulated POST /services/{id}/questions/suggest (backend ai/config_assist/suggest.py): 4–6 question drafts
 * whose keys do not collide with the service's active questions, plus one rule. Deterministic, like the
 * backend's cached LLM call.
 */
import type {
  QuestionSuggestionsOut,
  ServiceOut,
  SignalQuestionOut,
  SuggestedQuestionOut,
  SuggestedRuleOut,
} from "@/api/generated/model"

import { hash } from "../data/prng"

type Draft = Omit<SuggestedQuestionOut, "key"> & { key: string }

const draft = (
  d: Partial<Draft> & Pick<Draft, "key" | "label" | "text" | "category">
): Draft => ({
  polarity: "positive",
  weight: "medium",
  source_types: ["news", "website"],
  recency_days: 365,
  keywords: {},
  job_titles: [],
  negative_terms: [],
  ...d,
})

const IA: Draft[] = [
  draft({
    key: "ia_ssc_cee",
    label: "Shared service centre in CEE",
    text: "Is the company opening or expanding a shared service centre in Poland, Romania, Czechia or Bulgaria?",
    category: "shared_services",
    source_types: ["jobs", "news", "website"],
    keywords: {
      en: [
        "shared service centre",
        "global business services",
        "nearshore hub",
      ],
    },
    job_titles: ["SSC Manager", "GBS Lead", "Transition Manager"],
  }),
  draft({
    key: "ia_idp",
    label: "Document-heavy back office",
    text: "Does the company describe manual, document-heavy processes such as invoice, claims or customs-document handling?",
    category: "ai_automation",
    weight: "high",
    source_types: ["jobs", "news", "report", "website"],
    keywords: {
      en: [
        "invoice processing",
        "claims handling",
        "customs documents",
        "manual data entry",
      ],
    },
  }),
  draft({
    key: "ia_procurement",
    label: "Procurement digitalisation",
    text: "Is the company digitalising procurement or purchase-to-pay processes?",
    category: "digital_transformation",
    source_types: ["news", "report", "website"],
    keywords: {
      en: ["purchase-to-pay", "procurement digitalisation", "e-procurement"],
    },
  }),
  draft({
    key: "ia_cx_backlog",
    label: "Customer-service backlog",
    text: "Does the company report long customer-service waiting times or a growing contact backlog?",
    category: "cost_efficiency",
    source_types: ["news", "website"],
    recency_days: 180,
    keywords: {
      en: ["waiting times", "customer service backlog", "contact centre"],
    },
  }),
  draft({
    key: "ia_process_mining",
    label: "Process mining hiring",
    text: "Is the company hiring process mining or Celonis specialists?",
    category: "hiring",
    weight: "high",
    source_types: ["jobs"],
    recency_days: 90,
    keywords: { en: ["Celonis", "process mining", "process analyst"] },
    job_titles: ["Process Mining Analyst", "Celonis Consultant"],
  }),
  draft({
    key: "ia_outsourcing",
    label: "BPO contract ending",
    text: "Is a large business-process outsourcing contract of the company ending or being re-tendered?",
    category: "tech_partners",
    source_types: ["news"],
    recency_days: 540,
    keywords: { en: ["outsourcing contract", "re-tender", "BPO"] },
  }),
  draft({
    key: "ia_merger",
    label: "Post-merger integration",
    text: "Is the company integrating an acquisition and harmonising back-office processes?",
    category: "expansion",
    source_types: ["news", "report"],
    keywords: {
      en: ["post-merger integration", "acquisition completed", "harmonisation"],
    },
  }),
]

const CYBER: Draft[] = [
  draft({
    key: "cy_ot",
    label: "OT security programme",
    text: "Is the company securing operational technology (OT) networks in plants, grids or depots?",
    category: "expansion",
    weight: "high",
    source_types: ["jobs", "news", "website"],
    keywords: {
      en: ["OT security", "IEC 62443", "industrial control systems"],
    },
    job_titles: ["OT Security Engineer"],
  }),
  draft({
    key: "cy_audit_findings",
    label: "Audit findings",
    text: "Has a regulator or auditor reported IT security findings at the company?",
    category: "compliance",
    weight: "high",
    source_types: ["news", "report"],
    recency_days: 540,
    keywords: {
      en: ["audit findings", "supervisory review", "remediation plan"],
    },
  }),
  draft({
    key: "cy_zero_trust",
    label: "Zero-trust rollout",
    text: "Is the company rolling out zero-trust access or replacing its VPN?",
    category: "tech_stack",
    weight: "low",
    source_types: ["jobs", "website"],
    keywords: { en: ["zero trust", "ZTNA", "VPN replacement"] },
  }),
  draft({
    key: "cy_supply_chain",
    label: "Supplier security requirements",
    text: "Does the company ask suppliers for security certifications or NIS2 supply-chain controls?",
    category: "compliance",
    source_types: ["website", "report"],
    keywords: {
      en: ["supplier security", "third-party risk", "supply chain security"],
    },
  }),
  draft({
    key: "cy_awareness",
    label: "Phishing awareness",
    text: "Is the company running security awareness or phishing simulation programmes?",
    category: "investment",
    weight: "low",
    source_types: ["news", "website"],
    keywords: { en: ["security awareness", "phishing simulation"] },
  }),
  draft({
    key: "cy_cloud_sec",
    label: "Cloud security hiring",
    text: "Is the company hiring cloud security architects or engineers?",
    category: "hiring",
    weight: "high",
    source_types: ["jobs"],
    recency_days: 90,
    keywords: { en: ["cloud security", "Azure security", "AWS security"] },
    job_titles: ["Cloud Security Architect"],
  }),
]

function genericDrafts(service: ServiceOut): Draft[] {
  const prefix = (
    service.slug
      .replace(/[^a-z0-9]+/g, "_")
      .split("_")
      .filter(Boolean)
      .map((p) => p[0])
      .join("") || "sv"
  ).slice(0, 4)
  const topic = service.name.toLowerCase()
  return [
    draft({
      key: `${prefix}_programme`,
      label: `${service.name} programme`,
      text: `Has the company announced a programme or budget related to ${topic}?`,
      category: "investment",
      weight: "high",
      source_types: ["news", "report", "website"],
    }),
    draft({
      key: `${prefix}_hiring`,
      label: "Relevant hiring",
      text: `Is the company hiring specialists or leaders for ${topic}?`,
      category: "hiring",
      weight: "high",
      source_types: ["jobs"],
      recency_days: 90,
    }),
    draft({
      key: `${prefix}_legacy`,
      label: "Legacy platform",
      text: "Do job ads or reports mention ageing legacy platforms the company wants to replace?",
      category: "tech_stack",
      source_types: ["jobs", "report"],
    }),
    draft({
      key: `${prefix}_leader`,
      label: "New leader",
      text: "Was a new CIO, CDO or CTO appointed in the last 12 months?",
      category: "leadership_change",
      source_types: ["news", "website"],
    }),
    draft({
      key: `${prefix}_inhouse`,
      label: "Strong in-house team",
      text: `Does the company already run a large in-house team for ${topic}?`,
      category: "internal_capability",
      polarity: "negative",
      source_types: ["website", "report"],
      recency_days: 730,
    }),
  ]
}

const RULES: Record<string, SuggestedRuleOut> = {
  intelligent_automation: {
    name: "Public sector body",
    kind: "firmographic",
    condition: {
      field: "industry_ids",
      op: "intersects",
      value: ["public_sector"],
    },
    action: "flag",
    cap_value: null,
  },
  cybersecurity: {
    name: "Too small for a managed SOC",
    kind: "firmographic",
    condition: { field: "employees", op: "lt", value: 500 },
    action: "cap",
    cap_value: 40,
  },
}

export function suggestQuestions(
  service: ServiceOut,
  questions: SignalQuestionOut[]
): QuestionSuggestionsOut {
  const active = new Set(
    questions
      .filter((q) => q.service_id === service.id && q.is_active)
      .map((q) => q.key)
  )
  const bank =
    service.slug === "intelligent_automation"
      ? IA
      : service.slug === "cybersecurity"
        ? CYBER
        : genericDrafts(service)
  const count = 4 + (hash(service.id) % 3)
  const drafts = bank.filter((d) => !active.has(d.key)).slice(0, count)
  const rule: SuggestedRuleOut = RULES[service.slug] ?? {
    name: "Too small",
    kind: "firmographic",
    condition: { field: "employees", op: "lt", value: 250 },
    action: "exclude",
    cap_value: null,
  }
  return {
    questions: drafts.map((d) => ({
      ...d,
      source_types: [...d.source_types].sort(),
    })),
    rules: [rule],
    model: "gemini-2.5-flash-lite",
    prompt_version: "suggest_questions@v1",
  }
}
