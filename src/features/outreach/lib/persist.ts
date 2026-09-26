import type { OutreachChannel } from "@/api/generated/model"
import { channels } from "@/features/outreach/copy"
import { readStorage, writeStorage } from "@/lib/storage"

type JobRef = { jobId: string; requestKey: string }
export type JobRefs = Partial<Record<OutreachChannel, JobRef>>

const senderCompanyKey = "lr:outreach:sender-company"

export const readSenderCompany = () => readStorage(senderCompanyKey) ?? ""
export const writeSenderCompany = (company: string) =>
  writeStorage(senderCompanyKey, company)

// There is no job list endpoint, so the job ids live in this tab's sessionStorage to survive a reload.
const jobsKey = (companyId: string, serviceId: string) =>
  `lr:outreach:${companyId}:${serviceId}`

function isJobRef(value: unknown): value is JobRef {
  if (!value || typeof value !== "object") return false
  const ref = value as Record<string, unknown>
  return typeof ref.jobId === "string" && typeof ref.requestKey === "string"
}

export function readJobRefs(companyId: string, serviceId: string): JobRefs {
  try {
    const raw: unknown = JSON.parse(
      window.sessionStorage.getItem(jobsKey(companyId, serviceId)) ?? "{}"
    )
    if (!raw || typeof raw !== "object") return {}
    const stored = raw as Record<string, unknown>
    const refs: JobRefs = {}
    for (const channel of channels) {
      const ref = stored[channel]
      if (isJobRef(ref)) refs[channel] = ref
    }
    return refs
  } catch {
    return {}
  }
}

/** Merges into what is stored, so a job that starts after the page was left is still found on return. */
export function saveJobRef(
  companyId: string,
  serviceId: string,
  channel: OutreachChannel,
  ref: JobRef
) {
  try {
    window.sessionStorage.setItem(
      jobsKey(companyId, serviceId),
      JSON.stringify({ ...readJobRefs(companyId, serviceId), [channel]: ref })
    )
  } catch {
    // Not persisted: a reload then writes a fresh draft.
  }
}
