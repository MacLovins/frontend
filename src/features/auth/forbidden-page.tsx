import { Link } from "react-router"

import { EmptyState } from "@/components/common/states"
import { Button } from "@/components/ui/button"

export function ForbiddenPage() {
  return (
    <EmptyState
      className="my-auto"
      title="This page is for admins"
      actions={<Button render={<Link to="/prospects" />}>Go to Prospects</Button>}
    >
      Services, questions, the ideal customer profile, rules and scoring are configured by an admin. Ask one to
      change them for you.
    </EmptyState>
  )
}
