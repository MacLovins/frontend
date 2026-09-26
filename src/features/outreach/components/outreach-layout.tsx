import type { ReactNode } from "react"

/** 360 px settings column next to the flexible draft panel; stacked below `lg`. */
export function OutreachLayout({
  side,
  main,
}: {
  side: ReactNode
  main: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-6 lg:flex-row lg:items-start">
      <div className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
        {side}
      </div>
      {main}
    </div>
  )
}

export function SideCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-[18px]">
      <h2 className="m-0 text-sm font-bold">{title}</h2>
      {children}
    </section>
  )
}
