/**
 * Outreach drafts (backend ai/outreach/generator.py), built from the Outreach artboard: the top verified
 * signals become the numbered claims [1] [2], the service's value proposition is [3]; the blocker is taken
 * into account but never named. DHL × Intelligent Automation reproduces the artboard verbatim.
 */
import type {
  CompanyOut,
  OutreachDraftOut,
  ServiceOut,
} from "@/api/generated/model"

import type { OutreachRequest, SignalRecord } from "../types"

const lowerFirst = (s: string) =>
  s ? s.charAt(0).toLowerCase() + s.slice(1) : s
const stripDot = (s: string) => s.replace(/[.\s]+$/, "")

function nextWeekLabel(now: Date): string {
  const d = new Date(now)
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7))
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
}

function dhlDraft(
  request: OutreachRequest,
  now: Date
): Pick<OutreachDraftOut, "subject" | "body" | "hook" | "call_to_action"> {
  const sender = request.sender_company
  const name = request.sender_name ?? "[Your name]"
  const week = nextWeekLabel(now)
  if (request.channel === "linkedin_inmail")
    return {
      subject: "Your GBS automation hiring",
      body: `Hi [First name], I saw DHL is hiring automation engineers for GBS in Prague [2], on top of the agentic AI already running for RFQs [1].\n\nWe help in-house automation teams ship more use cases without growing headcount: we build and run them next to your centre of excellence [3]. Customs and freight-document intake is a common first one.\n\nOpen to a short exchange in October?`,
      hook: "GBS automation hiring in Prague",
      call_to_action: "Open to a short exchange in October?",
    }
  if (request.channel === "call_script")
    return {
      subject: null,
      body: `Opener: "I’m calling because DHL is hiring automation engineers for GBS in Prague [2], and your strategy says AI already handles RFQs [1]."\n\nBridge: "When the backlog of use cases outgrows the team, we build and run them alongside your people [3]."\n\nQuestion: "Which process is next in line for automation, and what is stopping it today?"\n\nIf they say "we do it in-house": "That’s why we work next to the CoE. Would one extra delivery squad for a quarter be useful?"`,
      hook: "Automation hiring at GBS Prague",
      call_to_action: "Which process is next in line for automation?",
    }
  return {
    subject:
      "Agentic AI for freight-document intake, next to your automation team",
    body: `Hi [First name],\n\nYour Strategy 2030 update describes AI already handling RFQ processing and customer communication [1], and your Global Business Services team in Prague is hiring automation engineers [2].\n\nTeams at that stage usually have more good use cases than engineers to build them. ${sender} designs, builds and runs automation and agentic AI use cases end to end, working alongside in-house centres of excellence rather than replacing them [3].\n\nOne place we often start is customs and freight-document intake: high volume, a clear baseline, and results within a quarter.\n\nWould a 20-minute call in the week of ${week} be useful to compare notes?\n\nBest regards,\n${name}\n${sender}`,
    hook: "agentic AI for freight-document intake",
    call_to_action: `Would a 20-minute call in the week of ${week} be useful to compare notes?`,
  }
}

const GREETING = {
  professional: "Hi [First name],",
  conversational: "Hi [First name], hope your week is going well.",
  direct: "[First name],",
} as const

export function buildDraft(
  company: CompanyOut,
  service: ServiceOut,
  signals: SignalRecord[],
  request: OutreachRequest,
  now: Date
): OutreachDraftOut {
  if (
    company.domain === "dhl.com" &&
    service.slug === "intelligent_automation" &&
    request.language === "en"
  ) {
    // [1] the Strategy 2030 page, [2] the GBS Prague job ad, as on the artboard
    const one =
      signals.find((s) => s.summary.startsWith("Uses AI")) ?? signals[0]
    const two =
      signals.find((s) => s.quote.startsWith("Automation Engineer")) ??
      signals[1]
    const refs = [one, two].filter((s): s is SignalRecord => Boolean(s))
    return {
      channel: request.channel,
      ...dhlDraft(request, now),
      referenced_signals: refs.map((s) => s.id),
      referenced_quotes: refs.map((s) => s.quote),
      language: "en",
    }
  }
  const top = signals.slice(0, 3)
  const referenced = top.map((s) => s.id)
  const quotes = top.map((s) => s.quote)
  const [first, second] = top
  const claim1 = first
    ? `${lowerFirst(stripDot(first.summary))} [1]`
    : `your plans for ${service.name.toLowerCase()}`
  const claim2 = second ? `${lowerFirst(stripDot(second.summary))} [2]` : null
  const pitch = stripDot(
    service.value_proposition || service.description || service.name
  )
  const valueRef = `[${top.length >= 2 ? 3 : 2}]`
  const value = /^we\b/i.test(pitch)
    ? `At ${request.sender_company}, ${lowerFirst(pitch)} ${valueRef}.`
    : `${request.sender_company}: ${lowerFirst(pitch)} ${valueRef}.`
  const cta =
    request.tone === "direct"
      ? "Worth 15 minutes next week?"
      : "Would a 20-minute call in the next two weeks be useful to compare notes?"
  const signature = [
    request.sender_name ?? "[Your name]",
    request.sender_title,
    request.sender_company,
  ]
    .filter(Boolean)
    .join("\n")
  const german = request.language === "de"
  if (request.channel === "call_script") {
    return {
      channel: "call_script",
      subject: null,
      body: `Opener: "I’m calling because I saw that ${company.name} ${claim1.replace(/ \[1\]$/, "")} [1]."\n\nBridge: "${value}"\n\nQuestion: "What is the next priority for your team, and what is stopping it today?"`,
      referenced_signals: referenced,
      referenced_quotes: quotes,
      hook: first ? stripDot(first.summary) : null,
      call_to_action: "What is the next priority for your team?",
      language: "en",
    }
  }
  if (request.channel === "linkedin_inmail") {
    return {
      channel: "linkedin_inmail",
      subject: first
        ? stripDot(first.summary).slice(0, 60)
        : `${service.name} at ${company.name}`,
      body: `Hi [First name], two things about ${company.name} caught my eye: ${claim1}${claim2 ? `, and ${claim2}` : ""}.\n\n${value}\n\nOpen to a short exchange?`,
      referenced_signals: referenced,
      referenced_quotes: quotes,
      hook: first ? stripDot(first.summary) : null,
      call_to_action: "Open to a short exchange?",
      language: "en",
    }
  }
  if (german) {
    return {
      channel: "email",
      subject: `${service.name} bei ${company.name}`,
      body: `Guten Tag [Vorname],\n\nwir haben gesehen: ${first ? stripDot(first.summary) : service.name} [1]${second ? ` und ${stripDot(second.summary)} [2]` : ""}.\n\n${value}\n\nHätten Sie in den nächsten zwei Wochen 20 Minuten Zeit für einen Austausch?\n\nMit freundlichen Grüßen\n${signature}`,
      referenced_signals: referenced,
      referenced_quotes: quotes,
      hook: first ? stripDot(first.summary) : null,
      call_to_action:
        "Hätten Sie in den nächsten zwei Wochen 20 Minuten Zeit für einen Austausch?",
      language: "de",
    }
  }
  return {
    channel: "email",
    subject: first
      ? `${stripDot(first.summary)} at ${company.name}`.slice(0, 90)
      : `${service.name} at ${company.name}`,
    body: `${GREETING[request.tone]}\n\nTwo things about ${company.name} caught my eye: ${claim1}${claim2 ? `, and ${claim2}` : ""}.\n\nTeams at that stage usually have more good ideas than capacity to deliver them. ${value}\n\n${cta}\n\nBest regards,\n${signature}`,
    referenced_signals: referenced,
    referenced_quotes: quotes,
    hook: first ? stripDot(first.summary) : null,
    call_to_action: cta,
    language: "en",
  }
}
