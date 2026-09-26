import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useApplyPreset } from "@/api/generated/config/config"
import { useGetPresets } from "@/api/generated/meta/meta"
import type { PresetOut, ServiceOut } from "@/api/generated/model"
import { ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLabels } from "@/hooks/use-labels"

import { copy } from "@/features/settings/services/copy"
import { storeService } from "@/features/settings/services/hooks/use-service-writes"

function PresetRow({
  preset,
  applied,
  applying,
  disabled,
  onApply,
}: {
  preset: PresetOut
  applied: boolean
  applying: boolean
  disabled: boolean
  onApply: () => void
}) {
  const label = useLabels()
  return (
    <li className="flex items-center gap-2.5 rounded-md border border-subtle p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{preset.name}</div>
        <Tooltip>
          <TooltipTrigger
            render={<button type="button" className="cursor-default text-left text-xs text-muted-foreground" />}
          >
            {copy.presets.subline(preset.questions_count, preset.categories.length)}
          </TooltipTrigger>
          <TooltipContent>{preset.categories.map((category) => label("categories", category)).join(", ")}</TooltipContent>
        </Tooltip>
      </div>
      {applied ? (
        <span className="text-xs font-semibold text-positive-strong">{copy.presets.applied}</span>
      ) : (
        <Button variant="outline" size="sm" className="h-8" disabled={disabled} onClick={onApply}>
          {applying ? <Spinner /> : null}
          {copy.presets.apply}
        </Button>
      )}
    </li>
  )
}

/** "Start from a preset": apply is idempotent by slug and answers 200 either way (config/presets.py:23-103). */
export function PresetsCard({
  services,
  onApplied,
}: {
  services: readonly ServiceOut[]
  onApplied: (serviceId: string) => void
}) {
  const queryClient = useQueryClient()
  const presets = useGetPresets({ query: { staleTime: Infinity } })
  const apply = useApplyPreset({
    mutation: {
      // "Created" is not signalled, so remember whether the slug was taken before the call.
      onMutate: ({ key }) => ({ existed: services.some((item) => item.slug === key) }),
      onSuccess: (service, { key }, context) => {
        const preset = presets.data?.find((item) => item.key === key)
        if (preset && !context.existed) toast.success(copy.toast.presetApplied(preset.name, preset.questions_count))
        // The list must hold the service before the page selects it.
        const stored = storeService(queryClient, service)
        onApplied(service.id)
        return stored
      },
    },
  })

  if (presets.data?.length === 0) return null

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <h2 className="m-0 text-base font-bold">{copy.presets.title}</h2>
      {presets.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-[62px] rounded-md" />
          <Skeleton className="h-[62px] rounded-md" />
        </div>
      ) : presets.isError ? (
        <ErrorState
          className="py-6"
          title={copy.presets.loadError}
          error={presets.error}
          onRetry={() => void presets.refetch()}
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {presets.data.map((preset) => (
            <PresetRow
              key={preset.key}
              preset={preset}
              applied={services.some((service) => service.slug === preset.key)}
              applying={apply.isPending && apply.variables.key === preset.key}
              disabled={apply.isPending}
              onApply={() => apply.mutate({ key: preset.key })}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
