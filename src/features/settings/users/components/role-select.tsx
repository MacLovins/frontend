import type { UserOutRole } from "@/api/generated/model"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { roleItems } from "@/features/settings/users/lib/user-form"

export function RoleSelect({
  id,
  value,
  onChange,
  disabled,
  describedBy,
}: {
  id: string
  value: UserOutRole
  onChange: (role: UserOutRole) => void
  disabled?: boolean
  describedBy?: string
}) {
  return (
    <Select items={roleItems} value={value} onValueChange={(role) => role && onChange(role)} disabled={disabled}>
      <SelectTrigger id={id} aria-describedby={describedBy} className="w-full rounded-sm px-2.5">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roleItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
