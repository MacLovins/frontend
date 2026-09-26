import { mapPoints } from "../copy"

// Text sizes are the mock's px at 520 px wide and shrink with the box (cqi), so labels keep their places on smaller maps.
const axisLabel =
  "absolute text-[length:clamp(9px,2.12cqi,11px)] leading-[1.2] font-semibold tracking-[0.04em] text-muted-foreground uppercase"

/** An illustration, not a data chart: plain positioned elements on the mock's 520 × 440 grid. */
export function PositioningMap() {
  return (
    <div
      role="img"
      aria-label="Positioning map: LeadRadar sits top-right, where every claim is checkable and specific to one offer; intent data and CRM scoring sit bottom-left."
      className="@container relative aspect-[520/440] w-full max-w-[520px] overflow-hidden rounded-md border border-border bg-canvas"
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-1/2 h-full w-px bg-border"
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-0 h-px w-full bg-border"
      />
      <span className={`${axisLabel} top-2.5 left-3`}>
        Every claim checkable ↑
      </span>
      <span className={`${axisLabel} bottom-2.5 left-3`}>
        ↓ Score without the reason
      </span>
      <span className={`${axisLabel} right-3 bottom-2.5`}>
        Specific to one offer →
      </span>

      {mapPoints.map((point) => (
        <div
          key={point.name}
          className="absolute flex items-center gap-2"
          style={{ left: point.left, top: point.top }}
        >
          <span className="size-3.5 shrink-0 rounded-full bg-chart-2" />
          <span className="text-[length:clamp(10px,2.5cqi,13px)] leading-[1.2] whitespace-nowrap">
            <strong>{point.name}</strong>
            {point.inline ? " " : <br />}
            <span className="text-muted-foreground">{point.sub}</span>
          </span>
        </div>
      ))}

      <div
        className="absolute flex items-center gap-2 rounded-sm bg-primary px-2.5 py-2"
        style={{ left: "67.31%", top: "9.09%" }}
      >
        <span className="size-3.5 shrink-0 rounded-full bg-black" />
        <span className="text-[length:clamp(11px,2.7cqi,14px)] font-bold">
          LeadRadar
        </span>
      </div>
    </div>
  )
}
