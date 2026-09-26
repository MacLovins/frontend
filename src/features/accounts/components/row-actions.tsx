import { DotsThreeIcon } from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import {
  getGetCompanyQueryKey,
  useDeleteCompany,
  useUpdateCompany,
} from "@/api/generated/accounts/accounts"
import type { CompanyOut } from "@/api/generated/model"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { copy } from "@/features/accounts/copy"
import { invalidateCompanyLists } from "@/features/accounts/lib/cache"

export function RowActions({
  company,
  href,
  canDelete,
  onDeleted,
}: {
  company: CompanyOut
  href: string
  canDelete: boolean
  onDeleted: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const update = useUpdateCompany({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetCompanyQueryKey(updated.id), updated)
        void invalidateCompanyLists(queryClient)
        toast.success(
          updated.is_tracked
            ? copy.actions.resumed(updated.name)
            : copy.actions.stopped(updated.name)
        )
      },
    },
  })
  const remove = useDeleteCompany({
    mutation: {
      onSuccess: () => {
        setConfirmOpen(false)
        onDeleted(company.id)
        queryClient.removeQueries({
          queryKey: getGetCompanyQueryKey(company.id),
        })
        void invalidateCompanyLists(queryClient)
        // Deleting cascades to the company's scores and signals.
        void invalidateApi(queryClient, apiPaths.leads, apiPaths.activity)
        toast.success(copy.actions.deleted(company.name))
      },
    },
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={copy.rowActions(company.name)}
            />
          }
        >
          <DotsThreeIcon weight="bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link to={href} />}>
            {copy.actions.open}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                id: company.id,
                data: { is_tracked: !company.is_tracked },
              })
            }
          >
            {company.is_tracked
              ? copy.actions.stopMonitoring
              : copy.actions.resumeMonitoring}
          </DropdownMenuItem>
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                {copy.actions.delete}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canDelete ? (
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(open) => !remove.isPending && setConfirmOpen(open)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {copy.actions.deleteTitle(company.name)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {copy.actions.deleteBody}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={remove.isPending}>
                {copy.actions.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: company.id })}
              >
                {remove.isPending
                  ? copy.actions.deleting
                  : copy.actions.confirmDelete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  )
}
