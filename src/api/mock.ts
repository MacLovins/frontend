import {
  discoveryPool,
  emptyRun,
  seedAccounts,
  seedCompanies,
  seedIcp,
  seedQuestions,
  seedRules,
  seedScoring,
  services,
} from "@/api/seed"
import type {
  Account,
  Candidate,
  Company,
  Feedback,
  Icp,
  Me,
  Prospect,
  ProspectQuery,
  Question,
  Role,
  Rule,
  Run,
  Scoring,
  Service,
  Weight,
} from "@/api/types"
import { stages } from "@/lib/labels"

const SESSION_KEY = "lr_mock_session"

type Db = {
  companies: Company[]
  accounts: Account[]
  questions: Question[]
  rules: Rule[]
  icp: Icp
  scoring: Scoring
  runs: Run[]
  services: Service[]
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

const db: Db = {
  companies: clone(seedCompanies),
  accounts: clone(seedAccounts),
  questions: clone(seedQuestions),
  rules: clone(seedRules),
  icp: clone(seedIcp),
  scoring: clone(seedScoring),
  runs: [],
  services: clone(services),
}

function wait<T>(value: T) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), 180)
  })
}

export function mockMe(): Promise<Me | null> {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) {
    return wait(null)
  }
  const role: Role = raw.includes("admin") ? "admin" : "sales"
  return wait({ email: raw, role })
}

export function mockLogin(email: string, password: string) {
  if (!email.includes("@") || password.length < 1) {
    return Promise.reject(new Error("invalid_credentials"))
  }
  sessionStorage.setItem(SESSION_KEY, email.trim())
  return mockMe()
}

export function mockLogout() {
  sessionStorage.removeItem(SESSION_KEY)
  return wait(undefined)
}

export function mockServices() {
  return wait(db.services)
}

export function mockProspects(query: ProspectQuery): Promise<Prospect[]> {
  const rows = db.companies
    .map((company) => {
      const score = company.scores[query.serviceId]
      const reasons = company.whyNow[query.serviceId] ?? []
      const signals = company.signals[query.serviceId] ?? []
      if (!score) {
        return null
      }
      return {
        id: company.id,
        rank: 0,
        name: company.name,
        domain: company.domain,
        country: company.country,
        countryCode: company.countryCode,
        industry: company.industry,
        priority: score.priority,
        tier: score.tier,
        fit: score.fit,
        signals: score.signals,
        blockers: score.blockers,
        whyNow: reasons.slice(0, 3),
        signalCount: signals.length,
        newCount: company.isNew ? 2 : 0,
      } satisfies Prospect
    })
    .filter((row): row is Prospect => row !== null)
    .filter((row) => {
      if (query.q && !`${row.name} ${row.domain}`.toLowerCase().includes(query.q.toLowerCase())) {
        return false
      }
      if (query.country && row.country !== query.country) {
        return false
      }
      if (query.industry && row.industry !== query.industry) {
        return false
      }
      if (query.tier && row.tier !== query.tier) {
        return false
      }
      if (query.onlyNew && row.newCount === 0) {
        return false
      }
      return row.priority >= query.minPriority
    })
    .sort((a, b) => b.priority - a.priority)
    .map((row, index) => ({ ...row, rank: index + 1 }))

  return wait(rows)
}

export function mockCompany(id: string) {
  const company = db.companies.find((item) => item.id === id)
  if (!company) {
    return Promise.reject(new Error("not_found"))
  }
  return wait(clone(company))
}

export function mockFeedback(companyId: string, serviceId: string, signalId: string, feedback: Feedback) {
  const company = db.companies.find((item) => item.id === companyId)
  const signal = company?.signals[serviceId]?.find((item) => item.id === signalId)
  if (!signal) {
    return Promise.reject(new Error("not_found"))
  }
  signal.feedback = feedback
  if (feedback === "wrong") {
    const score = company?.scores[serviceId]
    if (score) {
      score.signals = Math.max(0, score.signals - 8)
      score.priority = Math.max(0, score.priority - 4)
    }
  }
  return wait(clone(company!))
}

export function mockNotes(companyId: string, notes: string) {
  const company = db.companies.find((item) => item.id === companyId)
  if (!company) {
    return Promise.reject(new Error("not_found"))
  }
  company.notes = notes
  return wait(clone(company))
}

export function mockAccounts() {
  return wait(clone(db.accounts))
}

export function mockAddAccount(input: Omit<Account, "id">) {
  const id = input.domain.replace(/\W/g, "")
  if (db.accounts.some((item) => item.domain === input.domain)) {
    return Promise.reject(new Error("domain_taken"))
  }
  const account = { ...input, id }
  db.accounts.push(account)
  db.companies.push({
    id,
    name: input.name,
    domain: input.domain,
    country: input.country,
    countryCode: input.country.slice(0, 2).toUpperCase(),
    industry: input.industry,
    employees: "Unknown",
    isNew: true,
    notes: "",
    decisionMakers: ["Managing director"],
    scores: {
      ia: { priority: 40, tier: "cold", fit: 50, signals: 20, blockers: 20 },
      cyber: { priority: 36, tier: "cold", fit: 44, signals: 18, blockers: 24 },
    },
    whyNow: { ia: [], cyber: [] },
    breakdown: { ia: [], cyber: [] },
    signals: { ia: [], cyber: [] },
    sources: [],
  })
  return wait(account)
}

export function mockDeleteAccount(id: string) {
  db.accounts = db.accounts.filter((item) => item.id !== id)
  db.companies = db.companies.filter((item) => item.id !== id)
  return wait(undefined)
}

export function mockImportCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const report = { added: 0, skipped: 0 }
  for (const line of lines.slice(1)) {
    const [name, domain, country, industry] = line.split(",").map((part) => part.trim())
    if (!name || !domain) {
      report.skipped += 1
      continue
    }
    if (db.accounts.some((item) => item.domain === domain)) {
      report.skipped += 1
      continue
    }
    void mockAddAccount({ name, domain, country: country || "Unknown", industry: industry || "Unknown" })
    report.added += 1
  }
  return wait(report)
}

export function mockDiscover(country: string): Promise<Candidate[]> {
  const rows = discoveryPool.filter((item) => !country || item.country === country)
  return wait(rows)
}

export function mockQuestions(serviceId: string) {
  return wait(db.questions.filter((item) => item.serviceId === serviceId).map((item) => clone(item)))
}

export function mockSaveQuestion(question: Question) {
  const index = db.questions.findIndex((item) => item.id === question.id)
  const next = { ...question, keywordStatus: "pending" as const }
  if (index === -1) {
    db.questions.push(next)
  } else {
    db.questions[index] = next
  }
  setTimeout(() => {
    const saved = db.questions.find((item) => item.id === question.id)
    if (saved) {
      saved.keywordStatus = "ready"
      saved.keywords = saved.keywords.length ? saved.keywords : ["generated keyword"]
    }
  }, 1200)
  return wait(clone(next))
}

export function mockSetWeight(id: string, weight: Weight) {
  const question = db.questions.find((item) => item.id === id)
  if (!question) {
    return Promise.reject(new Error("not_found"))
  }
  question.weight = weight
  return wait({ message: "Ranking updated: 3 tier changes" })
}

export function mockIcp() {
  return wait(clone(db.icp))
}

export function mockSaveIcp(icp: Icp) {
  db.icp = icp
  return wait(clone(db.icp))
}

export function mockRules(serviceId: string) {
  return wait(db.rules.filter((item) => item.serviceId === serviceId))
}

export function mockSaveRule(rule: Rule) {
  db.rules.push(rule)
  return wait(clone(rule))
}

export function mockScoring() {
  return wait(clone(db.scoring))
}

export function mockSaveScoring(scoring: Scoring) {
  db.scoring = scoring
  return wait({ message: "Rescored 58 companies in 0.8 s, 4 tier changes" })
}

export function mockRuns() {
  return wait(clone(db.runs))
}

export function mockRun(id: string) {
  const run = db.runs.find((item) => item.id === id)
  if (!run) {
    return Promise.reject(new Error("not_found"))
  }
  return wait(clone(run))
}

export function mockStartRun(serviceId: string, companyIds: string[]) {
  const names = db.companies
    .filter((company) => companyIds.length === 0 || companyIds.includes(company.id))
    .map((company) => ({ id: company.id, name: company.name }))
  const run = emptyRun(`run-${db.runs.length + 1}`, serviceId, names)
  db.runs.unshift(run)
  return wait(clone(run))
}

export function advanceRun(id: string) {
  const run = db.runs.find((item) => item.id === id)
  if (!run || run.status === "finished") {
    return
  }
  for (const company of run.companies) {
    const index = stages.indexOf(company.stage)
    const next = stages[Math.min(index + 1, stages.length - 1)]
    company.stage = next ?? company.stage
    company.message = company.stage === "done" ? "Scored" : `In ${company.stage}`
  }
  if (run.companies.every((company) => company.stage === "done")) {
    run.status = "finished"
  }
}

export function mockRetryFailed(id: string) {
  const run = db.runs.find((item) => item.id === id)
  if (!run) {
    return Promise.reject(new Error("not_found"))
  }
  for (const company of run.companies) {
    if (company.failed) {
      company.failed = false
      company.stage = "resolving"
    }
  }
  run.status = "running"
  return wait(clone(run))
}

export function tierCounts(rows: Prospect[]) {
  return {
    hot: rows.filter((row) => row.tier === "hot").length,
    warm: rows.filter((row) => row.tier === "warm").length,
    cold: rows.filter((row) => row.tier === "cold").length,
    disqualified: rows.filter((row) => row.tier === "disqualified").length,
  }
}
