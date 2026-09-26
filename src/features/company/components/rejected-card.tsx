import { Link } from "react-router"

import { withService } from "@/hooks/use-current-service"

import { SideCard } from "./side-card"

/**
 * Checker rejections are only exposed organisation- or service-wide (GET /quality), so this card points
 * there instead of showing per-company counts.
 */
export function RejectedCard({ serviceId }: { serviceId: string | undefined }) {
  return (
    <SideCard title="Rejected by the checker" className="gap-2">
      <p className="m-0 text-xs leading-[1.45] text-muted-foreground">
        Rejected evidence never reaches the score. It is kept so the team can
        see what the AI got wrong.
      </p>
      <Link
        to={withService("/quality", serviceId)}
        className="text-[13px] text-foreground underline"
      >
        See rejection reasons on the Quality page
      </Link>
    </SideCard>
  )
}
