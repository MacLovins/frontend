import { useMemo, useState } from "react"

import type {
  LeadDetail,
  LeadService,
  OutreachChannel,
  OutreachTone,
} from "@/api/generated/model"
import { DraftPanel } from "@/features/outreach/components/draft-panel"
import { EvidenceCard } from "@/features/outreach/components/evidence-card"
import { OutreachLayout } from "@/features/outreach/components/outreach-layout"
import { SignatureCard } from "@/features/outreach/components/signature-card"
import { StyleCard } from "@/features/outreach/components/style-card"
import { WhoCard } from "@/features/outreach/components/who-card"
import { useLanguageOptions } from "@/features/outreach/hooks/use-language-options"
import { useOutreachDrafts } from "@/features/outreach/hooks/use-outreach-drafts"
import type { Sender } from "@/features/outreach/lib/draft"
import { readSenderCompany } from "@/features/outreach/lib/persist"
import {
  allSignals,
  blockerCategories,
  workerEvidence,
} from "@/features/outreach/lib/signals"
import { useLabels } from "@/hooks/use-labels"
import { useMe } from "@/hooks/use-session"

/** "Strong in-house capability" → "strong in-house capability", but "IT partners" stays as it is. */
const lowerFirst = (text: string) =>
  /^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text

export function OutreachWorkspace({
  detail,
  service,
  channel,
  onChannelChange,
}: {
  detail: LeadDetail
  service: LeadService
  channel: OutreachChannel
  onChannelChange: (channel: OutreachChannel) => void
}) {
  const me = useMe()
  const label = useLabels()
  const languages = useLanguageOptions(detail.company.country_code)

  const [tone, setTone] = useState<OutreachTone>("professional")
  const [language, setLanguage] = useState("en")
  const [role, setRole] = useState<string | null>(null)
  const [sender, setSender] = useState<Sender>(() => ({
    name: me.data?.full_name ?? "",
    title: "",
    company: readSenderCompany(),
  }))

  const drafts = useOutreachDrafts({
    companyId: detail.company.id,
    serviceId: service.id,
    channel,
    style: { tone, language, sender },
  })

  const evidence = useMemo(() => workerEvidence(detail), [detail])
  const signalsById = useMemo(
    () => new Map(allSignals(detail).map((signal) => [signal.id, signal])),
    [detail]
  )
  const blockers = blockerCategories(detail).map((category) =>
    lowerFirst(label("categories", category))
  )
  const cited =
    drafts.state.kind === "ready" ? drafts.state.draft.referenced_signals : []

  return (
    <OutreachLayout
      side={
        <>
          <WhoCard
            roles={detail.decision_makers}
            role={role ?? detail.decision_makers[0] ?? null}
            onRoleChange={setRole}
            companyName={detail.company.name}
          />
          <EvidenceCard evidence={evidence} cited={cited} blockers={blockers} />
          <StyleCard
            tone={tone}
            onToneChange={setTone}
            language={language}
            onLanguageChange={setLanguage}
            languages={languages}
          />
          <SignatureCard sender={sender} onChange={setSender} />
        </>
      }
      main={
        <DraftPanel
          channel={channel}
          onChannelChange={onChannelChange}
          drafts={drafts}
          signalCount={evidence.length}
          signalsById={signalsById}
          serviceName={service.name}
        />
      }
    />
  )
}
