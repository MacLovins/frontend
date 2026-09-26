import { useId } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideCard } from "@/features/outreach/components/outreach-layout"
import type { Sender } from "@/features/outreach/lib/draft"
import { writeSenderCompany } from "@/features/outreach/lib/persist"

/** The API signs with "LeadRadar" unless it gets the seller's company (outreach/schemas.py), hence this card. */
export function SignatureCard({
  sender,
  onChange,
}: {
  sender: Sender
  onChange: (sender: Sender) => void
}) {
  const id = useId()

  return (
    <SideCard title="Signature">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>Your name</Label>
        <Input
          id={`${id}-name`}
          autoComplete="name"
          value={sender.name}
          onChange={(event) =>
            onChange({ ...sender, name: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-title`}>Your title</Label>
        <Input
          id={`${id}-title`}
          autoComplete="organization-title"
          placeholder="e.g. Account Executive"
          value={sender.title}
          onChange={(event) =>
            onChange({ ...sender, title: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-company`}>Your company</Label>
        <Input
          id={`${id}-company`}
          autoComplete="organization"
          placeholder="e.g. Orange Systems"
          value={sender.company}
          onChange={(event) =>
            onChange({ ...sender, company: event.target.value })
          }
          onBlur={(event) => writeSenderCompany(event.target.value.trim())}
        />
      </div>
      <p className="m-0 text-xs leading-[1.4] text-muted-foreground">
        Used in the sign-off. Nothing about the recipient is sent to the AI.
      </p>
    </SideCard>
  )
}
