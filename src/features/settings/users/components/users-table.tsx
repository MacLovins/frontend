import type { UserOut } from "@/api/generated/model"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime, relativeTime } from "@/lib/format"
import { roleLabels } from "@/lib/labels"

import { copy } from "@/features/settings/users/copy"
import { displayName } from "@/features/settings/users/lib/user-form"

const SKELETON_ROWS = 4

function Header() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[26%]">{copy.columns.name}</TableHead>
        <TableHead>{copy.columns.email}</TableHead>
        <TableHead className="w-[110px]">{copy.columns.role}</TableHead>
        <TableHead className="w-[130px]">{copy.columns.status}</TableHead>
        <TableHead className="w-[150px]">{copy.columns.lastSignIn}</TableHead>
        <TableHead className="w-[88px]">
          <span className="sr-only">{copy.edit}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

export function UsersTableSkeleton() {
  return (
    <Table className="table-fixed">
      <Header />
      <TableBody>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <TableRow key={index}>
            {[160, 200, 50, 70, 80, 50].map((width, cell) => (
              <TableCell key={cell} className="align-middle">
                <Skeleton className="h-4" style={{ width }} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function UsersTable({
  users,
  currentUserId,
  onEdit,
}: {
  users: readonly UserOut[]
  currentUserId: string | undefined
  onEdit: (user: UserOut) => void
}) {
  return (
    <Table className="table-fixed">
      <Header />
      <TableBody>
        {users.map((user) => (
          <TableRow
            key={user.id}
            className={user.is_active ? undefined : "text-muted-foreground"}
          >
            <TableCell className="align-middle">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={
                    user.full_name
                      ? "truncate font-semibold"
                      : "truncate text-muted-foreground"
                  }
                >
                  {user.full_name?.trim() || copy.noName}
                </span>
                {user.id === currentUserId ? (
                  <Badge variant="outline">{copy.you}</Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="truncate align-middle">
              {user.email}
            </TableCell>
            <TableCell className="align-middle">
              {roleLabels[user.role]}
            </TableCell>
            <TableCell className="align-middle">
              {user.is_active ? (
                <Badge size="md" variant="success">
                  {copy.active}
                </Badge>
              ) : (
                <Badge size="md" variant="muted">
                  {copy.deactivated}
                </Badge>
              )}
            </TableCell>
            <TableCell className="align-middle text-[13px]">
              {user.last_login_at ? (
                <time
                  dateTime={user.last_login_at}
                  title={formatDateTime(user.last_login_at)}
                >
                  {relativeTime(user.last_login_at)}
                </time>
              ) : (
                <span className="text-muted-foreground">{copy.never}</span>
              )}
            </TableCell>
            <TableCell className="text-right align-middle">
              <Button
                variant="outline"
                size="xs"
                aria-label={copy.editLabel(displayName(user))}
                onClick={() => onEdit(user)}
              >
                {copy.edit}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
