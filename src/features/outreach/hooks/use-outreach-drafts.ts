import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useEffectEvent, useRef, useState } from "react"

import {
  getGetLeadOutreachQueryKey,
  useGenerateLeadOutreach,
  useGetLeadOutreach,
} from "@/api/generated/leads/leads"
import type {
  OutreachChannel,
  OutreachDraftOut,
  OutreachGenerateIn,
} from "@/api/generated/model"
import {
  type DraftEdit,
  type DraftStyle,
  isJobActive,
} from "@/features/outreach/lib/draft"
import {
  type JobRefs,
  readJobRefs,
  saveJobRef,
} from "@/features/outreach/lib/persist"

const POLL_MS = 2_000

type PerChannel<T> = Partial<Record<OutreachChannel, T>>

function without<T>(
  record: PerChannel<T>,
  channel: OutreachChannel
): PerChannel<T> {
  const next = { ...record }
  delete next[channel]
  return next
}

export type OutreachDrafts = ReturnType<typeof useOutreachDrafts>

type DraftState =
  | { kind: "writing"; createdAt: string | null }
  | { kind: "ready"; draft: OutreachDraftOut; stale: boolean }
  | { kind: "failed" }

function toRequest(
  serviceId: string,
  { tone, language, sender }: DraftStyle
): OutreachGenerateIn {
  const company = sender.company.trim()
  return {
    service_id: serviceId,
    tone,
    language,
    sender_name: sender.name.trim() || null,
    sender_title: sender.title.trim() || null,
    // Left out when empty: the backend then signs with its own default (outreach/schemas.py).
    ...(company ? { sender_company: company } : {}),
  }
}

/**
 * One async outreach job per channel: POST (202) → poll GET until succeeded/failed. Jobs start lazily the first
 * time a channel is shown; a job is stale once the style or signature differs from the one it was written with.
 */
export function useOutreachDrafts({
  companyId,
  serviceId,
  channel,
  style,
}: {
  companyId: string
  serviceId: string
  channel: OutreachChannel
  style: DraftStyle
}) {
  const queryClient = useQueryClient()
  const request = toRequest(serviceId, style)
  const requestKey = JSON.stringify(request)

  const [refs, setRefs] = useState<JobRefs>(() =>
    readJobRefs(companyId, serviceId)
  )
  const [starting, setStarting] = useState<PerChannel<true>>({})
  const [startFailed, setStartFailed] = useState<PerChannel<true>>({})
  const [edits, setEdits] = useState<PerChannel<DraftEdit>>({})
  const autoStarted = useRef(new Set<OutreachChannel>())
  // Start errors go through the global mutation toast, which also signs the user out on a 401.
  const { mutateAsync } = useGenerateLeadOutreach()

  const generate = (target: OutreachChannel) => {
    setStarting((prev) => ({ ...prev, [target]: true }))
    setStartFailed((prev) => without(prev, target))
    mutateAsync({ companyId, data: { ...request, channel: target } })
      .then((job) => {
        queryClient.setQueryData(
          getGetLeadOutreachQueryKey(companyId, job.id),
          job
        )
        const jobRef = { jobId: job.id, requestKey }
        saveJobRef(companyId, serviceId, target, jobRef)
        setRefs((prev) => ({ ...prev, [target]: jobRef }))
        setEdits((prev) => without(prev, target))
      })
      .catch(() => setStartFailed((prev) => ({ ...prev, [target]: true })))
      .finally(() => setStarting((prev) => without(prev, target)))
  }

  const showChannel = useEffectEvent((target: OutreachChannel) => {
    if (refs[target] || autoStarted.current.has(target)) return
    autoStarted.current.add(target)
    generate(target)
  })
  useEffect(() => showChannel(channel), [channel])

  const ref = refs[channel]
  const job = useGetLeadOutreach(companyId, ref?.jobId ?? "", {
    query: {
      enabled: Boolean(ref),
      refetchInterval: (query) =>
        isJobActive(query.state.data?.status) ? POLL_MS : false,
      staleTime: (query) =>
        isJobActive(query.state.data?.status) ? 0 : Infinity,
    },
  })

  let state: DraftState
  if (starting[channel]) state = { kind: "writing", createdAt: null }
  else if (!ref)
    state = startFailed[channel]
      ? { kind: "failed" }
      : { kind: "writing", createdAt: null }
  // A failed poll with data already in hand is a hiccup: polling goes on and the draft still arrives.
  else if ((job.isError && !job.data) || job.data?.status === "failed")
    state = { kind: "failed" }
  else if (job.data?.status === "succeeded")
    state = job.data.draft
      ? {
          kind: "ready",
          draft: job.data.draft,
          stale: ref.requestKey !== requestKey,
        }
      : { kind: "failed" }
  else state = { kind: "writing", createdAt: job.data?.created_at ?? null }

  return {
    state,
    regenerate: () => generate(channel),
    edit: edits[channel],
    setEdit: (edit: DraftEdit) =>
      setEdits((prev) => ({ ...prev, [channel]: edit })),
    resetEdit: () => setEdits((prev) => without(prev, channel)),
  }
}
