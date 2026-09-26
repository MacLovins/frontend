import { useMemo } from "react"

import { useGetCountries } from "@/api/generated/meta/meta"
import { baseLanguages } from "@/features/outreach/copy"

function languageName(code: string) {
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code)
    return name ? name[0].toLocaleUpperCase(code) + name.slice(1) : null
  } catch {
    return null
  }
}

/** English, Deutsch, Română, plus the first official language of the company's country when it is not listed. */
export function useLanguageOptions(countryCode: string | null) {
  const countries = useGetCountries({
    query: { staleTime: Infinity, gcTime: Infinity },
  })

  return useMemo(() => {
    const code = countries.data
      ?.find((country) => country.code === countryCode)
      ?.languages[0]?.toLowerCase()
    if (!code || baseLanguages.some((language) => language.code === code))
      return baseLanguages
    const label = languageName(code)
    return label ? [...baseLanguages, { code, label }] : baseLanguages
  }, [countries.data, countryCode])
}
