import { TierSwatch } from "@/components/common/tier"
import { tierLabels, tierOrder } from "@/lib/labels"
import { matrixCopy } from "@/features/prospects/copy"

const FEW_FIT_VALUES = 5

function fitNote(distinctFitValues: number, niceToHave: number | undefined) {
  if (distinctFitValues > FEW_FIT_VALUES || niceToHave === undefined)
    return null
  return `Fit takes few distinct values with the current ICP (${niceToHave} nice-to-have ${
    niceToHave === 1 ? "criterion" : "criteria"
  }). More criteria spread it out.`
}

export function MatrixLegend({
  distinctFitValues,
  niceToHave,
  capped,
}: {
  distinctFitValues: number
  /** Nice-to-have criteria of the service's ICP; undefined until loaded. */
  niceToHave: number | undefined
  /** More leads exist than the plot shows. */
  capped: boolean
}) {
  const note = [
    capped ? matrixCopy.cappedNote : null,
    fitNote(distinctFitValues, niceToHave),
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
      {tierOrder.map((tier) => (
        <span key={tier} className="flex items-center gap-1.5">
          <TierSwatch tier={tier} shape="dot" />
          {tierLabels[tier]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-3 rounded-full border-2 border-dashed border-destructive"
        />
        {matrixCopy.legendRisk}
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-input" />
        {matrixCopy.legendOther}
      </span>
      {note ? (
        <span className="ml-auto text-muted-foreground">{note}</span>
      ) : null}
    </div>
  )
}
