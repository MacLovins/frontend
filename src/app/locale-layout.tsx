import { useEffect } from "react"
import { Navigate, Outlet, useLocation, useParams } from "react-router"
import { useTranslation } from "react-i18next"

import { isLocale, localizePath } from "@/lib/locale"
import { i18n } from "@/i18n"

export function LocaleRedirect() {
  const location = useLocation()
  const target = localizePath(location.pathname)

  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}

export function LocaleLayout() {
  const { lang } = useParams()
  const location = useLocation()
  const { i18n: instance } = useTranslation()

  useEffect(() => {
    if (!isLocale(lang) || instance.language === lang) {
      return
    }
    void i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }, [instance, lang])

  if (!isLocale(lang)) {
    return (
      <Navigate to={`${localizePath(location.pathname)}${location.search}${location.hash}`} replace />
    )
  }

  return <Outlet />
}
