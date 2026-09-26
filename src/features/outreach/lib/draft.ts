import type {
  OutreachChannel,
  OutreachJobOut,
  OutreachTone,
} from "@/api/generated/model"
import { channels } from "@/features/outreach/copy"

export type Sender = { name: string; title: string; company: string }

/** Everything the user picks that changes the generated text (the role only drives the LinkedIn link). */
export type DraftStyle = {
  tone: OutreachTone
  language: string
  sender: Sender
}

export type DraftEdit = { subject: string; body: string }

export function parseChannel(value: string | null): OutreachChannel {
  return channels.find((channel) => channel === value) ?? "email"
}

export function isJobActive(status: OutreachJobOut["status"] | undefined) {
  return status === "queued" || status === "running"
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length

/** Live length of the (possibly edited) body; the backend guarantees no length, so nothing is claimed. */
export function lengthMeta(channel: OutreachChannel, body: string) {
  if (channel === "email") return `${words(body)} words`
  if (channel === "linkedin_inmail") return `${body.length} characters`
  return `≈ ${Math.round(words(body) / 2.5)} s read aloud`
}

export function clipboardText(subject: string | null, body: string) {
  return subject ? `Subject: ${subject}\n\n${body}` : body
}

export const hasNamePlaceholder = (body: string) => body.includes("[First name")

/** "an" before a vowel letter ("an IT Director"), "a" otherwise ("a Head of Automation"). */
export const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a")
