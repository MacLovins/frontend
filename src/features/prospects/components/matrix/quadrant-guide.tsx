import { matrixCopy } from "@/features/prospects/copy"

export function QuadrantGuide() {
  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-5">
      <h2 className="m-0 text-sm font-bold">{matrixCopy.howTo}</h2>
      {matrixCopy.howToLines.map((line) => (
        <p
          key={line.lead}
          className="m-0 text-[13px] leading-[1.5] text-text-secondary"
        >
          <strong>{line.lead}</strong> {line.text}
        </p>
      ))}
    </section>
  )
}
