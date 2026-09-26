import type { stages } from "@/lib/labels"

export type Role = "admin" | "sales"
export type Tier = "hot" | "warm" | "cold" | "disqualified"
export type Weight = "H" | "M" | "L"
export type Stage = (typeof stages)[number]
export type Feedback = "correct" | "wrong" | "irrelevant" | null
export type KeywordStatus = "pending" | "ready" | "failed"

export type Me = {
  email: string
  role: Role
}

export type Service = {
  id: string
  name: string
  preset: "ia" | "cyber" | null
}

export type WhyNow = {
  text: string
  source: string
  date: string
  url: string
  positive: boolean
}

export type BreakdownRow = {
  label: string
  weight: Weight
  width: number
  delta: number
}

export type Signal = {
  id: string
  question: string
  category: string
  strength: "strong" | "medium" | "weak"
  confidence: number
  quote: string
  source: string
  url: string
  date: string
  feedback: Feedback
}

export type Score = {
  priority: number
  tier: Tier
  fit: number
  signals: number
  blockers: number
}

export type SourceRow = {
  title: string
  type: "news" | "web" | "jobs"
  date: string
  url: string
}

export type Company = {
  id: string
  name: string
  domain: string
  country: string
  countryCode: string
  industry: string
  employees: string
  scores: Record<string, Score>
  whyNow: Record<string, WhyNow[]>
  breakdown: Record<string, BreakdownRow[]>
  signals: Record<string, Signal[]>
  sources: SourceRow[]
  notes: string
  decisionMakers: string[]
  isNew: boolean
}

export type Prospect = {
  id: string
  rank: number
  name: string
  domain: string
  country: string
  countryCode: string
  industry: string
  priority: number
  tier: Tier
  fit: number
  signals: number
  blockers: number
  whyNow: WhyNow[]
  signalCount: number
  newCount: number
}

export type ProspectQuery = {
  serviceId: string
  q: string
  country: string
  industry: string
  tier: string
  onlyNew: boolean
  minPriority: number
}

export type RunCompany = {
  companyId: string
  name: string
  stage: Stage
  failed: boolean
  message: string
}

export type Run = {
  id: string
  serviceId: string
  status: "running" | "finished" | "paused"
  companies: RunCompany[]
  createdAt: string
}

export type Account = {
  id: string
  name: string
  domain: string
  country: string
  industry: string
}

export type Question = {
  id: string
  serviceId: string
  text: string
  category: string
  polarity: "+" | "-"
  weight: Weight
  sources: string[]
  windowDays: number
  keywordStatus: KeywordStatus
  keywords: string[]
  active: boolean
}

export type Icp = {
  countries: string[]
  industries: string[]
  headcount: string
  revenue: string
  nice: { label: string; weight: number }[]
}

export type Rule = {
  id: string
  serviceId: string
  name: string
  kind: "firmographic" | "signal" | "domains"
  effect: "exclude" | "cap" | "flag"
  detail: string
}

export type Scoring = {
  weights: Record<Weight, number>
  fitBalance: number
  riskPenalty: number
  hot: number
  warm: number
  cold: number
  newsHalfLife: number
  minConfidence: number
}

export type Candidate = {
  id: string
  name: string
  domain: string
  country: string
  fit: number
}
