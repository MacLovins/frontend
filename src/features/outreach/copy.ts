import type { OutreachChannel, OutreachTone } from "@/api/generated/model"

export const channels: OutreachChannel[] = [
  "email",
  "linkedin_inmail",
  "call_script",
]

export const channelLabels: Record<OutreachChannel, string> = {
  email: "Email",
  linkedin_inmail: "LinkedIn InMail",
  call_script: "Call opener",
}

export const tones: OutreachTone[] = [
  "professional",
  "conversational",
  "direct",
]

export const toneLabels: Record<OutreachTone, string> = {
  professional: "Professional",
  conversational: "Conversational",
  direct: "Direct",
}

/** Languages always offered; the company country's first official language is appended when it is missing. */
export const baseLanguages = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "ro", label: "Română" },
]

/** Human names of the collectors behind `SignalItem.source_name` (backend collector ids). */
export const collectorLabels: Record<string, string> = {
  workday: "Workday",
  greenhouse: "Greenhouse",
  lever: "Lever",
  personio: "Personio",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  workable: "Workable",
  recruitee: "Recruitee",
  adzuna: "Adzuna",
  careers_html: "Careers page",
  google_news: "Google News",
  gdelt: "GDELT",
  newsapi: "NewsAPI",
  serpapi: "Google Search",
  rsshub: "RSS feeds",
  wikidata: "Wikidata",
  gleif: "GLEIF",
  crunchbase: "Crunchbase",
  hibp: "Have I Been Pwned",
}

export const atsCollectors = new Set([
  "workday",
  "greenhouse",
  "lever",
  "personio",
  "ashby",
  "smartrecruiters",
  "workable",
  "recruitee",
])

/** Collectors whose documents live on the company's own site: the host name says more than the collector. */
export const siteCollectors = new Set(["website", "playwright", "reports"])
