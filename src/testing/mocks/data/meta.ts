/**
 * Reference data of GET /meta/* — copied from the backend: parser/data/industries.yaml,
 * parser/data/countries.yaml, core/modules/meta/service.py and ai/presets/loader.py.
 */
import type {
  CountryOut,
  IndustryOut,
  LabelsOut,
  SignalCategory,
} from "@/api/generated/model"

export const INDUSTRIES: IndustryOut[] = [
  {
    id: "logistics",
    label: "Logistics & Transport",
    nace: ["H49", "H52"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "airlines",
    label: "Airlines",
    nace: ["H51"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "rail",
    label: "Rail Transport",
    nace: ["H49.1", "H49.2"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "postal_courier",
    label: "Postal & Courier",
    nace: ["H53"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "automotive",
    label: "Automotive",
    nace: ["C29"],
    nis2: null,
    dora: false,
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    nace: ["C"],
    nis2: "annex_ii",
    dora: false,
  },
  {
    id: "chemicals",
    label: "Chemicals",
    nace: ["C20"],
    nis2: "annex_ii",
    dora: false,
  },
  {
    id: "pharma",
    label: "Pharmaceuticals",
    nace: ["C21"],
    nis2: "annex_ii",
    dora: false,
  },
  {
    id: "medical_devices",
    label: "Medical Devices",
    nace: ["C32.5"],
    nis2: "annex_ii",
    dora: false,
  },
  {
    id: "healthcare",
    label: "Healthcare",
    nace: ["Q86"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "banking",
    label: "Banking",
    nace: ["K64.1"],
    nis2: "annex_i",
    dora: true,
  },
  {
    id: "insurance",
    label: "Insurance",
    nace: ["K65"],
    nis2: null,
    dora: true,
  },
  {
    id: "financial_markets",
    label: "Financial Markets",
    nace: ["K66.1"],
    nis2: "annex_i",
    dora: true,
  },
  {
    id: "telecom",
    label: "Telecommunications",
    nace: ["J61"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "energy_utilities",
    label: "Energy & Utilities",
    nace: ["D35"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "oil_gas",
    label: "Oil & Gas",
    nace: ["B06"],
    nis2: "annex_i",
    dora: false,
  },
  { id: "water", label: "Water", nace: ["E36"], nis2: "annex_i", dora: false },
  { id: "retail", label: "Retail", nace: ["G47"], nis2: null, dora: false },
  {
    id: "consumer_goods",
    label: "Consumer Goods",
    nace: ["C31", "C32"],
    nis2: null,
    dora: false,
  },
  {
    id: "food_beverage",
    label: "Food & Beverage",
    nace: ["C10", "C11"],
    nis2: "annex_ii",
    dora: false,
  },
  {
    id: "public_sector",
    label: "Public Sector",
    nace: ["O84"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "digital_infrastructure",
    label: "Digital Infrastructure",
    nace: ["J61", "J63.1"],
    nis2: "annex_i",
    dora: false,
  },
  {
    id: "it_services",
    label: "IT Services",
    nace: ["J62"],
    nis2: "annex_ii",
    dora: false,
  },
  {
    id: "software",
    label: "Software",
    nace: ["J62.01"],
    nis2: "annex_ii",
    dora: false,
  },
  {
    id: "media",
    label: "Media",
    nace: ["J58", "J59", "J60"],
    nis2: null,
    dora: false,
  },
  {
    id: "construction",
    label: "Construction",
    nace: ["F"],
    nis2: null,
    dora: false,
  },
  {
    id: "real_estate",
    label: "Real Estate",
    nace: ["L68"],
    nis2: null,
    dora: false,
  },
]

export const COUNTRIES: CountryOut[] = [
  { code: "DE", name: "Germany", is_eu: true, languages: ["de", "en"] },
  { code: "AT", name: "Austria", is_eu: true, languages: ["de", "en"] },
  {
    code: "CH",
    name: "Switzerland",
    is_eu: false,
    languages: ["de", "fr", "it", "en"],
  },
  { code: "FR", name: "France", is_eu: true, languages: ["fr", "en"] },
  { code: "IT", name: "Italy", is_eu: true, languages: ["it", "en"] },
  { code: "ES", name: "Spain", is_eu: true, languages: ["es", "en"] },
  { code: "NL", name: "Netherlands", is_eu: true, languages: ["nl", "en"] },
  {
    code: "BE",
    name: "Belgium",
    is_eu: true,
    languages: ["nl", "fr", "de", "en"],
  },
  { code: "PL", name: "Poland", is_eu: true, languages: ["pl", "en"] },
  { code: "RO", name: "Romania", is_eu: true, languages: ["ro", "en"] },
  { code: "MD", name: "Moldova", is_eu: false, languages: ["ro", "ru", "en"] },
  { code: "DK", name: "Denmark", is_eu: true, languages: ["da", "en"] },
  { code: "SE", name: "Sweden", is_eu: true, languages: ["sv", "en"] },
  { code: "NO", name: "Norway", is_eu: false, languages: ["no", "en"] },
  { code: "FI", name: "Finland", is_eu: true, languages: ["fi", "sv", "en"] },
  { code: "IE", name: "Ireland", is_eu: true, languages: ["en", "ga"] },
  { code: "PT", name: "Portugal", is_eu: true, languages: ["pt", "en"] },
  { code: "CZ", name: "Czechia", is_eu: true, languages: ["cs", "en"] },
  { code: "GB", name: "United Kingdom", is_eu: false, languages: ["en"] },
  { code: "US", name: "United States", is_eu: false, languages: ["en"] },
]

/** ai.SIGNAL_CATEGORIES (ai/presets/loader.py). */
export const CATEGORY_LABELS: Record<SignalCategory, string> = {
  cost_efficiency: "Cost reduction & efficiency",
  digital_transformation: "Digital transformation",
  ai_automation: "AI & automation projects",
  hiring: "Relevant hiring",
  leadership_change: "New leadership",
  shared_services: "Shared services & consolidation",
  tech_stack: "Technology in use",
  tech_partners: "Existing technology partners",
  incident: "Cyber incidents",
  compliance: "Regulatory & compliance",
  investment: "IT & security investment",
  expansion: "Expansion & M&A",
  internal_capability: "Strong in-house capability",
  distress: "Spending blockers",
}

export const SIGNAL_CATEGORIES = Object.keys(
  CATEGORY_LABELS
) as SignalCategory[]

const LABEL_OVERRIDES: Record<string, string> = {
  ai_automation: "AI & automation",
  rejected_by_user: "Rejected by user",
  good_fit: "Good fit",
  bad_fit: "Bad fit",
  quote_not_found: "Quote not found in source",
  wrong_subject: "About another company",
  below_confidence: "Low confidence",
  no_evidence_for_yes: "No evidence for “yes”",
  fuzzy_quote: "Approximate quote",
  headline_only: "Headline only",
}

/** Python `value.replace("_", " ").capitalize()` with the backend's overrides. */
function label(value: string): string {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value]
  const text = value.replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function labels(values: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((v) => [v, label(v)]))
}

export const SOURCE_TYPES = [
  "news",
  "website",
  "jobs",
  "report",
  "registry",
  "incident",
  "derived",
  "manual",
] as const
export const STAGES = [
  "resolving",
  "collecting",
  "indexing",
  "prefiltering",
  "extracting",
  "verifying",
  "scoring",
  "done",
  "failed",
  "paused",
] as const
export const REJECT_REASONS = [
  "quote_not_found",
  "wrong_subject",
  "stale",
  "below_confidence",
  "no_evidence_for_yes",
] as const

export const LABELS: LabelsOut = {
  categories: { ...CATEGORY_LABELS },
  weights: labels(["high", "medium", "low"]),
  statuses: labels(["active", "superseded", "rejected_by_user"]),
  polarities: labels(["positive", "negative"]),
  source_types: labels(SOURCE_TYPES),
  strengths: labels(["weak", "moderate", "strong"]),
  answers: labels(["yes", "no", "unclear"]),
  tiers: labels(["hot", "warm", "cold", "disqualified"]),
  stages: labels(STAGES),
  run_kinds: labels(["analyze", "discover", "rescore", "refresh"]),
  run_statuses: labels([
    "queued",
    "running",
    "succeeded",
    "partial",
    "failed",
    "cancelled",
  ]),
  signal_feedback: labels(["correct", "incorrect", "irrelevant"]),
  lead_feedback: labels(["good_fit", "bad_fit"]),
  roles: labels(["admin", "sales"]),
  reject_reasons: labels(REJECT_REASONS),
  signal_flags: labels([
    "fuzzy_quote",
    "headline_only",
    "undated",
    "corroborated",
    "derived",
  ]),
}

/** NIS2 annex per industry and DORA industries (ai/scoring/derived.py). */
export const NIS2_ANNEX: Record<string, "I" | "II"> = {
  energy_utilities: "I",
  oil_gas: "I",
  airlines: "I",
  rail: "I",
  logistics: "I",
  banking: "I",
  financial_markets: "I",
  healthcare: "I",
  pharma: "I",
  water: "I",
  digital_infrastructure: "I",
  telecom: "I",
  public_sector: "I",
  it_services: "I",
  postal_courier: "II",
  chemicals: "II",
  food_beverage: "II",
  manufacturing: "II",
  automotive: "II",
  medical_devices: "II",
}
export const DORA_INDUSTRIES = ["banking", "insurance", "financial_markets"]
export const EU_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]
export const NIS2_URL = "https://eur-lex.europa.eu/eli/dir/2022/2555/oj"
export const DORA_URL = "https://eur-lex.europa.eu/eli/reg/2022/2554/oj"

/** Country names and aliases the CSV importer understands (accounts/importer.py). */
export const COUNTRY_ALIASES: Record<string, string> = {
  UK: "GB",
  "UNITED KINGDOM": "GB",
  "GREAT BRITAIN": "GB",
  ENGLAND: "GB",
  USA: "US",
  "U.S.": "US",
  "U.S.A.": "US",
  "UNITED STATES OF AMERICA": "US",
  DEUTSCHLAND: "DE",
  SCHWEIZ: "CH",
  SUISSE: "CH",
  ÖSTERREICH: "AT",
  OSTERREICH: "AT",
  NEDERLAND: "NL",
  HOLLAND: "NL",
  "THE NETHERLANDS": "NL",
  ESPAÑA: "ES",
  ESPANA: "ES",
  ITALIA: "IT",
  DANMARK: "DK",
  SVERIGE: "SE",
  NORGE: "NO",
  SUOMI: "FI",
  POLSKA: "PL",
  BELGIË: "BE",
  BELGIQUE: "BE",
  CZECHIA: "CZ",
  "CZECH REPUBLIC": "CZ",
  "REPUBLIC OF MOLDOVA": "MD",
}

/** Industry aliases of the CSV importer (normalized label → taxonomy id). */
export const INDUSTRY_ALIASES: Record<string, string> = {
  energy: "energy_utilities",
  utilities: "energy_utilities",
  power: "energy_utilities",
  oil: "oil_gas",
  "financial services": "banking",
  fintech: "banking",
  banks: "banking",
  automobile: "automotive",
  "automotive industry": "automotive",
  "information technology": "it_services",
  it: "it_services",
  saas: "software",
  "enterprise software": "software",
  transportation: "logistics",
  "supply chain": "logistics",
  biotechnology: "pharma",
  biotech: "pharma",
  "life sciences": "pharma",
  "e commerce": "retail",
  ecommerce: "retail",
  government: "public_sector",
  food: "food_beverage",
  aviation: "airlines",
}
