import type { ReactNode } from "react"

/** White bordered card of the Runs screen (18 × 20 padding) with a 15 px title. */
export function RunCard({
  title,
  action,
  children,
}: {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-border bg-card px-5 py-[18px]">
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-[15px] font-bold">{title}</h2>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
