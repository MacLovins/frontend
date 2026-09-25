export const LOCALES = ["ru", "ro", "en"] as const

export type Locale = (typeof LOCALES)[number]

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale)
}

export function detectLocale(): Locale {
  const candidates =
    typeof navigator === "undefined"
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language]

  for (const candidate of candidates) {
    const code = candidate.toLowerCase().split("-")[0]
    if (isLocale(code)) {
      return code
    }
  }

  return "ro"
}

export function localizePath(pathname: string): string {
  const locale = detectLocale()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return `/${locale}`
  }

  if (isLocale(segments[0])) {
    return `/${segments.join("/")}`
  }

  if (/^[a-z]{2}$/i.test(segments[0])) {
    segments[0] = locale
    return `/${segments.join("/")}`
  }

  return `/${locale}/${segments.join("/")}`
}
