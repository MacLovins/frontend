import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { detectLocale, isLocale } from "@/lib/locale"
import { en } from "@/i18n/locales/en"
import { ro } from "@/i18n/locales/ro"
import { ru } from "@/i18n/locales/ru"

function initialLocale() {
  const first = window.location.pathname.split("/").filter(Boolean)[0]
  if (isLocale(first)) {
    return first
  }

  return detectLocale()
}

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    ro: { translation: ro },
    en: { translation: en },
  },
  lng: initialLocale(),
  fallbackLng: "ro",
  interpolation: { escapeValue: false },
})

export { i18n }
