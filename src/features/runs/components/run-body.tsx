import type { ReactNode } from "react"

/**
 * Two columns under the header: 820 px of company cards and a 288 px side column at 1440 px. Below that the
 * main column gives way first; above it the side column grows.
 */
export function RunBody({
  main,
  aside,
}: {
  main: ReactNode
  aside: ReactNode
}) {
  return (
    <div className="flex items-start gap-5 px-8 py-5">
      <section className="flex max-w-[820px] min-w-0 flex-[1_1_820px] flex-col gap-3.5">
        {main}
      </section>
      <aside className="flex min-w-0 flex-[1_0_288px] flex-col gap-3.5">
        {aside}
      </aside>
    </div>
  )
}
