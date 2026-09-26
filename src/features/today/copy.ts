import type {
  FeedbackCreatedPayload,
  RunFinishedPayloadStatus,
  RunKind,
} from "@/api/generated/model"

export type FeedFilter = "all" | "signal" | "tier" | "system"

export const feedFilters: FeedFilter[] = ["all", "signal", "tier", "system"]

// The mock's "Runs & settings": the API emits no settings events, so the tab holds runs and feedback.
export const feedTabLabels: Record<FeedFilter, string> = {
  all: "All",
  signal: "New signals",
  tier: "Tier changes",
  system: "Runs & feedback",
}

export const emptyFeedTitles: Record<FeedFilter, string> = {
  all: "Nothing has changed yet.",
  signal: "No new signals yet.",
  tier: "No tier changes yet.",
  system: "No finished runs or feedback yet.",
}

export const runKindPrefix: Partial<Record<RunKind, string>> = {
  analyze: "Analysis run",
  refresh: "Monitoring run",
}

export const runOutcome: Record<RunFinishedPayloadStatus, string> = {
  succeeded: "finished",
  partial: "finished with pauses or failures",
  failed: "failed",
  cancelled: "cancelled",
}

export const verdictText: Record<FeedbackCreatedPayload["verdict"], string> = {
  correct: "correct",
  incorrect: "wrong",
  irrelevant: "not relevant",
  good_fit: "good fit",
  bad_fit: "bad fit",
}

/** Short service names for the call list, keyed by service slug; other services show their full name. */
export const serviceShortLabels: Record<string, string> = {
  intelligent_automation: "IA",
  cybersecurity: "Cyber",
}

export function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many
}
