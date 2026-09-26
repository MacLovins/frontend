import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import {
  getListCompaniesQueryOptions,
  useListCompanies,
} from "@/api/generated/accounts/accounts"
import { createRun } from "@/api/generated/runs/runs"
import { errorMessage } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentService, withService } from "@/hooks/use-current-service"

import { copy } from "../copy"

const PAGE_SIZE = 100
/** RunCreate.company_ids accepts 1..500 ids (backend runs/schemas.py). */
const MAX_COMPANIES = 500
const trackedParams = (page: number) => ({
  is_tracked: true,
  page,
  page_size: PAGE_SIZE,
})

/** Ids of the tracked companies, newest first, up to the run limit (GET /companies pages of 100). */
async function trackedCompanyIds(queryClient: QueryClient, total: number) {
  const pages = Math.ceil(Math.min(total, MAX_COMPANIES) / PAGE_SIZE)
  const results = await Promise.all(
    Array.from({ length: pages }, (_, index) =>
      queryClient.fetchQuery(
        getListCompaniesQueryOptions(trackedParams(index + 1))
      )
    )
  )
  return results
    .flatMap((page) => page.items.map((company) => company.id))
    .slice(0, MAX_COMPANIES)
}

/** Analyzes every tracked account for the current service, then opens the new run. */
export function StartAnalysisDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { serviceId, service } = useCurrentService()
  const [full, setFull] = useState(false)
  const tracked = useListCompanies(trackedParams(1), {
    query: { enabled: open },
  })
  const total = tracked.data?.total ?? 0

  const setOpen = (next: boolean) => {
    if (!next) setFull(false)
    onOpenChange(next)
  }

  const start = useMutation({
    mutationFn: async () =>
      createRun({
        kind: "analyze",
        mode: full ? "full" : "incremental",
        company_ids: await trackedCompanyIds(queryClient, total),
        service_ids: serviceId ? [serviceId] : [],
      }),
    onSuccess: (run) => {
      toast.success(copy.start.started)
      void invalidateApi(queryClient, apiPaths.runs)
      setOpen(false)
      void navigate(withService(`/runs/${run.id}`, serviceId))
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[min(480px,calc(100%-2rem))]">
        <DialogHeader>
          <DialogTitle>{copy.start.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-6 py-5">
          {tracked.isPending ? (
            <Skeleton className="h-10 w-full" />
          ) : tracked.isError ? (
            <div
              role="alert"
              className="flex items-center gap-2 text-sm text-negative-strong"
            >
              {errorMessage(tracked.error)}
              <Button
                variant="link"
                className="text-[13px]"
                onClick={() => void tracked.refetch()}
              >
                {copy.tryAgain}
              </Button>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col gap-1">
              <div className="text-[15px] font-bold">
                {copy.start.noAccounts}
              </div>
              <DialogDescription className="text-sm">
                {copy.start.noAccountsBody}{" "}
                <Link
                  to={withService("/accounts", serviceId)}
                  onClick={() => setOpen(false)}
                >
                  {copy.start.accounts}
                </Link>
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogDescription className="text-sm text-text-secondary">
                {copy.start.body(
                  Math.min(total, MAX_COMPANIES),
                  service?.name ?? "all services"
                )}
                {total > MAX_COMPANIES
                  ? ` ${copy.start.limited(MAX_COMPANIES)}`
                  : null}
              </DialogDescription>
              <Field orientation="horizontal">
                <Checkbox
                  id="start-analysis-full"
                  checked={full}
                  onCheckedChange={(checked) => setFull(checked)}
                />
                <FieldLabel htmlFor="start-analysis-full">
                  {copy.start.full}
                </FieldLabel>
              </Field>
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {copy.start.cancel}
          </DialogClose>
          <Button
            disabled={total === 0 || start.isPending}
            onClick={() => start.mutate()}
          >
            {copy.start.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
