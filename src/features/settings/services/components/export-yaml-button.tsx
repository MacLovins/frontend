import {
  useGetIcp,
  useGetScoringProfile,
  useListQuestions,
  useListRules,
} from "@/api/generated/config/config"
import type { ServiceOut } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import { useLabels } from "@/hooks/use-labels"

import { copy } from "@/features/settings/services/copy"
import { isNotFound } from "@/features/settings/services/lib/config-queries"
import {
  downloadText,
  serviceToPreset,
  toYaml,
} from "@/features/settings/services/lib/service-yaml"

/** Downloads `{slug}.yaml` in the preset format, built from the cached queries of the service card. */
export function ExportYamlButton({ service }: { service: ServiceOut }) {
  const label = useLabels()
  const questions = useListQuestions(service.id)
  const rules = useListRules(service.id)
  const icp = useGetIcp(service.id)
  const scoring = useGetScoringProfile(service.id)

  const settled = (result: { data: unknown; error: unknown }) =>
    result.data !== undefined || isNotFound(result.error)
  const ready = questions.data && rules.data && settled(icp) && settled(scoring)

  const exportYaml = () => {
    if (!questions.data || !rules.data) return
    const preset = serviceToPreset({
      service,
      questions: questions.data,
      rules: rules.data,
      icp: icp.data ?? null,
      scoring: scoring.data ?? null,
      questionLabel: (question) => label("categories", question.category),
    })
    downloadText(`${service.slug}.yaml`, toYaml(preset), "application/yaml")
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={!ready}
      onClick={exportYaml}
    >
      {copy.details.exportYaml}
    </Button>
  )
}
