/**
 * Text templates for what the simulated worker "finds" (new signals of an analysis run) and for keyword
 * expansion. `{c}` = company name, `{city}` = HQ city.
 */
import type {
  SignalCategory,
  SourceType,
  Strength,
} from "@/api/generated/model"

export interface SignalTemplate {
  quote: string
  summary: string
  type: SourceType
  strength: Strength
  title?: string
}

/** Per preset question key; custom questions fall back to CATEGORY_TEMPLATES. */
export const QUESTION_TEMPLATES: Record<string, SignalTemplate[]> = {
  ia_cost: [
    {
      quote:
        "{c} launched an efficiency programme that targets 8% lower operating costs by 2028.",
      summary: "Efficiency programme targets −8% operating costs by 2028",
      type: "news",
      strength: "moderate",
    },
    {
      quote:
        "The board approved a savings plan of €50 million over three years.",
      summary: "€50m three-year savings plan approved",
      type: "report",
      strength: "moderate",
      title: "Annual Report 2025",
    },
  ],
  ia_ai_projects: [
    {
      quote:
        "{c} is piloting generative AI to process supplier invoices and customer e-mails.",
      summary: "Piloting generative AI for invoices and customer e-mails",
      type: "news",
      strength: "moderate",
    },
    {
      quote:
        "Robotic process automation already handles order entry in our {city} back office.",
      summary: "RPA already handles order entry in the back office",
      type: "website",
      strength: "strong",
    },
  ],
  ia_hiring: [
    {
      quote: "RPA Developer (UiPath) – Finance Operations, {city}",
      summary: "Hiring RPA developers for finance operations",
      type: "jobs",
      strength: "moderate",
    },
    {
      quote: "Process Mining Analyst (Celonis), {city}",
      summary: "Hiring a process mining analyst",
      type: "jobs",
      strength: "moderate",
    },
  ],
  ia_dt: [
    {
      quote:
        "Our digital transformation programme redesigns core processes from order to cash.",
      summary: "Digital transformation programme redesigns order-to-cash",
      type: "website",
      strength: "moderate",
    },
  ],
  ia_ssc: [
    {
      quote:
        "{c} will consolidate accounting and HR services in a new shared service centre.",
      summary: "Consolidating accounting and HR into a shared service centre",
      type: "news",
      strength: "moderate",
    },
  ],
  ia_ssc_cee: [
    {
      quote:
        "{c} is opening a service delivery centre in Kraków for finance and procurement.",
      summary: "Opening a service delivery centre in Kraków",
      type: "news",
      strength: "moderate",
    },
  ],
  ia_leaders: [
    {
      quote:
        "{c} appoints a new Chief Digital Officer to lead process transformation.",
      summary: "New Chief Digital Officer appointed",
      type: "news",
      strength: "moderate",
    },
  ],
  ia_erp: [
    {
      quote: "SAP S/4HANA Consultant – Finance rollout, {city}",
      summary: "Hiring for an SAP S/4HANA rollout",
      type: "jobs",
      strength: "moderate",
    },
  ],
  ia_stack: [
    {
      quote:
        "Experience with Power Automate and ServiceNow workflows is required.",
      summary: "Job ads mention Power Automate and ServiceNow",
      type: "jobs",
      strength: "weak",
    },
  ],
  ia_inhouse: [
    {
      quote:
        "Our automation centre of excellence has delivered more than 200 bots.",
      summary: "In-house automation centre of excellence",
      type: "website",
      strength: "moderate",
    },
  ],
  ia_partner: [
    {
      quote:
        "{c} selects a global integrator as strategic automation partner for five years.",
      summary: "Five-year strategic automation partner selected",
      type: "news",
      strength: "moderate",
    },
  ],
  ia_distress: [
    {
      quote: "{c} announced a hiring freeze for all administrative functions.",
      summary: "Hiring freeze in administrative functions",
      type: "news",
      strength: "moderate",
    },
  ],
  cy_incident: [
    {
      quote: "A cyberattack disrupted {c}'s customer portal for two days.",
      summary: "Cyberattack disrupted the customer portal",
      type: "news",
      strength: "strong",
    },
  ],
  cy_compliance: [
    {
      quote:
        "{c} is preparing for NIS2 and has started an ISO 27001 certification project.",
      summary: "NIS2 preparation and ISO 27001 project",
      type: "website",
      strength: "moderate",
    },
  ],
  cy_hiring: [
    {
      quote: "SOC Analyst (L2) – Security Operations, {city}",
      summary: "Hiring SOC analysts",
      type: "jobs",
      strength: "moderate",
    },
    {
      quote: "Chief Information Security Officer (CISO), {city}",
      summary: "Hiring a CISO",
      type: "jobs",
      strength: "strong",
    },
  ],
  cy_leaders: [
    {
      quote: "{c} appoints a new Chief Information Security Officer.",
      summary: "New CISO appointed",
      type: "news",
      strength: "moderate",
    },
  ],
  cy_surface: [
    {
      quote:
        "{c} is moving its core systems to a public cloud platform by 2027.",
      summary: "Moving core systems to public cloud by 2027",
      type: "news",
      strength: "moderate",
    },
  ],
  cy_budget: [
    {
      quote: "{c} will increase its security budget by 30% next year.",
      summary: "Security budget up 30% next year",
      type: "report",
      strength: "moderate",
      title: "Annual Report 2025",
    },
  ],
  cy_stack: [
    {
      quote:
        "Experience with Microsoft Sentinel, CrowdStrike and Okta is a plus.",
      summary: "Job ads mention Sentinel, CrowdStrike and Okta",
      type: "jobs",
      strength: "weak",
    },
  ],
  cy_mssp: [
    {
      quote: "{c} signed a multi-year managed SOC contract.",
      summary: "Multi-year managed SOC contract",
      type: "news",
      strength: "moderate",
    },
  ],
  cy_inhouse: [
    {
      quote:
        "Our own security operations centre monitors all sites around the clock.",
      summary: "Runs its own 24/7 security operations centre",
      type: "website",
      strength: "moderate",
    },
  ],
}

export const CATEGORY_TEMPLATES: Record<SignalCategory, SignalTemplate> = {
  cost_efficiency: QUESTION_TEMPLATES.ia_cost[0],
  digital_transformation: QUESTION_TEMPLATES.ia_dt[0],
  ai_automation: QUESTION_TEMPLATES.ia_ai_projects[0],
  hiring: QUESTION_TEMPLATES.ia_hiring[0],
  leadership_change: QUESTION_TEMPLATES.ia_leaders[0],
  shared_services: QUESTION_TEMPLATES.ia_ssc[0],
  tech_stack: QUESTION_TEMPLATES.ia_erp[0],
  tech_partners: QUESTION_TEMPLATES.ia_partner[0],
  incident: QUESTION_TEMPLATES.cy_incident[0],
  compliance: QUESTION_TEMPLATES.cy_compliance[0],
  investment: QUESTION_TEMPLATES.cy_budget[0],
  expansion: QUESTION_TEMPLATES.cy_surface[0],
  internal_capability: QUESTION_TEMPLATES.ia_inhouse[0],
  distress: QUESTION_TEMPLATES.ia_distress[0],
}

export function fill(
  text: string,
  company: string,
  city: string | null
): string {
  return text.replace(/\{c\}/g, company).replace(/\{city\}/g, city ?? "Remote")
}

/** Extra search terms the (simulated) keyword expansion adds per category and language. */
export const CATEGORY_KEYWORDS: Record<
  SignalCategory,
  Record<"en" | "de" | "fr", string[]>
> = {
  cost_efficiency: {
    en: ["cost savings", "efficiency programme", "operating model review"],
    de: ["Kostensenkung", "Effizienzsteigerung", "Sparziel"],
    fr: ["plan d'économies", "réduction des coûts", "gains d'efficacité"],
  },
  digital_transformation: {
    en: ["digital roadmap", "process digitisation", "digital strategy"],
    de: ["Digitalisierung", "digitale Transformation", "Digitalstrategie"],
    fr: [
      "transformation numérique",
      "feuille de route digitale",
      "digitalisation",
    ],
  },
  ai_automation: {
    en: ["automation", "agentic AI", "document processing"],
    de: ["Automatisierung", "KI-Projekt", "Dokumentenverarbeitung"],
    fr: ["automatisation", "IA générative", "traitement des documents"],
  },
  hiring: {
    en: ["we are hiring", "job opening", "vacancy"],
    de: ["Stellenangebot", "wir suchen", "Karriere"],
    fr: ["offre d'emploi", "nous recrutons", "poste à pourvoir"],
  },
  leadership_change: {
    en: ["appointed", "joins as", "new chief"],
    de: ["ernannt", "neuer Leiter", "übernimmt"],
    fr: ["nommé", "nomination", "nouveau directeur"],
  },
  shared_services: {
    en: [
      "shared service centre",
      "global business services",
      "nearshore hub",
      "service delivery centre",
    ],
    de: ["Shared-Service-Center", "Dienstleistungszentrum", "Konsolidierung"],
    fr: ["centre de services partagés", "centre de services", "mutualisation"],
  },
  tech_stack: {
    en: ["system migration", "platform rollout", "tool stack"],
    de: ["Systemumstellung", "Einführung", "Plattform"],
    fr: ["migration du système", "déploiement", "plateforme"],
  },
  tech_partners: {
    en: ["strategic partner", "multi-year contract", "selects"],
    de: ["strategischer Partner", "mehrjähriger Vertrag", "beauftragt"],
    fr: ["partenaire stratégique", "contrat pluriannuel", "choisit"],
  },
  incident: {
    en: ["cyberattack", "ransomware", "data breach"],
    de: ["Cyberangriff", "Ransomware", "Datenleck"],
    fr: ["cyberattaque", "rançongiciel", "fuite de données"],
  },
  compliance: {
    en: ["NIS2", "DORA", "ISO 27001", "audit"],
    de: ["NIS2", "DORA", "ISO 27001", "Prüfung"],
    fr: ["NIS2", "DORA", "ISO 27001", "audit"],
  },
  investment: {
    en: ["security investment", "security budget", "security programme"],
    de: [
      "Investition in IT-Sicherheit",
      "Sicherheitsbudget",
      "Sicherheitsprogramm",
    ],
    fr: [
      "investissement cybersécurité",
      "budget sécurité",
      "programme de sécurité",
    ],
  },
  expansion: {
    en: ["acquisition", "cloud migration", "integration"],
    de: ["Übernahme", "Cloud-Migration", "Integration"],
    fr: ["acquisition", "migration vers le cloud", "intégration"],
  },
  internal_capability: {
    en: ["centre of excellence", "in-house team", "own development"],
    de: ["Center of Excellence", "eigenes Team", "Eigenentwicklung"],
    fr: ["centre d'excellence", "équipe interne", "développement interne"],
  },
  distress: {
    en: ["hiring freeze", "restructuring", "profit warning"],
    de: ["Einstellungsstopp", "Sanierung", "Gewinnwarnung"],
    fr: ["gel des embauches", "restructuration", "avertissement sur résultats"],
  },
}

export const STOPWORDS = new Set(
  "a an and are as at be been by company companys does for from has have in into is it its of on or that the their them this to was were what which with within last months years year any other such example".split(
    " "
  )
)
