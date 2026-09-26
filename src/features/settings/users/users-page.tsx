import { useMemo, useState } from "react"

import { useListUsers } from "@/api/generated/auth/auth"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { useMe } from "@/hooks/use-session"

import { AddUserDialog } from "@/features/settings/users/components/add-user-dialog"
import { EditUserSheet } from "@/features/settings/users/components/edit-user-sheet"
import { UsersTable, UsersTableSkeleton } from "@/features/settings/users/components/users-table"
import { copy } from "@/features/settings/users/copy"
import { sortUsers } from "@/features/settings/users/lib/user-form"

export function UsersPage() {
  const me = useMe()
  const users = useListUsers()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [sheetOpen, setSheetOpen] = useState(false)

  const sorted = useMemo(() => sortUsers(users.data ?? []), [users.data])
  const editing = sorted.find((user) => user.id === editingId)
  const currentUserId = me.data?.id

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <Button onClick={() => setAdding(true)}>{copy.addUser}</Button>
        }
      />
      <div className="px-8 py-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {users.isPending ? (
            <UsersTableSkeleton />
          ) : users.isError ? (
            <ErrorState title={copy.loadError} error={users.error} onRetry={() => void users.refetch()} />
          ) : sorted.length === 0 ? (
            <EmptyState title={copy.empty}>{copy.emptyBody}</EmptyState>
          ) : (
            <UsersTable
              users={sorted}
              currentUserId={currentUserId}
              onEdit={(user) => {
                setEditingId(user.id)
                setSheetOpen(true)
              }}
            />
          )}
        </div>
      </div>
      <AddUserDialog open={adding} onOpenChange={setAdding} />
      <EditUserSheet
        user={editing}
        open={sheetOpen}
        currentUserId={currentUserId}
        onClose={() => setSheetOpen(false)}
      />
    </>
  )
}
