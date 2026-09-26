import { Controller, useFormContext, useWatch } from "react-hook-form"

import { RuleAction, RuleKind } from "@/api/generated/model"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NumberInput } from "@/features/settings/icp/components/number-input"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import {
  FirmographicPart,
  ListPart,
  SignalPart,
} from "@/features/settings/rules/components/condition-parts"
import {
  SentenceSelect,
  type SentenceItem,
} from "@/features/settings/rules/components/sentence-select"
import { copy } from "@/features/settings/rules/copy"
import type { RuleDraft } from "@/features/settings/rules/lib/rule-form"

const strings = copy.editor

const kindItems = Object.values(RuleKind).map((value) => ({
  value,
  label: strings.kinds[value],
}))
const actionItems = Object.values(RuleAction).map((value) => ({
  value,
  label: strings.actions[value],
}))

/** "When [kind ▾] … then [action ▾] (at [cap])": the rule as one sentence. */
export function RuleSentence({
  kindLocked,
  questionItems,
  countries,
  industries,
}: {
  /** `kind` is immutable after create (DisqualificationRuleUpdate has no kind). */
  kindLocked: boolean
  questionItems: SentenceItem<string>[]
  countries: CountryCatalog
  industries: IndustryCatalog
}) {
  const { control, formState } = useFormContext<RuleDraft>()
  const [kind, action] = useWatch({ control, name: ["kind", "action"] })

  const kindSelect = (
    <Controller
      control={control}
      name="kind"
      render={({ field }) => (
        <SentenceSelect
          label={strings.kindLabel}
          value={field.value}
          items={kindItems}
          onChange={field.onChange}
          disabled={kindLocked}
        />
      )}
    />
  )

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-base">
      <span className="font-semibold">{strings.when}</span>
      {kindLocked ? (
        <Tooltip>
          <TooltipTrigger
            render={<span className="inline-flex" tabIndex={0} />}
          >
            {kindSelect}
          </TooltipTrigger>
          <TooltipContent>{strings.kindLocked}</TooltipContent>
        </Tooltip>
      ) : (
        kindSelect
      )}
      {kind === "firmographic" ? (
        <FirmographicPart countries={countries} industries={industries} />
      ) : null}
      {kind === "signal" ? <SignalPart questionItems={questionItems} /> : null}
      {kind === "list" ? <ListPart /> : null}
      <span className="font-semibold">{strings.then}</span>
      <Controller
        control={control}
        name="action"
        render={({ field }) => (
          <SentenceSelect
            strong
            label={strings.actionLabel}
            value={field.value}
            items={actionItems}
            onChange={field.onChange}
          />
        )}
      />
      {action === "cap" ? (
        <>
          <span>{strings.at}</span>
          <Controller
            control={control}
            name="cap"
            render={({ field }) => (
              <NumberInput
                aria-label={strings.capLabel}
                aria-invalid={!!formState.errors.cap}
                maxLength={3}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className="w-16 px-3 text-base"
              />
            )}
          />
        </>
      ) : null}
    </div>
  )
}
