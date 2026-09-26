import type { ScoreHistoryPoint } from "@/api/generated/model"
import { score } from "@/lib/format"

const WIDTH = 176
const HEIGHT = 40
const X0 = 4
const X1 = 172
const Y0 = 2
const Y1 = 38

/** Priority over the card's recompute points (oldest → newest), with the Hot band shaded. */
export function PrioritySparkline({
  points,
  hotThreshold,
}: {
  points: ScoreHistoryPoint[]
  hotThreshold: number
}) {
  if (points.length < 2) return null
  const values = points.map((point) => point.priority)
  let low = Math.max(0, Math.min(...values) - 5)
  let high = Math.min(100, Math.max(...values) + 5)
  if (hotThreshold >= low - 5 && hotThreshold <= high + 5) {
    low = Math.min(low, hotThreshold)
    high = Math.max(high, hotThreshold)
  }
  const span = high - low || 1
  const y = (value: number) => Y1 - ((value - low) / span) * (Y1 - Y0)
  const x = (index: number) => X0 + (index * (X1 - X0)) / (points.length - 1)
  const path = values
    .map((value, index) => `${index ? "L" : "M"}${x(index)},${y(value)}`)
    .join(" ")
  const band = y(hotThreshold)
  const last = values.length - 1

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Priority history, from ${score(values[0])} to ${score(values[last])}`}
      className="mt-1"
    >
      {band > 0 ? (
        <rect
          x={0}
          y={0}
          width={WIDTH}
          height={band}
          fill="var(--primary-surface)"
        />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={x(last)} cy={y(values[last])} r={3} fill="var(--primary)" />
    </svg>
  )
}
