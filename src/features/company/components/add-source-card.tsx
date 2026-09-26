import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { CompanyOut } from "@/api/generated/model"
import { errorMessage, fieldErrors } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useSaveCompany } from "../hooks/use-save-company"
import type { Analysis } from "./company-header"
import { ExternalLink } from "./external-link"
import { SideCard } from "./side-card"

// The API stores exactly these two hand-added URLs: the website collector reads the newsroom and the
// careers collectors read the careers page (parser adapters web_site.py, jobs_careers_html.py).
const fields = [
  { value: "newsroom_url", label: "Newsroom" },
  { value: "careers_url", label: "Careers page" },
] as const

type SourceField = (typeof fields)[number]["value"]

const isHttpUrl = (value: string) => {
  try {
    return /^https?:$/.test(new URL(value).protocol)
  } catch {
    return false
  }
}

const schema = z.object({
  field: z.enum(["newsroom_url", "careers_url"]),
  url: z
    .string()
    .trim()
    .refine(isHttpUrl, "Enter a full URL starting with https://"),
})

type Values = z.infer<typeof schema>

export function AddSourceCard({
  company,
  analysis,
}: {
  company: CompanyOut
  analysis: Analysis
}) {
  const save = useSaveCompany(company.id)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { field: "newsroom_url", url: "" },
  })

  const submit = form.handleSubmit(({ field, url }) =>
    save.mutate(
      { id: company.id, data: { [field]: url } },
      {
        onSuccess: () => {
          form.reset({ field, url: "" })
          toast.success("Saved. It is read at the next run.", {
            action: { label: "Analyze now", onClick: analysis.start },
          })
        },
        onError: (error) => {
          const message = fieldErrors(error)[field]
          if (message) form.setError("url", { message })
          else toast.error(errorMessage(error))
        },
      }
    )
  )

  const remove = (field: SourceField) =>
    save.mutate(
      { id: company.id, data: { [field]: null } },
      { onError: (error) => toast.error(errorMessage(error)) }
    )
  const current = fields.filter((item) => company[item.value])

  return (
    <SideCard title="Add a source by hand">
      <p className="m-0 text-[13px] leading-[1.45] text-muted-foreground">
        Newsroom or careers page that wasn't found automatically. It is read at
        the next run.
      </p>
      <form noValidate onSubmit={submit} className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Controller
            control={form.control}
            name="field"
            render={({ field }) => (
              <Select
                items={fields}
                value={field.value}
                onValueChange={(value) => value && field.onChange(value)}
              >
                <SelectTrigger
                  aria-label="Source kind"
                  className="w-[132px] shrink-0 rounded-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input
            type="url"
            aria-label="Source URL"
            placeholder="https://"
            aria-invalid={!!form.formState.errors.url || undefined}
            className="min-w-0 flex-1 rounded-sm px-2.5"
            {...form.register("url")}
          />
          <Button
            type="submit"
            variant="black"
            className="px-3.5"
            disabled={save.isPending}
          >
            Add
          </Button>
        </div>
        <FieldError errors={[form.formState.errors.url]} />
      </form>
      {current.length ? (
        <div className="flex flex-col gap-1">
          {current.map((item) => {
            const url = company[item.value] ?? ""
            return (
              <div
                key={item.value}
                className="flex min-w-0 items-center gap-2 text-[13px]"
              >
                <span className="shrink-0 text-muted-foreground">
                  {item.label}:
                </span>
                <ExternalLink href={url} className="min-w-0 truncate underline">
                  {url}
                </ExternalLink>
                <Button
                  variant="ghost"
                  size="xs"
                  className="ml-auto shrink-0"
                  disabled={save.isPending}
                  onClick={() => remove(item.value)}
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>
      ) : null}
    </SideCard>
  )
}
