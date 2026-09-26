import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import { useCreateRun } from "@/api/generated/runs/runs"
import { errorMessage } from "@/api/mutator"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { withService } from "@/hooks/use-current-service"
import { analyzeCopy } from "@/features/prospects/copy"
import { useTrackedCompanyIds } from "@/features/prospects/hooks/use-tracked-company-ids"

const accountsLabel = (count: number) =>
  `${count} tracked account${count === 1 ? "" : "s"}`

/** Starts an analysis of every tracked account for the current service, then opens the run. */
export function AnalyzeDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceId: string
  serviceName: string
}) {
  const tracked = useTrackedCompanyIds(open)
  const [fullRefresh, setFullRefresh] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createRun = useCreateRun()

  const ids = tracked.data?.ids ?? []
  const total = tracked.data?.total ?? 0

  const start = () =>
    createRun.mutate(
      {
        data: {
          kind: "analyze",
          mode: fullRefresh ? "full" : "incremental",
          company_ids: ids,
          service_ids: [serviceId],
        },
      },
      {
        onSuccess: (run) => {
          toast.success(analyzeCopy.started)
          void invalidateApi(queryClient, apiPaths.runs)
          onOpenChange(false)
          void navigate(withService(`/runs/${run.id}`, serviceId))
        },
      }
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{analyzeCopy.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-6 py-5 text-sm leading-[1.45]">
          {tracked.isPending ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : tracked.isError ? (
            <div role="alert" className="flex flex-col items-start gap-3">
              <p className="m-0 font-semibold">{analyzeCopy.loadError}</p>
              <p className="m-0 text-muted-foreground">
                {errorMessage(tracked.error)}
              </p>
              <Button variant="outline" onClick={() => void tracked.refetch()}>
                Try again
              </Button>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="m-0 font-semibold">{analyzeCopy.noTracked}</p>
              <p className="m-0 text-muted-foreground">
                {analyzeCopy.noTrackedBody}
              </p>
              <Link
                to={withService("/accounts", serviceId)}
                className={buttonVariants({ variant: "outline" })}
              >
                {analyzeCopy.goToAccounts}
              </Link>
            </div>
          ) : (
            <>
              <p className="m-0">
                Collect fresh evidence and re-score{" "}
                {total > ids.length
                  ? `the first ${ids.length} of ${accountsLabel(total)}`
                  : accountsLabel(total)}{" "}
                for <strong>{serviceName}</strong>. You can keep working;
                progress continues on Runs.
              </p>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={fullRefresh}
                  onCheckedChange={(checked) => setFullRefresh(checked)}
                />
                {analyzeCopy.fullRefresh}
              </label>
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {analyzeCopy.cancel}
          </DialogClose>
          {total > 0 ? (
            <Button
              onClick={start}
              disabled={createRun.isPending || !ids.length}
            >
              {analyzeCopy.start}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
