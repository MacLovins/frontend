import { useId } from "react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SideCard } from "@/features/outreach/components/outreach-layout"
import { article } from "@/features/outreach/lib/draft"
import { linkedinSearchUrl } from "@/lib/linkedin"

export function WhoCard({
  roles,
  role,
  onRoleChange,
  companyName,
}: {
  roles: string[]
  role: string | null
  onRoleChange: (role: string) => void
  companyName: string
}) {
  const id = useId()

  return (
    <SideCard title="Who">
      {role ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id}>Role</Label>
            <Select
              value={role}
              onValueChange={(value) => value && onRoleChange(value)}
            >
              <SelectTrigger id={id} className="w-full rounded-sm px-2.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* The API takes no recipient, so the role only drives this search link (outreach/schemas.py). */}
          <a
            href={linkedinSearchUrl(role, companyName)}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] leading-[1.4] underline underline-offset-2"
          >
            Find {article(role)} {role} at {companyName} on LinkedIn{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </>
      ) : null}
      <p className="m-0 text-xs leading-[1.4] text-muted-foreground">
        Find the person with the LinkedIn link on the company page, then paste
        their name here or in your email client.
      </p>
    </SideCard>
  )
}
