import { TierSwatch } from "@/components/common/tier"
import {
  NotPreviewedNote,
  SettingsCard,
} from "@/features/settings/scoring/components/settings-card"
import {
  LabeledSlider,
  SliderRow,
} from "@/features/settings/scoring/components/slider-fields"
import { copy } from "@/features/settings/scoring/copy"
import type { ScoringDraft } from "@/features/settings/scoring/hooks/use-scoring-draft"
import {
  fitShare,
  formatParam,
  oneStrongSignalIntent,
  round1,
} from "@/features/settings/scoring/lib/params"

type CardProps = { editor: ScoringDraft; disabled: boolean }

const WEIGHT_LEVELS = ["high", "medium", "low"] as const
const percentFormat: Intl.NumberFormatOptions = { style: "percent" }
const pct = (ratio: number) => Math.round(ratio * 100)

export function WeightsCard({ editor, disabled }: CardProps) {
  const { weights } = editor.draft
  const ratio =
    weights.low > 0 ? formatParam(round1(weights.high / weights.low)) : "∞"
  return (
    <SettingsCard title={copy.weights.title} className="gap-3.5">
      {WEIGHT_LEVELS.map((level) => (
        <SliderRow
          key={level}
          label={copy.weights.rows[level]}
          display={formatParam(weights[level])}
          value={weights[level]}
          min={0}
          max={5}
          step={0.5}
          disabled={disabled}
          onChange={(value) => editor.setWeight(level, value)}
        />
      ))}
      <p className="m-0 text-xs text-muted-foreground">
        {copy.weights.ratio(ratio)}
      </p>
    </SettingsCard>
  )
}

export function PriorityCard({ editor, disabled }: CardProps) {
  const { draft } = editor
  const share = fitShare(draft)
  const penalty = pct(draft.risk_penalty)
  return (
    <SettingsCard title={copy.priority.title} className="gap-3.5">
      <LabeledSlider
        label={copy.priority.balance}
        display={`${pct(share)}% / ${pct(1 - share)}%`}
        help={copy.priority.balanceHelp}
        value={share}
        min={0.1}
        max={0.9}
        step={0.1}
        format={percentFormat}
        disabled={disabled}
        onChange={editor.setFitShare}
      />
      <LabeledSlider
        label={copy.priority.penalty}
        display={`${penalty}%`}
        help={copy.priority.penaltyHelp(penalty)}
        value={draft.risk_penalty}
        min={0}
        max={1}
        step={0.1}
        format={percentFormat}
        disabled={disabled}
        onChange={(value) => editor.setNumber("risk_penalty", value)}
      />
      <LabeledSlider
        label={copy.priority.tau}
        display={formatParam(draft.tau_intent)}
        help={copy.priority.tauHelp(oneStrongSignalIntent(draft))}
        value={draft.tau_intent}
        min={1}
        max={8}
        step={0.5}
        disabled={disabled}
        onChange={(value) => editor.setNumber("tau_intent", value)}
      />
      <LabeledSlider
        label={copy.priority.confidence}
        display={`${pct(draft.min_confidence)}%`}
        help={copy.priority.confidenceHelp}
        note={
          editor.confidenceDirty ? (
            <NotPreviewedNote>{copy.notPreviewed}</NotPreviewedNote>
          ) : null
        }
        value={draft.min_confidence}
        min={0.3}
        max={0.9}
        step={0.05}
        format={percentFormat}
        disabled={disabled}
        onChange={(value) => editor.setNumber("min_confidence", value)}
      />
    </SettingsCard>
  )
}

export function TiersCard({ editor, disabled }: CardProps) {
  const { tiers } = editor.draft
  return (
    <SettingsCard title={copy.tiers.title} className="gap-3">
      {(["hot", "warm"] as const).map((tier) => (
        <SliderRow
          key={tier}
          label={
            <>
              <TierSwatch tier={tier} />
              {copy.tiers[tier]}
            </>
          }
          display={formatParam(tiers[tier])}
          value={tiers[tier]}
          min={tier === "hot" ? 40 : 10}
          max={tier === "hot" ? 90 : 70}
          step={5}
          disabled={disabled}
          onChange={(value) => editor.setTier(tier, value)}
        />
      ))}
    </SettingsCard>
  )
}
