import { Fragment } from "react"

import { copy, stepGlossary } from "../copy"
import { RunCard } from "./run-card"

export function StepGlossaryCard() {
  return (
    <RunCard title={copy.glossaryTitle}>
      <dl className="m-0 grid grid-cols-[92px_minmax(0,1fr)] gap-y-1.5 text-xs leading-[1.4] text-text-secondary">
        {stepGlossary.map(([term, text]) => (
          <Fragment key={term}>
            <dt className="font-bold">{term}</dt>
            <dd className="m-0">{text}</dd>
          </Fragment>
        ))}
      </dl>
    </RunCard>
  )
}
