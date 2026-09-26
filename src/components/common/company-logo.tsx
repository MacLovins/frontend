import { cn } from "cn"

const LEGAL_SUFFIXES = new Set([
  "a/s",
  "ag",
  "sa",
  "s.a.",
  "n.v.",
  "nv",
  "gmbh",
  "group",
  "ltd",
  "plc",
  "inc",
  "se",
  "s.p.a.",
  "spa",
  "oy",
  "ab",
  "asa",
  "b.v.",
  "bv",
  "llc",
  "srl",
  "s.r.l.",
  "sas",
  "kg",
  "co",
])

function companyInitials(name: string) {
  const words = name
    .split(/\s+/)
    .filter((word) => word && !LEGAL_SUFFIXES.has(word.toLowerCase()))
  const [first = name, second] = words
  if (/^[A-Z0-9&]{2,4}$/.test(first)) return first
  return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase()
}

// Presentation only: a stable colour per domain from the design's logo palette (the API has no logos).
function paletteIndex(key: string) {
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash % 11) + 1
}

export function CompanyLogo({
  name,
  domain,
  size = "md",
  className,
}: {
  name: string
  domain: string
  size?: "md" | "lg"
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      style={{ background: `var(--logo-${paletteIndex(domain || name)})` }}
      className={cn(
        "flex shrink-0 items-center justify-center text-white",
        size === "md"
          ? "size-8 rounded-sm text-xs font-bold"
          : "size-14 rounded-lg text-base font-extrabold",
        className
      )}
    >
      {companyInitials(name)}
    </span>
  )
}
