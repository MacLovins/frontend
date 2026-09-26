import { Link } from "react-router"

import { EmptyState } from "@/components/common/states"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <EmptyState
      className="my-auto"
      title="Page not found"
      actions={
        <Button render={<Link to="/prospects" />}>Go to Prospects</Button>
      }
    >
      The link may be old, or the page was moved.
    </EmptyState>
  )
}
