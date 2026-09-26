/** Region shortcuts for country pickers: UI helpers that add ISO codes in one click, not data. */
export type Region = { key: string; name: string; codes: readonly string[] }

export const eu27: Region = {
  key: "eu27",
  name: "EU 27",
  codes: [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
  ],
}

const dach: Region = { key: "dach", name: "DACH", codes: ["DE", "AT", "CH"] }
const nordics: Region = {
  key: "nordics",
  name: "Nordics",
  codes: ["DK", "SE", "NO", "FI", "IS"],
}
const cee: Region = {
  key: "cee",
  name: "CEE",
  codes: ["PL", "CZ", "SK", "HU", "RO", "BG", "SI", "HR", "EE", "LV", "LT"],
}
const moldova: Region = { key: "moldova", name: "Moldova", codes: ["MD"] }

/** Order of the "Regions" group in the country pickers. */
export const regions: readonly Region[] = [dach, nordics, cee, eu27, moldova]

/** Region chips under Markets; a complete EU 27 is shown as one selected chip instead. */
export const regionChips: readonly Region[] = [
  eu27,
  dach,
  nordics,
  cee,
  moldova,
]

export const regionCodes = [
  ...new Set(regions.flatMap((region) => region.codes)),
]

export function hasAll(selected: readonly string[], codes: readonly string[]) {
  return codes.every((code) => selected.includes(code))
}

/** Adds the region when any code is missing, removes it when it is complete. */
export function toggleRegion(
  selected: readonly string[],
  codes: readonly string[]
) {
  if (hasAll(selected, codes))
    return selected.filter((code) => !codes.includes(code))
  return [...selected, ...codes.filter((code) => !selected.includes(code))]
}

export function toggleCode(selected: readonly string[], code: string) {
  return selected.includes(code)
    ? selected.filter((item) => item !== code)
    : [...selected, code]
}

/**
 * Names for a list of codes where complete regions collapse to the region name ("EU 27, Switzerland").
 * A region counts only when none of its codes was already named by a larger region.
 */
export function marketNames(
  codes: readonly string[],
  countryName: (code: string) => string
) {
  const named = new Set<string>()
  const names: string[] = []
  for (const region of [eu27, dach, nordics, cee]) {
    if (
      !hasAll(codes, region.codes) ||
      region.codes.some((code) => named.has(code))
    )
      continue
    names.push(region.name)
    region.codes.forEach((code) => named.add(code))
  }
  for (const code of codes) if (!named.has(code)) names.push(countryName(code))
  return names
}
