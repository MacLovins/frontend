import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "cn"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { CompanyOut, CompanyUpdate } from "@/api/generated/model"
import { Card } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { useSaveCompany } from "../hooks/use-save-company"
import { TagEditor } from "./tag-editor"

function isLinkedinUrl(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return (
      /^https?:$/.test(url.protocol) &&
      (host === "linkedin.com" || host.endsWith(".linkedin.com"))
    )
  } catch {
    return false
  }
}

const schema = z.object({
  linkedin_url: z
    .string()
    .trim()
    .refine(
      (value) => !value || isLinkedinUrl(value),
      "Enter a LinkedIn URL, e.g. https://www.linkedin.com/company/…"
    ),
  notes: z.string(),
})

type Values = z.infer<typeof schema>

const SAVED_MS = 2000

/** "Saved" under the card for two seconds after each successful autosave. */
function useSavedFlash() {
  const [visible, setVisible] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const flash = () => {
    setVisible(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(false), SAVED_MS)
  }
  return [visible, flash] as const
}

/** LinkedIn URL and team notes save on blur, tags on every change (PATCH /companies/{id}). */
export function NotesCard({ company }: { company: CompanyOut }) {
  const save = useSaveCompany(company.id)
  const [saved, flashSaved] = useSavedFlash()
  const [tags, setTags] = useState(company.tags)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      linkedin_url: company.linkedin_url ?? "",
      notes: company.notes ?? "",
    },
  })

  const patch = (data: CompanyUpdate) =>
    save.mutate(
      { id: company.id, data },
      {
        onSuccess: flashSaved,
        onError: () => toast.error("Couldn't save notes"),
      }
    )

  const saveField = async (field: keyof Values) => {
    if (!(await form.trigger(field))) return
    const value = form.getValues(field).trim()
    if (value === (company[field] ?? "")) return
    patch({ [field]: value || null })
  }

  const linkedinError = form.formState.errors.linkedin_url

  return (
    <Card className="relative">
      <h2 className="m-0 text-base font-bold">Notes</h2>
      <Field data-invalid={!!linkedinError || undefined}>
        <FieldLabel htmlFor="company-linkedin">
          LinkedIn company or contact URL
        </FieldLabel>
        <Input
          id="company-linkedin"
          type="url"
          placeholder="https://www.linkedin.com/company/…"
          aria-invalid={!!linkedinError || undefined}
          className="rounded-sm px-2.5"
          {...form.register("linkedin_url", {
            onBlur: () => void saveField("linkedin_url"),
          })}
        />
        <FieldError errors={[linkedinError]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="company-notes">Notes for the team</FieldLabel>
        <Textarea
          id="company-notes"
          rows={4}
          className="field-sizing-fixed min-h-0 resize-y rounded-sm p-2.5"
          {...form.register("notes", { onBlur: () => void saveField("notes") })}
        />
      </Field>
      <TagEditor
        tags={tags}
        onChange={(next) => {
          setTags(next)
          patch({ tags: next })
        }}
      />
      <p className="absolute right-5 bottom-1 m-0 text-xs text-muted-foreground">
        <span
          aria-hidden="true"
          className={cn(
            "transition-opacity duration-500",
            saved ? "opacity-100" : "opacity-0"
          )}
        >
          Saved
        </span>
        <span aria-live="polite" className="sr-only">
          {saved ? "Saved" : ""}
        </span>
      </p>
    </Card>
  )
}
