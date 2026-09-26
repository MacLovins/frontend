import { cn } from "cn"
import { Link } from "react-router"

import { useCurrentService, withService } from "@/hooks/use-current-service"
import { useMe } from "@/hooks/use-session"

import { steps, type StepTarget } from "../copy"

/** Step links follow the reader: settings pages only for admins, and the selected service is kept. */
export function ProcessSteps() {
  const me = useMe()
  // The page is public: services are fetched only for a signed-in reader.
  return me.data ? (
    <SignedInSteps isAdmin={me.data.role === "admin"} />
  ) : (
    <StepGrid isAdmin={false} />
  )
}

function SignedInSteps({ isAdmin }: { isAdmin: boolean }) {
  const { serviceId } = useCurrentService()
  return <StepGrid serviceId={serviceId} isAdmin={isAdmin} />
}

function stepHref(
  target: StepTarget,
  serviceId: string | undefined,
  isAdmin: boolean
) {
  if (isAdmin && serviceId && (target === "icp" || target === "scoring")) {
    return `/settings/${serviceId}/${target}`
  }
  return withService(
    target === "accounts" ? "/accounts" : "/prospects",
    serviceId
  )
}

function StepGrid({
  serviceId,
  isAdmin,
}: {
  serviceId?: string
  isAdmin: boolean
}) {
  return (
    // Each card is a four-row subgrid, so the Today / In LeadRadar / link rows line up across a row of cards.
    <ol className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {steps.map((step, index) => {
        const final = index === steps.length - 1
        return (
          <li
            key={step.head}
            className={cn(
              "row-span-4 grid grid-rows-subgrid gap-0 overflow-hidden rounded-md",
              final ? "border-2 border-primary" : "border border-border"
            )}
          >
            <h3
              className={cn(
                "m-0 px-3.5 py-3 text-[15px] font-bold",
                final ? "bg-primary text-black" : "bg-black text-white"
              )}
            >
              {step.head}
            </h3>
            <p className="m-0 min-h-16 border-b border-subtle px-3.5 py-3 text-[13px] leading-[1.45] text-muted-foreground">
              <span className="sr-only">Today: </span>
              {step.today}
            </p>
            <p className="m-0 px-3.5 py-3 text-[13px] leading-[1.45] text-black">
              <span className="sr-only">In LeadRadar: </span>
              {step.ours}
            </p>
            <Link
              to={stepHref(step.target, serviceId, isAdmin)}
              className="bg-primary-surface px-3.5 py-2.5 text-xs font-semibold text-black no-underline hover:text-link-hover"
            >
              {step.link}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
