import { useMemo } from "react"

import type { ScoringProfileOut } from "@/api/generated/model"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { HalfLifeCard } from "@/features/settings/scoring/components/half-life-card"
import { LeaveGuard } from "@/features/settings/scoring/components/leave-guard"
import {
  PriorityCard,
  TiersCard,
  WeightsCard,
} from "@/features/settings/scoring/components/left-cards"
import { PreviewPanel } from "@/features/settings/scoring/components/preview-panel"
import { ScoringColumns } from "@/features/settings/scoring/components/scoring-layout"
import { copy } from "@/features/settings/scoring/copy"
import { useSaveProfile } from "@/features/settings/scoring/hooks/use-save-profile"
import { useScoringDraft } from "@/features/settings/scoring/hooks/use-scoring-draft"
import { effectiveParams } from "@/features/settings/scoring/lib/params"

/**
 * Edits one saved profile (or the defaults when the service has none yet). Keyed by version: after a save the
 * refetched profile remounts it, so the draft starts over from v{n+1}.
 */
export function ScoringEditor({
  serviceId,
  serviceName,
  profile,
}: {
  serviceId: string
  serviceName: string
  profile: ScoringProfileOut | null
}) {
  const saved = useMemo(() => effectiveParams(profile?.params), [profile])
  const editor = useScoringDraft(saved)
  const saving = useSaveProfile(serviceId)
  const version = profile?.version ?? null
  const cardProps = { editor, disabled: saving.isPending }

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle(serviceName, version)}
        actions={
          <>
            <Button
              variant="outline"
              disabled={!editor.dirty || saving.isPending}
              onClick={editor.reset}
            >
              {copy.reset(version)}
            </Button>
            <Button
              disabled={
                !editor.dirty ||
                editor.invalidHalfLives.length > 0 ||
                saving.isPending
              }
              onClick={() => saving.save(editor.draft)}
            >
              {saving.isPending ? (
                <>
                  <Spinner />
                  {copy.saving}
                </>
              ) : (
                copy.save(version)
              )}
            </Button>
          </>
        }
      />
      <ScoringColumns
        left={
          <>
            <WeightsCard {...cardProps} />
            <PriorityCard {...cardProps} />
            <TiersCard {...cardProps} />
            <HalfLifeCard {...cardProps} />
          </>
        }
        right={
          <PreviewPanel
            serviceId={serviceId}
            profile={profile}
            saved={saved}
            draft={editor.draft}
          />
        }
      />
      <LeaveGuard dirty={editor.dirty && !saving.isPending} />
    </>
  )
}
