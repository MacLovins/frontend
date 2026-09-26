import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useListQuestions } from "@/api/generated/config/config"
import { useGetCountries, useGetIndustries } from "@/api/generated/meta/meta"
import type { RuleCondition } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  QuestionDraftRow,
  RuleDraftRow,
  SectionLabel,
} from "@/features/settings/questions/components/suggestion-rows"
import { copy } from "@/features/settings/questions/copy"
import { useQuestionsContext } from "@/features/settings/questions/hooks/questions-context"
import {
  suggestErrorMessage,
  useAddSuggestions,
  useSuggestions,
} from "@/features/settings/questions/hooks/use-suggestions"
import type { RuleNames } from "@/features/settings/questions/lib/describe-rule"

const SKELETON_ROWS = 6
const META_OPTIONS = { query: { staleTime: Infinity } }

/** `?suggest=1`: AI drafts reviewed before anything is saved. */
export function SuggestionsSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{copy.suggestions.title}</SheetTitle>
        </SheetHeader>
        <SuggestionsBody onClose={onClose} />
      </SheetContent>
    </Sheet>
  )
}

function useRuleNames(): RuleNames {
  const { serviceId } = useQuestionsContext()
  const industries = useGetIndustries(META_OPTIONS)
  const countries = useGetCountries(META_OPTIONS)
  const questions = useListQuestions(serviceId)
  return useMemo(() => {
    const industryNames = new Map(
      industries.data?.map((item) => [item.id, item.label])
    )
    const countryNames = new Map(
      countries.data?.map((item) => [item.code, item.name])
    )
    const questionTexts = new Map(
      questions.data?.map((item) => [item.key, item.text])
    )
    return {
      industry: (id) => industryNames.get(id) ?? id,
      country: (code) => countryNames.get(code) ?? code,
      question: (key) => questionTexts.get(key) ?? key,
    }
  }, [industries.data, countries.data, questions.data])
}

function SuggestionsBody({ onClose }: { onClose: () => void }) {
  const { serviceId, serviceName } = useQuestionsContext()
  const suggestions = useSuggestions(serviceId)
  const add = useAddSuggestions()
  const existingNames = useRuleNames()
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(new Set())
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set())
  const [savedKeys, setSavedKeys] = useState<ReadonlyMap<string, string>>(
    new Map()
  )
  const reported = useRef(false)

  // Errors and an empty answer end the review with a toast (the sheet has nothing to show).
  const { error, data } = suggestions
  useEffect(() => {
    const empty = data && !data.questions.length && !data.rules.length
    if (reported.current || (!error && !empty)) return
    reported.current = true
    if (error) toast.error(suggestErrorMessage(error))
    else toast(copy.toasts.noSuggestions)
    onClose()
  }, [error, data, onClose])

  const drafts = (data?.questions ?? []).filter(
    (draft) => !added.has(draft.key)
  )
  const rules = (data?.rules ?? [])
    .map((rule, index) => ({ id: `rule:${index}`, rule }))
    .filter(({ id }) => !added.has(id))
  const isChecked = (id: string) => !unchecked.has(id)
  const toggle = (id: string, checked: boolean) =>
    setUnchecked((current) => {
      const next = new Set(current)
      if (checked) next.delete(id)
      else next.add(id)
      return next
    })

  const draftLabels = new Map(drafts.map((draft) => [draft.key, draft.label]))
  const names: RuleNames = {
    ...existingNames,
    question: (key) =>
      draftLabels.get(key) ?? existingNames.question(savedKeys.get(key) ?? key),
  }
  // A signal rule needs its question: when that draft is unchecked, the rule cannot be added.
  const blockedBy = (condition: RuleCondition) => {
    if (!("question_key" in condition)) return undefined
    const key = condition.question_key
    return draftLabels.has(key) && !isChecked(key)
      ? draftLabels.get(key)
      : undefined
  }

  const selectedDrafts = drafts.filter((draft) => isChecked(draft.key))
  const selectedRules = rules.filter(
    ({ id, rule }) => isChecked(id) && !blockedBy(rule.condition)
  )
  const selected = selectedDrafts.length + selectedRules.length

  const submit = () =>
    add.mutate(
      {
        drafts: selectedDrafts,
        rules: selectedRules,
        earlierKeys: savedKeys,
      },
      {
        onSuccess: (result) => {
          setAdded((current) => new Set([...current, ...result.addedDraftIds]))
          setSavedKeys(result.savedKeys)
          if (!result.failed) onClose()
        },
      }
    )

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <p className="m-0 text-[13px] text-muted-foreground">
          {copy.suggestions.intro}
        </p>
        {suggestions.isPending ? (
          <div className="flex flex-col gap-2.5" aria-busy>
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-md" />
            ))}
            <p className="m-0 text-[13px] text-muted-foreground">
              {copy.suggestions.loading}
            </p>
          </div>
        ) : null}
        {drafts.length ? (
          <section className="flex flex-col gap-2">
            <SectionLabel>{copy.suggestions.questions}</SectionLabel>
            {drafts.map((draft) => (
              <QuestionDraftRow
                key={draft.key}
                draft={draft}
                checked={isChecked(draft.key)}
                onCheckedChange={(checked) => toggle(draft.key, checked)}
              />
            ))}
          </section>
        ) : null}
        {rules.length ? (
          <section className="flex flex-col gap-2">
            <SectionLabel>{copy.suggestions.rules}</SectionLabel>
            {rules.map(({ id, rule }) => (
              <RuleDraftRow
                key={id}
                rule={rule}
                names={names}
                checked={isChecked(id)}
                blockedBy={blockedBy(rule.condition)}
                onCheckedChange={(checked) => toggle(id, checked)}
              />
            ))}
          </section>
        ) : null}
      </div>
      <SheetFooter>
        <span className="flex-1 self-center text-xs text-muted-foreground">
          {data ? copy.suggestions.selected(selected) : null}
        </span>
        <Button variant="outline" onClick={onClose}>
          {copy.sheet.cancel}
        </Button>
        <Button disabled={!selected || add.isPending} onClick={submit}>
          {add.isPending
            ? copy.suggestions.adding
            : copy.suggestions.add(selected, serviceName)}
        </Button>
      </SheetFooter>
    </>
  )
}
