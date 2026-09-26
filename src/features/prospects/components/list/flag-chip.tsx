import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const chipClass =
  "mt-0.5 w-fit self-start rounded bg-subtle px-1.5 py-px text-left text-2xs font-semibold text-text-secondary"

/** The first fired rule of a lead ("In financial distress", "Outside ICP: …"), with "+n" and a list when more fired. */
export function FlagChip({ flags }: { flags: string[] }) {
  const [first, ...rest] = flags
  if (!first) return null
  if (!rest.length) return <span className={chipClass}>{first}</span>
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={`${chipClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black`}
          />
        }
      >
        {first} +{rest.length}
      </TooltipTrigger>
      <TooltipContent>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}
