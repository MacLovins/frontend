import { useParams } from "react-router"

import { isLocale, type Locale } from "@/lib/locale"

export function useLocaleParam(): Locale {
  const { lang } = useParams()
  if (!isLocale(lang)) {
    throw new Error("Locale route rendered without a locale")
  }
  return lang
}
