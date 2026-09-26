import type {
  Account,
  Candidate,
  Company,
  Icp,
  Question,
  Rule,
  Run,
  Scoring,
  Service,
} from "@/api/types"

export const services: Service[] = [
  { id: "ia", name: "Intelligent Automation", preset: "ia" },
  { id: "cyber", name: "Cybersecurity", preset: "cyber" },
]

const dhl: Company = {
  id: "dhl",
  name: "DHL Group",
  domain: "dhl.com",
  country: "Germany",
  countryCode: "DE",
  industry: "Logistics",
  employees: "590k employees",
  isNew: true,
  notes: "",
  decisionMakers: ["COO", "CIO", "Head of Automation"],
  scores: {
    ia: { priority: 69, tier: "hot", fit: 92, signals: 81, blockers: 38 },
    cyber: { priority: 54, tier: "warm", fit: 70, signals: 48, blockers: 22 },
  },
  whyNow: {
    ia: [
      {
        text: "Uses agentic AI to process customer RFQs",
        source: "dhl.com",
        date: "2026-06-18",
        url: "https://dhl.com",
        positive: true,
      },
      {
        text: "Hiring 6 automation & AI engineers",
        source: "Workday",
        date: "2026-09-10",
        url: "https://dhl.com/careers",
        positive: true,
      },
      {
        text: "Large in-house automation capability and third-party AI partners",
        source: "Annual report",
        date: "2026-03-01",
        url: "https://dhl.com",
        positive: false,
      },
    ],
    cyber: [
      {
        text: "Published a supplier security addendum",
        source: "dhl.com",
        date: "2026-05-02",
        url: "https://dhl.com",
        positive: true,
      },
    ],
  },
  breakdown: {
    ia: [
      { label: "Automation & AI projects", weight: "H", width: 100, delta: 2.5 },
      { label: "Hiring", weight: "H", width: 52, delta: 1.3 },
      { label: "In-house capability", weight: "M", width: 40, delta: -1 },
    ],
    cyber: [
      { label: "Security program", weight: "H", width: 60, delta: 1.4 },
      { label: "Hiring", weight: "M", width: 30, delta: 0.4 },
    ],
  },
  signals: {
    ia: [
      {
        id: "dhl-rfq",
        question: "Automation & AI projects",
        category: "Automation & AI projects",
        strength: "strong",
        confidence: 90,
        quote: "…deploying agentic AI to handle RFQ processing…",
        source: "dhl.com",
        url: "https://dhl.com",
        date: "2026-06-18",
        feedback: null,
      },
    ],
    cyber: [],
  },
  sources: [
    { title: "Strategy 2030", type: "web", date: "2026-06-18", url: "https://dhl.com" },
    { title: "Automation hiring wave", type: "jobs", date: "2026-09-10", url: "https://dhl.com/careers" },
  ],
}

const siemens: Company = {
  id: "siemens",
  name: "Siemens",
  domain: "siemens.com",
  country: "Germany",
  countryCode: "DE",
  industry: "Industrial",
  employees: "320k employees",
  isNew: false,
  notes: "",
  decisionMakers: ["CTO", "VP Operations"],
  scores: {
    ia: { priority: 58, tier: "warm", fit: 80, signals: 64, blockers: 30 },
    cyber: { priority: 71, tier: "hot", fit: 88, signals: 76, blockers: 18 },
  },
  whyNow: {
    ia: [
      {
        text: "Factory software suite adds agent workflows",
        source: "siemens.com",
        date: "2026-08-01",
        url: "https://siemens.com",
        positive: true,
      },
    ],
    cyber: [
      {
        text: "OT security budget called out in the annual report",
        source: "siemens.com",
        date: "2026-04-12",
        url: "https://siemens.com",
        positive: true,
      },
    ],
  },
  breakdown: {
    ia: [{ label: "Automation & AI projects", weight: "H", width: 70, delta: 1.6 }],
    cyber: [{ label: "Security program", weight: "H", width: 90, delta: 2.2 }],
  },
  signals: {
    ia: [
      {
        id: "sie-ai",
        question: "Automation & AI projects",
        category: "Automation & AI projects",
        strength: "medium",
        confidence: 74,
        quote: "…agent workflows across factory software…",
        source: "siemens.com",
        url: "https://siemens.com",
        date: "2026-08-01",
        feedback: null,
      },
    ],
    cyber: [
      {
        id: "sie-ot",
        question: "Security program",
        category: "Cost reduction program",
        strength: "strong",
        confidence: 86,
        quote: "…OT security investment increased this year…",
        source: "siemens.com",
        url: "https://siemens.com",
        date: "2026-04-12",
        feedback: null,
      },
    ],
  },
  sources: [
    { title: "Annual report", type: "web", date: "2026-04-12", url: "https://siemens.com" },
  ],
}

const northwind: Company = {
  id: "northwind",
  name: "Northwind Foods",
  domain: "northwind.example",
  country: "Romania",
  countryCode: "RO",
  industry: "Food",
  employees: "2k employees",
  isNew: false,
  notes: "",
  decisionMakers: ["CEO"],
  scores: {
    ia: { priority: 22, tier: "disqualified", fit: 28, signals: 12, blockers: 80 },
    cyber: { priority: 31, tier: "cold", fit: 40, signals: 20, blockers: 55 },
  },
  whyNow: {
    ia: [
      {
        text: "No public automation program; family-owned operations",
        source: "northwind.example",
        date: "2026-01-20",
        url: "https://northwind.example",
        positive: false,
      },
    ],
    cyber: [],
  },
  breakdown: {
    ia: [{ label: "In-house capability", weight: "L", width: 20, delta: -2 }],
    cyber: [{ label: "Security program", weight: "L", width: 15, delta: -0.4 }],
  },
  signals: { ia: [], cyber: [] },
  sources: [],
}

export const seedCompanies: Company[] = [dhl, siemens, northwind]

export const seedQuestions: Question[] = [
  {
    id: "q1",
    serviceId: "ia",
    text: "Is the company deploying automation or AI in operations?",
    category: "Automation & AI projects",
    polarity: "+",
    weight: "H",
    sources: ["web", "news"],
    windowDays: 180,
    keywordStatus: "ready",
    keywords: ["agentic AI", "automation program"],
    active: true,
  },
  {
    id: "q2",
    serviceId: "ia",
    text: "Do they already have a large in-house automation team?",
    category: "In-house capability",
    polarity: "-",
    weight: "M",
    sources: ["jobs", "web"],
    windowDays: 365,
    keywordStatus: "ready",
    keywords: ["automation team"],
    active: true,
  },
  {
    id: "q3",
    serviceId: "cyber",
    text: "Is security spending or an OT program visible?",
    category: "Cost reduction program",
    polarity: "+",
    weight: "H",
    sources: ["web", "news"],
    windowDays: 180,
    keywordStatus: "ready",
    keywords: ["OT security"],
    active: true,
  },
]

export const seedRules: Rule[] = [
  {
    id: "r1",
    serviceId: "ia",
    name: "Exclude sub-1k headcount",
    kind: "firmographic",
    effect: "exclude",
    detail: "Employees under 1,000",
  },
]

export const seedIcp: Icp = {
  countries: ["Germany", "Romania"],
  industries: ["Logistics", "Industrial"],
  headcount: "1,000+",
  revenue: "$100M+",
  nice: [
    { label: "Public digital strategy", weight: 2 },
    { label: "Recent leadership change", weight: 1 },
  ],
}

export const seedScoring: Scoring = {
  weights: { H: 3, M: 2, L: 1 },
  fitBalance: 40,
  riskPenalty: 20,
  hot: 65,
  warm: 45,
  cold: 25,
  newsHalfLife: 120,
  minConfidence: 60,
}

export const seedAccounts: Account[] = seedCompanies.map((company) => ({
  id: company.id,
  name: company.name,
  domain: company.domain,
  country: company.country,
  industry: company.industry,
}))

export const discoveryPool: Candidate[] = [
  { id: "maersk", name: "Maersk", domain: "maersk.com", country: "Denmark", fit: 84 },
  { id: "db", name: "Deutsche Bahn", domain: "bahn.de", country: "Germany", fit: 77 },
  { id: "eon", name: "E.ON", domain: "eon.com", country: "Germany", fit: 69 },
]

export function emptyRun(id: string, serviceId: string, names: { id: string; name: string }[]): Run {
  return {
    id,
    serviceId,
    status: "running",
    createdAt: new Date().toISOString(),
    companies: names.map((company) => ({
      companyId: company.id,
      name: company.name,
      stage: "resolving",
      failed: false,
      message: "Queued",
    })),
  }
}
