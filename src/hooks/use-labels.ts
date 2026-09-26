import { useCallback } from "react"

import { useGetLabels } from "@/api/generated/meta/meta"
import type { LabelsOut } from "@/api/generated/model"
import { humanize } from "@/lib/labels"

export type LabelGroup = keyof LabelsOut

/**
 * English names of backend enums (categories, source types, stages, reject reasons…) from GET /meta/labels.
 * Falls back to a humanized value while loading or for values the dictionary does not know.
 */
export function useLabels() {
  const { data } = useGetLabels({ query: { staleTime: Infinity, gcTime: Infinity } })
  return useCallback(
    (group: LabelGroup, value: string | null | undefined) => {
      if (!value) return ""
      const dictionary = data?.[group] as Record<string, string> | undefined
      return dictionary?.[value] ?? humanize(value)
    },
    [data],
  )
}
